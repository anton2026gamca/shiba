import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.next/games-cache.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Simple authentication - require a secret key
  const { secret } = req.body || {};
  const REBUILD_SECRET = process.env.CACHE_REBUILD_SECRET || 'your-secret-key-here';
  
  if (secret !== REBUILD_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('[rebuildCache] Starting cache rebuild...');
    
    // Delete the existing cache file
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('[rebuildCache] Deleted existing cache file');
    } else {
      console.log('[rebuildCache] No existing cache file found');
    }

    // Fetch fresh data from GetAllGames
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://shiba.hackclub.com' 
      : 'http://localhost:3000';
    
    console.log('[rebuildCache] Fetching fresh data from GetAllGames...');
    const response = await fetch(`${baseUrl}/api/GetAllGames?full=true&limit=1000&build=true`);
    
    if (!response.ok) {
      throw new Error(`GetAllGames API failed: ${response.status}`);
    }
    
    const freshData = await response.json();
    console.log('[rebuildCache] Fetched', freshData.length, 'games');
    
    // Write the new cache
    const cacheDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(freshData, null, 2));
    console.log('[rebuildCache] Cache rebuilt successfully');
    
    // Count feedback in the new cache
    let totalFeedback = 0;
    freshData.forEach(game => {
      totalFeedback += (game.feedback?.length || 0);
    });
    
    return res.status(200).json({ 
      ok: true, 
      message: 'Cache rebuilt successfully',
      stats: {
        gamesCount: freshData.length,
        totalFeedback: totalFeedback
      }
    });
  } catch (error) {
    console.error('[rebuildCache] Error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Failed to rebuild cache',
      error: error.message 
    });
  }
}

