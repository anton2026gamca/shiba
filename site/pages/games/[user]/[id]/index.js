import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

const PlayGameComponent = dynamic(() => import('@/components/utils/playGameComponent'), { ssr: false });

// Journal Post Renderer - renders post content without profile header
        function CommentsSection({ token, commentText, setCommentText, commentStarRating, setCommentStarRating, isSubmittingComment, setIsSubmittingComment, feedback, gameData, onCommentSubmitted }) {
  const [feedbackWithProfiles, setFeedbackWithProfiles] = useState([]);

  // Fetch profile data for feedback creators
  useEffect(() => {
    console.log('[CommentsSection] Received feedback:', feedback);
    if (!feedback || feedback.length === 0) {
      console.log('[CommentsSection] No feedback to display');
      setFeedbackWithProfiles([]);
      return;
    }

    console.log('[CommentsSection] Fetching profiles for', feedback.length, 'comments');
    const fetchProfiles = async () => {
      const profilesWithData = await Promise.all(
        feedback.map(async (comment) => {
          if (!comment.messageCreatorSlack) {
            return { ...comment, displayName: 'Anonymous', profileImage: null };
          }

          try {
            const response = await fetch(`/api/slackProfiles?slackId=${encodeURIComponent(comment.messageCreatorSlack)}`);
            const profileData = await response.json().catch(() => ({}));
            
            return {
              ...comment,
              displayName: profileData.displayName || comment.messageCreatorSlack,
              profileImage: profileData.image || null
            };
          } catch (error) {
            console.error(`Error fetching profile for ${comment.messageCreatorSlack}:`, error);
            return {
              ...comment,
              displayName: comment.messageCreatorSlack,
              profileImage: null
            };
          }
        })
      );
      
      setFeedbackWithProfiles(profilesWithData);
    };

    fetchProfiles();
  }, [feedback]);
  return (
    <div style={{
      width: "100%",
      maxWidth: "800px",
      border: "1px solid rgba(0, 0, 0, 0.18)",
      borderRadius: "10px",
      background: "rgba(255, 255, 255, 0.8)",
      padding: "16px",
      marginTop: "16px"
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '12px'
      }}>
        Comments
      </h3>
      
      {/* Comment Input */}
      <div style={{ marginBottom: '16px' }}>
        {/* Text area */}
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Leave a comment..."
          style={{
            width: "100%",
            minHeight: "80px",
            resize: "vertical",
            fontSize: "14px",
            boxSizing: "border-box",
            padding: "10px",
            outline: "none",
            border: "1px solid rgba(0, 0, 0, 0.18)",
            borderRadius: "10px 10px 0 0",
            background: "rgba(255, 255, 255, 0.75)",
            fontFamily: "inherit"
          }}
        />

        {/* Star rating and button container */}
        <div className="comment-actions" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px",
          background: "white",
          border: "1px solid rgba(0, 0, 0, 0.18)",
          borderTop: "1px solid rgba(0, 0, 0, 0.18)",
          marginTop: "-6px",
          borderRadius: "0 0 10px 10px",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          {/* Star Rating */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {Array.from({ length: 5 }, (_, index) => {
              const starNumber = index + 1;
              const isSelected = starNumber <= commentStarRating;
              
              return (
                <button
                  key={starNumber}
                  onClick={() => setCommentStarRating(starNumber)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer"
                  }}
                >
                  <img
                    src="/SpeedyShibaShipper.png"
                    alt={`${starNumber} star`}
                    style={{
                      width: "24px",
                      height: "24px",
                      opacity: isSelected ? 1.0 : 0.1,
                      transition: "opacity 0.2s ease"
                    }}
                  />
                </button>
              );
            })}
            <span style={{ marginLeft: "8px", fontSize: "14px", color: "#666" }}>
              {commentStarRating > 0 ? `${commentStarRating} star${commentStarRating > 1 ? 's' : ''}` : "Select rating"}
            </span>
          </div>

                  <button
                    onClick={async () => {
                      if (!token) {
                        alert("Please login to comment");
                        return;
                      }
                      if (commentStarRating === 0) {
                        alert("Please select a star rating");
                        return;
                      }
                      if (!gameData || !gameData.name || !gameData.slackId) {
                        alert("Game data not available");
                        return;
                      }
                      
                      setIsSubmittingComment(true);
                      
                      try {
                        const response = await fetch('/api/CreateGameFeedback', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            token,
                            gameName: gameData.name,
                            gameSlackId: gameData.slackId,
                            message: commentText.trim(),
                            starRanking: commentStarRating
                          })
                        });
                        
                        const result = await response.json();
                        
                        if (response.ok && result.ok) {
                          // Clear the form
                          setCommentText('');
                          setCommentStarRating(0);
                          
                          // Add the new comment to the local state immediately for real-time update
                          if (onCommentSubmitted && result.feedback) {
                            onCommentSubmitted(result.feedback);
                          }
                        } else {
                          alert('Failed to submit comment: ' + (result.message || 'Unknown error'));
                        }
                      } catch (error) {
                        console.error('Error submitting comment:', error);
                        alert('Error submitting comment: ' + error.message);
                      } finally {
                        setIsSubmittingComment(false);
                      }
                    }}
            disabled={isSubmittingComment || !commentText.trim() || commentStarRating === 0}
            style={{
              appearance: "none",
              border: "0",
              background: isSubmittingComment || !commentText.trim() || commentStarRating === 0 ? "#ccc" : "linear-gradient(180deg, #ff8ec3 0%, #ff6fa5 100%)",
              color: "#fff",
              borderRadius: "10px",
              padding: "10px 16px",
              cursor: isSubmittingComment || !commentText.trim() || commentStarRating === 0 ? "not-allowed" : "pointer",
              fontWeight: "800",
              fontSize: "13px",
              fontFamily: "inherit",
              opacity: isSubmittingComment || !commentText.trim() || commentStarRating === 0 ? 0.5 : 1
            }}
          >
            {isSubmittingComment ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </div>

              {/* Display existing feedback */}
              {feedbackWithProfiles && feedbackWithProfiles.length > 0 ? (
                <div style={{ marginTop: '16px' }}>
                  {feedbackWithProfiles.map((comment, index) => (
                    <div key={comment.id || index} style={{ marginBottom: index < feedbackWithProfiles.length - 1 ? '16px' : '0' }}>
                      {/* Divider line between comments */}
                      {index > 0 && (
                        <div style={{
                          height: '1px',
                          background: 'rgba(0, 0, 0, 0.1)',
                          margin: '16px 0'
                        }} />
                      )}
                      
                      {/* Comment header with profile info */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        marginBottom: '8px',
                        fontSize: '12px'
                      }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: '1px solid rgba(0,0,0,0.18)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: '#fff',
                          backgroundImage: comment.profileImage ? `url(${comment.profileImage})` : 'none',
                        }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <strong>{comment.displayName || comment.messageCreatorSlack || 'Anonymous'}</strong>
                            {/* Display badges */}
                            {Array.isArray(comment.messageCreatorBadges) && comment.messageCreatorBadges.map((badge, badgeIndex) => {
                              // Map badge names to correct image paths based on PostAttachmentRenderer.js
                              const getBadgeImagePath = (badgeName) => {
                                switch (badgeName) {
                                  case 'Speedy Shiba Shipper': return '/SpeedyShibaShipper.png';
                                  case 'Super Subtle Shiba': return '/SuperSubtleShiba.png';
                                  case 'Shomato': return '/shomato.png';
                                  case 'Shiba Showreel Submitter': return '/ShibaShowreel.png';
                                  case 'Stargazer': return '/Stargazer.png';
                                  case 'Shiba Pie': return '/PieBadge.svg';
                                  case 'Twin Shark': return '/TwinShark.png';
                                  case 'Akito Lover': return '/AkitoLover.png';
                                  case 'Shiba Sushi': return '/ShibaSushi.png';
                                  case 'Umbrella Badge': return '/UmbrellaBadge.png';
                                  case 'Shiba Fox': return '/ShibaFox.png';
                                  case 'ChefsCircle': return '/ChefsCircle.png';
                                  case 'House Of Mine': return '/HouseOfMine.png';
                                  case 'Bug Crusher': return '/BugCrusher.png';
                                  case 'Fist Of Fury': return '/FistOfFurry.png';
                                  case 'Be Cool': return '/BeCool.png';
                                  case 'Chaotic Dice': return '/ChaoticDice.gif';
                                  case 'Shiba Friendship': return '/ShibaFriendship.png';
                                  case 'CARRR': return '/CARRR.png';
                                  case 'Space Head': return '/Space-Head.png';
                                  case 'Gastly Badge': return '/gastly.png';
                                  case 'Shiba Axtro Ship': return '/axtro.png';
                                  case 'Speedy Shiba Racer': return '/ShibaRacer.svg';
                                  case 'Fish Keychain': return '/fishGif.gif';
                                  case 'Shiba Omelette': return '/ShibaEgg.png';
                                  case 'Shadow Merger': return '/shadow.gif';
                                  case 'Fatty Frog': return '/fatFrog.gif';
                                  case 'Shiba As Gundam': return '/ShibaAsGundam.png';
                                  case 'Shiba Radio': return '/Note_Block_animate.gif';
                                  case 'Randomness': return '/randomness.gif';
                                  case 'Nature': return '/tree.svg';
                                  case 'Daydream': return '/daydream.png';
                                  case 'Yapper': return '/Yapper.gif';
                                  default: return `/${badgeName.replace(/\s+/g, '')}.png`;
                                }
                              };

                              return (
                                <div key={badgeIndex} style={{ position: 'relative', display: 'inline-block' }}>
                                  <img
                                    src={getBadgeImagePath(badge)}
                                    alt={badge}
                                    style={{
                                      width: 16,
                                      height: 16,
                                      cursor: 'pointer',
                                      transition: 'transform 0.2s ease-out, border 0.2s ease-out, background-color 0.2s ease-out',
                                      border: '1px dotted transparent',
                                      borderRadius: '3px',
                                      backgroundColor: 'transparent',
                                      objectFit: 'contain'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.transform = 'scale(1.1)';
                                      e.target.style.border = '1px dotted #999';
                                      e.target.style.backgroundColor = 'white';
                                      setTimeout(() => {
                                        e.target.style.transform = 'scale(1)';
                                      }, 200);
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.transform = 'scale(1)';
                                      e.target.style.border = '1px dotted transparent';
                                      e.target.style.backgroundColor = 'transparent';
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            fontSize: '11px', 
                            opacity: 0.6, 
                            marginTop: '2px'
                          }}>
                            {/* Star rating display */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              {Array.from({ length: 5 }, (_, starIndex) => {
                                const starNumber = starIndex + 1;
                                const isSelected = starNumber <= (comment.StarRanking || comment.starRanking || 0);
                                
                                return (
                                  <img
                                    key={starNumber}
                                    src="/SpeedyShibaShipper.png"
                                    alt={`${starNumber} star`}
                                    style={{
                                      width: 12,
                                      height: 12,
                                      opacity: isSelected ? 1.0 : 1.0,
                                      filter: isSelected ? 'none' : 'grayscale(100%) brightness(0.3)',
                                      transition: "filter 0.2s ease"
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <span>●</span>
                            <span>
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: '2-digit'
                              }) : ''}
                            </span>
                            <span>
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              }) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Comment content */}
                      <div style={{ 
                        marginLeft: '34px',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {comment.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666', fontSize: '14px' }}>No comments currently</p>
              )}
    </div>
  );
}

function JournalPostRenderer({ content, attachments, playLink, gameName, thumbnailUrl, slackId, createdAt, badges, HoursSpent, gamePageUrl, postType, timelapseVideoId, githubImageLink, timeScreenshotId, hoursSpent, minutesSpent, timeSpentOnAsset, gitChanges, user, id }) {
  const [expandedCommits, setExpandedCommits] = useState({});
  
  // Calculate timeSpentOnAsset from hoursSpent and minutesSpent if not provided
  const calculatedTimeSpentOnAsset = timeSpentOnAsset || (hoursSpent && minutesSpent ? hoursSpent + (minutesSpent / 60) : 0);
  
  // Prefer explicit PlayLink field provided by API
  let playHref = typeof playLink === 'string' && playLink.trim() ? playLink.trim() : null;

  // If attachments contain a text/plain with a play URL, fallback (rare)
  if (!playHref && Array.isArray(attachments)) {
    const txt = attachments.find((a) => (a?.type || a?.contentType || "").startsWith("text/"));
    if (txt && typeof txt.url === "string") {
      playHref = txt.url;
    }
  }

  let gameId = '';
  if (playHref) {
    try {
      const path = playHref.startsWith('http') ? new URL(playHref).pathname : playHref;
      const m = /\/play\/([^\/?#]+)/.exec(path);
      gameId = m && m[1] ? decodeURIComponent(m[1]) : '';
    } catch (_) {
      gameId = '';
    }
  }

  // Utility: classify attachment kind using MIME and filename extension
  const classifyKind = (att) => {
    const rawType = String(att?.type || att?.contentType || '').toLowerCase();
    const filename = String(att?.filename || '');
    let ext = '';

    if (filename && filename.includes('.')) {
      ext = filename.split('.').pop().toLowerCase();
    }
    else if (att?.url) {
      try {
        const u = new URL(att.url, 'https://dummy');
        const p = u.pathname || '';
        if (p.includes('.')) {
          ext = p.split('.').pop().toLowerCase();
        }
      } catch (_) {
        // ignore
      }
    }

    const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']);
    const videoExts = new Set(['mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv', 'mpg', 'mpeg']);
    const audioExts = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']);

    if (rawType.startsWith('image/') || imageExts.has(ext)) return 'image';
    if (rawType.startsWith('video/') || videoExts.has(ext)) return 'video';
    if (rawType.startsWith('audio/') || audioExts.has(ext)) return 'audio';

    if (rawType === 'application/octet-stream' || !rawType) {
      if (imageExts.has(ext)) return 'image';
      if (videoExts.has(ext)) return 'video';
      if (audioExts.has(ext)) return 'audio';
    }

    return 'other';
  };

  const isArtlog = postType === 'artlog' || (timelapseVideoId && githubImageLink && calculatedTimeSpentOnAsset > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 12, paddingBottom: 12 }}>
      {/* Timestamp and hours */}
      {createdAt && (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, fontSize: 12, opacity: 0.6, alignItems: 'center' }}>
          {timeSpentOnAsset
            ? (
              <>
                <span style={{ fontWeight: 600 }}>
                  {`${Math.floor(timeSpentOnAsset)}h${Math.round((timeSpentOnAsset % 1) * 60)}m`}
                </span>
                <span style={{ fontSize: 8 }}>●</span>
              </>
            )
            : (HoursSpent && HoursSpent > 0 && Math.floor((HoursSpent % 1) * 60) > 0 && (
              <>
                <span style={{ fontWeight: 600 }}>
                  {Math.floor(HoursSpent) > 0 ? `${Math.floor(HoursSpent)}hr ` : ''}{Math.round((HoursSpent % 1) * 60)}min
                </span>
                <span style={{ fontSize: 8 }}>●</span>
              </>
            ))
          }
          <span>
            {new Date(createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </span>
          <span>
            {new Date(createdAt).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: '2-digit'
            })}
          </span>
        </div>
      )}

      {/* Content */}
      <div style={{ whiteSpace: 'pre-wrap' }}>{content || ''}</div>

      {/* Artlog-specific rendering */}
      {isArtlog && (
        <div style={{ marginTop: '8px' }}>
          {/* Timelapse Video */}
          {timelapseVideoId && (
            <div style={{ marginBottom: '12px' }}>
              <video
                src={timelapseVideoId}
                controls
                playsInline
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  borderRadius: '8px',
                  background: '#000'
                }}
              />
            </div>
          )}
          
          {/* GitHub Image Link - styled like git commits */}
          {githubImageLink && (
            <div style={{ marginBottom: '12px' }}>
              <a
                href={githubImageLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  backgroundColor: '#f1f3f5',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#24292e',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  border: '1px solid #d0d7de'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.borderColor = '#adb5bd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f3f5';
                  e.currentTarget.style.borderColor = '#d0d7de';
                }}
              >
                <img 
                  src="/githubIcon.svg" 
                  alt="GitHub" 
                  style={{ 
                    width: '14px', 
                    height: '14px',
                    display: 'block',
                    opacity: 0.6
                  }} 
                />
                <span style={{ fontWeight: '500' }}>View on GitHub</span>
              </a>
            </div>
          )}
          
          {/* Time Screenshot - styled like git commits */}
          {timeScreenshotId && (
            <div style={{ marginBottom: '12px' }}>
              <a
                href={typeof timeScreenshotId === 'string' ? timeScreenshotId : timeScreenshotId?.[0]?.url || ''}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  backgroundColor: '#f1f3f5',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#24292e',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  border: '1px solid #d0d7de'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.borderColor = '#adb5bd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f3f5';
                  e.currentTarget.style.borderColor = '#d0d7de';
                }}
              >
                <img 
                  src="/clock.svg" 
                  alt="Time" 
                  style={{ 
                    width: '14px', 
                    height: '14px',
                    display: 'block',
                    opacity: 0.6
                  }} 
                />
                <span style={{ fontWeight: '500' }}>Time Screenshot</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Game embed */}
      {gameId && (
        <PlayGameComponent
          gameId={gameId}
          gameName={gameName}
          thumbnailUrl={thumbnailUrl}
          animatedBackground={''}
          token={null}
          onPlayCreated={() => {}}
          gamePageUrl={gamePageUrl}
          compact={false}
          isFromMainPage={false}
        />
      )}

      {/* Attachments */}
      {Array.isArray(attachments) && attachments.length > 0 && (() => {
        const media = attachments.filter((att) => {
          const kind = classifyKind(att);
          return kind === 'image' || kind === 'video';
        });
        const mediaCount = media.length;
        const columns = Math.max(1, Math.min(mediaCount, 3));
        const imageMax = Math.max(160, Math.floor(480 / columns));
        const videoMax = Math.max(200, Math.floor(540 / columns));
        return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
            {attachments.map((att, idx) => {
              const url = att?.url;
              const kind = classifyKind(att);
              if (!url) return null;
              if (kind === 'image') {
                return (
                  <img
                    key={att.id || idx}
                    src={url}
                    alt={att.filename || ''}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: imageMax,
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      background: '#fff',
                    }}
                  />
                );
              }
              if (kind === 'video') {
                return (
                  <video
                    key={att.id || idx}
                    src={url}
                    controls
                    playsInline
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: videoMax,
                      borderRadius: 8,
                      background: '#000',
                    }}
                  />
                );
              }
              if (kind === 'audio') {
                return (
                  <div key={att.id || idx} style={{ gridColumn: columns > 1 ? `span ${columns}` : 'auto' }}>
                    <audio src={url} controls style={{ width: '100%' }} />
                  </div>
                );
              }
              return (
                <a
                  key={att.id || idx}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  style={{ fontSize: 12, gridColumn: columns > 1 ? `span ${columns}` : 'auto' }}
                >
                  {att.filename || url}
                </a>
              );
            })}
          </div>
        );
      })()}

      {/* Git Changes */}
      {gitChanges && gitChanges.commits && gitChanges.commits.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginTop: '12px'
        }}>
          {gitChanges.commits.map((commit, commitIndex) => {
            const totalAdditions = commit.files?.reduce((sum, f) => sum + (f.additions || 0), 0) || 0;
            const totalDeletions = commit.files?.reduce((sum, f) => sum + (f.deletions || 0), 0) || 0;
            const isExpanded = expandedCommits[commitIndex];
            
            const sortedFiles = commit.files ? [...commit.files].sort((a, b) => {
              const aTotal = (a.additions || 0) + (a.deletions || 0);
              const bTotal = (b.additions || 0) + (b.deletions || 0);
              return bTotal - aTotal;
            }) : [];
            
            return (
              <div key={commitIndex} style={{ width: '100%' }}>
                <div
                  onClick={() => setExpandedCommits(prev => ({ ...prev, [commitIndex]: !prev[commitIndex] }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: '#f1f3f5',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#24292e',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid #d0d7de',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef';
                    e.currentTarget.style.borderColor = '#adb5bd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f3f5';
                    e.currentTarget.style.borderColor = '#d0d7de';
                  }}
                >
                  {commit.github_link && (
                    <a
                      href={commit.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        marginRight: '4px',
                        padding: '3px',
                        borderRadius: '4px',
                        border: '1px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                        e.currentTarget.style.border = '1px solid rgba(0, 0, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.border = '1px solid transparent';
                      }}
                    >
                      <img 
                        src="/githubIcon.svg" 
                        alt="GitHub" 
                        style={{ 
                          width: '14px', 
                          height: '14px',
                          display: 'block',
                          opacity: 0.6
                        }} 
                      />
                    </a>
                  )}
                  <span style={{ 
                    fontWeight: '500',
                    wordBreak: 'break-word'
                  }}>
                    {commit.message}
                  </span>
                  {totalAdditions > 0 && (
                    <span style={{ color: '#28a745', fontWeight: '600', fontSize: '11px' }}>
                      +{totalAdditions}
                    </span>
                  )}
                  {totalDeletions > 0 && (
                    <span style={{ color: '#d73a49', fontWeight: '600', fontSize: '11px' }}>
                      -{totalDeletions}
                    </span>
                  )}
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
                
                {isExpanded && sortedFiles.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginTop: '6px',
                    marginLeft: '8px',
                    paddingLeft: '8px',
                    borderLeft: '2px solid #e9ecef'
                  }}>
                    {sortedFiles.map((file, fileIndex) => (
                      <a
                        key={fileIndex}
                        href={file.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          backgroundColor: '#dfe6e9',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#2d3436',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#b2bec3';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#dfe6e9';
                        }}
                      >
                        <span style={{ 
                          fontFamily: 'monospace',
                          wordBreak: 'break-word'
                        }}>
                          {file.filepath.split('/').pop()}
                        </span>
                        {!file.is_binary && (
                          <>
                            {file.additions > 0 && (
                              <span style={{ color: '#28a745', fontWeight: '600' }}>
                                +{file.additions}
                              </span>
                            )}
                            {file.deletions > 0 && (
                              <span style={{ color: '#d73a49', fontWeight: '600' }}>
                                -{file.deletions}
                              </span>
                            )}
                          </>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Feedback Modal Component
function FeedbackModal({ gameId, game, onClose, token, slackProfile }) {
  const [message, setMessage] = useState("");
  const [starRating, setStarRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setSubmitMessage("Please enter a message");
      return;
    }
    if (starRating === 0) {
      setSubmitMessage("Please select a star rating");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const res = await fetch("/api/CreateGameFeedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          gameId,
          message: message.trim(),
          starRanking: starRating
        }),
      });

      const data = await res.json();
      
      if (data.ok) {
        setIsSent(true);
        setMessage("");
        setStarRating(0);
        setTimeout(() => {
          onClose();
          setIsSent(false);
        }, 1500);
      } else {
        setSubmitMessage(data.message || "Failed to send feedback");
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      setSubmitMessage("Failed to send feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isSelected = starNumber <= starRating;
      
      return (
        <button
          key={starNumber}
          onClick={() => setStarRating(starNumber)}
          style={{
            background: "none",
            border: "none",
            padding: "4px",
            cursor: "pointer"
          }}
        >
          <img
            src="/SpeedyShibaShipper.png"
            alt={`${starNumber} star`}
            style={{
              width: "24px",
              height: "24px",
              opacity: isSelected ? 1.0 : 0.1,
              transition: "opacity 0.2s ease"
            }}
          />
        </button>
      );
    });
  };

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
          maxWidth: "500px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#333" }}>
            Give yap (feedback) to{" "}
            {slackProfile?.image && (
              <img
                src={slackProfile.image}
                alt={slackProfile.displayName || "User"}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "4px",
                  marginRight: "8px",
                  verticalAlign: "middle"
                }}
              />
            )}
            {slackProfile?.displayName || "User"} for {game?.name || "this game"}
          </h3>
        </div>

        {/* Star Rating */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#333" }}>
            Star Rating (1-5):
          </label>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {renderStars()}
            <span style={{ marginLeft: "12px", fontSize: "14px", color: "#666" }}>
              {starRating > 0 ? `${starRating} star${starRating > 1 ? 's' : ''}` : "Select rating"}
            </span>
          </div>
        </div>

        {/* Message Text Area */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#333" }}>
            Your Feedback:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your thoughts about this game..."
            style={{
              width: "100%",
              minHeight: "120px",
              resize: "vertical",
              fontSize: "14px",
              boxSizing: "border-box",
              padding: "10px",
              outline: "none",
              border: "1px solid rgba(0, 0, 0, 0.18)",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.75)",
              fontFamily: "inherit"
            }}
          />
        </div>

        {/* Submit Message - only show error messages */}
        {submitMessage && !isSent && (
          <div style={{ 
            marginBottom: "16px", 
            padding: "8px 12px", 
            borderRadius: "6px",
            fontSize: "13px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb"
          }}>
            {submitMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              appearance: "none",
              border: "1px solid rgba(0, 0, 0, 0.18)",
              background: "rgba(255, 255, 255, 0.75)",
              color: "rgba(0, 0, 0, 0.8)",
              borderRadius: "8px",
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              fontFamily: "inherit"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim() || starRating === 0 || isSent}
            style={{
              appearance: "none",
              border: "0",
              background: isSent 
                ? "#22c55e" 
                : isSubmitting || !message.trim() || starRating === 0 
                  ? "#ccc" 
                  : "linear-gradient(180deg, #ff8ec3 0%, #ff6fa5 100%)",
              color: "#fff",
              borderRadius: "10px",
              padding: "10px 16px",
              cursor: isSubmitting || !message.trim() || starRating === 0 || isSent ? "not-allowed" : "pointer",
              fontWeight: "800",
              fontSize: "13px",
              fontFamily: "inherit",
              opacity: isSubmitting || !message.trim() || starRating === 0 ? 0.5 : 1
            }}
          >
            {isSent ? "Sent" : isSubmitting ? "Sending..." : "Send Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

// File-based cache for build time
const CACHE_FILE = path.join(process.cwd(), '.next', 'games-cache.json');
const CACHE_DURATION = 900000; // 15 minutes

// Function to get cached games data (file-based cache)
async function getCachedGamesData() {
  try {
    // Try to read from file cache first
    if (fs.existsSync(CACHE_FILE)) {
      const stats = fs.statSync(CACHE_FILE);
      const now = Date.now();
      
      if (now - stats.mtime.getTime() < CACHE_DURATION) {
        const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        
        
        return cachedData;
      }
    }
  } catch (error) {
  }
  
  // Fetch fresh data
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://shiba.hackclub.com' 
    : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/GetAllGames?full=true&limit=1000&build=true`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch games data: ${response.status}`);
  }
  
  const games = await response.json();
  
  
  // Write to file cache
  try {
    // Ensure .next directory exists
    const nextDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(nextDir)) {
      fs.mkdirSync(nextDir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(games, null, 2));
  } catch (error) {
  }
  
  return games;
}

export default function GamesPage({ gameData, error }) {
  const router = useRouter();
  const { user, id, LastReviewed } = router.query;
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState('Devlogs'); // 'Devlogs' | 'Artlogs' | 'Plays'
  
  // Debug: log gameData to check if feedback is present
  useEffect(() => {
    console.log('[GamesPage] gameData:', gameData);
    console.log('[GamesPage] feedback:', gameData?.feedback);
    console.log('[GamesPage] posts:', gameData?.posts?.length);
  }, [gameData]);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('latest');
  const [isPawed, setIsPawed] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [expandedDevlogs, setExpandedDevlogs] = useState(false);
  const [expandedArtlogs, setExpandedArtlogs] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentStarRating, setCommentStarRating] = useState(0);
  const [localFeedback, setLocalFeedback] = useState([]);

  // Handle new comment submission
  const handleCommentSubmitted = (newComment) => {
    // Add the new comment to the local feedback state
    setLocalFeedback(prev => [newComment, ...prev]);
  };

  // Get token from localStorage
  const [token, setToken] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    }
  }, []);

  // Use profile data from gameData instead of fetching separately
  const slackProfile = gameData ? {
    displayName: gameData.creatorDisplayName || '',
    image: gameData.creatorImage || '',
  } : null;

  // Load pawed status from server (only for logged-in users)
  useEffect(() => {
    const loadPawedStatus = async () => {
      if (typeof window !== 'undefined' && token && gameData?.id) {
        try {
          const response = await fetch('/api/getMyPaws', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          
          const result = await response.json();
          if (response.ok && result.ok) {
            const pawedGames = new Set(result.followingGames || []);
            setIsPawed(pawedGames.has(gameData.id));
          }
        } catch (e) {
          console.error('Failed to load pawed status:', e);
        }
      }
    };
    
    loadPawedStatus();
  }, [token, gameData?.id]);

  // Get all posts with gameLink (demos) and create versions
  const demoVersions = gameData?.posts 
    ? gameData.posts
        .filter(post => post.PlayLink || post.playLink || post.gameLink)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((post, index) => {
          const buildNumber = index + 1;
          const major = buildNumber <= 9 ? 0 : Math.floor(buildNumber / 10);
          const minor = buildNumber <= 9 ? buildNumber : buildNumber % 10;
          return {
            version: `v${major}.${minor}`,
            label: `Version ${major}.${minor}`,
            gameLink: post.PlayLink || post.playLink || post.gameLink,
            post
          };
        })
        .reverse() // Show newest versions first
    : [];

  // Get the current game link based on selected version
  const currentGameLink = selectedVersion === 'latest' 
    ? gameData?.playableURL 
    : demoVersions.find(v => v.version === selectedVersion)?.gameLink || gameData?.playableURL;

  // Get the latest version label
  const latestVersionLabel = demoVersions.length > 0 
    ? demoVersions[0].label // First item since array is reversed (newest first)
    : 'Latest Version';

  // Helper function to group posts between LastReviewed and current moment
  const groupPostsByLastReviewed = (posts) => {
    if (!LastReviewed || !Array.isArray(posts) || posts.length === 0) {
      return { recentPosts: [], olderPosts: posts };
    }

    const lastReviewedDate = new Date(LastReviewed);
    const recentPosts = [];
    const olderPosts = [];

    posts.forEach(post => {
      const postDate = new Date(post.createdAt);
      if (postDate > lastReviewedDate) {
        recentPosts.push(post);
      } else {
        olderPosts.push(post);
      }
    });

    return { recentPosts, olderPosts };
  };

  // Calculate total time spent for posts
  const calculateTotalTimeSpent = (posts, isArtlog = false) => {
    return posts.reduce((total, post) => {
      if (isArtlog) {
        return total + (post.timeSpentOnAsset || 0);
      } else {
        return total + (post.hoursSpent || post.HoursSpent || 0);
      }
    }, 0);
  };

  if (error) {
    return (
      <>
        <Head>
          <title>Game Not Found - Shiba Arcade</title>
          <meta name="description" content="The requested game could not be found." />
        </Head>
        <div style={{
          width: '100%', 
          alignItems: "center", 
          height: '100%', 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'linear-gradient(180deg, #f8f9fa 0px, #f1f3f4 100px, #e8eaed 200px, #f8f9fa 300px, #fff 400px, #fff 100%)',
          justifyContent: 'center'
        }}>
          <p>Error: {error}</p>
        </div>
      </>
    );
  }

  if (!gameData) {
    return (
      <>
        <Head>
          <title>Loading Game - Shiba Arcade</title>
          <meta name="description" content="Loading game details..." />
        </Head>
        <div style={{
          width: '100%', 
          alignItems: "center", 
          height: '100%', 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'linear-gradient(180deg, #f8f9fa 0px, #f1f3f4 100px, #e8eaed 200px, #f8f9fa 300px, #fff 400px, #fff 100%)',
          justifyContent: 'center'
        }}>
          <p>Loading...</p>
        </div>
      </>
    );
  }

  // Generate meta tags based on game data
  const gameTitle = gameData?.name || id;
  const gameDescription = gameData?.description || `Play ${gameTitle} on Shiba Arcade`;
  const gameImage = gameData?.thumbnailUrl || 'https://shiba.hackclub.com/shiba.png';
  const pageTitle = `${gameTitle} - Shiba Arcade`;
  const pageDescription = gameDescription.length > 160 ? gameDescription.substring(0, 157) + '...' : gameDescription;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(id)}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={gameImage} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(id)}`} />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />
        <meta property="twitter:image" content={gameImage} />
      </Head>
      <div style={{
        width: '100%', 
        alignItems: "center", 
        height: '100%', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'linear-gradient(180deg, #f8f9fa 0px, #f1f3f4 100px, #e8eaed 200px, #f8f9fa 300px, #fff 400px, #fff 100%)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/comicbg.jpg)',
          backgroundSize: '100%',
          imageRendering: 'pixelated',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'multiply',
          opacity: 0.1,
          pointerEvents: 'none',
          zIndex: 1
        }} />
                <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{width: "100%", maxWidth: 800}}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              marginTop: 16,
              gap: "16px",
              width: "100%"
            }}>
              {/* Left side - Breadcrumb navigation */}
              <div style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 12px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "8px",
                border: "1px solid #666",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                flexWrap: "wrap",
                gap: "8px",
                fontSize: "14px"
              }}>
                <a 
                  href="https://shiba.hackclub.com/games/list"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    cursor: "pointer",
                    borderBottom: "1px solid #ccc"
                  }}
                >
                  <span>Shiba Games</span>
                </a>
                <span style={{ color: "#666" }}>/</span>
                <a 
                  href={`https://hackclub.slack.com/team/${user}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    cursor: "pointer"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: '1px solid rgba(0,0,0,0.18)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#fff',
                        backgroundImage: slackProfile?.image ? `url(${slackProfile.image})` : 'none',
                      }}
                    />
                    <span style={{ borderBottom: "1px solid #ccc" }}>{slackProfile?.displayName || user}</span>
                  </div>
                </a>
                <span style={{ color: "#666" }}>/</span>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.reload();
                  }}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    cursor: "pointer",
                    borderBottom: "1px solid #ccc"
                  }}
                >
                  <span>{gameData?.name || 'Game Name'}</span>
                </a>
              </div>

              {/* Right side - Version dropdown */}
              <div style={{
                position: "relative"
              }}>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "8px",
                    border: "1px solid #666",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    fontSize: "14px",
                    cursor: "pointer",
                    appearance: "none",
                    paddingRight: "32px",
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center"
                  }}
                >
                  <option value="latest">{latestVersionLabel}</option>
                  {demoVersions.slice(1).map((demo) => (
                    <option key={demo.version} value={demo.version}>
                      {demo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ 
              width: '100%', 
              maxWidth: '1152px',
              border: "3px solid #fff",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              overflow: "hidden"
            }}>
            {currentGameLink && (() => {
              let gameId = '';
              try {
                // Handle both string and array formats
                const playableURL = Array.isArray(currentGameLink) ? currentGameLink[0] : currentGameLink;
                if (!playableURL) return null;
                
                const path = playableURL.startsWith('http') ? new URL(playableURL).pathname : playableURL;
                const m = /\/play\/([^\/?#]+)/.exec(path);
                gameId = m && m[1] ? decodeURIComponent(m[1]) : '';
              } catch (_) {
                gameId = '';
              }
              return gameId ? (
                <PlayGameComponent 
                  key={`${gameId}-${selectedVersion}`}
                  gameId={gameId}
                  gameName={gameData?.name || id}
                  thumbnailUrl={gameData?.thumbnailUrl || ''}
                  animatedBackground={gameData?.animatedBackground || ''}
                  width="100%"
                  gamePageUrl={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(gameData?.name || id)}`}
                />
              ) : (
                <div style={{ aspectRatio: '16 / 9', border: "1px solid #000", width: '100%', maxWidth: '1152px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  No playable URL available
                </div>
              );
            })()}
          </div>
          {gameData?.description && (
            <p style={{marginTop: 16, marginBottom: 8}}>{gameData.description}</p>
          )}

          {/* View Selector with Paw and Feedback Buttons */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            marginBottom: 16,
            width: "100%",
            gap: "16px"
          }}>
            {/* Left side - View selector */}
            <div style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 6px",
              backgroundColor: "#fff",
              gap: "8px",
              borderRadius: "12px",
              border: "1px solid #ccc"
            }}>
              <button
                onClick={() => setSelectedView("Devlogs")}
                style={{
                  appearance: "none",
                  border: selectedView === "Devlogs" ? "2px solid #000" : "1px solid #ccc",
                  background: selectedView === "Devlogs" ? "#000" : "#fff",
                  color: selectedView === "Devlogs" ? "#fff" : "#000",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "14px",
                  transition: "all 0.2s ease"
                }}
              >
                Devlogs
                {Array.isArray(gameData?.posts) && gameData.posts.length > 0 && (() => {
                  const devlogPosts = gameData.posts.filter(post => post.postType !== 'artlog');
                  const totalHours = devlogPosts.reduce((sum, post) => sum + (post.HoursSpent || 0), 0);
                  return totalHours > 0 ? (
                    <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                      ({totalHours.toFixed(2)} hours)
                    </span>
                  ) : null;
                })()}
              </button>
              
              <button
                onClick={() => setSelectedView("Artlogs")}
                style={{
                  appearance: "none",
                  border: selectedView === "Artlogs" ? "2px solid #000" : "1px solid #ccc",
                  background: selectedView === "Artlogs" ? "#000" : "#fff",
                  color: selectedView === "Artlogs" ? "#fff" : "#000",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "14px",
                  transition: "all 0.2s ease"
                }}
              >
                Artlogs
                {Array.isArray(gameData?.posts) && gameData.posts.length > 0 && (() => {
                  const artlogPosts = gameData.posts.filter(post => post.postType === 'artlog');
                  const totalHours = artlogPosts.reduce((sum, post) => sum + (post.timeSpentOnAsset || 0), 0);
                  return totalHours > 0 ? (
                    <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                      ({totalHours.toFixed(2)} hours)
                    </span>
                  ) : null;
                })()}
              </button>
              
              <button
                onClick={() => setSelectedView("Plays")}
                style={{
                  appearance: "none",
                  border: selectedView === "Plays" ? "2px solid #000" : "1px solid #ccc",
                  background: selectedView === "Plays" ? "#000" : "#fff",
                  color: selectedView === "Plays" ? "#fff" : "#000",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "14px",
                  transition: "all 0.2s ease"
                }}
              >
                Plays
                <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                  ({gameData?.playsCount || 0})
                </span>
              </button>
            </div>

            {/* Right side - Paw and Feedback buttons */}
            <div style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 6px",
              backgroundColor: "#fff",
              gap: "8px",
              borderRadius: "12px",
              border: "1px solid #ccc"
            }}>
              {/* Feedback Button */}
              <div
                className="chat-bubble-button"
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // Check if user is logged in
                  if (!token) {
                    alert("Please login @ shiba.hackclub.com & come back");
                    return;
                  }
                  
                  setShowFeedbackModal(true);
                }}
                onMouseEnter={(e) => {
                  const img = e.currentTarget.querySelector('.chat-bubble-image');
                  if (img) img.src = "/chatBubble.svg";
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector('.chat-bubble-image');
                  if (img) img.src = "/chatBubbleInactive.svg";
                }}
                style={{
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  padding: "2px"
                }}
              >
                <img
                  className="chat-bubble-image"
                  src="/chatBubbleInactive.svg"
                  alt="Give Feedback"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: 0.7
                  }}
                />
              </div>

              {/* Paw Button */}
              <div
                className="stamp-button"
                onClick={async (e) => {
                  e.stopPropagation();
                  
                  // Check if user is logged in
                  if (!token) {
                    alert("Please login @ shiba.hackclub.com & come back");
                    return;
                  }
                  
                  const gameRecordId = gameData?.id;
                  if (!gameRecordId) return;
                  
                  // Call the appropriate API
                  const apiEndpoint = isPawed ? '/api/UnpawProject' : '/api/PawProject';
                  const apiData = { token, gameId: gameRecordId };
                  
                  try {
                    const response = await fetch(apiEndpoint, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(apiData)
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok && result.ok) {
                      setIsPawed(!isPawed);
                    } else {
                      console.error('API error:', result.message);
                      alert(`Failed to ${isPawed ? 'unpaw' : 'paw'} game: ${result.message || 'Unknown error'}`);
                    }
                  } catch (error) {
                    console.error('Network error:', error);
                    alert(`Failed to ${isPawed ? 'unpaw' : 'paw'} game: Network error`);
                  }
                }}
                style={{
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <img
                  src={isPawed ? "/stamped.svg" : "/stamp.svg"}
                  alt={isPawed ? "Pawed" : "Paw"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: isPawed ? 1 : 0.7
                  }}
                />
              </div>
            </div>
          </div>

          {/* Devlogs View */}
          {selectedView === "Devlogs" && (
            <>
              {Array.isArray(gameData?.posts) && gameData.posts.length > 0 ? (() => {
                const devlogPosts = gameData.posts.filter(post => post.postType !== 'artlog');
                const { recentPosts, olderPosts } = groupPostsByLastReviewed(devlogPosts);
                const recentTimeSpent = calculateTotalTimeSpent(recentPosts, false);
                
                return devlogPosts.length > 0 ? (() => {
                  // Collect all unique badges from all devlog posts
                  const allBadges = new Set();
                  devlogPosts.forEach(post => {
                    if (Array.isArray(post.badges)) {
                      post.badges.forEach(badge => allBadges.add(badge));
                    }
                  });
                  const uniqueBadges = Array.from(allBadges);

                  return (
                  <div style={{
                    border: "1px solid rgba(0, 0, 0, 0.18)",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.8)",
                    padding: "16px",
                    paddingBottom: "32px"
                  }}>
                    {/* Profile header - shown once */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: '1px solid rgba(0,0,0,0.18)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: '#fff',
                          backgroundImage: slackProfile?.image ? `url(${slackProfile.image})` : 'none',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12 }}>
                        <strong>{slackProfile?.displayName || user}</strong>
                        {uniqueBadges.map((badge) => {
                          const badgeConfig = {
                            'Speedy Shiba Shipper': { img: '/SpeedyShibaShipper.png', bg: '#FFD1A3', border: '#F5994B' },
                            'Super Subtle Shiba': { img: '/SuperSubtleShiba.png', bg: '#E8F4FD', border: '#4A90E2' },
                            'Shomato': { img: '/shomato.png', bg: '#FFE6E6', border: '#DC3545' },
                            'Shiba Showreel Submitter': { img: '/ShibaShowreel.png', bg: '#FFF3CD', border: '#FFC107' },
                            'Stargazer': { img: '/Stargazer.png', bg: '#E6F3FF', border: '#4A90E2' },
                            'Shiba Pie': { img: '/PieBadge.svg', bg: '#FFF8E1', border: '#FFB74D' },
                            'Twin Shark': { img: '/TwinShark.png', bg: '#FFE6F0', border: '#E91E63' },
                            'Akito Lover': { img: '/AkitoLover.png', bg: '#F3E5F5', border: '#9C27B0' },
                            'Shiba Sushi': { img: '/ShibaSushi.png', bg: '#E8EAF6', border: '#3F51B5' },
                            'Umbrella Badge': { img: '/UmbrellaBadge.png', bg: '#F5F5F5', border: '#616161' },
                            'Shiba Fox': { img: '/ShibaFox.png', bg: '#E3F2FD', border: '#2196F3' },
                            'ChefsCircle': { img: '/ChefsCircle.png', bg: '#E8F4FD', border: '#4A90E2' },
                            'House Of Mine': { img: '/HouseOfMine.png', bg: '#E8F5E8', border: '#4CAF50' },
                            'Bug Crusher': { img: '/BugCrusher.png', bg: '#FFEBEE', border: '#F44336' },
                            'Fist Of Fury': { img: '/FistOfFurry.png', bg: '#FFF3E0', border: '#FF9800' },
                            'Be Cool': { img: '/BeCool.png', bg: '#E0F2F1', border: '#009688' },
                            'Chaotic Dice': { img: '/ChaoticDice.gif', bg: '#FCE4EC', border: '#E91E63' },
                            'Shiba Friendship': { img: '/ShibaFriendship.png', bg: '#FFF8E1', border: '#FFC107' },
                            'CARRR': { img: '/CARRR.png', bg: '#FFEBEE', border: '#F44336' },
                            'Space Head': { img: '/Space-Head.png', bg: '#E3F2FD', border: '#2196F3' },
                            'Gastly Badge': { img: '/gastly.png', bg: '#F3E5F5', border: '#9C27B0' },
                            'Shiba Axtro Ship': { img: '/axtro.png', bg: '#E8F4FD', border: '#4A90E2' },
                            'Speedy Shiba Racer': { img: '/ShibaRacer.svg', bg: '#FFF3E0', border: '#FF9800' },
                            'Fish Keychain': { img: '/fishGif.gif', bg: '#E0F2F1', border: '#009688' },
                            'Shiba Omelette': { img: '/ShibaEgg.png', bg: '#FFF8E1', border: '#FFC107' },
                            'Shadow Merger': { img: '/shadow.gif', bg: '#F5F5F5', border: '#616161' },
                            'Fatty Frog': { img: '/fatFrog.gif', bg: '#E8F5E8', border: '#4CAF50' },
                            'Shiba As Gundam': { img: '/ShibaAsGundam.png', bg: '#E8EAF6', border: '#3F51B5' },
                            'Shiba Radio': { img: '/Note_Block_animate.gif', bg: '#FFF3E0', border: '#FF9800' },
                            'Randomness': { img: '/randomness.gif', bg: '#F3E5F5', border: '#9C27B0' },
                            'Nature': { img: '/tree.svg', bg: '#E8F5E8', border: '#4CAF50' },
                            'Daydream': { img: '/daydream.png', bg: '#F3E5F5', border: '#9C27B0' },
                            'Yapper': { img: '/Yapper.gif', bg: '#FFF3E0', border: '#FF9800' }
                          };
                          
                          const config = badgeConfig[badge];
                          if (!config) return null;
                          
                          return (
                            <div key={badge} style={{ position: 'relative', display: 'inline-block' }}>
                              <img
                                src={config.img}
                                alt={badge}
                                style={{
                                  width: 20,
                                  height: 20,
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease-out, border 0.2s ease-out, background-color 0.2s ease-out',
                                  border: '1px dotted transparent',
                                  borderRadius: '4px',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.1)';
                                  e.target.style.border = '1px dotted #999';
                                  e.target.style.backgroundColor = 'white';
                                  setTimeout(() => {
                                    e.target.style.transform = 'scale(1)';
                                  }, 200);
                                  const popup = e.target.nextSibling;
                                  if (popup) {
                                    popup.style.display = 'block';
                                    setTimeout(() => {
                                      popup.style.opacity = '1';
                                      popup.style.transform = 'translateX(-50%) scale(1)';
                                    }, 10);
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.border = '1px dotted transparent';
                                  e.target.style.backgroundColor = 'transparent';
                                  const popup = e.target.nextSibling;
                                  if (popup) {
                                    popup.style.opacity = '0';
                                    popup.style.transform = 'translateX(-50%) scale(0)';
                                    setTimeout(() => {
                                      popup.style.display = 'none';
                                    }, 200);
                                  }
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '100%',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  backgroundColor: config.bg,
                                  border: `1px solid ${config.border}`,
                                  borderRadius: '4px',
                                  padding: '4px 6px',
                                  fontSize: '6px',
                                  fontWeight: 'bold',
                                  color: '#333',
                                  whiteSpace: 'nowrap',
                                  zIndex: 1000,
                                  display: 'none',
                                  marginBottom: '0px',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  opacity: 0,
                                  transformOrigin: 'center bottom',
                                  transition: 'all 0.2s ease-out'
                                }}
                              >
                                {badge}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Posts container with expandable view */}
                    <div style={{
                      overflow: 'hidden',
                      maxHeight: expandedDevlogs ? 'none' : '900px',
                      position: 'relative'
                    }}>
                      {/* Gradient overlay when collapsed */}
                      {!expandedDevlogs && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '200px',
                          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)',
                          pointerEvents: 'none',
                          zIndex: 1
                        }} />
                      )}
                    {/* Recent posts (since LastReviewed) */}
                    {recentPosts.length > 0 && (
                      <div style={{
                        border: "2px solid #ff0000",
                        borderRadius: "10px",
                        padding: "16px",
                        backgroundColor: "rgba(255, 0, 0, 0.05)",
                        marginBottom: "16px"
                      }}>
                        <div style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "#ff0000",
                          marginBottom: "12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <span>New since last review</span>
                          <span>{recentTimeSpent.toFixed(2)} hours</span>
                        </div>
                          {recentPosts.map((p, pIdx) => (
                            <div key={p.id || pIdx}>
                              {pIdx > 0 && (
                                <div style={{
                                  height: "1px",
                                  background: "rgba(255, 0, 0, 0.2)",
                                  margin: "16px 0"
                                }} />
                              )}
                              <JournalPostRenderer
                                content={p.content}
                                attachments={p.attachments}
                                playLink={p.PlayLink}
                                gameName={gameData?.name || ""}
                                thumbnailUrl={gameData?.thumbnailUrl || ""}
                                slackId={user}
                                createdAt={p.createdAt}
                                badges={p.badges}
                                HoursSpent={p.HoursSpent}
                                gamePageUrl={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(gameData?.name || id)}`}
                                gitChanges={p.GitChanges}
                                postType={p.postType}
                                timelapseVideoId={p.timelapseVideoId}
                                githubImageLink={p.githubImageLink}
                                timeScreenshotId={p.timeScreenshotId}
                                hoursSpent={p.hoursSpent || p.HoursSpent || 0}
                                timeSpentOnAsset={p.timeSpentOnAsset || 0}
                                minutesSpent={p.minutesSpent}
                                user={user}
                                id={id}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                    
                    {/* Older posts */}
                    {olderPosts.map((p, pIdx) => (
                        <div key={p.id || pIdx}>
                          {(pIdx > 0 || recentPosts.length > 0) && (
                            <div style={{
                              height: "1px",
                              background: "rgba(0, 0, 0, 0.1)",
                              margin: "16px 0"
                            }} />
                          )}
                          <JournalPostRenderer
                          content={p.content}
                          attachments={p.attachments}
                          playLink={p.PlayLink}
                          gameName={gameData?.name || ""}
                          thumbnailUrl={gameData?.thumbnailUrl || ""}
                          slackId={user}
                          createdAt={p.createdAt}
                          badges={p.badges}
                          HoursSpent={p.HoursSpent}
                          gamePageUrl={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(gameData?.name || id)}`}
                          gitChanges={p.GitChanges}
                          postType={p.postType}
                          timelapseVideoId={p.timelapseVideoId}
                          githubImageLink={p.githubImageLink}
                          timeScreenshotId={p.timeScreenshotId}
                          hoursSpent={p.hoursSpent || p.HoursSpent || 0}
                          timeSpentOnAsset={p.timeSpentOnAsset || 0}
                          minutesSpent={p.minutesSpent}
                            user={user}
                            id={id}
                        />
                      </div>
                    ))}
                  </div>

                    {/* Expand/Collapse toggle */}
                    <p
                      onClick={() => setExpandedDevlogs(!expandedDevlogs)}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      style={{
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '12px',
                        marginTop: '8px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        textDecoration: 'none'
                      }}
                    >
                      {expandedDevlogs ? 'Collapse Journey' : 'Expand Journey'}
                    </p>
                  </div>
                  );
                })() : (
                  <div style={{width: "100%", border: "1px solid #000", padding: 16}}>
                    <p>No devlog posts yet</p>
                  </div>
                );
              })() : (
                <div style={{width: "100%", border: "1px solid #000", padding: 16}}>
                  <p>No posts yet</p>
                </div>
              )}

            </>
          )}

          {/* Artlogs View */}
          {selectedView === "Artlogs" && (
            <>
              {Array.isArray(gameData?.posts) && gameData.posts.length > 0 ? (() => {
                const artlogPosts = gameData.posts.filter(post => post.postType === 'artlog');
                const { recentPosts, olderPosts } = groupPostsByLastReviewed(artlogPosts);
                const recentTimeSpent = calculateTotalTimeSpent(recentPosts, true);
                
                return artlogPosts.length > 0 ? (() => {
                  // Collect all unique badges from all artlog posts
                  const allBadges = new Set();
                  artlogPosts.forEach(post => {
                    if (Array.isArray(post.badges)) {
                      post.badges.forEach(badge => allBadges.add(badge));
                    }
                  });
                  const uniqueBadges = Array.from(allBadges);

                  return (
                  <div style={{
                    border: "1px solid rgba(0, 0, 0, 0.18)",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.8)",
                    padding: "16px",
                    paddingBottom: "32px"
                  }}>
                    {/* Profile header - shown once */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: '1px solid rgba(0,0,0,0.18)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: '#fff',
                          backgroundImage: slackProfile?.image ? `url(${slackProfile.image})` : 'none',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12 }}>
                        <strong>{slackProfile?.displayName || user}</strong>
                        {uniqueBadges.map((badge) => {
                          const badgeConfig = {
                            'Speedy Shiba Shipper': { img: '/SpeedyShibaShipper.png', bg: '#FFD1A3', border: '#F5994B' },
                            'Super Subtle Shiba': { img: '/SuperSubtleShiba.png', bg: '#E8F4FD', border: '#4A90E2' },
                            'Shomato': { img: '/shomato.png', bg: '#FFE6E6', border: '#DC3545' },
                            'Shiba Showreel Submitter': { img: '/ShibaShowreel.png', bg: '#FFF3CD', border: '#FFC107' },
                            'Stargazer': { img: '/Stargazer.png', bg: '#E6F3FF', border: '#4A90E2' },
                            'Shiba Pie': { img: '/PieBadge.svg', bg: '#FFF8E1', border: '#FFB74D' },
                            'Twin Shark': { img: '/TwinShark.png', bg: '#FFE6F0', border: '#E91E63' },
                            'Akito Lover': { img: '/AkitoLover.png', bg: '#F3E5F5', border: '#9C27B0' },
                            'Shiba Sushi': { img: '/ShibaSushi.png', bg: '#E8EAF6', border: '#3F51B5' },
                            'Umbrella Badge': { img: '/UmbrellaBadge.png', bg: '#F5F5F5', border: '#616161' },
                            'Shiba Fox': { img: '/ShibaFox.png', bg: '#E3F2FD', border: '#2196F3' },
                            'ChefsCircle': { img: '/ChefsCircle.png', bg: '#E8F4FD', border: '#4A90E2' },
                            'House Of Mine': { img: '/HouseOfMine.png', bg: '#E8F5E8', border: '#4CAF50' },
                            'Bug Crusher': { img: '/BugCrusher.png', bg: '#FFEBEE', border: '#F44336' },
                            'Fist Of Fury': { img: '/FistOfFurry.png', bg: '#FFF3E0', border: '#FF9800' },
                            'Be Cool': { img: '/BeCool.png', bg: '#E0F2F1', border: '#009688' },
                            'Chaotic Dice': { img: '/ChaoticDice.gif', bg: '#FCE4EC', border: '#E91E63' },
                            'Shiba Friendship': { img: '/ShibaFriendship.png', bg: '#FFF8E1', border: '#FFC107' },
                            'CARRR': { img: '/CARRR.png', bg: '#FFEBEE', border: '#F44336' },
                            'Space Head': { img: '/Space-Head.png', bg: '#E3F2FD', border: '#2196F3' },
                            'Gastly Badge': { img: '/gastly.png', bg: '#F3E5F5', border: '#9C27B0' },
                            'Shiba Axtro Ship': { img: '/axtro.png', bg: '#E8F4FD', border: '#4A90E2' },
                            'Speedy Shiba Racer': { img: '/ShibaRacer.svg', bg: '#FFF3E0', border: '#FF9800' },
                            'Fish Keychain': { img: '/fishGif.gif', bg: '#E0F2F1', border: '#009688' },
                            'Shiba Omelette': { img: '/ShibaEgg.png', bg: '#FFF8E1', border: '#FFC107' },
                            'Shadow Merger': { img: '/shadow.gif', bg: '#F5F5F5', border: '#616161' },
                            'Fatty Frog': { img: '/fatFrog.gif', bg: '#E8F5E8', border: '#4CAF50' },
                            'Shiba As Gundam': { img: '/ShibaAsGundam.png', bg: '#E8EAF6', border: '#3F51B5' },
                            'Shiba Radio': { img: '/Note_Block_animate.gif', bg: '#FFF3E0', border: '#FF9800' },
                            'Randomness': { img: '/randomness.gif', bg: '#F3E5F5', border: '#9C27B0' },
                            'Nature': { img: '/tree.svg', bg: '#E8F5E8', border: '#4CAF50' },
                            'Daydream': { img: '/daydream.png', bg: '#F3E5F5', border: '#9C27B0' },
                            'Yapper': { img: '/Yapper.gif', bg: '#FFF3E0', border: '#FF9800' }
                          };
                          
                          const config = badgeConfig[badge];
                          if (!config) return null;
                          
                          return (
                            <div key={badge} style={{ position: 'relative', display: 'inline-block' }}>
                              <img
                                src={config.img}
                                alt={badge}
                                style={{
                                  width: 20,
                                  height: 20,
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease-out, border 0.2s ease-out, background-color 0.2s ease-out',
                                  border: '1px dotted transparent',
                                  borderRadius: '4px',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.1)';
                                  e.target.style.border = '1px dotted #999';
                                  e.target.style.backgroundColor = 'white';
                                  setTimeout(() => {
                                    e.target.style.transform = 'scale(1)';
                                  }, 200);
                                  const popup = e.target.nextSibling;
                                  if (popup) {
                                    popup.style.display = 'block';
                                    setTimeout(() => {
                                      popup.style.opacity = '1';
                                      popup.style.transform = 'translateX(-50%) scale(1)';
                                    }, 10);
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.border = '1px dotted transparent';
                                  e.target.style.backgroundColor = 'transparent';
                                  const popup = e.target.nextSibling;
                                  if (popup) {
                                    popup.style.opacity = '0';
                                    popup.style.transform = 'translateX(-50%) scale(0)';
                                    setTimeout(() => {
                                      popup.style.display = 'none';
                                    }, 200);
                                  }
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '100%',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  backgroundColor: config.bg,
                                  border: `1px solid ${config.border}`,
                                  borderRadius: '4px',
                                  padding: '4px 6px',
                                  fontSize: '6px',
                                  fontWeight: 'bold',
                                  color: '#333',
                                  whiteSpace: 'nowrap',
                                  zIndex: 1000,
                                  display: 'none',
                                  marginBottom: '0px',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  opacity: 0,
                                  transformOrigin: 'center bottom',
                                  transition: 'all 0.2s ease-out'
                                }}
                              >
                                {badge}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Posts container with expandable view */}
                    <div style={{
                      overflow: 'hidden',
                      maxHeight: expandedArtlogs ? 'none' : '900px',
                      position: 'relative'
                    }}>
                      {/* Gradient overlay when collapsed */}
                      {!expandedArtlogs && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '200px',
                          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)',
                          pointerEvents: 'none',
                          zIndex: 1
                        }} />
                      )}
                    {/* Recent posts (since LastReviewed) */}
                    {recentPosts.length > 0 && (
                      <div style={{
                        border: "2px solid #ff0000",
                        borderRadius: "10px",
                        padding: "16px",
                        backgroundColor: "rgba(255, 0, 0, 0.05)",
                        marginBottom: "16px"
                      }}>
                        <div style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "#ff0000",
                          marginBottom: "12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <span>New since last review</span>
                          <span>{recentTimeSpent.toFixed(2)} hours</span>
                        </div>
                          {recentPosts.map((p, pIdx) => (
                            <div key={p.id || pIdx}>
                              {pIdx > 0 && (
                                <div style={{
                                  height: "1px",
                                  background: "rgba(255, 0, 0, 0.2)",
                                  margin: "16px 0"
                                }} />
                              )}
                              <JournalPostRenderer
                                content={p.content}
                                attachments={p.attachments}
                                playLink={p.PlayLink}
                                gameName={gameData?.name || ""}
                                thumbnailUrl={gameData?.thumbnailUrl || ""}
                                slackId={user}
                                createdAt={p.createdAt}
                                badges={p.badges}
                                HoursSpent={p.HoursSpent}
                                gamePageUrl={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(gameData?.name || id)}`}
                                gitChanges={p.GitChanges}
                                postType={p.postType}
                                timelapseVideoId={p.timelapseVideoId}
                                githubImageLink={p.githubImageLink}
                                timeScreenshotId={p.timeScreenshotId}
                                hoursSpent={p.hoursSpent || p.HoursSpent || 0}
                                timeSpentOnAsset={p.timeSpentOnAsset || 0}
                                minutesSpent={p.minutesSpent}
                                user={user}
                                id={id}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                    
                    {/* Older posts */}
                    {olderPosts.map((p, pIdx) => (
                        <div key={p.id || pIdx}>
                          {(pIdx > 0 || recentPosts.length > 0) && (
                            <div style={{
                              height: "1px",
                              background: "rgba(0, 0, 0, 0.1)",
                              margin: "16px 0"
                            }} />
                          )}
                          <JournalPostRenderer
                          content={p.content}
                          attachments={p.attachments}
                          playLink={p.PlayLink}
                          gameName={gameData?.name || ""}
                          thumbnailUrl={gameData?.thumbnailUrl || ""}
                          slackId={user}
                          createdAt={p.createdAt}
                          badges={p.badges}
                          HoursSpent={p.HoursSpent}
                          gamePageUrl={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(gameData?.name || id)}`}
                          gitChanges={p.GitChanges}
                          postType={p.postType}
                          timelapseVideoId={p.timelapseVideoId}
                          githubImageLink={p.githubImageLink}
                          timeScreenshotId={p.timeScreenshotId}
                          hoursSpent={p.hoursSpent || p.HoursSpent || 0}
                          timeSpentOnAsset={p.timeSpentOnAsset || 0}
                          minutesSpent={p.minutesSpent}
                            user={user}
                            id={id}
                        />
                      </div>
                    ))}
                  </div>

                    {/* Expand/Collapse toggle */}
                    <p
                      onClick={() => setExpandedArtlogs(!expandedArtlogs)}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      style={{
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '12px',
                        marginTop: '8px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        textDecoration: 'none'
                      }}
                    >
                      {expandedArtlogs ? 'Collapse Journey' : 'Expand Journey'}
                    </p>
                  </div>
                  );
                })() : (
                  <div style={{width: "100%", border: "1px solid #000", padding: 16}}>
                    <p>No artlog posts yet</p>
                  </div>
                );
              })() : (
                <div style={{width: "100%", border: "1px solid #000", padding: 16}}>
                  <p>No posts yet</p>
                </div>
              )}

            </>
          )}

          {/* Plays View */}
          {selectedView === "Plays" && (
            <>
              {Array.isArray(gameData?.plays) && gameData.plays.length > 0 ? (
                <div style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  border: "1px solid #666",
                  padding: "8px",
                  marginTop: "16px"
                }}>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))", 
                    gap: "8px"
                  }}>
                    {gameData.plays.map((player, idx) => {
                      const isHovered = hoveredPlayer === player.slackId;
                      return (
                        <a
                          key={player.slackId || idx}
                          href={`https://hackclub.slack.com/team/${player.slackId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "block",
                            textDecoration: "none",
                            color: "inherit",
                            transition: "transform 0.3s ease"
                          }}
                          onMouseEnter={() => setHoveredPlayer(player.slackId)}
                          onMouseLeave={() => setHoveredPlayer(null)}
                        >
                          <div style={{
                            width: "40px",
                            height: "40px",
                            border: isHovered ? "1px solid #000" : "1px solid #ccc",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundColor: "#f0f0f0",
                            backgroundImage: player.slackId ? `url(https://cachet.dunkirk.sh/users/${player.slackId}/r)` : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "600",
                            color: "#666",
                            overflow: "hidden",
                            transform: isHovered ? "scale(1.1)" : "scale(1)",
                            transition: "transform 0.3s ease, border-color 0.3s ease"
                          }}>
                            {!player.slackId && (
                              <span>{player.displayName ? player.displayName.charAt(0).toUpperCase() : "?"}</span>
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  border: "1px solid #666",
                  padding: "16px",
                  marginTop: "16px"
                }}>
                  <p>No plays yet</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Comments Section - appears for both Devlogs and Artlogs */}
        {gameData && (
          <CommentsSection
            token={token}
            commentText={commentText}
            setCommentText={setCommentText}
            commentStarRating={commentStarRating}
            setCommentStarRating={setCommentStarRating}
            isSubmittingComment={isSubmittingComment}
            setIsSubmittingComment={setIsSubmittingComment}
            feedback={[...localFeedback, ...(gameData?.feedback || [])]}
            gameData={gameData}
            onCommentSubmitted={handleCommentSubmitted}
          />
        )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          gameId={gameData?.id}
          game={gameData}
          onClose={() => setShowFeedbackModal(false)}
          token={token}
          slackProfile={slackProfile}
        />
      )}

      <style jsx>{`
        /* Chat bubble button animations */
        .chat-bubble-button {
          transition: transform 0.1s ease;
        }
        
        .chat-bubble-button:active {
          transform: scale(0.9);
        }
        
        .chat-bubble-image {
          transition: opacity 0.3s ease;
        }

        /* Stamp button animations */
        .stamp-button {
          transition: transform 0.1s ease;
        }
        
        .stamp-button:active {
          transform: scale(0.9);
        }
        
        .stamp-image {
          transition: opacity 0.3s ease;
        }

        /* Comment actions responsive layout */
        @media (max-width: 768px) {
          .comment-actions {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          
          .comment-actions button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

export async function getStaticPaths() {
  try {
    const games = await getCachedGamesData();
    
    
    // Generate paths for ALL games with full data
    const paths = games
      .filter((game) => {
        return game && 
               game.slackId && 
               typeof game.slackId === 'string' && 
               game.name && 
               typeof game.name === 'string' &&
               game.slackId.trim().length > 0 &&
               game.name.trim().length > 0;
      })
      .map((game) => ({
        params: {
          user: game.slackId.trim(),
          id: game.name.trim()
        }
      }));

    
    // Debug: check if our specific game is in the paths
    const targetPath = paths.find(p => p.params.user === 'U041FQB8VK2' && p.params.id === 'WASD Beats');
    
    
    return {
      paths,
      fallback: 'blocking' // Enable on-demand generation for missing paths
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

export async function getStaticProps(context) {
  const { user, id } = context.params;

  try {
    const games = await getCachedGamesData();
    
    // Find the specific game by user and id
    // Try both encoded and decoded versions of the game name
    const decodedId = decodeURIComponent(id);
    
    // Debug: log some games for this user
    const userGames = games.filter(game => game.slackId === user);
    
    const gameData = games.find(game => 
      game.slackId === user && 
      (game.name === id || game.name === decodedId)
    );

    if (!gameData) {
      
      // Fallback to getGame.js API
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://shiba.hackclub.com' 
          : 'http://localhost:3000';
        
        // Decode the game name in case it's URL encoded
        const decodedGameName = decodeURIComponent(id);
        
        const response = await fetch(`${baseUrl}/api/gameStore/getGame`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slackId: user,
            gameName: decodedGameName
          })
        });


        if (response.ok) {
          const apiGameData = await response.json();
          
          // Format the last updated date on the server to avoid hydration issues
          if (apiGameData && apiGameData.lastUpdated) {
            apiGameData.lastUpdatedFormatted = new Date(apiGameData.lastUpdated).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: '2-digit'
            });
          }

          return {
            props: {
              gameData: apiGameData,
              error: null
            },
            revalidate: 900 // Shorter revalidate for API fallback
          };
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`API fallback failed for ${user}/${id}: ${response.status} - ${errorText}`);
        }
      } catch (apiError) {
        console.error(`API fallback error for ${user}/${id}:`, apiError);
      }

      // If API fallback also fails, return 404
      console.error(`Game not found: ${user}/${id}`);
      return {
        props: {
          gameData: null,
          error: 'Game not found'
        },
        revalidate: 900
      };
    }

    // Format the last updated date on the server to avoid hydration issues
    if (gameData && gameData.lastUpdated) {
      gameData.lastUpdatedFormatted = new Date(gameData.lastUpdated).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
    }


    return {
      props: {
        gameData,
        error: null
      },
      revalidate: 3600
    };
  } catch (error) {
    console.error('Error fetching game data:', error);
    return {
      props: {
        gameData: null,
        error: 'Failed to load game data'
      },
      revalidate: 3600
    };
  }
}
