import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { uploadMiscFile } from './utils/uploadMiscFile';

const ArtlogPostForm = forwardRef(({ 
  onSubmit, 
  onCancel, 
  postContent, 
  setPostContent,
  isPosting,
  setIsPosting,
  setPostMessage,
  onUploadStateChange
}, ref) => {
  const [timelapseFile, setTimelapseFile] = useState(null);
  const [githubImageLink, setGithubImageLink] = useState('');
  const [timeScreenshotFile, setTimeScreenshotFile] = useState(null);
  const [hoursSpent, setHoursSpent] = useState(0);
  const [minutesSpent, setMinutesSpent] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [errors, setErrors] = useState({});

  // File input refs
  const timelapseFileInputRef = useRef(null);
  const timeScreenshotInputRef = useRef(null);

  // Monitor upload progress and notify parent component
  useEffect(() => {
    if (onUploadStateChange) {
      const isUploading = Object.values(uploadProgress).some(progress => 
        progress > 0 && progress < 100
      );
      const hasUploads = Object.keys(uploadProgress).length > 0;
      const hasErrors = Object.values(uploadProgress).some(progress => progress === -1);
      const allComplete = Object.values(uploadProgress).every(progress => 
        progress === 100 || progress === -1
      );
      
      console.log('Artlog upload state check:', { uploadProgress, isUploading, hasUploads, hasErrors, allComplete });
      
      if (hasUploads && allComplete && !isUploading) {
        // All uploads are complete (either 100% or -1 for errors)
        console.log('All uploads complete, setting upload state to false');
        onUploadStateChange(false);
      } else if (isUploading || (hasUploads && !allComplete)) {
        // Some uploads are still in progress or preparing
        console.log('Uploads in progress or preparing, setting upload state to true');
        onUploadStateChange(true);
      } else if (!hasUploads) {
        // No uploads at all, ensure upload state is false
        console.log('No uploads, setting upload state to false');
        onUploadStateChange(false);
      }
    }
  }, [uploadProgress, onUploadStateChange]);

  const clearFileInputs = () => {
    setTimelapseFile(null);
    setTimeScreenshotFile(null);
    setUploadedFiles({});
    setUploadProgress({});
    setErrors({});
    
    // Notify parent that uploads are cleared
    if (onUploadStateChange) {
      console.log('Clearing files, setting upload state to false');
      onUploadStateChange(false);
    }
  };

  const uploadFileToS3 = async (file, fileType) => {
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    
    console.log('Starting upload for:', fileKey, fileType);
    
    // Set initial progress and immediately notify parent
    setUploadProgress(prev => {
      const newProgress = { ...prev, [fileKey]: 0 };
      console.log('Setting initial progress:', newProgress);
      return newProgress;
    });
    
    // Notify parent component about upload state change immediately
    if (onUploadStateChange) {
      console.log('Notifying parent: upload started');
      onUploadStateChange(true);
    }
    
    // Simulate progress updates during upload (like devlog posts do)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[fileKey] || 0;
        if (current < 90) {
          return { ...prev, [fileKey]: current + Math.random() * 10 };
        }
        return prev;
      });
    }, 200);
    
    try {
      const result = await uploadMiscFile({ file });
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      if (result.ok) {
        console.log('Upload successful for:', fileKey);
        setUploadedFiles(prev => ({ 
          ...prev, 
          [fileType]: { fileKey, url: result.url, fileId: result.fileId } 
        }));
        setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
        
        // Clear any errors for this file type
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fileType];
          return newErrors;
        });
        
        // Check if all uploads are now complete and update parent state
        setTimeout(() => {
          const currentProgress = uploadProgress;
          const allComplete = Object.values({ ...currentProgress, [fileKey]: 100 }).every(progress => 
            progress === 100 || progress === -1
          );
          const isUploading = Object.values({ ...currentProgress, [fileKey]: 100 }).some(progress => 
            progress > 0 && progress < 100
          );
          
          if (allComplete && !isUploading && onUploadStateChange) {
            console.log('Upload completed, updating parent state to false');
            onUploadStateChange(false);
          }
        }, 100);
      } else {
        console.log('Upload failed for:', fileKey, result.error);
        setUploadProgress(prev => ({ ...prev, [fileKey]: -1 }));
        
        // Show specific error message based on the error
        let errorMessage = result.error;
        if (result.error.includes('too large') || result.error.includes('50MB')) {
          errorMessage = 'File too large. Maximum size is 50MB.';
        } else if (result.error.includes('File type not allowed')) {
          errorMessage = 'File type not supported. Please use MP4/MOV for video or PNG/JPG for images.';
        }
        
        // Set error in the form
        setErrors(prev => ({ ...prev, [fileType]: errorMessage }));
        
        // Check if all uploads are now complete (including failed ones) and update parent state
        setTimeout(() => {
          const currentProgress = uploadProgress;
          const allComplete = Object.values({ ...currentProgress, [fileKey]: -1 }).every(progress => 
            progress === 100 || progress === -1
          );
          const isUploading = Object.values({ ...currentProgress, [fileKey]: -1 }).some(progress => 
            progress > 0 && progress < 100
          );
          
          if (allComplete && !isUploading && onUploadStateChange) {
            console.log('Upload failed but all uploads complete, updating parent state to false');
            onUploadStateChange(false);
          }
        }, 100);
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Clear progress interval on error
      clearInterval(progressInterval);
      
      console.log('Upload error for:', fileKey, error);
      setUploadProgress(prev => ({ ...prev, [fileKey]: -1 }));
      
      // Set generic error if not already set
      if (!errors[fileType]) {
        setErrors(prev => ({ ...prev, [fileType]: 'Upload failed. Please try again.' }));
      }
      throw error;
    }
  };

  // Function to validate form and get data
  const getFormData = () => {
    console.log('getFormData called with:', { 
      postContent: postContent.trim(), 
      timelapseFile: !!timelapseFile, 
      githubImageLink: githubImageLink.trim(), 
      timeScreenshotFile: !!timeScreenshotFile, 
      hoursSpent, 
      minutesSpent,
      uploadedFiles,
      uploadProgress
    });
    
    setErrors({});
    
    // Validate required fields
    if (!postContent.trim()) {
      console.log('getFormData: Missing content');
      setErrors({ content: 'Description is required' });
      return null;
    }
    if (!timelapseFile) {
      console.log('getFormData: Missing timelapse file');
      setErrors({ timelapse: 'Timelapse video is required' });
      return null;
    }
    if (!githubImageLink.trim()) {
      console.log('getFormData: Missing GitHub link');
      setErrors({ github: 'GitHub image link is required' });
      return null;
    }
    // Time screenshot is now optional
    // if (!timeScreenshotFile) {
    //   console.log('getFormData: Missing screenshot file');
    //   setErrors({ screenshot: 'Time screenshot is required' });
    //   return null;
    // }
    if (hoursSpent === 0 && minutesSpent === 0) {
      console.log('getFormData: Missing time spent');
      setErrors({ time: 'Please specify time spent' });
      return null;
    }

    // Validate that timelapse was uploaded successfully (screenshot is optional)
    if (!uploadedFiles.timelapse?.url) {
      console.log('getFormData: Timelapse upload failed - no URL');
      setErrors({ timelapse: 'Timelapse video upload failed. Please try again.' });
      return null;
    }
    // Screenshot is optional, so we don't validate it here

    // Check for upload errors
    const timelapseKey = `${timelapseFile.name}-${timelapseFile.size}-${timelapseFile.lastModified}`;
    
    if (uploadProgress[timelapseKey] === -1) {
      console.log('getFormData: Timelapse upload error detected');
      setErrors({ timelapse: 'Timelapse video upload failed. Please try again.' });
      return null;
    }
    
    // Check screenshot upload errors only if screenshot file exists (optional)
    if (timeScreenshotFile) {
      const screenshotKey = `${timeScreenshotFile.name}-${timeScreenshotFile.size}-${timeScreenshotFile.lastModified}`;
      
      if (uploadProgress[screenshotKey] === -1) {
        console.log('getFormData: Screenshot upload error detected');
        setErrors({ screenshot: 'Time screenshot upload failed. Please try again.' });
        return null;
      }
    }

    console.log('getFormData: All validation passed, returning data');
    // Return validated data
    return {
      postType: 'artlog',
      content: postContent.trim(),
      timelapseVideoId: uploadedFiles.timelapse?.url,
      githubImageLink: githubImageLink.trim(),
      timeScreenshotId: uploadedFiles.screenshot?.url,
      hoursSpent: parseInt(hoursSpent),
      minutesSpent: parseInt(minutesSpent)
    };
  };

  // Expose the validation function to parent component
  useImperativeHandle(ref, () => ({
    getFormData,
    isValid: () => {
      // Only validate if we're actually in artlog mode and have all required fields
      // AND ensure hours spent is greater than 0
      // AND ensure files were uploaded successfully (screenshot is optional)
      if (!postContent.trim() || !timelapseFile || !githubImageLink.trim() || (hoursSpent === 0 && minutesSpent === 0)) {
        console.log('isValid: Basic validation failed');
        return false;
      }
      
      // Check that timelapse was uploaded successfully (screenshot is optional)
      if (!uploadedFiles.timelapse?.url) {
        console.log('isValid: Missing timelapse uploaded file URL:', { timelapse: uploadedFiles.timelapse?.url });
        return false;
      }
      
      // Check for upload errors
      const timelapseKey = `${timelapseFile.name}-${timelapseFile.size}-${timelapseFile.lastModified}`;
      
      if (uploadProgress[timelapseKey] === -1) {
        console.log('isValid: Timelapse upload error detected:', { timelapse: uploadProgress[timelapseKey] });
        return false;
      }
      
      // Ensure timelapse has completed uploading (progress = 100)
      if (uploadProgress[timelapseKey] !== 100) {
        console.log('isValid: Timelapse upload not complete:', { timelapse: uploadProgress[timelapseKey] });
        return false;
      }
      
      // Check screenshot upload if it exists (optional)
      if (timeScreenshotFile) {
        const screenshotKey = `${timeScreenshotFile.name}-${timeScreenshotFile.size}-${timeScreenshotFile.lastModified}`;
        
        if (uploadProgress[screenshotKey] === -1) {
          console.log('isValid: Screenshot upload error detected:', { screenshot: uploadProgress[screenshotKey] });
          return false;
        }
        
        if (uploadProgress[screenshotKey] !== 100) {
          console.log('isValid: Screenshot upload not complete:', { screenshot: uploadProgress[screenshotKey] });
          return false;
        }
      }
      
      console.log('isValid: All validation passed');
      return true;
    },
    isUploading: () => {
      // Check if any files are still uploading
      return Object.values(uploadProgress).some(progress => progress > 0 && progress < 100);
    }
  }), [postContent, timelapseFile, githubImageLink, timeScreenshotFile, hoursSpent, minutesSpent, uploadedFiles, uploadProgress]);

    return (
    <div className="artlog-form">
      {/* File Previews - Now above the form */}
      {(timelapseFile || timeScreenshotFile) && (
        <div className="moments-previews">
          {/* Timelapse Preview */}
          {timelapseFile && (
            <div className="moments-preview-item">
              <video
                src={uploadedFiles.timelapse?.url || URL.createObjectURL(timelapseFile)}
                className="moments-preview-media"
                muted
                playsInline
              />
              
              {/* Upload Progress Overlay */}
              {(() => {
                const fileKey = `${timelapseFile.name}-${timelapseFile.size}-${timelapseFile.lastModified}`;
                const progress = uploadProgress[fileKey] || 0;
                const isUploading = progress > 0 && progress < 100;
                const hasError = progress === -1;
                
                if (isUploading) {
                  return (
                    <div className="upload-progress-overlay">
                      <div className="upload-progress-bar">
                        <div 
                          className="upload-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="upload-progress-text">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  );
                } else if (hasError) {
                  return (
                    <div className="upload-error-overlay">
                      <span>❌ Upload Failed</span>
                      <button
                        type="button"
                        onClick={() => uploadFileToS3(timelapseFile, 'timelapse')}
                        style={{
                          background: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          marginTop: '4px'
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
              
              <button
                type="button"
                className="moments-remove-btn"
                title="Remove"
                onClick={() => {
                  const fileKey = `${timelapseFile.name}-${timelapseFile.size}-${timelapseFile.lastModified}`;
                  setTimelapseFile(null);
                  setUploadedFiles(prev => {
                    const newFiles = { ...prev };
                    delete newFiles.timelapse;
                    return newFiles;
                  });
                  setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[fileKey];
                    return newProgress;
                  });
                  
                  // Check if we need to update parent upload state
                  if (onUploadStateChange) {
                    const remainingProgress = Object.values(uploadProgress).filter(key => key !== fileKey);
                    const hasActiveUploads = remainingProgress.some(progress => progress > 0 && progress < 100);
                    console.log('Removing timelapse, remaining uploads:', remainingProgress, 'hasActive:', hasActiveUploads);
                    onUploadStateChange(hasActiveUploads);
                  }
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Screenshot Preview */}
          {timeScreenshotFile && (
            <div className="moments-preview-item">
              <img
                src={uploadedFiles.screenshot?.url || URL.createObjectURL(timeScreenshotFile)}
                alt="Time screenshot"
                className="moments-preview-media"
              />
              
              {/* Upload Progress Overlay */}
              {(() => {
                const fileKey = `${timeScreenshotFile.name}-${timeScreenshotFile.size}-${timeScreenshotFile.lastModified}`;
                const progress = uploadProgress[fileKey] || 0;
                const isUploading = progress > 0 && progress < 100;
                const hasError = progress === -1;
                
                if (isUploading) {
                  return (
                    <div className="upload-progress-overlay">
                      <div className="upload-progress-bar">
                        <div 
                          className="upload-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="upload-progress-text">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  );
                } else if (hasError) {
                  return (
                    <div className="upload-error-overlay">
                      <span>❌ Upload Failed</span>
                      <button
                        type="button"
                        onClick={() => uploadFileToS3(timeScreenshotFile, 'screenshot')}
                        style={{
                          background: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          marginTop: '4px'
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
              
              <button
                type="button"
                className="moments-remove-btn"
                title="Remove"
                onClick={() => {
                  const fileKey = `${timeScreenshotFile.name}-${timeScreenshotFile.size}-${timeScreenshotFile.lastModified}`;
                  setTimeScreenshotFile(null);
                  setUploadedFiles(prev => {
                    const newFiles = { ...prev };
                    delete newFiles.screenshot;
                    return newFiles;
                  });
                  setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[fileKey];
                    return newProgress;
                  });
                  
                  // Check if we need to update parent upload state
                  if (onUploadStateChange) {
                    const remainingProgress = Object.values(uploadProgress).filter(key => key !== fileKey);
                    const hasActiveUploads = remainingProgress.some(progress => progress > 0 && progress < 100);
                    console.log('Removing screenshot, remaining uploads:', remainingProgress, 'hasActive:', hasActiveUploads);
                    onUploadStateChange(hasActiveUploads);
                  }
                }}
              >
                ×
              </button>
            </div>
          )}

        </div>
      )}

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="error-messages">
          {Object.entries(errors).map(([field, message]) => (
            <div key={field} className="error-message">
              ❌ {field === 'timelapse' ? 'Timelapse Video: ' : field === 'screenshot' ? 'Screenshot: ' : ''}{message}
            </div>
          ))}
        </div>
      )}

      {/* Form Fields */}
      <div className="moments-footer">
        {/* Timelapse Video Upload */}
        <input
          ref={timelapseFileInputRef}
          type="file"
          accept=".mp4,.mov"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = (e.target.files && e.target.files[0]) || null;
            if (file) {
              // Validate file type
              const validTypes = ["video/mp4", "video/quicktime"];
              if (!validTypes.includes(file.type)) {
                alert("❌ Invalid file format! Please select an MP4 or MOV file.");
                e.target.value = "";
                return;
              }
              
              // Validate file size (50MB limit)
              if (file.size > 50 * 1024 * 1024) {
                alert("❌ File too large! Please select a file under 50MB.");
                e.target.value = "";
                return;
              }
              
              setTimelapseFile(file);
              await uploadFileToS3(file, 'timelapse');
            }
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="moments-attach-btn"
          onClick={() => timelapseFileInputRef.current?.click()}
        >
          {timelapseFile
            ? `Timelapse: ${timelapseFile.name}`
            : "Upload Timelapse Video (.mp4/.mov)"}
        </button>

        {/* GitHub Image Link */}
        <div className="github-link-input">
          <input
            type="url"
            placeholder="Link to asset in Github repo"
            value={githubImageLink}
            onChange={(e) => setGithubImageLink(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "12px"
            }}
          />
        </div>

        {/* Time Screenshot Upload */}
        <input
          ref={timeScreenshotInputRef}
          type="file"
          accept="image/*,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = (e.target.files && e.target.files[0]) || null;
            if (file) {
              // Validate file type
              const validTypes = ["image/"];
              if (!validTypes.some(type => file.type.startsWith(type))) {
                alert("❌ Invalid file format! Please select an image file.");
                e.target.value = "";
                return;
              }
              
              setTimeScreenshotFile(file);
              await uploadFileToS3(file, 'screenshot');
            }
            e.target.value = "";
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="moments-attach-btn"
            onClick={() => timeScreenshotInputRef.current?.click()}
          >
            {timeScreenshotFile
              ? `Screenshot: ${timeScreenshotFile.name}`
              : "Upload Time Screenshot"}
          </button>
          <div 
            style={{ 
              position: "relative",
              cursor: "help"
            }}
            onMouseEnter={(e) => {
              const tooltip = e.currentTarget.querySelector('.tooltip');
              if (tooltip) tooltip.style.display = 'block';
            }}
            onMouseLeave={(e) => {
              const tooltip = e.currentTarget.querySelector('.tooltip');
              if (tooltip) tooltip.style.display = 'none';
            }}
          >
            <span style={{ 
              fontSize: "16px", 
              color: "#666",
              cursor: "help"
            }}>
              ⓘ
            </span>
            <div 
              className="tooltip"
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                whiteSpace: "normal",
                zIndex: 1000,
                display: "none",
                marginBottom: "8px",
                width: "280px",
                textAlign: "center",
                lineHeight: "1.4"
              }}
            >
              A screenshot of the time you spent making the asset (eg. Procreate canvas information). Optional, but you may not get the full amount of hours if you don't have it!
            </div>
          </div>
        </div>

        {/* Time Spent Input */}
        <div className="time-spent-inputs">
          <input
            type="number"
            min="0"
            placeholder="Hours"
            value={hoursSpent}
            onChange={(e) => setHoursSpent(e.target.value)}
            style={{
              width: "60px",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              textAlign: "center"
            }}
          />
          <span style={{ color: "#666", fontSize: "14px" }}>h</span>
          <input
            type="number"
            min="0"
            max="59"
            placeholder="Min"
            value={minutesSpent}
            onChange={(e) => setMinutesSpent(e.target.value)}
            style={{
              width: "60px",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              textAlign: "center"
            }}
          />
          <span style={{ color: "#666", fontSize: "14px" }}>m</span>
        </div>
        
        {/* Time validation helper */}
        {(hoursSpent === 0 && minutesSpent === 0) && (
          <div style={{ 
            fontSize: "11px", 
            color: "#d32f2f", 
            fontStyle: "italic",
            marginTop: "4px"
          }}>
            ⚠️ You must specify time spent to create an artlog
          </div>
        )}
        
        {/* Upload status indicator */}
        {Object.keys(uploadProgress).length > 0 && (
          <div style={{ 
            fontSize: "11px", 
            color: "#1976d2", 
            fontStyle: "italic",
            marginTop: "4px"
          }}>
            {Object.values(uploadProgress).some(progress => progress > 0 && progress < 100) 
              ? "⏳ Files uploading..." 
              : Object.values(uploadProgress).some(progress => progress === -1)
                ? "❌ Some uploads failed"
                : Object.values(uploadProgress).every(progress => progress === 100)
                  ? "✅ All files uploaded"
                  : "⏳ Preparing uploads..."}
          </div>
        )}
      </div>



      <style jsx>{`
        .artlog-form {
          /* No additional margin since it's nested in the devlog form */
        }
        
        .moments-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
          align-items: center;
          /* No padding since parent devlog form already has padding */
        }
        
        .moments-attach-btn {
          appearance: none;
          border: 1px solid rgba(0, 0, 0, 0.18);
          background: rgba(255, 255, 255, 0.75);
          color: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
        }
        
        .github-link-input {
          flex: 1;
          min-width: 200px;
        }
        
        .time-spent-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
          /* No padding since parent devlog form already has padding */
        }
        
        .moments-previews {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          /* No padding since parent devlog form already has padding */
        }
        
        .moments-preview-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #ddd;
        }
        
        .moments-preview-media {
          width: 120px;
          height: 120px;
          object-fit: cover;
        }
        
        .moments-remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          background: rgba(255, 0, 0, 0.8);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }
        
        .upload-error-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 0, 0, 0.8);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }
        
        .error-messages {
          margin-bottom: 16px;
          /* No padding since parent devlog form already has padding */
        }
        
        .error-message {
          color: #d32f2f;
          font-size: 14px;
          margin-bottom: 4px;
          padding: 8px 12px;
          background: rgba(255, 0, 0, 0.1);
          border-radius: 4px;
          border: 1px solid rgba(255, 0, 0, 0.3);
        }
        
        .upload-progress-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 10;
        }
        
        .upload-progress-bar {
          width: 80%;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .upload-progress-fill {
          height: 100%;
          background: #ff6fa5;
          transition: width 0.3s ease;
        }
        
        .upload-progress-text {
          font-size: 11px;
          font-weight: normal;
          margin-top: 4px;
          opacity: 0.9;
        }
        

      `}</style>
    </div>
  );
});

export default ArtlogPostForm;
