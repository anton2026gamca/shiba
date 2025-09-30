import React, { useState } from 'react';
import { uploadMiscFile, isSupportedFileType, formatFileSize } from './uploadMiscFile';

/**
 * Example component demonstrating how to use the uploadMiscFile utility
 * 
 * @example
 * // In your component or page
 * import MiscFileUploadExample from './components/utils/MiscFileUploadExample';
 * 
 * function MyPage() {
 *   return (
 *     <div>
 *       <h1>Upload Files</h1>
 *       <MiscFileUploadExample />
 *     </div>
 *   );
 * }
 */
export default function MiscFileUploadExample() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError(null);
    setResult(null);

    if (file && !isSupportedFileType(file)) {
      setError('File type not supported. Please select a PNG, JPG, MP4, GIF, MOV, or MP3 file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Upload the file using the utility function
      const uploadResult = await uploadMiscFile({
        file: selectedFile,
        // You can specify a custom API base URL here
        // apiBase: 'https://tc8ckgo4kskk48s0o8cwc0g8.a.selfhosted.hackclub.com'
      });

      if (uploadResult.ok) {
        setResult(uploadResult);
      } else {
        setError(uploadResult.error);
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '20px auto', 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px' 
    }}>
      <h2>Upload Misc File Example</h2>
      
      {/* File Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="file-input" style={{ display: 'block', marginBottom: '10px' }}>
          Select a file (PNG, JPG, MP4, GIF, MOV, MP3):
        </label>
        <input
          id="file-input"
          type="file"
          accept=".png,.jpg,.jpeg,.mp4,.gif,.mov,.mp3"
          onChange={handleFileSelect}
          style={{ width: '100%', padding: '8px' }}
        />
        
        {selectedFile && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <strong>Selected:</strong> {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading || error}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: uploading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>

      {/* Error Display */}
      {error && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success Display */}
      {result && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>✅ Upload Successful!</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>File ID:</strong> {result.fileId}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Access URL:</strong>
            <br />
            <a 
              href={result.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#007bff', wordBreak: 'break-all' }}
            >
              {result.url}
            </a>
          </div>

          {/* Preview for images */}
          {selectedFile && selectedFile.type.startsWith('image/') && (
            <div style={{ marginTop: '15px' }}>
              <strong>Preview:</strong>
              <br />
              <img 
                src={result.url} 
                alt="Uploaded file preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  marginTop: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }} 
              />
            </div>
          )}

          {/* Copy URL button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.url);
              alert('URL copied to clipboard!');
            }}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Copy URL
          </button>
        </div>
      )}
    </div>
  );
}
