import { safeEscapeFormulaString, generateSecureRandomString } from './utils/security.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appg245A41MWc6Rej';
const AIRTABLE_USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const AIRTABLE_GAMES_TABLE = process.env.AIRTABLE_GAMES_TABLE || 'Games';
const AIRTABLE_GAMEFEEDBACK_TABLE = process.env.AIRTABLE_GAMEFEEDBACK_TABLE || 'GameFeedback';
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!AIRTABLE_API_KEY) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const { token, gameId, message, starRanking } = req.body || {};
  
  if (!token || !gameId || !message || !starRanking) {
    return res.status(400).json({ message: 'Missing required fields: token, gameId, message, starRanking' });
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

    // Verify game exists and get game owner
    const gameRecord = await findGameById(gameId);
    if (!gameRecord) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const payload = {
      records: [
        {
          fields: {
            messageCreator: [userRecord.id], // Set to current user (person giving feedback)
            Game: [gameRecord.id],
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
          game: rec.fields?.Game?.[0] || '',
          message: rec.fields?.message || '',
          starRanking: rec.fields?.StarRanking || 0
        }
      : null;

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

async function findGameById(gameId) {
  const gameIdEscaped = safeEscapeFormulaString(gameId);
  const params = new URLSearchParams({
    filterByFormula: `RECORD_ID() = "${gameIdEscaped}"`,
    pageSize: '1',
  });

  const data = await airtableRequest(`${encodeURIComponent(AIRTABLE_GAMES_TABLE)}?${params.toString()}`, {
    method: 'GET',
  });
  const record = data.records && data.records[0];
  return record || null;
}

function normalizeLinkedIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

