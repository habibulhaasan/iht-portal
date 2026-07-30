export const MAX_DIMENSION = 400; // resize before base64-encoding to keep Firestore doc size sane

export function defaultAvatarFor(gender) {
  if (gender === "male") return "/avatars/male-default.svg";
  if (gender === "female") return "/avatars/female-default.svg";
  return "/avatars/neutral-default.svg";
}

export function resizeAndEncode(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
