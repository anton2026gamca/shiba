# Animated Background Feature

## Overview
This feature adds a background to the Shiba Arcade site that randomly selects one of the jumpy images (jumpy1.png, jumpy2.png, jumpy3.png, jumpy4.png) each time the page is refreshed. It also sets up bg.gif as the meta image for social media sharing.

## Files Created/Modified

### New Files
- `components/AnimatedBackground.js` - The main background component
- `public/favicon-16x16.png` - 16x16 favicon from jumpy1.png
- `public/favicon-32x32.png` - 32x32 favicon from jumpy1.png  
- `public/favicon-48x48.png` - 48x48 favicon from jumpy1.png

### Modified Files
- `pages/_app.js` - Added AnimatedBackground component to the main app
- `pages/_document.js` - Added favicon links and meta image tags
- `components/AppHead.js` - Added meta image tags for social sharing
- `styles/globals.css` - Changed body background to transparent

## Features

### Random Background
- Randomly selects one of the jumpy images on each page refresh
- Subtle opacity (0.2) so it doesn't interfere with content
- Positioned behind all content (z-index: -2)
- Non-interactive (pointer-events: none)
- Debug logging to console to verify random selection

### Favicon
- Created from jumpy1.png in multiple sizes (16x16, 32x32, 48x48)
- Properly linked in document head for browser compatibility
- Uses PNG format for better quality

### Meta Image
- Uses bg.gif as the social media preview image
- Configured for both Open Graph (Facebook, LinkedIn) and Twitter
- Set to 1200x630 dimensions for optimal social sharing

## Configuration
The AnimatedBackground component accepts these props:
- `opacity` (default: 0.2) - Background opacity
- `enabled` (default: true) - Whether the background is active
- `zIndex` (default: -2) - CSS z-index value

## Usage
The background is automatically applied to all pages through the `_app.js` file. To disable it on specific pages, you can pass `enabled={false}` to the component.

## Debugging
- Check browser console for "Selected random image:" log to verify random selection
- Each page refresh should show a different random image
- If stuck on jumpy1.png, check console for any errors

## Browser Compatibility
- Modern browsers with CSS support
- Favicon works across all major browsers
- Meta images work for social media platforms
- Graceful degradation for older browsers
