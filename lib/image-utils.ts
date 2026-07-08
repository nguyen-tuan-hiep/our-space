const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";
const HERO_IMAGE_TRANSFORM = "f_auto,q_auto:good,c_limit,w_1200";

export function getOptimizedImageUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    const uploadIndex = url.pathname.indexOf(CLOUDINARY_UPLOAD_SEGMENT);

    if (url.hostname !== "res.cloudinary.com" || uploadIndex === -1) {
      return imageUrl;
    }

    const transformStart = uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length;
    const beforeTransform = url.pathname.slice(0, transformStart);
    const afterTransform = url.pathname.slice(transformStart);

    url.pathname = `${beforeTransform}${HERO_IMAGE_TRANSFORM}/${afterTransform}`;

    return url.toString();
  } catch {
    return imageUrl;
  }
}
