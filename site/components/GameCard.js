import { useEffect, useState } from "react";



export default function GameCard({ game, style, isFocused = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [topImageLoaded, setTopImageLoaded] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  // Handle focus changes and rotation tracking
  useEffect(() => {
    if (isFocused) {
      if (!isSpinning) {
        setIsSpinning(true);
        setCurrentRotation(0);
      }
    } else {
      if (isSpinning) {
        setIsSpinning(false);
      }
    }
  }, [isFocused, isSpinning]);

  // Track rotation while spinning
  useEffect(() => {
    if (!isSpinning) return;
    
    let startTime = Date.now();
    const updateRotation = () => {
      if (!isSpinning) return;
      const elapsed = Date.now() - startTime;
      const rotation = (elapsed / 15000) * 360; // 15 seconds = 360 degrees
      setCurrentRotation(rotation % 360);
      requestAnimationFrame(updateRotation);
    };
    
    const animationId = requestAnimationFrame(updateRotation);
    return () => cancelAnimationFrame(animationId);
  }, [isSpinning]);
  const baseStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    width: "100%",
    aspectRatio: "1 / 1",
    marginTop: 24,
    backgroundColor: "white",
    boxSizing: "border-box",
    borderRadius: "8px",
    border: "1px solid black",
    transition: "transform 300ms ease, opacity 300ms ease",
  };
  const computeHueRotateDeg = () => {
    try {
      const baseHue = 190; // approx teal-blue base hue of Frame.svg
      const color = String(game?.bgColor || "").trim();
      if (!color) return 0;
      const rgb = parseCssColorToRgb(color);
      if (!rgb) return 0;
      const hue = rgbToHue(rgb.r, rgb.g, rgb.b);
      if (!Number.isFinite(hue)) return 0;
      // shortest signed delta between hues (-180..180)
      const delta = (((hue - baseHue) % 360) + 540) % 360 - 180;
      return delta;
    } catch (_) {
      return 0;
    }
  };
  const hueRotateDeg = computeHueRotateDeg();
  const frameFilter = `hue-rotate(${hueRotateDeg}deg) saturate(1.05) brightness(1.02)`;

  // Warm the cache so both begin loading at the same time
  useEffect(() => {
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = `/${game.backgroundImage}`;
      const frame = new Image();
      frame.decoding = "async";
      frame.src = "./Frame.svg";
      if (game.topImage) {
        const topImg = new Image();
        topImg.decoding = "async";
        topImg.src = `/${game.topImage}`;
      }
    } catch (_) {}
  }, [game?.backgroundImage, game?.topImage]);
  return (
    <div style={{ ...baseStyle, ...style, position: "relative" }}>
      {!imageFailed ? (
        <img
          src={`/${game.backgroundImage}`}
          alt={game.name}
          style={{ width: "85%", height: "85%", objectFit: "cover", opacity: imgLoaded && frameLoaded ? 1 : 0, transition: "opacity 200ms ease" }}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImageFailed(true); setImgLoaded(true); }}
          loading="eager"
          decoding="async"
        />
      ) : (
        <p style={{ textAlign: "center", zIndex: 1 }}>{game.name}</p>
      )}
      {game.topImage && (
        <img
          src={`/${game.topImage}`}
          alt=""
          aria-hidden
          style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: `translate(-50%, -50%) rotate(${isSpinning ? currentRotation : 0}deg)`, 
            width: "80%", 
            height: "auto", 
            maxHeight: "80%", 
            objectFit: "contain", 
            pointerEvents: "none", 
            zIndex: 3, 
            opacity: topImageLoaded ? 1 : 0, 
            transition: `opacity 200ms ease, transform ${isSpinning ? '0ms linear' : '600ms ease-out'}`, 
          }}
          onLoad={() => setTopImageLoaded(true)}
          loading="eager"
          decoding="async"
        />
      )}
      <img
        src="./Frame.svg"
        alt=""
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "105%", marginTop: "-15%", marginLeft: "-2.5%", objectFit: "cover", pointerEvents: "none", zIndex: 2, filter: frameFilter, opacity: imgLoaded && frameLoaded ? 1 : 0, transition: "opacity 200ms ease" }}
        onLoad={() => setFrameLoaded(true)}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}


function parseCssColorToRgb(input) {
  const s = String(input).trim().toLowerCase();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    return null;
  }
  if (s.startsWith("rgb")) {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(",").map((x) => x.trim());
    if (parts.length < 3) return null;
    const r = clamp255(parseComponent(parts[0]));
    const g = clamp255(parseComponent(parts[1]));
    const b = clamp255(parseComponent(parts[2]));
    return { r, g, b };
  }
  if (s.startsWith("hsl")) {
    const m = s.match(/hsla?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(",").map((x) => x.trim());
    if (parts.length < 3) return null;
    const h = parseFloat(parts[0]);
    const sPerc = parseFloat(parts[1]);
    const lPerc = parseFloat(parts[2]);
    const rgb = hslToRgb(h, sPerc / 100, lPerc / 100);
    return rgb;
  }
  return null;
}

function parseComponent(v) {
  if (v.endsWith("%")) {
    return Math.round((parseFloat(v) / 100) * 255);
  }
  return parseFloat(v);
}

function clamp255(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbToHue(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  switch (max) {
    case rn:
      h = ((gn - bn) / d) % 6;
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
      break;
  }
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;
  if (0 <= h && h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (60 <= h && h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (120 <= h && h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (180 <= h && h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (240 <= h && h < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }
  const r = clamp255((r1 + m) * 255);
  const g = clamp255((g1 + m) * 255);
  const b = clamp255((b1 + m) * 255);
  return { r, g, b };
}

