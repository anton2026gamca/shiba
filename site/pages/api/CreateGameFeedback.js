import { safeEscapeFormulaString, generateSecureRandomString } from './utils/security.js';
import fs from 'fs';
import path from 'path';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appg245A41MWc6Rej';
const AIRTABLE_USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const AIRTABLE_GAMES_TABLE = process.env.AIRTABLE_GAMES_TABLE || 'Games';
const AIRTABLE_GAMEFEEDBACK_TABLE = process.env.AIRTABLE_GAMEFEEDBACK_TABLE || 'GameFeedback';
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const CACHE_FILE = path.join(process.cwd(), '.next/games-cache.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!AIRTABLE_API_KEY) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const { token, gameName, gameSlackId, message, starRanking } = req.body || {};
  
  if (!token || !gameName || !gameSlackId || !message || !starRanking) {
    return res.status(400).json({ message: 'Missing required fields: token, gameName, gameSlackId, message, starRanking' });
  }

  // Validate starRanking is between 1 and 5
  if (starRanking < 1 || starRanking > 5 || !Number.isInteger(starRanking)) {
    return res.status(400).json({ message: 'starRanking must be an integer between 1 and 5' });
  }

  try {
    // Find user by token (messageCreator)
    const userRecord = await findUserByToken(token);
    if (!userRecord) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find game by gameName and gameSlackId
    const gameRecord = await findGameByNameAndSlackId(gameName, gameSlackId);
    if (!gameRecord) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const payload = {
      records: [
        {
          fields: {
            messageCreator: [userRecord.id], // Link to the user record
            Game: [gameRecord.id], // Link to the game record
            message: message.trim(),
            StarRanking: starRanking,
          },
        },
      ],
    };

    const created = await airtableRequest(encodeURIComponent(AIRTABLE_GAMEFEEDBACK_TABLE), {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const rec = created?.records?.[0];
    const result = rec
      ? { 
          feedbackId: rec.id,
          messageCreator: rec.fields?.messageCreator?.[0] || '',
          messageCreatorSlack: userRecord.fields?.['slack id'] || '',
          messageCreatorBadges: userRecord.fields?.badges || [],
          gameName: rec.fields?.gameName || '',
          gameSlackId: rec.fields?.gameSlackId || '',
          message: rec.fields?.message || '',
          starRanking: rec.fields?.StarRanking || 0,
          createdAt: rec.createdTime || new Date().toISOString()
        }
      : null;

    // Update the gameStore cache with the new feedback
    console.log('[CreateGameFeedback] Attempting to update cache...');
    console.log('[CreateGameFeedback] gameName:', gameName);
    console.log('[CreateGameFeedback] gameSlackId:', gameSlackId);
    console.log('[CreateGameFeedback] result:', result);
    
    try {
      await updateCacheWithNewFeedback(gameName, gameSlackId, result);
      console.log('[CreateGameFeedback] Cache update successful');
    } catch (cacheError) {
      console.error('[CreateGameFeedback] Error updating cache:', cacheError);
      // Don't fail the request if cache update fails
    }

    return res.status(200).json({ ok: true, feedback: result });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('CreateGameFeedback error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
}

async function airtableRequest(path, options = {}) {
  const url = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Airtable error ${response.status}: ${text}`);
  }
  return response.json();
}

async function findUserByToken(token) {
  const tokenEscaped = safeEscapeFormulaString(token);
  
  // Try different field names like in CreatePlay.js
  const candidateFields = ['token', 'Token', 'User Token'];
  
  for (const fieldName of candidateFields) {
    const formula = `{${fieldName}} = "${tokenEscaped}"`;
    const params = new URLSearchParams({
      filterByFormula: formula,
      pageSize: '1',
    });

    try {
      const data = await airtableRequest(`${encodeURIComponent(AIRTABLE_USERS_TABLE)}?${params.toString()}`, {
        method: 'GET',
      });
      
      if (data.records && data.records.length > 0) {
        return data.records[0];
      }
    } catch (error) {
      // Continue to next field name
    }
  }
  
  return null;
}

async function findGameByNameAndSlackId(gameName, gameSlackId) {
  const gameNameEscaped = safeEscapeFormulaString(gameName);
  const gameSlackIdEscaped = safeEscapeFormulaString(gameSlackId);
  
  const formula = `AND({Name} = "${gameNameEscaped}", {slack id} = "${gameSlackIdEscaped}")`;
  const params = new URLSearchParams({
    filterByFormula: formula,
    pageSize: '1',
  });

  const data = await airtableRequest(`${encodeURIComponent(AIRTABLE_GAMES_TABLE)}?${params.toString()}`, {
    method: 'GET',
  });
  
  const record = data.records && data.records[0];
  return record || null;
}


async function updateCacheWithNewFeedback(gameName, gameSlackId, newFeedback) {
  console.log('[updateCacheWithNewFeedback] Starting cache update...');
  console.log('[updateCacheWithNewFeedback] CACHE_FILE path:', CACHE_FILE);
  
  try {
    // Read the current cache
    let cachedData = [];
    console.log('[updateCacheWithNewFeedback] Checking if cache file exists...');
    if (fs.existsSync(CACHE_FILE)) {
      console.log('[updateCacheWithNewFeedback] Cache file exists, reading...');
      const fileContent = fs.readFileSync(CACHE_FILE, 'utf8');
      console.log('[updateCacheWithNewFeedback] File content length:', fileContent.length);
      cachedData = JSON.parse(fileContent);
      console.log('[updateCacheWithNewFeedback] Parsed cache data, games count:', cachedData.length);
    } else {
      console.log('[updateCacheWithNewFeedback] Cache file does not exist');
      return;
    }

    // Find the game in the cache
    console.log('[updateCacheWithNewFeedback] Looking for game:', { gameName, gameSlackId });
    const gameIndex = cachedData.findIndex(game => {
      console.log('[updateCacheWithNewFeedback] Checking game:', { name: game.name, slackId: game.slackId });
      return game.name === gameName && game.slackId === gameSlackId;
    });

    console.log('[updateCacheWithNewFeedback] Game index found:', gameIndex);

    if (gameIndex === -1) {
      console.warn(`[updateCacheWithNewFeedback] Game not found in cache: ${gameName} (${gameSlackId})`);
      console.log('[updateCacheWithNewFeedback] Available games:', cachedData.map(g => ({ name: g.name, slackId: g.slackId })));
      return;
    }

    // Add the new feedback to the game
    const game = cachedData[gameIndex];
    console.log('[updateCacheWithNewFeedback] Found game, current feedback count:', game.feedback?.length || 0);
    
    if (!game.feedback) {
      game.feedback = [];
    }
    
    // Add new feedback at the beginning (most recent first)
    game.feedback.unshift(newFeedback);
    game.feedbackCount = game.feedback.length;
    console.log('[updateCacheWithNewFeedback] New feedback count:', game.feedbackCount);

    // Update the cache
    console.log('[updateCacheWithNewFeedback] Writing cache file...');
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedData, null, 2));
    console.log(`[updateCacheWithNewFeedback] Successfully updated cache with new feedback for ${gameName}`);
  } catch (error) {
    console.error('[updateCacheWithNewFeedback] Error updating cache:', error);
    console.error('[updateCacheWithNewFeedback] Error stack:', error.stack);
    throw error;
  }
}

function normalizeLinkedIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

