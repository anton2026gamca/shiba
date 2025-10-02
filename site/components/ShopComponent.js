import React, { useEffect, useState } from "react";
import ShopItemRenderer from "./utils/ShopItemRenderer";
import PurchaseModal from "./PurchaseModal";
import useAudioManager from "./useAudioManager";

export default function ShopComponent({ profile, token, setProfile }) {
  // console.log('ShopComponent received profile:', profile);
  // console.log('ShopComponent sssBalance:', profile?.sssBalance);
  const { play: playSound, stopAll } = useAudioManager(["mysteryShopMusic.mp3"]);
  const [shopItems, setShopItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentView, setCurrentView] = useState("Market"); // "Market" or "My Orders"
  const [isExplainerModalOpen, setIsExplainerModalOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Fetch shop items when Market view is selected
  useEffect(() => {
    const fetchShopItems = async () => {
      if (currentView !== "Market") return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/GetShopItems', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the API data to match the expected format for ShopItemRenderer
        const transformedItems = data.map(item => {
          let images = ["/comingSoon.png"]; // Default image
          
          // Get all images from the Images field
          if (item.Images && Array.isArray(item.Images) && item.Images.length > 0) {
            images = item.Images.map(img => img.url).filter(url => url);
          }
          
          return {
            id: item.id,
            images: images,
            image: images[0], // Keep for backward compatibility
            itemName: item.Name || "Unknown Item",
            price: item.Cost?.toString() || "0",
            description: item.Description || "",
            soldItems: item.SoldItems || 0,
            initialStock: item.InitialStock || 0,
            inStock: item.InStock || 0
          };
        });
        
        // Sort items by price (lowest to highest)
        const sortedItems = transformedItems.sort((a, b) => {
          const priceA = parseInt(a.price) || 0;
          const priceB = parseInt(b.price) || 0;
          return priceA - priceB;
        });
        
        setShopItems(sortedItems);
      } catch (err) {
        console.error('Error fetching shop items:', err);
        setError('Failed to load shop items');
        
        // Fallback to sample items if API fails
        setShopItems([
          {
            image: "/comingSoon.png",
            itemName: "??",
            price: "0"
          },
          {
            image: "/comingSoon.png", 
            itemName: "??",
            price: "0"
          },
          {
            image: "/comingSoon.png",
            itemName: "??",
            price: "0"
          },
          {
            image: "/comingSoon.png",
            itemName: "??",
            price: "0"
          },
          {
            image: "/comingSoon.png",
            itemName: "??",
            price: "0"
          },
          {
            image: "/comingSoon.png",
            itemName: "??",
            price: "0"
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopItems();
  }, [currentView]); // Changed from [] to [currentView]

  // Fetch orders when My Orders view is selected
  useEffect(() => {
    const fetchMyOrders = async () => {
      if (currentView !== "My Orders" || !token) return;
      
      try {
        setIsOrdersLoading(true);
        
        const response = await fetch('/api/GetMyOrders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.ok && Array.isArray(data.orders)) {
          setMyOrders(data.orders);
        } else {
          setMyOrders([]);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setMyOrders([]);
      } finally {
        setIsOrdersLoading(false);
      }
    };

    fetchMyOrders();
  }, [currentView, token]);

  // Play shop music when component mounts
  useEffect(() => {
    playSound("mysteryShopMusic.mp3");
    
    // Stop music when component unmounts
    return () => {
      stopAll();
    };
  }, [playSound, stopAll]);

  return (
    <div style={{
      backgroundColor: "rgb(214, 255, 214)", // Updated background color
      minHeight: "100vh",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{
        width: "1000px",
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Commented out launch message
        <div style={{
          border: "2px dotted #2d5a27",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          backgroundColor: "#fffacd" // Pastel yellow background
        }}>
          <p style={{
            fontSize: "18px",
            fontWeight: "600",
            textAlign: "center",
            margin: "0",
            color: "#2d5a27"
          }}>
            The Shiba Shop is now open!
          </p>
        </div>
        */}
        
                <div style={{width: "100%", display: "flex", flexDirection: "column", alignItems: "center"}}>
          {/* Navigation Bar */}
          <div style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            padding: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            maxWidth: "350px",
            justifyContent: "space-around",
            borderRadius: "12px",
            border: "1px solid rgba(0, 0, 0, 0.1)"
          }}>
            <button
              onClick={() => setCurrentView("Market")}
              style={{
                appearance: "none",
                border: "none",
                background: currentView === "Market" 
                  ? "#2d5a27" 
                  : "rgba(255, 255, 255, 0.75)",
                color: currentView === "Market" ? "#fff" : "#2d5a27",
                borderRadius: "8px",
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "14px",
                transition: "all 0.2s ease"
              }}
            >
              Market
            </button>
            
                               {/* SSS Balance Display */}
                   <div 
                     onClick={() => setIsExplainerModalOpen(true)}
                     style={{
                       display: "flex",
                       alignItems: "center",
                       gap: "4px",
                       padding: "10px 12px",
                       backgroundColor: "rgba(255, 250, 180, 0.8)", // Subtle yellow tint
                       borderRadius: "8px",
                       color: "#2d5a27",
                       fontWeight: "700",
                       fontSize: "14px",
                       border: "2px dotted #2d5a27",
                       cursor: "pointer",
                       transition: "all 0.2s ease"
                     }}
                     onMouseEnter={(e) => {
                       e.target.style.backgroundColor = "rgba(255, 250, 180, 0.9)";
                     }}
                     onMouseLeave={(e) => {
                       e.target.style.backgroundColor = "rgba(255, 250, 180, 0.8)";
                     }}
                   >
              {profile?.sssBalance !== undefined && profile?.sssBalance !== null && (
                <span style={{
                  animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                }}>
                  {profile.sssBalance}
                </span>
              )}
              <img
                src="/SSS.png"
                alt="SSS"
                style={{
                  width: "16px",
                  height: "16px",
                  objectFit: "contain"
                }}
              />
            </div>
            
            <button
              onClick={() => setCurrentView("My Orders")}
              style={{
                appearance: "none",
                border: "none",
                background: currentView === "My Orders" 
                  ? "#2d5a27" 
                  : "rgba(255, 255, 255, 0.75)",
                color: currentView === "My Orders" ? "#fff" : "#2d5a27",
                borderRadius: "8px",
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "14px",
                transition: "all 0.2s ease"
              }}
            >
              My Orders
            </button>
          </div>
        </div>
        

        
        {currentView === "Market" && (
          <>
            {isLoading && (
              <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#2d5a27"
              }}>
                <p>Loading shop items...</p>
              </div>
            )}
            
            {error && (
              <div style={{
                textAlign: "center",
                padding: "20px",
                color: "#d32f2f",
                backgroundColor: "#ffebee",
                borderRadius: "8px",
                marginBottom: "20px"
              }}>
                <p>{error}</p>
              </div>
            )}
            
            {!isLoading && !error && (
              <>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "20px"
                }}>
                  {shopItems.length > 0 ? (
                    shopItems.map((item, index) => (
                      <ShopItemRenderer
                        key={item.id || index}
                        images={item.images}
                        image={item.image}
                        itemName={item.itemName}
                        price={item.price}
                        description={item.description}
                        inStock={item.inStock}
                        userBalance={profile?.sssBalance || 0}
                        onBuyClick={() => {
                          setSelectedItem(item);
                          setIsPurchaseModalOpen(true);
                        }}
                      />
                    ))
                  ) : (
                    <div style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "40px",
                      color: "#2d5a27"
                    }}>
                      <p>No shop items available at the moment.</p>
                    </div>
                  )}
                </div>
                
                {shopItems.length > 0 && (
                  <div style={{
                    textAlign: "center",
                    padding: "40px 20px 20px 20px",
                    color: "#2d5a27",
                    fontStyle: "italic",
                    fontSize: "16px"
                  }}>
                    <p>More items coming soon...</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
        
        {currentView === "My Orders" && (
          <>
            {isOrdersLoading && (
              <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#2d5a27"
              }}>
                <p>Loading orders...</p>
              </div>
            )}
            
            {!isOrdersLoading && myOrders.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#2d5a27"
              }}>
                <p>You haven't made an order yet</p>
              </div>
            )}
            
            {!isOrdersLoading && myOrders.length > 0 && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                padding: "20px"
              }}>
                {myOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        token={token}
        profile={profile}
        setProfile={setProfile}
        onViewOrders={() => setCurrentView("My Orders")}
      />
      
      <ExplainerModal
        isOpen={isExplainerModalOpen}
        onClose={() => setIsExplainerModalOpen(false)}
      />
    </div>
  );
}

function OrderCard({ order }) {
  const getStatusColor = (status) => {
    return status === "Fulfilled" ? "#4CAF50" : "#FF9800";
  };

  const getStatusBackground = (status) => {
    return status === "Fulfilled" ? "rgba(76, 175, 80, 0.1)" : "rgba(255, 152, 0, 0.1)";
  };

  return (
    <div style={{
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderRadius: "12px",
      padding: "16px",
      border: "1px solid rgba(0, 0, 0, 0.1)",
      display: "flex",
      alignItems: "center",
      gap: "16px"
    }}>
      {/* Item Thumbnail */}
      <div style={{
        width: "80px",
        height: "80px",
        borderRadius: "8px",
        overflow: "hidden",
        flexShrink: 0,
        border: "1px solid rgba(0, 0, 0, 0.1)"
      }}>
        <img
          src={order.shopItemThumbnail}
          alt={order.shopItemName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />
      </div>

      {/* Order Details */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "8px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}>
          <h3 style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "600",
            color: "#2d5a27"
          }}>
            {order.shopItemName}
          </h3>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#2d5a27"
            }}>
              {order.amountSpent}
            </span>
            <img
              src="/SSS.png"
              alt="SSS"
              style={{
                width: "16px",
                height: "16px",
                objectFit: "contain"
              }}
            />
          </div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{
            fontSize: "12px",
            color: "rgba(0, 0, 0, 0.6)"
          }}>
            Order #{order.orderId}
          </div>
          <div style={{
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "600",
            color: getStatusColor(order.status),
            backgroundColor: getStatusBackground(order.status),
            border: `1px solid ${getStatusColor(order.status)}`
          }}>
            {order.status}
          </div>
        </div>

        {order.createdAt && (
          <div style={{
            fontSize: "12px",
            color: "rgba(0, 0, 0, 0.5)"
          }}>
            Ordered on {new Date(order.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

function ExplainerModal({ isOpen, onClose }) {
  const [shouldRender, setShouldRender] = useState(Boolean(isOpen));
  const [isExiting, setIsExiting] = useState(false);

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
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`modal-card ${isExiting ? "exit" : "enter"}`}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          padding: "20px",
          borderRadius: 12,
          width: "500px",
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
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <h2 style={{ margin: 0, fontWeight: 600, color: "#2d5a27" }}>How to get SSS</h2>
            <span style={{ fontWeight: 600, color: "#2d5a27" }}>(SSS =</span>
            <img
              src="/SSS.png"
              alt="SSS"
              style={{
                width: "20px",
                height: "20px",
                objectFit: "contain"
              }}
            />
            <span style={{ fontWeight: 600, color: "#2d5a27" }}>)</span>
          </div>
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
          <p style={{ marginBottom: 16, fontSize: 14 }}>
            You'll earn SSS from people playing your game and giving it a score. The maximum someone can give you is 25/25, which would result in 25 SSS from a single play of your game. They'll rate your game 1-5 on a scale of: Fun, Art, Creativity, Audio, and Mood.
          </p>
          <p style={{ fontSize: 14 }}>
            People will play your game if you playtest other people's games. You'll earn playtest tickets by shipping your game (uploading a demo of your current working version) and getting approved for hours spent making your game (time logged in Hackatime).
          </p>
        </div>


      </div>

      {/* Styles */}
      <style jsx>{`
        .modal-overlay {
          background-color: rgba(255, 255, 255, 0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          transition:
            backdrop-filter 240ms ease,
            -webkit-backdrop-filter 240ms ease,
            background-color 240ms ease;
        }
        .modal-overlay.enter {
          background-color: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .modal-overlay.exit {
          background-color: rgba(255, 255, 255, 0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
        }
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
        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}


