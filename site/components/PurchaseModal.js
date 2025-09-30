import { useState, useEffect } from "react";
import ShippingInput from "./ShippingInput";

export default function PurchaseModal({ isOpen, onClose, item, token, profile, setProfile, onViewOrders }) {
  console.log('PurchaseModal props:', { isOpen, item, token, profile });
  
  const [shouldRender, setShouldRender] = useState(Boolean(isOpen));
  const [isExiting, setIsExiting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccessful, setPurchaseSuccessful] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    street1: profile?.address?.street1 || "",
    street2: profile?.address?.street2 || "",
    city: profile?.address?.city || "",
    state: profile?.address?.state || "",
    zipcode: profile?.address?.zipcode || "",
    country: profile?.address?.country || "",
    phone: profile?.phoneNumber || ""
  });

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

  // Reset form data when modal opens (but not when profile changes)
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: profile?.firstName || "",
        lastName: profile?.lastName || "",
        street1: profile?.address?.street1 || "",
        street2: profile?.address?.street2 || "",
        city: profile?.address?.city || "",
        state: profile?.address?.state || "",
        zipcode: profile?.address?.zipcode || "",
        country: profile?.address?.country || "",
        phone: profile?.phoneNumber || ""
      });
      // Only reset success state when modal first opens, not on profile changes
      setPurchaseSuccessful(false);
    }
  }, [isOpen]); // Removed profile dependency

  // Separate effect to update form data when profile changes (without resetting success state)
  useEffect(() => {
    if (isOpen && !purchaseSuccessful) {
      setFormData({
        firstName: profile?.firstName || "",
        lastName: profile?.lastName || "",
        street1: profile?.address?.street1 || "",
        street2: profile?.address?.street2 || "",
        city: profile?.address?.city || "",
        state: profile?.address?.state || "",
        zipcode: profile?.address?.zipcode || "",
        country: profile?.address?.country || "",
        phone: profile?.phoneNumber || ""
      });
    }
  }, [profile, isOpen, purchaseSuccessful]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    // Check if phone number has at least 10 digits (including country code)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const isPhoneValid = phoneDigits.length >= 10;
    
    return formData.firstName.trim() !== "" &&
           formData.lastName.trim() !== "" &&
           formData.street1.trim() !== "" &&
           formData.city.trim() !== "" &&
           formData.state.trim() !== "" &&
           formData.zipcode.trim() !== "" &&
           formData.country.trim() !== "" &&
           formData.phone.trim() !== "" &&
           isPhoneValid;
  };

  const handlePurchase = async () => {
    if (!isFormValid() || isPurchasing) return;
    
    console.log('handlePurchase called');
    console.log('token:', token);
    console.log('item?.id:', item?.id);
    console.log('formData:', formData);
    
    setIsPurchasing(true);
    try {
      const requestBody = {
        token,
        shopItemId: item?.id,
        shippingInfo: formData
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch('/api/Purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (response.ok && data?.ok) {
        // Purchase successful
        console.log('Purchase successful:', data.orderId);
        console.log('Setting purchaseSuccessful to true');
        
        // Update the user's SSS balance in the frontend state
        const purchaseAmount = parseFloat(item?.price) || 0;
        const currentBalance = profile?.sssBalance || 0;
        const newBalance = currentBalance - purchaseAmount;
        
        setProfile(prevProfile => ({
          ...prevProfile,
          sssBalance: newBalance
        }));
        
        console.log('Updated SSS balance:', { currentBalance, purchaseAmount, newBalance });
        
        // Show success state instead of closing immediately
        setPurchaseSuccessful(true);
        console.log('purchaseSuccessful state should now be true');
      } else {
        console.error('Purchase failed:', data?.message);
        
        // Handle specific error types
        if (data?.message === 'Insufficient SSS balance') {
          alert(`Insufficient SSS balance!\n\nYou have: ${data.userBalance} SSS\nNeeded: ${data.requiredAmount} SSS\nShortfall: ${data.shortfall} SSS`);
        } else if (data?.message === 'Item is out of stock') {
          alert(`Sorry, "${data.itemName}" is out of stock!\n\nItems in stock: ${data.inStock}`);
        } else {
          alert(`Purchase failed: ${data?.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      // TODO: Show error message
    } finally {
      setIsPurchasing(false);
    }
  };

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


        {/* Content */}
        {/* Debug: purchaseSuccessful = {purchaseSuccessful ? 'true' : 'false'} */}
        {!purchaseSuccessful ? (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: "20px",
                flex: 1,
              }}
            >
              {/* Thumbnail Column */}
              <div style={{ flexShrink: 0 }}>
                <img
                  src={item?.image || "/comingSoon.png"}
                  alt={item?.itemName || "Item"}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              </div>

              {/* Item Details Column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  flex: 1,
                }}
              >
                {/* Title */}
                <h2 style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#2d5a27",
                }}>
                  {item?.itemName || ""}
                </h2>

                {/* Cost */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <span style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#2d5a27",
                  }}>
                    {item?.price || ""}
                  </span>
                  <img
                    src="/SSS.png"
                    alt="SSS Currency"
                    style={{
                      width: "24px",
                      height: "24px",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div style={{
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "12px",
              backgroundColor: "rgba(255,255,255,0.5)",
            }}>
              <h3 style={{
                margin: "0 0 8px 0",
                fontSize: "14px",
                fontWeight: "600",
                color: "#2d5a27",
              }}>
                Shipping Information
              </h3>

              {/* Name Row */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <ShippingInput
                  label="First Name"
                  placeholder="First Name"
                  defaultValue={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  style={{ flex: 1 }}
                />
                <ShippingInput
                  label="Last Name"
                  placeholder="Last Name"
                  defaultValue={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              {/* Street Address Row */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <ShippingInput
                  label="Street Address"
                  placeholder="Street Address"
                  defaultValue={formData.street1}
                  onChange={(e) => updateFormData('street1', e.target.value)}
                  style={{ flex: 1 }}
                />
                <ShippingInput
                  label="Apt/Suite"
                  placeholder="Apt/Suite (optional)"
                  defaultValue={formData.street2}
                  onChange={(e) => updateFormData('street2', e.target.value)}
                  required={false}
                  style={{ flex: 1 }}
                />
              </div>

              {/* City, State, Zip Row */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <ShippingInput
                  label="City"
                  placeholder="City"
                  defaultValue={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  style={{ flex: 2 }}
                />
                <ShippingInput
                  label="State"
                  placeholder="State"
                  defaultValue={formData.state}
                  onChange={(e) => updateFormData('state', e.target.value)}
                  style={{ flex: 1 }}
                />
                <ShippingInput
                  label="Zip Code"
                  placeholder="Zip Code"
                  defaultValue={formData.zipcode}
                  onChange={(e) => updateFormData('zipcode', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              {/* Country and Phone Row */}
              <div style={{ display: "flex", gap: "8px" }}>
                <ShippingInput
                  label="Country"
                  placeholder="Country"
                  defaultValue={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                  style={{ flex: 1 }}
                />
                <ShippingInput
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                  defaultValue={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  type="tel"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Purchase Button */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}>
              <button
                onClick={handlePurchase}
                disabled={!isFormValid() || isPurchasing}
                style={{
                  appearance: "none",
                  border: `2px solid ${isFormValid() && !isPurchasing ? "#2d5a27" : "#999"}`,
                  background: isFormValid() && !isPurchasing ? "#2d5a27" : "#ccc",
                  color: isFormValid() && !isPurchasing ? "white" : "#666",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: isFormValid() && !isPurchasing ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  width: "100%",
                  opacity: isFormValid() && !isPurchasing ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (isFormValid() && !isPurchasing) {
                    e.target.style.background = "#1e3d1e";
                    e.target.style.borderColor = "#1e3d1e";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isFormValid() && !isPurchasing) {
                    e.target.style.background = "#2d5a27";
                    e.target.style.borderColor = "#2d5a27";
                  }
                }}
              >
                {isPurchasing ? "Processing..." : `Purchase for ${item?.price || "0"} SSS`}
              </button>
              
              {!isFormValid() && (
                <p style={{
                  margin: "8px 0 0 0",
                  fontSize: "12px",
                  color: "#666",
                  textAlign: "center",
                }}>
                  Finish filling out shipping information to purchase
                </p>
              )}
            </div>
          </>
        ) : (
          /* Success State */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: "32px",
              padding: "40px 20px",
              minHeight: "400px", // Maintain consistent height
            }}
          >
            <h1 style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "bold",
              color: "#2d5a27",
              textAlign: "center",
              opacity: 0,
              animation: "fadeIn 1s ease forwards"
            }}>
              Purchase Successful!
            </h1>
            
            <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => {
                  onViewOrders?.();
                  onClose?.();
                }}
                style={{
                  appearance: "none",
                  border: "2px solid black",
                  background: "var(--yellow)",
                  color: "black",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f7b748";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "var(--yellow)";
                }}
              >
                View Orders
                <img src="/arrow.svg" alt="arrow" style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
          </div>
        )}
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
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
