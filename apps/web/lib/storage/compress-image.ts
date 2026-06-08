import sharp from "sharp";

const MAX_PHOTO_BYTES = 500 * 1024;

export async function compressProfilePhoto(
  input: Buffer
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  let quality = 85;
  let buffer = await sharp(input)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (buffer.length > MAX_PHOTO_BYTES && quality > 35) {
    quality -= 10;
    buffer = await sharp(input)
      .rotate()
      .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  if (buffer.length > MAX_PHOTO_BYTES) {
    buffer = await sharp(input)
      .rotate()
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 60, mozjpeg: true })
      .toBuffer();
  }

  return {
    buffer,
    contentType: "image/jpeg",
    extension: "jpg"
  };
}
