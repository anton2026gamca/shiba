import { useEffect } from "react";

export default function TopBar({ backgroundColor, title, image, onBack }) {
  // Event listener to return on escape key press

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (onBack) {
          onBack();
        } else {
          window.history.back();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onBack]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 64,
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",
        borderBottom: "1px solid #000",
        paddingLeft: 16,
        paddingRight: 16,
        backgroundColor: backgroundColor,
        backdropFilter: "saturate(180%) blur(8px)",
        WebkitBackdropFilter: "saturate(180%) blur(8px)",
        zIndex: 9999,
        boxSizing: "border-box",
      }}
    >
      <button
        onClick={onBack}
        style={{
          width: 32,
          borderRadius: 4,
          border: "1px solid #000",
          height: 32,
          padding: 0,
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src="back.svg" alt="Back" width={20} height={20} />
      </button>
      <p
        style={{
          display: "flex",
          opacity: 0.9,
          fontWeight: 600,
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        {title}
      </p>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          border: "1px solid #000",
          backgroundImage: `url(./${image})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </div>
  );
}
