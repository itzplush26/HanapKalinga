import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const SIGNED_URL_TTL_SECONDS = 3600;

function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 credentials are not configured.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

export function getDocsBucket(): string {
  return process.env.CLOUDFLARE_R2_DOCS_BUCKET ?? "hanapkalinga-docs";
}

export function getMediaBucket(): string {
  return process.env.CLOUDFLARE_R2_MEDIA_BUCKET ?? "hanapkalinga-media";
}

/** Upload a file buffer to R2. Returns the storage path only — never a URL. */
export async function uploadToR2(
  fileBuffer: Buffer,
  destinationPath: string,
  bucket: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const key = destinationPath.replace(/^\/+/, "");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    })
  );

  return key;
}

/** Short-lived signed URL for private document files (1 hour). */
export async function getSignedDocumentUrl(
  path: string,
  bucket: string = getDocsBucket()
): Promise<string> {
  const client = getR2Client();
  const key = normalizeStoragePath(path);

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }),
    { expiresIn: SIGNED_URL_TTL_SECONDS }
  );
}

/** Public CDN URL for media files (profile photos). */
function getPublicMediaBaseUrl(): string {
  const base =
    process.env.CLOUDFLARE_R2_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;
  if (!base) {
    throw new Error("CLOUDFLARE_R2_PUBLIC_URL is not configured.");
  }
  return base.replace(/\/$/, "");
}

export function getPublicMediaUrl(path: string): string {
  const base = getPublicMediaBaseUrl();

  const value = path.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${base}/${value.replace(/^\/+/, "")}`;
}

/** Resolve a stored profile photo value (path or legacy URL) to a display URL. */
export function resolveProfilePhotoUrl(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;

  const value = stored.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  try {
    return getPublicMediaUrl(value);
  } catch {
    return null;
  }
}

/** Strip legacy Supabase signed-URL prefixes so we store/use bare paths. */
export function normalizeStoragePath(storedValue: string): string {
  let path = storedValue.trim();

  if (path.startsWith("http")) {
    const supabaseMarker = "/object/sign/nurse-docs/";
    const supabaseIdx = path.indexOf(supabaseMarker);
    if (supabaseIdx !== -1) {
      return path.slice(supabaseIdx + supabaseMarker.length).split("?")[0] ?? path;
    }

    const publicBase = getPublicMediaBaseUrl();
    if (path.startsWith(publicBase)) {
      return path.slice(publicBase.length + 1);
    }
  }

  return path.replace(/^\/+/, "");
}
