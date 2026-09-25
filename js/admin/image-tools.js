// Browser-side image prep for gallery uploads. Phone photos are often 5-10MB; we
// store a resized full image + a small thumbnail instead, which keeps R2 storage
// small and the public gallery fast even with 1000+ photos.

const GALLERY_MAX_FULL = 2000; // px, longest edge of the stored full image
const GALLERY_MAX_THUMB = 640; // px, longest edge of the grid thumbnail

function canvasToJpeg(bitmap, maxEdge, quality) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // PNG/WebP transparency would otherwise turn black in JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))), "image/jpeg", quality)
  );
}

// Returns { full: File, thumb: File } (both JPEG). Throws a readable error for
// formats the browser can't decode (e.g. HEIC from an iPhone set to "High Efficiency").
async function prepareGalleryImage(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file); // applies EXIF rotation by default
  } catch (err) {
    throw new Error(`${file.name}: this image format isn't supported. Use JPG, PNG or WebP (on iPhone: Settings → Camera → Formats → Most Compatible).`);
  }
  try {
    const [full, thumb] = await Promise.all([
      canvasToJpeg(bitmap, GALLERY_MAX_FULL, 0.82),
      canvasToJpeg(bitmap, GALLERY_MAX_THUMB, 0.78),
    ]);
    return {
      full: new File([full], "photo.jpg", { type: "image/jpeg" }),
      thumb: new File([thumb], "thumb.jpg", { type: "image/jpeg" }),
    };
  } finally {
    bitmap.close();
  }
}
