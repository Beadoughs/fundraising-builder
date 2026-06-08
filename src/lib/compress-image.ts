/** Resize and compress an image for storage in SQLite (client-side). */
export async function compressImageFile(
  file: File,
  maxDimension = 800,
  quality = 0.82
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height, 1)
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);

  // If still too large, lower quality until under ~400KB
  if (estimateDataUrlBytes(dataUrl) > 400 * 1024) {
    return canvas.toDataURL("image/jpeg", 0.65);
  }

  return dataUrl;
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}
