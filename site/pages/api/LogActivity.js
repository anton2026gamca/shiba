import { safeEscapeFormulaString } from './utils/security.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appg245A41MWc6Rej';
const AIRTABLE_USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const AIRTABLE_ACTIVITY_TABLE = 'User Activity';
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

export default async function handler(req, res) {
  console.log('📡 LogActivity API called:', { method: req.method, body: req.body });
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!AIRTABLE_API_KEY) {
    console.log('❌ Missing AIRTABLE_API_KEY');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const { token, activityType, timeSpent, component, sessionId, metadata, gameRecordId } = req.body || {};
  console.log('📊 Activity data:', { token: token ? 'present' : 'missing', activityType, timeSpent, component, sessionId });
  
  // Validate gameRecordId format if provided (should be a valid Airtable record ID)
  if (gameRecordId) {
    const airtableRecordIdRegex = /^rec[a-zA-Z0-9]{14}$/;
    if (!airtableRecordIdRegex.test(gameRecordId)) {
      console.log('❌ Invalid gameRecordId format:', gameRecordId);
      return res.status(400).json({ message: 'Invalid game record ID format' });
    }
  }
  
  // Get client IP - works for both localhost and production
  const getClientIP = (req) => {
    // For production (behind proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    // For production (direct connection)
    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return realIP;
    }
    
    // For localhost development
    const remoteAddress = req.connection?.remoteAddress || 
                         req.socket?.remoteAddress ||
                         req.connection?.socket?.remoteAddress;
    
    if (remoteAddress) {
      // Clean up IPv6 localhost
      if (remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1') {
        return '127.0.0.1';
      }
      return remoteAddress;
    }
    
    return 'unknown';
  };
  
  const clientIP = getClientIP(req);
  console.log('🌐 Client IP detected:', clientIP);
  
  // Allow activity logging even without token (for anonymous users)
  let userRecord = null;
  if (token && token !== 'null' && token !== null) {
    try {
      userRecord = await findUserByToken(token);
      console.log('👤 User found:', userRecord ? 'Yes' : 'No');
    } catch (error) {
      console.log('⚠️ User lookup failed, proceeding without user:', error.message);
    }
  } else {
    console.log('👤 No valid token provided, logging as anonymous user');
  }
  
  if (typeof timeSpent !== 'number' || timeSpent < 0) {
    return res.status(400).json({ message: 'timeSpent must be a non-negative number' });
  }

  try {

    // Create activity record - always create new records
    const enhancedMetadata = {
      ...metadata,
      ip: clientIP,
      timestamp: new Date().toISOString()
    };
    
    const fields = {
      'Activity Type': activityType,
      'Time Spent (seconds)': timeSpent,
      'Component': component || 'SocialStartScreen',
      'Session ID': sessionId || '',
      'Timestamp': new Date().toISOString(),
      'Metadata': JSON.stringify(enhancedMetadata)
    };
    
    // Only add User field if we have a valid user record
    if (userRecord) {
      fields['User'] = [userRecord.id];
    }
    
    // Add Game field if we have a game record ID
    if (gameRecordId) {
      fields['Game'] = [gameRecordId];
    }
    
    const activityRecord = {
      fields: fields
    };

    console.log('📝 Creating Airtable record:', activityRecord);
    
    const response = await airtableRequest(`${encodeURIComponent(AIRTABLE_ACTIVITY_TABLE)}`, {
      method: 'POST',
      body: JSON.stringify(activityRecord),
    });
    
    console.log('✅ Airtable response:', response);

    return res.status(200).json({ 
      ok: true, 
      activityId: response.id,
      message: 'Activity logged successfully' 
    });
  } catch (error) {
    console.error('LogActivity error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
}

async function airtableRequest(path, options = {}) {
  const url = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${path}`;
  const headers = {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  console.log('🌐 Making Airtable request:', { url, method: options.method });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log('📡 Airtable response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Airtable API error:', { status: response.status, statusText: response.statusText, errorText });
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Airtable success:', result);
  return result;
}

async function findUserByToken(token) {
  const formula = `{Token} = "${safeEscapeFormulaString(token)}"`;
  const params = new URLSearchParams({ filterByFormula: formula });
  
  console.log('🔍 Looking up user by token:', { formula, params: params.toString() });
  
  const response = await airtableRequest(`${encodeURIComponent(AIRTABLE_USERS_TABLE)}?${params.toString()}`);
  
  console.log('👤 User lookup result:', { recordCount: response.records?.length || 0 });
  
  if (response.records && response.records.length > 0) {
    console.log('✅ User found:', response.records[0].id);
    return response.records[0];
  }
  
  console.log('❌ No user found for token');
  return null;
}