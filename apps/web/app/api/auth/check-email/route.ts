import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { checkSharedRateLimit } from "@/lib/rate-limit-shared";

const bodySchema = z.object({
  email: z.string().email()
});

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const rate = await checkSharedRateLimit(`auth:check-email:${ip}`, 10, 5 * 60_000);

    if (!rate.allowed) {
      return NextResponse.json(
        {
          exists: null,
          rateLimited: true,
          message: "Too many attempts. Please try again in a few minutes."
        },
        { status: 429 }
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const service = createServiceClient();
    const { data, error } = await service.rpc("auth_email_exists", {
      p_email: parsed.data.email.trim()
    });

    if (error) {
      console.error("auth.check_email", error);
      return NextResponse.json({ error: "Could not verify email." }, { status: 500 });
    }

    return NextResponse.json({ exists: Boolean(data), rateLimited: false });
  } catch (error) {
    console.error("auth.check_email.exception", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
