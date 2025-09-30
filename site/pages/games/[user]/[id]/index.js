import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

const PlayGameComponent = dynamic(() => import('@/components/utils/playGameComponent'), { ssr: false });
const PostAttachmentRenderer = dynamic(() => import('@/components/utils/PostAttachmentRenderer'), { ssr: false });

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
        console.log(`[getCachedGamesData] Using file-cached games data (${cachedData.length} games)`);
        
        // Debug: log some sample data
        if (cachedData.length > 0) {
          console.log('[getCachedGamesData] Sample cached game:', {
            slackId: cachedData[0].slackId,
            name: cachedData[0].name,
            hasAllFields: !!(cachedData[0].slackId && cachedData[0].name)
          });
        }
        
        return cachedData;
      }
    }
  } catch (error) {
    console.log('[getCachedGamesData] File cache read failed, fetching fresh data');
  }
  
  // Fetch fresh data
  console.log('[getCachedGamesData] Fetching fresh games data from API (build-time)');
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://shiba.hackclub.com' 
    : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/GetAllGames?full=true&limit=1000&build=true`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch games data: ${response.status}`);
  }
  
  const games = await response.json();
  
  // Debug: log some sample data from API
  if (games.length > 0) {
    console.log('[getCachedGamesData] Sample API game:', {
      slackId: games[0].slackId,
      name: games[0].name,
      hasAllFields: !!(games[0].slackId && games[0].name)
    });
  }
  
  // Write to file cache
  try {
    // Ensure .next directory exists
    const nextDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(nextDir)) {
      fs.mkdirSync(nextDir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(games, null, 2));
    console.log(`[getCachedGamesData] File-cached ${games.length} games`);
  } catch (error) {
    console.log('[getCachedGamesData] File cache write failed, but data fetched successfully');
  }
  
  return games;
}

export default function GamesPage({ gameData, error }) {
  const router = useRouter();
  const { user, id, LastReviewed } = router.query;
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState('Devlogs'); // 'Devlogs' | 'Artlogs' | 'Plays'
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('latest');
  const [isPawed, setIsPawed] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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
        .map((post, index) => ({
          version: `v1.${index}`,
          label: `Version 1.${index}`,
          gameLink: post.PlayLink || post.playLink || post.gameLink,
          post
        }))
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
                
                return devlogPosts.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: "32px" }}>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {recentPosts.map((p, pIdx) => (
                            <div key={p.id || pIdx} className="moment-card" style={{ 
                              position: "relative",
                              border: "2px solid #ff0000",
                              borderRadius: "10px",
                              background: "rgba(255, 255, 255, 0.9)",
                              padding: "12px"
                            }}>
                              <PostAttachmentRenderer
                                content={p.content}
                                attachments={p.attachments}
                                playLink={p.PlayLink}
                                gameName={gameData?.name || ""}
                                thumbnailUrl={gameData?.thumbnailUrl || ""}
                                token={null}
                                slackId={user}
                                createdAt={p.createdAt}
                                badges={p.badges}
                                HoursSpent={p.HoursSpent}
                                gamePageUrl={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(gameData?.name || id)}`}
                                onPlayCreated={(play) => {
                                  console.log("Play created:", play);
                                }}
                                postType={p.postType}
                                timelapseVideoId={p.timelapseVideoId}
                                githubImageLink={p.githubImageLink}
                                timeScreenshotId={p.timeScreenshotId}
                                hoursSpent={p.hoursSpent || p.HoursSpent || 0}
                                timeSpentOnAsset={p.timeSpentOnAsset || 0}
                                minutesSpent={p.minutesSpent}
                                postId={p.PostID}
                                currentUserProfile={null}
                                onTimeUpdated={() => {}} // No-op for public pages
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Older posts */}
                    {olderPosts.map((p, pIdx) => (
                      <div key={p.id || pIdx} className="moment-card" style={{ 
                        position: "relative",
                        border: "1px solid rgba(0, 0, 0, 0.18)",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.8)",
                        padding: "12px"
                      }}>
                        <PostAttachmentRenderer
                          content={p.content}
                          attachments={p.attachments}
                          playLink={p.PlayLink}
                          gameName={gameData?.name || ""}
                          thumbnailUrl={gameData?.thumbnailUrl || ""}
                          token={null}
                          slackId={user}
                          createdAt={p.createdAt}
                          badges={p.badges}
                          HoursSpent={p.HoursSpent}
                          gamePageUrl={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(gameData?.name || id)}`}
                          onPlayCreated={(play) => {
                            console.log("Play created:", play);
                          }}
                          postType={p.postType}
                          timelapseVideoId={p.timelapseVideoId}
                          githubImageLink={p.githubImageLink}
                          timeScreenshotId={p.timeScreenshotId}
                          hoursSpent={p.hoursSpent || p.HoursSpent || 0}
                          timeSpentOnAsset={p.timeSpentOnAsset || 0}
                          minutesSpent={p.minutesSpent}
                          postId={p.PostID}
                          currentUserProfile={null}
                          onTimeUpdated={() => {}} // No-op for public pages
                        />
                      </div>
                    ))}
                  </div>
                ) : (
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
                
                return artlogPosts.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: "32px" }}>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {recentPosts.map((p, pIdx) => (
                            <div key={p.id || pIdx} className="moment-card" style={{ 
                              position: "relative",
                              border: "2px solid #ff0000",
                              borderRadius: "10px",
                              background: "rgba(255, 255, 255, 0.9)",
                              padding: "12px"
                            }}>
                              <PostAttachmentRenderer
                                content={p.content}
                                attachments={p.attachments}
                                playLink={p.PlayLink}
                                gameName={gameData?.name || ""}
                                thumbnailUrl={gameData?.thumbnailUrl || ""}
                                token={null}
                                slackId={user}
                                createdAt={p.createdAt}
                                badges={p.badges}
                                HoursSpent={p.HoursSpent}
                                gamePageUrl={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(gameData?.name || id)}`}
                                onPlayCreated={(play) => {
                                  console.log("Play created:", play);
                                }}
                                postType={p.postType}
                                timelapseVideoId={p.timelapseVideoId}
                                githubImageLink={p.githubImageLink}
                                timeScreenshotId={p.timeScreenshotId}
                                hoursSpent={p.hoursSpent || p.HoursSpent || 0}
                                timeSpentOnAsset={p.timeSpentOnAsset || 0}
                                minutesSpent={p.minutesSpent}
                                postId={p.PostID}
                                currentUserProfile={null}
                                onTimeUpdated={() => {}} // No-op for public pages
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Older posts */}
                    {olderPosts.map((p, pIdx) => (
                      <div key={p.id || pIdx} className="moment-card" style={{ 
                        position: "relative",
                        border: "1px solid rgba(0, 0, 0, 0.18)",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.8)",
                        padding: "12px"
                      }}>
                        <PostAttachmentRenderer
                          content={p.content}
                          attachments={p.attachments}
                          playLink={p.PlayLink}
                          gameName={gameData?.name || ""}
                          thumbnailUrl={gameData?.thumbnailUrl || ""}
                          token={null}
                          slackId={user}
                          createdAt={p.createdAt}
                          badges={p.badges}
                          HoursSpent={p.HoursSpent}
                          gamePageUrl={`https://shiba.hackclub.com/games/${user}/${encodeURIComponent(gameData?.name || id)}`}
                          onPlayCreated={(play) => {
                            console.log("Play created:", play);
                          }}
                          postType={p.postType}
                          timelapseVideoId={p.timelapseVideoId}
                          githubImageLink={p.githubImageLink}
                          timeScreenshotId={p.timeScreenshotId}
                          hoursSpent={p.hoursSpent || p.HoursSpent || 0}
                          timeSpentOnAsset={p.timeSpentOnAsset || 0}
                          minutesSpent={p.minutesSpent}
                          postId={p.PostID}
                          currentUserProfile={null}
                          onTimeUpdated={() => {}} // No-op for public pages
                        />
                      </div>
                    ))}
                  </div>
                ) : (
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
                            backgroundImage: player.image ? `url(${player.image})` : "none",
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
                            {!player.image && (
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
      `}</style>
    </>
  );
}

export async function getStaticPaths() {
  try {
    const games = await getCachedGamesData();
    console.log(`[getStaticPaths] Got ${games.length} games from cache`);
    
    // Debug: log some games to see what we have
    console.log('[getStaticPaths] Sample games:', games.slice(0, 3).map(g => ({ slackId: g.slackId, name: g.name })));
    
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

    console.log(`[getStaticPaths] Pre-generated ${paths.length} static paths for games`);
    
    // Debug: check if our specific game is in the paths
    const targetPath = paths.find(p => p.params.user === 'U041FQB8VK2' && p.params.id === 'WASD Beats');
    console.log('[getStaticPaths] Target path found:', targetPath);
    
    // Debug: log some paths to see what's being generated
    console.log('[getStaticPaths] Sample paths:', paths.slice(0, 5));
    
    return {
      paths,
      fallback: 'blocking' // Enable on-demand generation for missing paths
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    console.log('Falling back to empty paths - pages will be generated on-demand');
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

export async function getStaticProps(context) {
  const { user, id } = context.params;
  console.log(`[getStaticProps] Processing ${user}/${id}`);

  try {
    const games = await getCachedGamesData();
    console.log(`[getStaticProps] Got ${games.length} games for ${user}/${id}`);
    
    // Find the specific game by user and id
    // Try both encoded and decoded versions of the game name
    const decodedId = decodeURIComponent(id);
    console.log(`[getStaticProps] Looking for game - user: ${user}, id: ${id}, decodedId: ${decodedId}`);
    
    // Debug: log some games for this user
    const userGames = games.filter(game => game.slackId === user);
    console.log(`[getStaticProps] Games for user ${user}:`, userGames.map(g => g.name));
    
    const gameData = games.find(game => 
      game.slackId === user && 
      (game.name === id || game.name === decodedId)
    );

    if (!gameData) {
      console.log(`Game not found in static data, falling back to API for ${user}/${id}`);
      
      // Fallback to getGame.js API
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://shiba.hackclub.com' 
          : 'http://localhost:3000';
        
        // Decode the game name in case it's URL encoded
        const decodedGameName = decodeURIComponent(id);
        console.log(`[getStaticProps] API fallback - slackId: ${user}, gameName: ${decodedGameName}`);
        
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

        console.log(`[getStaticProps] API fallback response status: ${response.status}`);

        if (response.ok) {
          const apiGameData = await response.json();
          console.log(`Found game data via API fallback for ${user}/${id}:`, apiGameData.name);
          
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

    console.log(`Found game data for ${user}/${id}:`, gameData.name);

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
