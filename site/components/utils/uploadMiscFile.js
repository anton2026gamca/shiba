/**
 * Client-side utility to upload a miscellaneous file to the Shiba API.
 * 
 * @param {Object} options - Upload options
 * @param {File} options.file - The file to upload (required)
 * @param {string} options.apiBase - API base URL (optional, defaults to NEXT_PUBLIC_API_BASE or same-origin)
 * 
 * @returns {Promise<Object>} Upload result
 * @returns {boolean} returns.ok - Whether the upload was successful
 * @returns {string} returns.url - The access URL for the uploaded file (if successful)
 * @returns {string} returns.fileId - The unique file ID (if successful)
 * @returns {string} returns.error - Error message (if failed)
 * 
 * @example
 * // Upload an image file
 * const result = await uploadMiscFile({
 *   file: imageFile,
 *   apiBase: 'https://tc8ckgo4kskk48s0o8cwc0g8.a.selfhosted.hackclub.com'
 * });
 * 
 * if (result.ok) {
 *   // console.log('File uploaded successfully!');
 *   // console.log('Access URL:', result.url);
 *   // console.log('File ID:', result.fileId);
 * } else {
 *   console.error('Upload failed:', result.error);
 * }
 * 
 * @example
 * // Upload with default API base
 * const result = await uploadMiscFile({ file: myFile });
 * if (result.ok) {
 *   // Use result.url to display or link to the file
 *   const img = document.createElement('img');
 *   img.src = result.url;
 *   document.body.appendChild(img);
 * }
 */

export async function uploadMiscFile({ file, apiBase }) {
  // Validate input
  if (!file) {
    return { ok: false, error: "Missing file parameter" };
  }

  // Validate file type
  const allowedTypes = ['.png', '.jpg', '.jpeg', '.mp4', '.gif', '.mov', '.mp3'];
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
  
  if (!allowedTypes.includes(fileExtension)) {
    return { 
      ok: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }

  // Validate file size (100MB max - increased from 50MB)
  const maxSize = 100 * 1024 * 1024; // 100MB in bytes
  if (file.size > maxSize) {
    return { 
      ok: false, 
      error: `File too large. Maximum size is 100MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB` 
    };
  }

  // Get API base URL
  const base = apiBase || process.env.NEXT_PUBLIC_API_BASE || "";

  // Create form data
  const formData = new FormData();
  formData.append("file", file);

  try {
    // Upload the file with timeout for large files
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    const response = await fetch(`${base}/uploadMiscFile`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    // Parse response
    const responseText = await response.text();
    let data = null;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return { 
        ok: false, 
        error: `Invalid response from server: ${responseText}` 
      };
    }

    // Check if upload was successful
    if (!response.ok) {
      return { 
        ok: false, 
        error: data.message || data.error || `Upload failed with status ${response.status}` 
      };
    }

    // Return success result
    return {
      ok: true,
      url: data.url,
      fileId: data.fileId,
      message: data.message
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      return { 
        ok: false, 
        error: "Upload timed out. Please try again with a smaller file or check your connection." 
      };
    }
    return { 
      ok: false, 
      error: `Network error: ${error.message || String(error)}` 
    };
  }
}

/**
 * Helper function to check if a file type is supported
 * 
 * @param {File} file - The file to check
 * @returns {boolean} Whether the file type is supported
 * 
 * @example
 * const file = event.target.files[0];
 * if (isSupportedFileType(file)) {
 *   // File type is supported, proceed with upload
 *   const result = await uploadMiscFile({ file });
 * }
 */
export function isSupportedFileType(file) {
  if (!file) return false;
  
  const allowedTypes = ['.png', '.jpg', '.jpeg', '.mp4', '.gif', '.mov', '.mp3'];
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
  
  return allowedTypes.includes(fileExtension);
}

/**
 * Helper function to format file size for display
 * 
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 * 
 * @example
 * const file = event.target.files[0];
 * // console.log(`File size: ${formatFileSize(file.size)}`);
 * // Output: "File size: 2.5 MB"
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
