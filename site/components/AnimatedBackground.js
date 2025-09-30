import { useState, useEffect } from 'react';

const AnimatedBackground = ({ 
  opacity = 0.2, 
  enabled = true,
  zIndex = -2 
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  
  const jumpyImages = [
    '/landing/jumpy1.png',
    '/landing/jumpy2.png',
    '/landing/jumpy3.png',
    '/landing/jumpy4.png'
  ];

  useEffect(() => {
    if (!enabled) return;
    
    // Randomly select one image on component mount (page refresh)
    const randomIndex = Math.floor(Math.random() * jumpyImages.length);
    const randomImage = jumpyImages[randomIndex];
    console.log('Selected random image:', randomImage); // Debug log
    setSelectedImage(randomImage);
  }, [enabled]);

  if (!enabled || !selectedImage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${selectedImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: zIndex,
        opacity: opacity,
        pointerEvents: 'none', // Ensure it doesn't interfere with interactions
      }}
    />
  );
};

export default AnimatedBackground;
