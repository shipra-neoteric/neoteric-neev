// Reads a File into a base64 data URL, ready to POST straight to a Cloudinary-backed
// upload endpoint (checklist evidence, module attachments) — no multer needed.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
