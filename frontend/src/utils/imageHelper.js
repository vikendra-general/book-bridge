/**
 * Get the correct image URL
 * Handles both Cloudinary URLs (full URLs) and local server paths
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL (Cloudinary or external), use it directly
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, it's a local path - prepend the server URL
  return `http://localhost:5001/${imagePath}`;
};
