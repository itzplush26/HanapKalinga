import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/anon";
import {
  getSignupCapacity,
  getSignupLimitClient,
  signupCapacityMessage,
  type SignupCapacityKind
} from "@/lib/register/signup-limits";

const CAPACITY_KINDS = new Set<SignupCapacityKind>(["family", "nurse", "caregiver"]);

function parseCapacityKind(value: string | null): SignupCapacityKind | null {
  if (!value || !CAPACITY_KINDS.has(value as SignupCapacityKind)) {
    return null;
  }

  return value as SignupCapacityKind;
}

export async function GET(request: Request) {
  const kind = parseCapacityKind(new URL(request.url).searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ error: "Invalid signup type." }, { status: 400 });
  }

  try {
    const anonClient = createAnonClient();
    if (!anonClient) {
      return NextResponse.json(
        { error: "We could not verify signup capacity right now. Please try again shortly." },
        { status: 503 }
      );
    }

    const client = getSignupLimitClient(anonClient);
    const capacity = await getSignupCapacity(client, kind);

    if (!capacity.available) {
      return NextResponse.json({
        available: false,
        kind,
        limit: capacity.limit,
        message: signupCapacityMessage(kind)
      });
    }

    return NextResponse.json({
      available: true,
      kind,
      limit: capacity.limit,
      remaining: capacity.limit - capacity.count
    });
  } catch (error) {
    console.error("register.capacity.error", error);
    return NextResponse.json(
      { error: "We could not verify signup capacity right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
