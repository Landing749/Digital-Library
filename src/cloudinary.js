const CLOUD_NAME = 'damr6r9op';
const UPLOAD_PRESET = 'org-resources';

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * Works for images (covers), PDFs, and other raw files.
 * Returns { url, publicId, resourceType, bytes, format }.
 *
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 * @param {string} [folder] optional Cloudinary folder, e.g. 'covers' | 'resources'
 */
export function uploadToCloudinary(file, onProgress, folder) {
  return new Promise((resolve, reject) => {
    // Cloudinary buckets uploads as image/video/raw. PDFs & docs go to 'raw'.
    const isImage = file.type.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    if (folder) formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            resourceType: data.resource_type,
            bytes: data.bytes,
            format: data.format,
            originalFilename: data.original_filename
          });
        } else {
          reject(new Error(data.error?.message || 'Cloudinary upload failed'));
        }
      } catch (err) {
        reject(err);
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

/** Builds a thumbnail-transformed Cloudinary image URL for a cover image. */
export function coverThumb(url, width = 300) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/c_fill,w_${width},q_auto,f_auto/`);
}
