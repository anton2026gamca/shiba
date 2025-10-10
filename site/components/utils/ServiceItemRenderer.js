import React, { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function ServiceItemRenderer({ 
  name,
  description = "",
  type = "",
  portfolioPieces = [],
  priceStructures = [],
  slackId = "",
  onContactClick
}) {
  const hasPortfolio = portfolioPieces && portfolioPieces.length > 0;
  const hasMultipleItems = portfolioPieces.length > 1;
  
  // Helper function to determine file type from URL
  const getFileType = (url) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (!extension) return 'unknown';
    
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension)) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)) {
      return 'audio';
    } else {
      return 'file';
    }
  };
  
  const [emblaRef, embla] = useEmblaCarousel({
    loop: hasMultipleItems,
    align: "center",
    slidesToScroll: 1,
  });
  
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [slackProfile, setSlackProfile] = useState(null);
  
  // Fetch Slack profile
  useEffect(() => {
    let cancelled = false;
    const fetchSlackProfile = async () => {
      if (!slackId) return;
      try {
        const res = await fetch(`/api/slackProfiles?slackId=${encodeURIComponent(slackId)}`);
        const json = await res.json().catch(() => ({}));
        if (!cancelled && json && (json.displayName || json.image)) {
          setSlackProfile({
            displayName: json.displayName || "",
            image: json.image || "",
            slackId: slackId
          });
        }
      } catch (e) {
        console.error('Error fetching Slack profile:', e);
      }
    };
    fetchSlackProfile();
    return () => {
      cancelled = true;
    };
  }, [slackId]);

  // Handle carousel selection
  useEffect(() => {
    if (!embla || !hasMultipleItems) return;
    
    const onSelect = () => {
      setSelectedItemIndex(embla.selectedScrollSnap());
    };
    
    embla.on("select", onSelect);
    return () => embla.off("select", onSelect);
  }, [embla, hasMultipleItems]);

  // Component to render different media types
  const renderMediaItem = (url, alt, index) => {
    const fileType = getFileType(url);
    const fileName = url.split('/').pop() || 'file';
    
    switch (fileType) {
      case 'image':
        return (
          <img
            src={url}
            alt={alt}
            className="pixelated-image"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              imageRendering: "pixelated",
              imageRendering: "-moz-crisp-edges",
              imageRendering: "crisp-edges"
            }}
          />
        );
      
      case 'video':
        return (
          <video
            src={url}
            controls
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain"
            }}
          >
            Your browser does not support the video tag.
          </video>
        );
      
      case 'audio':
        return (
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px"
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px",
              color: "#666"
            }}>
              🎵
            </div>
            <audio
              src={url}
              controls
              style={{
                width: "90%",
                maxWidth: "300px"
              }}
            >
              Your browser does not support the audio element.
            </audio>
            <p style={{
              margin: "8px 0 0 0",
              fontSize: "12px",
              color: "#666",
              textAlign: "center",
              wordBreak: "break-word"
            }}>
              {fileName}
            </p>
          </div>
        );
      
      case 'file':
      default:
        return (
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            cursor: "pointer"
          }}
          onClick={() => window.open(url, '_blank')}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px",
              color: "#666"
            }}>
              📄
            </div>
            <p style={{
              margin: "0",
              fontSize: "14px",
              color: "#2d5a27",
              textAlign: "center",
              fontWeight: "600",
              wordBreak: "break-word",
              padding: "0 16px"
            }}>
              {fileName}
            </p>
            <p style={{
              margin: "8px 0 0 0",
              fontSize: "12px",
              color: "#666",
              textAlign: "center"
            }}>
              Click to open
            </p>
          </div>
        );
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "16px",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      position: "relative",
      borderRadius: "8px",
      width: "100%",
      boxSizing: "border-box",
      overflow: "hidden"
    }}>
      {/* Portfolio Media */}
      {hasPortfolio && (
        <div style={{
          position: "relative",
          width: "100%",
          height: "240px",
          marginBottom: "12px",
          cursor: hasMultipleItems ? "pointer" : "default",
          borderRadius: "4px",
          overflow: "hidden",
          flexShrink: 0
        }}>
          {hasMultipleItems ? (
            <div ref={emblaRef} style={{ overflow: "hidden", width: "100%", height: "100%" }}>
              <div style={{ display: "flex", height: "100%" }}>
                {portfolioPieces.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      flex: "0 0 100%",
                      minWidth: 0,
                      position: "relative"
                    }}
                  >
                    {renderMediaItem(item, `${name} - Portfolio ${index + 1}`, index)}
                  </div>
                ))}
              </div>
              
              {/* Navigation arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (embla) embla.scrollPrev();
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%) translateX(-120px)",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  zIndex: 10,
                  transition: "background-color 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
                }}
              >
                ‹
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (embla) embla.scrollNext();
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%) translateX(120px)",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  zIndex: 10,
                  transition: "background-color 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
                }}
              >
                ›
              </button>
            </div>
          ) : (
            renderMediaItem(portfolioPieces[0], name, 0)
          )}
          
          {/* Media indicators for multiple items */}
          {hasMultipleItems && (
            <div style={{
              position: "absolute",
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "4px"
            }}>
              {portfolioPieces.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: index === selectedItemIndex ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)",
                    transition: "background-color 0.2s ease"
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Name */}
      <h3 style={{
        margin: "0 0 8px 0",
        fontSize: "18px",
        fontWeight: "600",
        textAlign: "left",
        color: "#2d5a27"
      }}>
        {name}
      </h3>
      
      {/* Type badge */}
      {type && (
        <div style={{
          padding: "4px 8px",
          backgroundColor: "rgba(45, 90, 39, 0.1)",
          border: "1px solid rgba(45, 90, 39, 0.3)",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "600",
          color: "#2d5a27",
          marginBottom: "8px"
        }}>
          {type}
        </div>
      )}
      
      {/* Description */}
      {description && (
        <p style={{
          margin: "0 0 12px 0",
          fontSize: "14px",
          lineHeight: "1.5",
          color: "#555",
          textAlign: "left"
        }}>
          {description}
        </p>
      )}
      
      
      {/* Commission button */}
      <button
        onClick={() => setIsContactModalOpen(true)}
        style={{
          width: "100%",
          padding: "10px 16px",
          backgroundColor: "white",
          color: "#2d5a27",
          border: "2px solid #2d5a27",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "8px"
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = "#f5f5f5";
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = "white";
        }}
      >
        Commission
        {slackProfile?.image && (
          <img
            src={slackProfile.image}
            alt={slackProfile.displayName || "Artist"}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "4px",
              objectFit: "cover"
            }}
          />
        )}
        @{slackProfile?.displayName || slackId || "artist"}
      </button>
      
      {/* Contact Modal */}
      {isContactModalOpen && (
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          priceStructures={priceStructures}
          slackProfile={slackProfile}
          slackId={slackId}
          onContactClick={onContactClick}
        />
      )}
      
      {/* Pixelated image styles */}
      <style jsx global>{`
        .pixelated-image {
          image-rendering: pixelated !important;
          image-rendering: -moz-crisp-edges !important;
          image-rendering: crisp-edges !important;
          image-rendering: pixelated !important;
        }
      `}</style>
    </div>
  );
}

// Contact Modal Component
function ContactModal({ isOpen, onClose, priceStructures, slackProfile, slackId, onContactClick }) {
  const [shouldRender, setShouldRender] = useState(Boolean(isOpen));
  const [isExiting, setIsExiting] = useState(false);

  // Handle scroll lock
  useEffect(() => {
    if (isOpen) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock scroll
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsExiting(false));
    } else if (shouldRender) {
      setIsExiting(true);
      const t = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
      }, 260);
      return () => clearTimeout(t);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      className={`modal-overlay ${isExiting ? "exit" : "enter"}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: isExiting ? "rgba(255, 255, 255, 0)" : "rgba(255, 255, 255, 0.3)",
        backdropFilter: isExiting ? "blur(0px)" : "blur(4px)",
        WebkitBackdropFilter: isExiting ? "blur(0px)" : "blur(4px)",
        transition: "background-color 240ms ease, backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`modal-card ${isExiting ? "exit" : "enter"}`}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          padding: "24px",
          borderRadius: 12,
          width: "600px",
          maxWidth: "calc(100vw - 40px)",
          maxHeight: "calc(100vh - 40px)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          border: "1px solid rgba(0, 0, 0, 0.12)",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0, fontWeight: 600, color: "#2d5a27" }}>Commission Artist</h2>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Close"
            title="Close"
            style={{
              appearance: "none",
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(255,255,255,0.7)",
              width: 32,
              height: 32,
              borderRadius: 9999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(0,0,0,0.65)",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ lineHeight: 1.6, color: "#2d5a27" }}>
          {/* Step 1 */}
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#2d5a27" }}>
              Step 1:
            </h4>
            <p style={{ margin: "0 0 12px 0", fontSize: "14px", lineHeight: "1.5" }}>
              First step is to dm the creator and ask for what you'd like to commission them to make and how much SSS you're willing to pay. Here's their price structure:
            </p>
            <div style={{
              backgroundColor: "rgba(45, 90, 39, 0.1)",
              border: "1px solid rgba(45, 90, 39, 0.2)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "12px"
            }}>
              {priceStructures && priceStructures.length > 0 ? (
                <div style={{
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "#2d5a27"
                }}>
                  {priceStructures.join(" • ")}
                </div>
              ) : (
                <div style={{
                  fontSize: "13px",
                  color: "#666",
                  fontStyle: "italic"
                }}>
                  No pricing information available
                </div>
              )}
            </div>
            <button
              onClick={() => {
                onContactClick?.();
                onClose?.();
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                backgroundColor: "#2d5a27",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#1e3d1e";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#2d5a27";
              }}
            >
              DM
              {slackProfile?.image && (
                <img
                  src={slackProfile.image}
                  alt={slackProfile.displayName || "Artist"}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    objectFit: "cover"
                  }}
                />
              )}
              @{slackProfile?.displayName || slackId || "creator"}
            </button>
          </div>

          {/* Step 2 */}
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#2d5a27" }}>
              Step 2:
            </h4>
            <p style={{ margin: "0 0 12px 0", fontSize: "14px", lineHeight: "1.5" }}>
              Make an open offer in{" "}
              <a 
                href="https://hackclub.slack.com/archives/C09KMBT2612" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: "#2d5a27", textDecoration: "underline" }}
              >
                #shiba-art-exchange
              </a>{" "}
              where you specify the deliverables you're purchasing and how much you're paying. The artist must accept your offer for it to be valid.
            </p>
            <button
              onClick={() => {
                window.open("https://hackclub.slack.com/archives/C09KMBT2612", "_blank");
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                backgroundColor: "#2d5a27",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#1e3d1e";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#2d5a27";
              }}
            >
              Make Public Offer
            </button>
          </div>

          {/* Step 3 */}
          <div>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#2d5a27" }}>
              Step 3:
            </h4>
            <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.5" }}>
              Once the asset is delivered, approve the asset in your post's thread and a Shiba-HQ staff member will deduct the SSS from your account and give it to the artist you hired.
            </p>
          </div>
        </div>

        {/* Styles */}
        <style jsx>{`
          .modal-card {
            transform: translateY(6px) scale(0.98);
            opacity: 0;
            transition:
              transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 220ms ease;
          }
          .modal-card.enter {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          .modal-card.exit {
            transform: translateY(6px) scale(0.98);
            opacity: 0;
          }
        `}</style>
      </div>
    </div>
  );
}

