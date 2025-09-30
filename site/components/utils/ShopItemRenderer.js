import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function ShopItemRenderer({ 
  images = [],
  image, 
  itemName, 
  price, 
  description = "",
  inStock = 0, 
  userBalance = 0,
  onBuyClick 
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  
  // Use images array if provided, otherwise fall back to single image
  const imageArray = images && images.length > 0 ? images : [image];
  const hasMultipleImages = imageArray.length > 1;
  
  const [emblaRef, embla] = useEmblaCarousel({
    loop: hasMultipleImages,
    align: "center",
    slidesToScroll: 1,
  });
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const priceNumber = parseInt(price) || 0;
  const stockNumber = parseInt(inStock) || 0;
  const balanceNumber = parseInt(userBalance) || 0;
  
  const hasEnoughBalance = balanceNumber >= priceNumber;
  const hasStock = stockNumber > 0;
  const isDisabled = !hasEnoughBalance || !hasStock;
  
  // Handle carousel selection
  useEffect(() => {
    if (!embla || !hasMultipleImages) return;
    
    const onSelect = () => {
      setSelectedImageIndex(embla.selectedScrollSnap());
    };
    
    embla.on("select", onSelect);
    return () => embla.off("select", onSelect);
  }, [embla, hasMultipleImages]);
  
  const getTooltipText = () => {
    if (!hasStock) {
      return "Out of stock";
    }
    if (!hasEnoughBalance) {
      return `Insufficient balance. You need ${priceNumber - balanceNumber} more SSS`;
    }
    return "";
  };

  const getButtonText = () => {
    if (!hasStock) {
      return "Out of Stock";
    }
    return "Buy";
  };

  const handleBuyClick = () => {
    if (!isDisabled && onBuyClick) {
      onBuyClick();
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
      position: "relative"
    }}>
      <div style={{
        position: "relative",
        width: "100%",
        height: "240px",
        marginBottom: "12px",
        cursor: hasMultipleImages ? "pointer" : "default"
      }}
      onMouseEnter={() => {
        setShowDescription(true);
      }}
      onMouseLeave={() => {
        setShowDescription(false);
      }}
      >
        {hasMultipleImages ? (
          <div ref={emblaRef} style={{ overflow: "hidden", width: "100%", height: "100%" }}>
            <div style={{ display: "flex", height: "100%" }}>
              {imageArray.map((img, index) => (
                <div
                  key={index}
                  style={{
                    flex: "0 0 100%",
                    minWidth: 0,
                    position: "relative"
                  }}
                >
                  <img
                    src={img}
                    alt={`${itemName} - Image ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
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
          <img
            src={imageArray[0]}
            alt={itemName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        )}
        
        {/* Image indicators for multiple images */}
        {hasMultipleImages && (
          <div style={{
            position: "absolute",
            bottom: "8px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "4px"
          }}>
            {imageArray.map((_, index) => (
              <div
                key={index}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: index === selectedImageIndex ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)",
                  transition: "background-color 0.2s ease"
                }}
              />
            ))}
          </div>
        )}
        
        {showDescription && description && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            transition: "background-color 0.2s ease"
          }}>
            <p style={{
              color: "white",
              fontSize: "14px",
              lineHeight: "1.4",
              textAlign: "center",
              margin: 0,
              fontWeight: "500"
            }}>
              {description}
            </p>
          </div>
        )}
      </div>
      <p style={{
        margin: "0 0 8px 0",
        fontSize: "16px",
        fontWeight: "600",
        textAlign: "left"
      }}>
        {itemName}
      </p>
      
      {/* Price and Buy button row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%"
      }}>
        {/* Price section */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <p style={{
            margin: "0",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#2d5a27"
          }}>
            {price}
          </p>
          <img
            src="/SSS.png"
            alt="SSS Currency"
            style={{
              width: "20px",
              height: "20px",
              objectFit: "contain"
            }}
          />
        </div>
        
        {/* Buy button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={handleBuyClick}
            disabled={isDisabled}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
              padding: "8px 16px",
              backgroundColor: isDisabled ? "#ccc" : "#2d5a27",
              color: isDisabled ? "#666" : "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: isDisabled ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease",
              minWidth: "60px"
            }}
            onMouseOver={(e) => {
              if (!isDisabled) {
                e.target.style.backgroundColor = "#1e3d1e";
              }
            }}
            onMouseOut={(e) => {
              if (!isDisabled) {
                e.target.style.backgroundColor = "#2d5a27";
              }
            }}
          >
            {getButtonText()}
          </button>
          
          {/* Tooltip */}
          {showTooltip && isDisabled && (
            <div style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#333",
              color: "white",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap",
              zIndex: 1000,
              marginBottom: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
            }}>
              {getTooltipText()}
              <div style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "0",
                height: "0",
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid #333"
              }}></div>
            </div>
          )}
        </div>
      </div>
      

    </div>
  );
}
