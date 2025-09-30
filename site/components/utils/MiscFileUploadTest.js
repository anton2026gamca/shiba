import React, { useState } from 'react';
import { uploadMiscFile } from './uploadMiscFile';

/**
 * Test component to demonstrate the new uploadMiscFile functionality
 * This shows how Devlog posts now use S3 upload instead of base64
 */
export default function MiscFileUploadTest() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError(null);
    setResult(null);
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
      // This simulates what happens in the Devlog posting process
      const uploadResult = await uploadMiscFile({
        file: selectedFile,
        // Uses the same API base as the main app
        apiBase: process.env.NEXT_PUBLIC_API_BASE || ""
      });

      if (uploadResult.ok) {
        setResult(uploadResult);
        
        // This is what would be sent to createPost API
        const attachmentForPost = {
          url: uploadResult.url,
          type: selectedFile.type || "application/octet-stream",
          contentType: selectedFile.type || "application/octet-stream",
          filename: selectedFile.name || "attachment",
          id: uploadResult.fileId,
          size: selectedFile.size
        };
        
        console.log('Attachment object for post:', attachmentForPost);
        
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
      maxWidth: '600px', 
      margin: '20px auto', 
      padding: '20px', 
      border: '2px solid #ff6fa5', 
      borderRadius: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)'
    }}>
      <h2 style={{ color: '#ff6fa5', textAlign: 'center' }}>
        🧪 Devlog File Upload Test
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          This demonstrates how Devlog posts now upload files to S3 first, 
          then use the URL as an attachment (similar to Demo posts).
        </p>
        
        <label htmlFor="test-file-input" style={{ display: 'block', marginBottom: '10px' }}>
          Select a file (PNG, JPG, MP4, GIF, MOV, MP3):
        </label>
        <input
          id="test-file-input"
          type="file"
          accept=".png,.jpg,.jpeg,.mp4,.gif,.mov,.mp3"
          onChange={handleFileSelect}
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        
        {selectedFile && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
          </div>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: uploading ? '#ccc' : '#ff6fa5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {uploading ? 'Uploading to S3...' : 'Test Upload'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '15px', 
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '8px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '8px',
          border: '1px solid #c3e6cb'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>✅ Upload Successful!</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>File ID:</strong> {result.fileId}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>S3 URL:</strong>
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

          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: 'rgba(255, 255, 255, 0.5)', 
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            <strong>This URL would be used as an attachment in the Devlog post.</strong>
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
        </div>
      )}
    </div>
  );
}
