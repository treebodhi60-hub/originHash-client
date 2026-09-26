// Phone cameras produce 3–12 MB photos; the API accepts up to 5 MB. Scale the photo down and
// re-encode it as JPEG before uploading. Falls back to the original file if the browser can't
// decode it (the server still rejects anything over the limit).
export const shrinkPhoto = async (file, maxPx = 1600, quality = 0.82) => {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    return blob ? new File([blob], 'report.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
};
