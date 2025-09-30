import { safeEscapeFormulaString } from './utils/security.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appg245A41MWc6Rej';
const AIRTABLE_USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!AIRTABLE_API_KEY) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const { token } = req.body || {};
  
  if (!token) {
    return res.status(400).json({ message: 'Missing required field: token' });
  }

  try {
    // Find user by token
    const userRecord = await findUserByToken(token);
    if (!userRecord) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get FollowingGames from the user record
    const followingGames = normalizeLinkedIds(userRecord.fields?.FollowingGames || []);

    return res.status(200).json({ 
      ok: true, 
      followingGames: followingGames
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getMyPaws error:', error);
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
  
  // Try different field names like in other APIs
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

function normalizeLinkedIds(value) {
  if (Array.isArray(value)) {
    return value;
  } else if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

