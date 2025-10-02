import React, { useState, useRef, useMemo } from "react";
import dynamic from 'next/dynamic';
import { uploadGame as uploadGameUtil } from "@/components/utils/uploadGame";
import { uploadMiscFile } from "@/components/utils/uploadMiscFile";
import ArtlogPostForm from "@/components/ArtlogPostForm";

const PostAttachmentRenderer = dynamic(() => import('@/components/utils/PostAttachmentRenderer'), { ssr: false });

export default function UploadModal({
  isOpen,
  onClose,
  token,
  profile,
  onPostCreated,
}) {
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [postMessage, setPostMessage] = useState("");
  const [postFiles, setPostFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]); // Store uploaded file results
  const [uploadProgress, setUploadProgress] = useState({}); // Track upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [isArtlogUploading, setIsArtlogUploading] = useState(false);
  const [postType, setPostType] = useState("moment"); // 'moment' | 'ship' | 'artlog'
  const [isDragActive, setIsDragActive] = useState(false);
  const [buildFile, setBuildFile] = useState(null);
  const [uploadAuthToken, setUploadAuthToken] = useState(
    process.env.NEXT_PUBLIC_UPLOAD_AUTH_TOKEN || "NeverTrustTheLiving#446",
  );
  const [userProfile, setUserProfile] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const gamePickerRef = useRef(null);
  const artlogFormRef = useRef(null);
  const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB limit for misc files
  const totalAttachmentBytes = useMemo(
    () =>
      (postFiles || []).reduce(
        (sum, f) => sum + (typeof f.size === "number" ? f.size : 0),
        0,
      ),
    [postFiles],
  );
  const overTotalLimit = totalAttachmentBytes > MAX_TOTAL_BYTES;

  // Refs for file inputs
  const buildFileInputRef = useRef(null);
  const momentsFileInputRef = useRef(null);

  // Key to force re-render of file inputs when needed
  const [fileInputKey, setFileInputKey] = useState(0);

  // Function to clear file inputs
  const clearFileInputs = () => {
    if (buildFileInputRef.current) buildFileInputRef.current.value = "";
    if (momentsFileInputRef.current) momentsFileInputRef.current.value = "";
    // Force re-render of file inputs
    setFileInputKey((prev) => prev + 1);
  };

  // Function to upload files to S3 when selected
  const uploadFilesToS3 = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const newUploadedFiles = [];
    const newProgress = {};
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
      
      try {
        // Set initial progress
        newProgress[fileKey] = 0;
        setUploadProgress({ ...newProgress });
        
        // Simulate progress updates during upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[fileKey] || 0;
            if (current < 90) {
              return { ...prev, [fileKey]: current + Math.random() * 10 };
            }
            return prev;
          });
        }, 200);
        
        // Upload file to S3
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";
        const uploadResult = await uploadMiscFile({
          file: file,
          apiBase: apiBase,
        });
        
        // Clear progress interval
        clearInterval(progressInterval);
        
        if (uploadResult.ok) {
          newUploadedFiles.push({
            ...uploadResult,
            originalFile: file,
            fileKey: fileKey
          });
          
          // Set progress to 100%
          newProgress[fileKey] = 100;
          setUploadProgress({ ...newProgress });
        } else {
          console.error(`Upload failed for ${file.name}:`, uploadResult.error);
          // Set progress to error state
          newProgress[fileKey] = -1; // -1 indicates error
          setUploadProgress({ ...newProgress });
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        newProgress[fileKey] = -1; // -1 indicates error
        setUploadProgress({ ...newProgress });
      }
    }
    
    setUploadedFiles(newUploadedFiles);
    setIsUploading(false);
  };

  // Handle artlog post submission
  const handleArtlogSubmit = async (postData) => {
    if (!token || !selectedGameId) return;
    
    setIsPosting(true);
    setPostMessage("");
    
    try {
      const res = await fetch("/api/createPost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          gameId: selectedGameId,
          content: postData.content,
          postType: 'artlog',
          timelapseVideoId: postData.timelapseVideoId,
          githubImageLink: postData.githubImageLink,
          timeScreenshotId: postData.timeScreenshotId,
          hoursSpent: postData.hoursSpent,
          minutesSpent: postData.minutesSpent
        }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setPostContent("");
        clearFileInputs();
        setPostType("moment"); // Reset to default
        setPostMessage("Artlog posted successfully!");
        setTimeout(() => setPostMessage(""), 2000);
        onPostCreated?.();
      } else {
        setPostMessage(`❌ Failed to post artlog: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setPostMessage(`❌ Failed to post artlog: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  // Fetch user profile and games
  const fetchUserData = async () => {
    if (!token) return;
    
    try {
      // Fetch user profile
      const profileRes = await fetch("/api/getMyProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const profileData = await profileRes.json().catch(() => ({}));
      if (profileRes.ok && profileData?.ok) {
        setUserProfile(profileData.profile || null);
      }

      // Fetch user games using the new lightweight API
      const gamesRes = await fetch("/api/GetUserGamesForUpload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const gamesData = await gamesRes.json().catch(() => []);
      if (Array.isArray(gamesData)) {
        setAvailableGames(gamesData);
        if (gamesData.length > 0) {
          setSelectedGameId(gamesData[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset form when modal opens/closes
  const resetForm = () => {
    setPostContent("");
    setPostMessage("");
    setPostFiles([]);
    setUploadedFiles([]);
    setUploadProgress({});
    setIsUploading(false);
    setIsArtlogUploading(false);
    setPostType("moment");
    setBuildFile(null);
    setSelectedGameId(null);
    clearFileInputs();
  };

  // Load data when modal opens
  React.useEffect(() => {
    if (isOpen && token) {
      fetchUserData();
    } else if (!isOpen) {
      resetForm();
    }
  }, [isOpen, token]);

  // Close picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showGamePicker) return;
      const node = gamePickerRef.current;
      if (node && !node.contains(event.target)) {
        setShowGamePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showGamePicker]);

  if (!isOpen) return null;

  const selectedGame = availableGames.find(g => g.id === selectedGameId);
  const isProfileComplete = userProfile && 
    userProfile.firstName && 
    userProfile.lastName && 
    userProfile.email && 
    userProfile.githubUsername && 
    userProfile.birthday && 
    userProfile.phoneNumber && 
    userProfile.slackId && 
    userProfile.address?.street1 && 
    userProfile.address?.city && 
    userProfile.address?.state && 
    userProfile.address?.zipcode && 
    userProfile.address?.country;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#000" }}>Create Post</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px"
            }}
          >
            ×
          </button>
        </div>

        {/* Game Selection */}
        {availableGames.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#000" }}>
              Select Game:
            </label>
            <div ref={gamePickerRef} style={{ position: "relative" }}>
              <div
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "white"
                }}
                onClick={() => setShowGamePicker(!showGamePicker)}
              >
                {selectedGame?.thumbnailUrl ? (
                  <img
                    src={selectedGame.thumbnailUrl}
                    alt={selectedGame.name}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px",
                      objectFit: "cover",
                      border: "1px solid #ddd"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px",
                      backgroundColor: "#f0f0f0",
                      border: "1px solid #ddd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      color: "#666"
                    }}
                  >
                    ?
                  </div>
                )}
                <span style={{ flex: 1, fontSize: "14px", color: "#000" }}>
                  {selectedGame?.name || "Select a game"}
                </span>
                <span style={{ fontSize: "12px", color: "#000" }}>▼</span>
              </div>
              {showGamePicker && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    background: "white",
                    maxHeight: "200px",
                    overflow: "auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}
                >
                  {availableGames.map((game) => (
                    <div
                      key={game.id}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "white";
                      }}
                      onClick={() => {
                        setSelectedGameId(game.id);
                        setShowGamePicker(false);
                      }}
                    >
                      {game.thumbnailUrl ? (
                        <img
                          src={game.thumbnailUrl}
                          alt={game.name}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            objectFit: "cover",
                            border: "1px solid #ddd"
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            backgroundColor: "#f0f0f0",
                            border: "1px solid #ddd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            color: "#666"
                          }}
                        >
                          ?
                        </div>
                      )}
                      <span style={{ fontSize: "14px", color: "#000" }}>{game.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Composer */}
        <div
          className={`moments-composer${isDragActive ? " drag-active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragActive(false);
            const incomingAll = Array.from(e.dataTransfer?.files || []);
            const incoming = incomingAll.filter((f) => {
              const t = (f.type || "").toLowerCase();
              return (
                postType === "moment" &&
                (t.startsWith("image/") ||
                  t.startsWith("video/") ||
                  t.startsWith("audio/"))
              );
            });
            if (incoming.length === 0) return;
            
            setPostFiles((prev) => {
              const byKey = new Map();
              const addAll = (arr) => {
                for (const f of arr) {
                  const key = `${f.name}|${f.size}|${f.lastModified}`;
                  if (!byKey.has(key)) byKey.set(key, f);
                }
              };
              addAll(prev || []);
              addAll(incoming);
              return Array.from(byKey.values());
            });
            
            await uploadFilesToS3(incoming);
          }}
        >
          <textarea
            className="moments-textarea"
            placeholder={
              postType === "ship" && !isProfileComplete
                ? "Complete your profile to unlock demo posting"
                : "Write what you added here..."
            }
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            disabled={postType === "ship" && !isProfileComplete}
            style={{
              opacity: postType === "ship" && !isProfileComplete ? 0.5 : 1,
              cursor:
                postType === "ship" && !isProfileComplete
                  ? "not-allowed"
                  : "text",
            }}
            onPaste={async (e) => {
              if (postType !== "moment") return;

              const items = Array.from(e.clipboardData.items);
              const imageItem = items.find((item) =>
                item.type.startsWith("image/"),
              );

              if (imageItem) {
                e.preventDefault();

                const file = imageItem.getAsFile();
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    alert(
                      "Pasted image is too large. Please use an image under 5MB.",
                    );
                    return;
                  }

                  setPostFiles((prev) => {
                    const byKey = new Map();
                    const addAll = (arr) => {
                      for (const f of arr) {
                        const key = `${f.name}|${f.size}|${f.lastModified}`;
                        if (!byKey.has(key)) byKey.set(key, f);
                      }
                    };
                    addAll(prev || []);
                    addAll([file]);
                    return Array.from(byKey.values());
                  });
                  
                  await uploadFilesToS3([file]);
                }
              }
            }}
          />
          
          {/* Previews */}
          {Array.isArray(postFiles) && postFiles.length > 0 && (
            <div className="moments-previews">
              {postFiles.map((file, idx) => {
                const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
                const progress = uploadProgress[fileKey] || 0;
                const uploadedFile = uploadedFiles.find(uf => uf.fileKey === fileKey);
                const url = uploadedFile?.url || URL.createObjectURL(file);
                const type = (file.type || "").split("/")[0];
                const isUploading = progress > 0 && progress < 100;
                const hasError = progress === -1;
                
                return (
                  <div
                    key={fileKey}
                    className="moments-preview-item"
                  >
                    {type === "video" ? (
                      <video
                        src={url}
                        className="moments-preview-media"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={url}
                        alt={file.name || ""}
                        className="moments-preview-media"
                      />
                    )}
                    
                    {isUploading && (
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
                    )}
                    
                    <button
                      type="button"
                      className="moments-remove-btn"
                      title="Remove"
                      onClick={() => {
                        setPostFiles((prev) =>
                          prev.filter((_, i) => i !== idx),
                        );
                        setUploadedFiles((prev) =>
                          prev.filter(uf => uf.fileKey !== fileKey)
                        );
                        setUploadProgress((prev) => {
                          const newProgress = { ...prev };
                          delete newProgress[fileKey];
                          return newProgress;
                        });
                        if (!uploadedFile) {
                          URL.revokeObjectURL(url);
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="moments-footer">
            {/* Attachment control: depends on postType */}
            {postType === "ship" ? (
              <>
                <input
                  key={`build-file-${fileInputKey}`}
                  ref={buildFileInputRef}
                  type="file"
                  accept=".zip"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file =
                      (e.target.files && e.target.files[0]) || null;

                    if (file && !file.name.toLowerCase().endsWith(".zip")) {
                      alert(
                        "❌ Invalid file format!\n\nPlease select a .zip file from your Godot HTML5 export.\n\nIn Godot: Project → Export → Web → Export Project → Export as HTML5",
                      );
                      e.target.value = "";
                      setBuildFile(null);
                      return;
                    }

                    setBuildFile(file);
                  }}
                />
                <button
                  type="button"
                  className="moments-attach-btn"
                  onClick={() => {
                    buildFileInputRef.current?.click();
                  }}
                  title="Upload a .zip file from Godot HTML5 export (Project → Export → Web → Export as HTML5)"
                >
                  {buildFile
                    ? `Selected: ${buildFile.name}`
                    : "Upload Godot Web Build (.zip)"}
                </button>
                <input type="hidden" value={uploadAuthToken} readOnly />
              </>
            ) : postType === "artlog" ? (
              <ArtlogPostForm
                ref={artlogFormRef}
                onSubmit={handleArtlogSubmit}
                onCancel={() => setPostType("moment")}
                postContent={postContent}
                setPostContent={setPostContent}
                isPosting={isPosting}
                setIsPosting={setIsPosting}
                setPostMessage={setPostMessage}
                onUploadStateChange={(isUploading) => {
                  setIsArtlogUploading(isUploading);
                }}
              />
            ) : (
              <>
                <input
                  key={`moments-file-${fileInputKey}`}
                  ref={momentsFileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.mp3,.mp4,.gif,.mov,.wav,.ogg,.m4a,.aac"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const f = (e.target.files && e.target.files[0]) || null;

                    if (f) {
                      const validTypes = ["image/", "video/", "audio/"];
                      const isValidType = validTypes.some((type) =>
                        f.type.startsWith(type),
                      );
                      if (!isValidType) {
                        alert(
                          "❌ Invalid file type!\n\nPlease select an image, video, or audio file for your Shiba Moment.",
                        );
                        e.target.value = "";
                        return;
                      }
                    }

                    setPostFiles(f ? [f] : []);
                    setUploadedFiles([]);
                    setUploadProgress({});
                    
                    if (f) {
                      await uploadFilesToS3([f]);
                    }
                    
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="moments-attach-btn"
                  onClick={() => {
                    momentsFileInputRef.current?.click();
                  }}
                >
                  {postFiles.length
                    ? `Selected: ${postFiles[0].name}`
                    : "Upload Screenshots"}
                </button>
              </>
            )}
            <div className="moments-footer-spacer" />
            
            {/* Visual toggle: Shiba Moment vs Shiba Ship vs Artlog */}
            <div
              className="moment-type-toggle"
              role="tablist"
              aria-label="Post type"
            >
              <button
                type="button"
                className={`moment-type-option${postType === "moment" ? " active" : ""}`}
                aria-selected={postType === "moment"}
                onClick={() => {
                  setPostType("moment");
                  setBuildFile(null);
                  setPostFiles([]);
                  setIsArtlogUploading(false);
                  clearFileInputs();
                }}
              >
                Devlog
              </button>
              <button
                type="button"
                className={`moment-type-option${postType === "artlog" ? " active" : ""}`}
                aria-selected={postType === "artlog"}
                onClick={() => {
                  setPostType("artlog");
                  setBuildFile(null);
                  setPostFiles([]);
                  setIsArtlogUploading(false);
                }}
              >
                Artlog
              </button>
              <button
                type="button"
                className={`moment-type-option${postType === "ship" ? " active" : ""}`}
                aria-selected={postType === "ship"}
                onClick={() => {
                  setPostType("ship");
                  setBuildFile(null);
                  setPostFiles([]);
                  setIsArtlogUploading(false);
                  clearFileInputs();
                }}
              >
                Demo
              </button>
            </div>
            
            <button
              className="moments-post-btn"
              disabled={
                !selectedGameId ||
                isPosting || 
                isUploading || 
                isArtlogUploading ||
                (postType === "moment" && postFiles.length > 0 && uploadedFiles.length === 0) ||
                (postType === "ship" && !isProfileComplete) ||
                (postType === "artlog" && (!postContent.trim() || !artlogFormRef.current))
              }
              onClick={async () => {
                if (!token || !selectedGameId || !postContent.trim()) return;
                if (postType === "moment" && postFiles.length === 0) {
                  alert(
                    "Add a media file (image/video/audio) of what you added in this update",
                  );
                  return;
                }
                if (postType === "artlog") {
                  if (!artlogFormRef.current) {
                    alert("Artlog form not ready");
                    return;
                  }
                  
                  const artlogData = artlogFormRef.current.getFormData();
                  if (!artlogData) {
                    return;
                  }
                  
                  await handleArtlogSubmit(artlogData);
                  return;
                }
                if (postType === "ship") {
                  if (!isProfileComplete) {
                    alert(
                      "You must complete your profile before uploading your demo.",
                    );
                    return;
                  }
                  if (!selectedGame?.GitHubURL || selectedGame.GitHubURL.trim() === "") {
                    alert(
                      "You must update your game to have a GitHub Repository to upload your demo. All games in Shiba must be open-sourced.",
                    );
                    return;
                  }
                  if (!buildFile || !uploadAuthToken) {
                    alert(
                      "Zip your godot web build and add it here with a msg of what you added!",
                    );
                    return;
                  }
                }
                
                setIsPosting(true);
                setPostMessage("");
                try {
                  let contentToSend = postContent.trim();
                  let attachmentsUpload = undefined;
                  if (postType === "ship" && buildFile) {
                    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";
                    const uploadResp = await uploadGameUtil({
                      file: buildFile,
                      name: selectedGame?.name || "game",
                      token: uploadAuthToken,
                      apiBase,
                    });
                    if (!uploadResp.ok) {
                      if (uploadResp.validationError && uploadResp.details) {
                        alert(
                          `Upload Failed: ${uploadResp.error}\n\n${uploadResp.details}`,
                        );
                      } else {
                        setPostMessage(
                          `Upload failed: ${uploadResp.error || "Unknown error"}`,
                        );
                      }
                      setIsPosting(false);
                      return;
                    }
                    const absolutePlayUrl = apiBase
                      ? `${apiBase}${uploadResp.playUrl}`
                      : uploadResp.playUrl;
                    var playLink = absolutePlayUrl;
                  }
                  if (postType === "moment" && postFiles.length) {
                    const f = postFiles[0];
                    const fileKey = `${f.name}-${f.size}-${f.lastModified}`;
                    const uploadedFile = uploadedFiles.find(uf => uf.fileKey === fileKey);
                    
                    if (!uploadedFile) {
                      setPostMessage("Please wait for file upload to complete");
                      setIsPosting(false);
                      return;
                    }
                    
                    attachmentsUpload = [
                      {
                        url: uploadedFile.url,
                        type: f.type || "application/octet-stream",
                        contentType: f.type || "application/octet-stream",
                        filename: f.name || "attachment",
                        id: uploadedFile.fileId,
                        size: f.size
                      },
                    ];
                  }
                  const res = await fetch("/api/createPost", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      token,
                      gameId: selectedGameId,
                      content: contentToSend,
                      attachmentsUpload,
                      playLink,
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data?.ok) {
                    setPostContent("");
                    setBuildFile(null);
                    setPostFiles([]);
                    setPostMessage("Posted!");
                    setTimeout(() => setPostMessage(""), 2000);
                    onPostCreated?.();
                  } else {
                    setPostMessage(data?.message || "Failed to post");
                    setBuildFile(null);
                    setPostFiles([]);
                    clearFileInputs();
                  }
                } catch (e) {
                  console.error(e);
                  setPostMessage("Failed to post");
                  setBuildFile(null);
                  setPostFiles([]);
                  clearFileInputs();
                } finally {
                  setIsPosting(false);
                }
              }}
            >
              {isPosting
                ? postType === "ship"
                  ? "Shipping…"
                  : "Posting…"
                : isUploading || isArtlogUploading
                  ? "Uploading…"
                  : overTotalLimit
                    ? "Files exceed 50MB"
                    : postType === "ship"
                      ? "Ship"
                      : "Post"}
            </button>
          </div>
        </div>
        
        {overTotalLimit ? (
          <p style={{ marginTop: 8, color: "#b00020" }}>
            Total files must be under 50MB. Try removing some files or
            using smaller ones.
          </p>
        ) : null}
        
        {postType === "ship" && !isProfileComplete && (
          <div
            style={{
              marginTop: 8,
              padding: "12px",
              backgroundColor: "white",
              border: "2px solid #b00020",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#b00020",
              fontWeight: "bold",
            }}
          >
            ⚠️ Complete your profile to unlock demo posting
          </div>
        )}
        
        {postMessage ? (
          <p style={{ marginTop: 8, opacity: 0.7, color: "#000" }}>{postMessage}</p>
        ) : null}
      </div>

      <style jsx>{`
        .moments-composer {
          border: 1px solid rgba(0, 0, 0, 0.18);
          border-radius: 10px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.75);
          transition:
            border-color 120ms ease,
            box-shadow 120ms ease,
            background 120ms ease;
        }
        .moments-composer.drag-active {
          border-color: rgba(0, 0, 0, 0.35);
          box-shadow: 0 0 0 3px rgba(255, 111, 165, 0.25);
          background: rgba(255, 255, 255, 0.85);
        }
        .moments-previews {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 8px;
          background: rgba(255, 255, 255, 0.65);
          border-bottom: 1px solid rgba(0, 0, 0, 0.12);
        }
        .moments-preview-item {
          position: relative;
          width: 88px;
          height: 88px;
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.85);
        }
        .moments-preview-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .moments-remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 18px;
          height: 18px;
          line-height: 18px;
          border-radius: 9999px;
          border: 1px solid rgba(0, 0, 0, 0.18);
          background: rgba(255, 255, 255, 0.9);
          color: rgba(0, 0, 0, 0.8);
          cursor: pointer;
          font-size: 12px;
          padding: 0;
        }
        .moments-textarea {
          width: 100%;
          min-height: 120px;
          resize: vertical;
          font-size: 14px;
          box-sizing: border-box;
          padding: 10px;
          outline: none;
          border: 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 10px 10px 0 0;
          background: transparent;
          color: #000;
        }
        .moments-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.65);
          border-radius: 0 0 10px 10px;
        }
        .moment-type-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-right: 6px;
          border: 1px solid rgba(0, 0, 0, 0.18);
          border-radius: 12px;
          padding: 4px;
          background: rgba(255, 255, 255, 0.85);
        }
        .moment-type-option {
          appearance: none;
          border: 0;
          background: rgba(255, 255, 255, 0.75);
          color: #000;
          border-radius: 9999px;
          padding: 6px 10px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        }
        .moment-type-option.active {
          border: 0;
          color: #fff;
          background: linear-gradient(180deg, #ff8ec3 0%, #ff6fa5 100%);
        }
        .moments-footer-spacer {
          flex: 1;
        }
        .moments-attach-btn {
          appearance: none;
          border: 1px solid rgba(0, 0, 0, 0.18);
          background: rgba(255, 255, 255, 0.75);
          color: #000;
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
        }
        .moments-post-btn {
          appearance: none;
          border: 0;
          background: linear-gradient(180deg, #ff8ec3 0%, #ff6fa5 100%);
          color: #fff;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 800;
          font-size: 13px;
        }
        .moments-post-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #ccc;
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
}
