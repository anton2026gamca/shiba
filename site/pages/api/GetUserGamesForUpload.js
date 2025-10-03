import { safeEscapeFormulaString } from './utils/security.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appg245A41MWc6Rej';
const AIRTABLE_USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const AIRTABLE_GAMES_TABLE = process.env.AIRTABLE_GAMES_TABLE || 'Games';
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!AIRTABLE_API_KEY) {
    console.error('[GetUserGamesForUpload] Missing AIRTABLE_API_KEY');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    const { token } = req.body || {};
    if (!token) return res.status(200).json([]);

    const gameRecords = await fetchAllGamesForOwner(token);
    
    if (!gameRecords || gameRecords.length === 0) {
      return res.status(200).json([]);
    }

    // Return only the minimal data needed for the upload modal
    const games = gameRecords.map(rec => ({
      id: rec.id,
      name: rec.fields?.Name || '',
      thumbnailUrl: Array.isArray(rec.fields?.Thumbnail) && rec.fields.Thumbnail[0]?.url 
        ? rec.fields.Thumbnail[0].url 
        : '',
      animatedBackground: Array.isArray(rec.fields?.AnimatedBackground) && rec.fields.AnimatedBackground[0]?.url 
        ? rec.fields.AnimatedBackground[0].url 
        : '',
      GitHubURL: rec.fields?.GitHubURL || rec.fields?.GithubURL || '',
    }));

    return res.status(200).json(games);
  } catch (error) {
    console.error('GetUserGamesForUpload error:', error);
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

async function fetchAllGamesForOwner(ownerToken) {
  const ownerTokenEscaped = safeEscapeFormulaString(ownerToken);
  const params = new URLSearchParams({
    filterByFormula: `{ownerToken} = "${ownerTokenEscaped}"`,
    pageSize: '100',
  });

  const data = await airtableRequest(`${encodeURIComponent(AIRTABLE_GAMES_TABLE)}?${params.toString()}`, {
    method: 'GET',
  });
  
  if (data.records && data.records.length > 0) {
    return data.records;
  }
  
  return [];
}
