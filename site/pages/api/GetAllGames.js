import { safeEscapeFormulaString } from './utils/security.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appg245A41MWc6Rej';
const AIRTABLE_USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const AIRTABLE_GAMES_TABLE = process.env.AIRTABLE_GAMES_TABLE || 'Games';
const AIRTABLE_POSTS_TABLE = process.env.AIRTABLE_POSTS_TABLE || 'Posts';
const AIRTABLE_PLAYS_TABLE = process.env.AIRTABLE_PLAYS_TABLE || 'Plays';
const AIRTABLE_FEEDBACK_TABLE = process.env.AIRTABLE_FEEDBACK_TABLE || 'GameFeedback';
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

// Rate limiting (more lenient for build processes)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP (increased for build)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!AIRTABLE_API_KEY) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // Rate limiting (bypass for build processes)
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || '';
  const isBuildProcess = userAgent.includes('vercel') || userAgent.includes('next') || req.query?.build === 'true';
  
  if (!isBuildProcess) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    if (!rateLimitMap.has(clientIP)) {
      rateLimitMap.set(clientIP, []);
    }
    
    const requests = rateLimitMap.get(clientIP);
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({ message: 'Rate limit exceeded. Please try again later.' });
    }
    
    recentRequests.push(now);
    rateLimitMap.set(clientIP, recentRequests);
  }

  try {
    // Input validation and sanitization
    const limitParam = Number.parseInt(String(req.query?.limit || '100'), 10);
    const hardLimit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 1000) : 100;
    const includeFullData = req.query?.full === 'true';
    
    // Validate limit parameter
    if (limitParam < 1 || limitParam > 1000) {
      return res.status(400).json({ message: 'Invalid limit parameter. Must be between 1 and 1000.' });
    }

    // Fetch all games that have a ShibaLink field, sorted by Last Updated (newest first)
    const allGames = await fetchAllGamesWithShibaLink({
      sort: [{ field: 'Last Updated', direction: 'desc' }],
      limit: hardLimit,
    });

    if (includeFullData) {
      // For full data, fetch all posts and plays in bulk, then organize by game
      // console.log('Fetching all posts and plays in bulk...');
      
      // Fetch all posts
      const allPosts = await fetchAllPosts();
      // console.log(`Fetched ${allPosts.length} posts`);
      
      // Fetch all plays
      const allPlays = await fetchAllPlays();
      // console.log(`Fetched ${allPlays.length} plays`);
      
      // Fetch all feedback
      console.log('📝 Fetching GameFeedback records...');
      const allFeedback = await fetchAllFeedback();
      console.log(`✅ Fetched ${allFeedback.length} GameFeedback records`);
      
      // Fetch all users for play data
      const allUsers = await fetchAllUsers();
      // console.log(`Fetched ${allUsers.length} users`);
      
      // Create lookup maps
      const postsByGameId = new Map();
      const playsByGameId = new Map();
      const feedbackByGame = new Map();
      const usersById = new Map();
      
      // Organize posts by game ID
      allPosts.forEach(post => {
        if (Array.isArray(post.fields?.Game)) {
          post.fields.Game.forEach(gameId => {
            if (!postsByGameId.has(gameId)) {
              postsByGameId.set(gameId, []);
            }
            postsByGameId.get(gameId).push(post);
          });
        }
      });
      
      // Organize plays by game ID
      allPlays.forEach(play => {
        if (Array.isArray(play.fields?.Game)) {
          play.fields.Game.forEach(gameId => {
            if (!playsByGameId.has(gameId)) {
              playsByGameId.set(gameId, []);
            }
            playsByGameId.get(gameId).push(play);
          });
        }
      });
      
      // Create user lookup map
      allUsers.forEach(user => {
        usersById.set(user.id, user);
      });
      
      // Organize feedback by game (using gameName + gameSlackId as key)
      allFeedback.forEach(feedbackRec => {
        const transformed = transformFeedback(feedbackRec);
        if (transformed.gameName && transformed.gameSlackId) {
          const gameKey = `${transformed.gameSlackId}|${transformed.gameName}`;
          if (!feedbackByGame.has(gameKey)) {
            feedbackByGame.set(gameKey, []);
          }
          feedbackByGame.get(gameKey).push(transformed);
        }
      });
      
      // Fetch profile data for all unique game creators
      const uniqueCreatorSlackIds = [...new Set(
        allGames
          .map(rec => {
            const fields = rec.fields || {};
            return Array.isArray(fields['slack id']) ? fields['slack id'][0] : fields['slack id'];
          })
          .filter(slackId => slackId && typeof slackId === 'string')
      )];

      // console.log(`Fetching profile data for ${uniqueCreatorSlackIds.length} unique creators`);

      // Fetch profile data for each creator
      const creatorsWithProfiles = await Promise.all(
        uniqueCreatorSlackIds.map(async (slackId) => {
          try {
            // During build time, we might need to call cachet directly
            const isBuildTime = req.query?.build === 'true' || process.env.NODE_ENV === 'production';
            let profileData = {};
            
            if (isBuildTime) {
              // During build, call cachet directly to avoid self-referencing API calls
              const response = await fetch(`https://cachet.dunkirk.sh/users/${encodeURIComponent(slackId)}`);
              profileData = await response.json().catch(() => ({}));
            } else {
              // During runtime, use our API
              const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://shiba.hackclub.com'}/api/slackProfiles?slackId=${encodeURIComponent(slackId)}`);
              profileData = await response.json().catch(() => ({}));
            }
            
            return {
              slackId,
              displayName: profileData.displayName || '',
              image: profileData.image || '',
            };
          } catch (error) {
            console.error(`[GetAllGames] Error fetching profile for ${slackId}:`, error);
            return {
              slackId,
              displayName: '',
              image: '',
            };
          }
        })
      );

      // Create lookup map for creator profiles
      const creatorProfiles = new Map();
      creatorsWithProfiles.forEach(creator => {
        creatorProfiles.set(creator.slackId, creator);
      });

      // Now process games with the bulk data
      const gamesWithFullData = allGames.map((rec) => {
        const fields = rec.fields || {};
        const slackId = Array.isArray(fields['slack id']) ? fields['slack id'][0] : fields['slack id'];
        const gameName = fields.Name || '';
        
        if (!slackId || !gameName) {
          return null;
        }

        // Get posts for this game
        const gamePosts = postsByGameId.get(rec.id) || [];
        const posts = gamePosts.map(transformPost);
        
        // Get plays for this game
        const gamePlays = playsByGameId.get(rec.id) || [];
        const plays = gamePlays.map(play => transformPlay(play, usersById));

        // Get creator profile data
        const creatorProfile = creatorProfiles.get(slackId) || { displayName: '', image: '' };

        // Get feedback for this game
        const gameKey = `${slackId}|${gameName}`;
        const feedback = feedbackByGame.get(gameKey) || [];

        return {
          id: rec.id,
          name: gameName,
          description: fields.Description || '',
          thumbnailUrl: Array.isArray(fields.Thumbnail) && fields.Thumbnail[0]?.url 
            ? fields.Thumbnail[0].url 
            : '',
          animatedBackground: Array.isArray(fields.AnimatedBackground) && fields.AnimatedBackground[0]?.url 
            ? fields.AnimatedBackground[0].url 
            : '',
          playableURL: fields?.['Playable URL'] || '',
          GitHubURL: fields?.GitHubURL || fields?.GithubURL || '',
          HackatimeProjects: Array.isArray(fields?.['Hackatime Projects'])
            ? fields['Hackatime Projects'].filter(Boolean).join(', ')
            : (typeof fields?.['Hackatime Projects'] === 'string' 
               ? fields['Hackatime Projects'] 
               : ''),
          HoursSpent: fields?.HoursSpent || 0,
          AveragePlaytestSeconds: fields?.AveragePlaytestSeconds || 0,
          AverageFunScore: fields?.AverageFunScore || 0,
          AverageArtScore: fields?.AverageArtScore || 0,
          AverageCreativityScore: fields?.AverageCreativityScore || 0,
          AverageAudioScore: fields?.AverageAudioScore || 0,
          AverageMoodScore: fields?.AverageMoodScore || 0,
          numberComplete: fields?.numberComplete || 0,
          Feedback: fields?.Feedback || '',
          lastUpdated: fields?.['Last Updated'] || rec.createdTime || '',
          posts,
          plays,
          playsCount: plays.length,
          feedback,
          feedbackCount: feedback.length,
          slackId,
          ShibaLink: fields.ShibaLink || '',
          creatorDisplayName: creatorProfile.displayName,
          creatorImage: creatorProfile.image,
        };
      });

      // Filter out null results and return
      const validGames = gamesWithFullData.filter(game => game !== null);
      
      // Log feedback statistics
      const gamesWithFeedback = validGames.filter(game => game.feedbackCount > 0);
      const totalFeedbackCount = validGames.reduce((sum, game) => sum + (game.feedbackCount || 0), 0);
      console.log(`📊 GameFeedback stats: ${gamesWithFeedback.length} games have feedback (${totalFeedbackCount} total feedback records)`);
      console.log(`✅ Returning ${validGames.length} games with full data`);
      
      return res.status(200).json(validGames);
    } else {
      // For basic data, fetch creator profiles and return the simple format
      const uniqueCreatorSlackIds = [...new Set(
        allGames
          .map(rec => {
            const fields = rec.fields || {};
            return Array.isArray(fields['slack id']) ? fields['slack id'][0] : fields['slack id'];
          })
          .filter(slackId => slackId && typeof slackId === 'string')
      )];

      // console.log(`Fetching profile data for ${uniqueCreatorSlackIds.length} unique creators (basic mode)`);

      // Fetch profile data for each creator
      const creatorsWithProfiles = await Promise.all(
        uniqueCreatorSlackIds.map(async (slackId) => {
          try {
            // During build time, we might need to call cachet directly
            const isBuildTime = req.query?.build === 'true' || process.env.NODE_ENV === 'production';
            let profileData = {};
            
            if (isBuildTime) {
              // During build, call cachet directly to avoid self-referencing API calls
              const response = await fetch(`https://cachet.dunkirk.sh/users/${encodeURIComponent(slackId)}`);
              profileData = await response.json().catch(() => ({}));
            } else {
              // During runtime, use our API
              const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://shiba.hackclub.com'}/api/slackProfiles?slackId=${encodeURIComponent(slackId)}`);
              profileData = await response.json().catch(() => ({}));
            }
            
            return {
              slackId,
              displayName: profileData.displayName || '',
              image: profileData.image || '',
            };
          } catch (error) {
            console.error(`[GetAllGames] Error fetching profile for ${slackId}:`, error);
            return {
              slackId,
              displayName: '',
              image: '',
            };
          }
        })
      );

      // Create lookup map for creator profiles
      const creatorProfiles = new Map();
      creatorsWithProfiles.forEach(creator => {
        creatorProfiles.set(creator.slackId, creator);
      });

      const games = allGames.map((rec) => {
        const fields = rec.fields || {};
        const slackId = Array.isArray(fields['slack id']) ? fields['slack id'][0] : fields['slack id'];
        const creatorProfile = creatorProfiles.get(slackId) || { displayName: '', image: '' };
        
        return {
          id: rec.id,
          Name: fields.Name || '',
          Description: fields.Description || '',
          Thumbnail: Array.isArray(fields.Thumbnail) && fields.Thumbnail[0]?.url ? fields.Thumbnail[0].url : '',
          AnimatedBackground: Array.isArray(fields.AnimatedBackground) && fields.AnimatedBackground[0]?.url ? fields.AnimatedBackground[0].url : '',
          'slack id': slackId || '',
          'Last Updated': fields['Last Updated'] || '',
          ShibaLink: fields.ShibaLink || '',
          creatorDisplayName: creatorProfile.displayName,
          creatorImage: creatorProfile.image,
        };
      });

      // Only return up to limit (safety)
      return res.status(200).json(games.slice(0, hardLimit));
    }
  } catch (error) {
    console.error('GetAllGames error:', error);
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

async function fetchAllGamesWithShibaLink({ sort, limit } = {}) {
  let allRecords = [];
  let offset;
  
  do {
    const params = new URLSearchParams();
    params.set('pageSize', '100');
    if (offset) params.set('offset', offset);
    
    // Filter to only include games that have a ShibaLink field
    params.set('filterByFormula', 'NOT({ShibaLink} = "")');
    
    if (Array.isArray(sort) && sort.length > 0) {
      sort.forEach((s, idx) => {
        if (s && s.field) {
          params.set(`sort[${idx}][field]`, s.field);
          params.set(`sort[${idx}][direction]`, s.direction === 'asc' ? 'asc' : 'desc');
        }
      });
    }
    
    const page = await airtableRequest(`${encodeURIComponent(AIRTABLE_GAMES_TABLE)}?${params.toString()}`, { method: 'GET' });
    allRecords = allRecords.concat(page?.records || []);
    
    if (typeof limit === 'number' && limit > 0 && allRecords.length >= limit) {
      return allRecords.slice(0, limit);
    }
    
    offset = page?.offset;
  } while (offset);
  
  return allRecords;
}

async function fetchPostsForGame(gameId) {
  // console.log('[GetAllGames] fetchPostsForGame gameId:', gameId);
  // First, try filtering server-side for performance and correctness
  const tryServerFilter = async () => {
    const params = new URLSearchParams();
    params.set('pageSize', '100');
    params.set('filterByFormula', `ARRAYJOIN({Game}) = "${safeEscapeFormulaString(gameId)}"`);
    params.set('sort[0][field]', 'Created At');
    params.set('sort[0][direction]', 'desc');
    const url = `${encodeURIComponent(AIRTABLE_POSTS_TABLE)}?${params.toString()}`;
    const page = await airtableRequest(url, { method: 'GET' });
    const records = Array.isArray(page?.records) ? page.records : [];
    // console.log(`[GetAllGames] server filter posts count for ${gameId}:`, records.length);
    return records;
  };

  let records = await tryServerFilter();
  if (!records || records.length === 0) {
    // Fallback: fetch pages and filter in code
    let allRecords = [];
    let offset;
    do {
      const params = new URLSearchParams();
      params.set('pageSize', '100');
      if (offset) params.set('offset', offset);
      const url = `${encodeURIComponent(AIRTABLE_POSTS_TABLE)}?${params.toString()}`;
      const page = await airtableRequest(url, { method: 'GET' });
      const pageRecords = (page?.records || []).filter((rec) => Array.isArray(rec.fields?.Game) && rec.fields.Game.includes(gameId));
      allRecords = allRecords.concat(pageRecords);
      offset = page?.offset;
    } while (offset);
    // console.log(`[GetAllGames] fallback client-filter posts count for ${gameId}:`, allRecords.length);
    records = allRecords;
  }

  // Sort newest first using "Created At" (fallback to createdTime)
  records.sort((a, b) => {
    const ad = new Date(a?.fields?.['Created At'] || a?.createdTime || 0).getTime();
    const bd = new Date(b?.fields?.['Created At'] || b?.createdTime || 0).getTime();
    return bd - ad;
  });

  return records.map((rec) => ({
    id: rec.id,
    postId: rec.fields?.PostID || '',
    content: rec.fields?.Content || '',
    createdAt: rec.fields?.['Created At'] || rec.createdTime || '',
    PlayLink: typeof rec.fields?.PlayLink === 'string' ? rec.fields.PlayLink : '',
    HoursSpent: rec.fields?.HoursSpent || 0,
    attachments: (() => {
      const airtableAttachments = Array.isArray(rec.fields?.Attachements)
        ? rec.fields.Attachements.map((a) => ({
            url: a?.url,
            type: a?.type,
            filename: a?.filename,
            id: a?.id,
            size: a?.size,
          })).filter((a) => a.url)
        : [];
      
      // Add S3 attachment links
      const attachmentLinks = rec.fields?.AttachementLinks || '';
      const s3Attachments = attachmentLinks
        ? attachmentLinks.split(',').map(link => link.trim()).filter(link => link).map(url => {
            const filename = url.split('/').pop() || 'attachment';
            let ext = '';
            
            // Try to get extension from filename first
            if (filename.includes('.')) {
              ext = filename.split('.').pop().toLowerCase();
            } 
            // If no extension in filename, try to get it from the URL path
            else {
              const urlPath = new URL(url).pathname;
              const pathParts = urlPath.split('.');
              if (pathParts.length > 1) {
                ext = pathParts[pathParts.length - 1].toLowerCase();
              }
            }
            
            // Determine content type from file extension
            let contentType = 'application/octet-stream';
            if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
              contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            } else if (['mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv', 'mpg', 'mpeg'].includes(ext)) {
              contentType = `video/${ext}`;
            } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) {
              contentType = `audio/${ext}`;
            }
            
            return {
              url: url,
              type: contentType,
              filename: filename.includes('.') ? filename : `attachment.${ext}`,
              id: `s3-${Date.now()}`,
              size: 0
            };
          })
        : [];
      
      return [...airtableAttachments, ...s3Attachments];
    })(),
    badges: Array.isArray(rec.fields?.Badges) ? rec.fields.Badges : [],
    postType: (rec.fields?.Timelapse && rec.fields?.['Link to Github Asset'] && rec.fields?.TimeSpentOnAsset) ? 'artlog' : 'devlog',
    timelapseVideoId: rec.fields?.Timelapse || '',
    githubImageLink: rec.fields?.['Link to Github Asset'] || '',
    timeScreenshotId: rec.fields?.TimeScreenshotFile || '',
    hoursSpent: rec.fields?.HoursSpent || 0,
    minutesSpent: 0,
    timeSpentOnAsset: rec.fields?.TimeSpentOnAsset || 0,
    GitChanges: (() => {
      // Parse GitChanges if it exists (it's stored as JSON string in Airtable)
      if (rec.fields?.GitChanges) {
        try {
          return typeof rec.fields.GitChanges === 'string' ? JSON.parse(rec.fields.GitChanges) : rec.fields.GitChanges;
        } catch (e) {
          return null;
        }
      }
      return null;
    })(),
  }));
}

async function fetchPlaysForGame(gameName, creatorSlackId) {
  // console.log('[GetAllGames] fetchPlaysForGame gameName:', gameName, 'creatorSlackId:', creatorSlackId);
  
  // First, we need to get the game's Airtable record ID to filter plays
  const gameRecord = await findGameBySlackIdAndName(creatorSlackId, gameName);
  if (!gameRecord) {
    // console.log('[GetAllGames] Game record not found for plays lookup');
    return [];
  }
  
  const gameId = gameRecord.id;
  // console.log('[GetAllGames] Found game ID for plays lookup:', gameId);
  
  // First, try filtering server-side for performance
  const tryServerFilter = async () => {
    // Filter by Game field which contains the game's Airtable record ID
    const formula = `{Game} = "${gameId}"`;
    const params = new URLSearchParams();
    params.set('pageSize', '100');
    params.set('filterByFormula', formula);
    params.set('sort[0][field]', 'Created At');
    params.set('sort[0][direction]', 'desc');
    
    const url = `${encodeURIComponent(AIRTABLE_PLAYS_TABLE)}?${params.toString()}`;
    const page = await airtableRequest(url, { method: 'GET' });
    const records = Array.isArray(page?.records) ? page.records : [];
    // console.log(`[GetAllGames] server filter plays count for game ${gameId}:`, records.length);
    return records;
  };

  let records = await tryServerFilter();
  if (!records || records.length === 0) {
    // Fallback: fetch all pages and filter in code
    let allRecords = [];
    let offset;
    do {
      const params = new URLSearchParams();
      params.set('pageSize', '100');
      if (offset) params.set('offset', offset);
      const url = `${encodeURIComponent(AIRTABLE_PLAYS_TABLE)}?${params.toString()}`;
      const page = await airtableRequest(url, { method: 'GET' });
      const pageRecords = (page?.records || []).filter((rec) => {
        const gameIds = Array.isArray(rec.fields?.Game) ? rec.fields.Game : [];
        return gameIds.includes(gameId);
      });
      allRecords = allRecords.concat(pageRecords);
      offset = page?.offset;
    } while (offset);
    // console.log(`[GetAllGames] fallback client-filter plays count for game ${gameId}:`, allRecords.length);
    records = allRecords;
  }

  // Extract unique player IDs and fetch their Slack IDs
  const uniquePlayerIds = [...new Set(
    records
      .map(rec => rec.fields?.Player?.[0])
      .filter(playerId => playerId && typeof playerId === 'string')
  )];

  // console.log(`[GetAllGames] unique player IDs for game ${gameId}:`, uniquePlayerIds.length);

  // Fetch player Slack IDs from Users table
  const playersWithSlackIds = await Promise.all(
    uniquePlayerIds.map(async (playerId) => {
      try {
        const params = new URLSearchParams();
        params.set('filterByFormula', `RECORD_ID() = "${safeEscapeFormulaString(playerId)}"`);
        params.set('pageSize', '1');
        
        const url = `${encodeURIComponent(AIRTABLE_USERS_TABLE)}?${params.toString()}`;
        const data = await airtableRequest(url, { method: 'GET' });
        const userRecord = data.records && data.records[0];
        
        if (userRecord) {
          return userRecord.fields?.['slack id'] || '';
        }
        return '';
      } catch (error) {
        console.error(`[GetAllGames] Error fetching user for player ID ${playerId}:`, error);
        return '';
      }
    })
  );

  const uniquePlayerSlackIds = playersWithSlackIds.filter(slackId => slackId && typeof slackId === 'string');
  // console.log(`[GetAllGames] unique player Slack IDs for game ${gameId}:`, uniquePlayerSlackIds.length);

  // Fetch profile data for each player
  const playersWithProfiles = await Promise.all(
    uniquePlayerSlackIds.map(async (slackId) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://shiba.hackclub.com'}/api/slackProfiles?slackId=${encodeURIComponent(slackId)}`);
        const profileData = await response.json().catch(() => ({}));
        
        return {
          slackId,
          displayName: profileData.displayName || '',
          image: profileData.image || '',
        };
      } catch (error) {
        console.error(`[GetAllGames] Error fetching profile for ${slackId}:`, error);
        return {
          slackId,
          displayName: '',
          image: '',
        };
      }
    })
  );

  return playersWithProfiles;
}

async function findGameBySlackIdAndName(slackId, gameName) {
  const slackIdEscaped = safeEscapeFormulaString(slackId);
  const gameNameEscaped = safeEscapeFormulaString(gameName);
  const formula = `AND({slack id} = "${slackIdEscaped}", {Name} = "${gameNameEscaped}")`;
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

async function fetchAllPosts() {
  let allRecords = [];
  let offset;
  
  do {
    const params = new URLSearchParams();
    params.set('pageSize', '100');
    if (offset) params.set('offset', offset);
    params.set('sort[0][field]', 'Created At');
    params.set('sort[0][direction]', 'desc');
    
    const page = await airtableRequest(`${encodeURIComponent(AIRTABLE_POSTS_TABLE)}?${params.toString()}`, { method: 'GET' });
    allRecords = allRecords.concat(page?.records || []);
    offset = page?.offset;
  } while (offset);
  
  return allRecords;
}

async function fetchAllPlays() {
  let allRecords = [];
  let offset;
  
  do {
    const params = new URLSearchParams();
    params.set('pageSize', '100');
    if (offset) params.set('offset', offset);
    params.set('sort[0][field]', 'Created At');
    params.set('sort[0][direction]', 'desc');
    
    const page = await airtableRequest(`${encodeURIComponent(AIRTABLE_PLAYS_TABLE)}?${params.toString()}`, { method: 'GET' });
    allRecords = allRecords.concat(page?.records || []);
    offset = page?.offset;
  } while (offset);
  
  return allRecords;
}

async function fetchAllUsers() {
  let allRecords = [];
  let offset;
  
  do {
    const params = new URLSearchParams();
    params.set('pageSize', '100');
    if (offset) params.set('offset', offset);
    
    const page = await airtableRequest(`${encodeURIComponent(AIRTABLE_USERS_TABLE)}?${params.toString()}`, { method: 'GET' });
    allRecords = allRecords.concat(page?.records || []);
    offset = page?.offset;
  } while (offset);
  
  return allRecords;
}

async function fetchAllFeedback() {
  let allRecords = [];
  let offset;
  
  do {
    const params = new URLSearchParams();
    params.set('pageSize', '100');
    if (offset) params.set('offset', offset);
    params.set('sort[0][field]', 'Created At');
    params.set('sort[0][direction]', 'desc');
    
    const page = await airtableRequest(`${encodeURIComponent(AIRTABLE_FEEDBACK_TABLE)}?${params.toString()}`, { method: 'GET' });
    allRecords = allRecords.concat(page?.records || []);
    offset = page?.offset;
  } while (offset);
  
  return allRecords;
}

function transformPost(rec) {
  return {
    id: rec.id,
    postId: rec.fields?.PostID || '',
    content: rec.fields?.Content || '',
    createdAt: rec.fields?.['Created At'] || rec.createdTime || '',
    PlayLink: typeof rec.fields?.PlayLink === 'string' ? rec.fields.PlayLink : '',
    HoursSpent: rec.fields?.HoursSpent || 0,
    attachments: (() => {
      const airtableAttachments = Array.isArray(rec.fields?.Attachements)
        ? rec.fields.Attachements.map((a) => ({
            url: a?.url,
            type: a?.type,
            filename: a?.filename,
            id: a?.id,
            size: a?.size,
          })).filter((a) => a.url)
        : [];
      
      // Add S3 attachment links
      const attachmentLinks = rec.fields?.AttachementLinks || '';
      const s3Attachments = attachmentLinks
        ? attachmentLinks.split(',').map(link => link.trim()).filter(link => link).map(url => {
            const filename = url.split('/').pop() || 'attachment';
            let ext = '';
            
            // Try to get extension from filename first
            if (filename.includes('.')) {
              ext = filename.split('.').pop().toLowerCase();
            } 
            // If no extension in filename, try to get it from the URL path
            else {
              const urlPath = new URL(url).pathname;
              const pathParts = urlPath.split('.');
              if (pathParts.length > 1) {
                ext = pathParts[pathParts.length - 1].toLowerCase();
              }
            }
            
            // Determine content type from file extension
            let contentType = 'application/octet-stream';
            if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
              contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            } else if (['mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv', 'mpg', 'mpeg'].includes(ext)) {
              contentType = `video/${ext}`;
            } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) {
              contentType = `audio/${ext}`;
            }
            
            return {
              url: url,
              type: contentType,
              filename: filename.includes('.') ? filename : `attachment.${ext}`,
              id: `s3-${Date.now()}`,
              size: 0
            };
          })
        : [];
      
      return [...airtableAttachments, ...s3Attachments];
    })(),
    badges: Array.isArray(rec.fields?.Badges) ? rec.fields.Badges : [],
    postType: (rec.fields?.Timelapse && rec.fields?.['Link to Github Asset'] && rec.fields?.TimeSpentOnAsset) ? 'artlog' : 'devlog',
    timelapseVideoId: rec.fields?.Timelapse || '',
    githubImageLink: rec.fields?.['Link to Github Asset'] || '',
    timeScreenshotId: rec.fields?.TimeScreenshotFile || '',
    hoursSpent: rec.fields?.HoursSpent || 0,
    minutesSpent: 0,
    timeSpentOnAsset: rec.fields?.TimeSpentOnAsset || 0,
    GitChanges: (() => {
      // Parse GitChanges if it exists (it's stored as JSON string in Airtable)
      if (rec.fields?.GitChanges) {
        try {
          return typeof rec.fields.GitChanges === 'string' ? JSON.parse(rec.fields.GitChanges) : rec.fields.GitChanges;
        } catch (e) {
          return null;
        }
      }
      return null;
    })(),
  };
}

function transformPlay(play, usersById) {
  const playerId = play.fields?.Player?.[0];
  const user = playerId ? usersById.get(playerId) : null;
  const slackId = user?.fields?.['slack id'] || '';
  
  return {
    slackId,
    displayName: '', // Will be fetched from cachet if needed
    image: '', // Will be fetched from cachet if needed
  };
}

function transformFeedback(rec) {
  // Handle messageCreatorSlack - it might be an array or string
  const messageCreatorSlackRaw = rec.fields?.messageCreatorSlack;
  const messageCreatorSlack = Array.isArray(messageCreatorSlackRaw) 
    ? messageCreatorSlackRaw[0] || '' 
    : (messageCreatorSlackRaw || '');
  
  // Handle gameName - it might be an array or string
  const gameNameRaw = rec.fields?.gameName;
  const gameName = Array.isArray(gameNameRaw) 
    ? gameNameRaw[0] || '' 
    : (gameNameRaw || '');
  
  // Handle gameSlackId - it might be an array or string
  const gameSlackIdRaw = rec.fields?.gameSlackId;
  const gameSlackId = Array.isArray(gameSlackIdRaw) 
    ? gameSlackIdRaw[0] || '' 
    : (gameSlackIdRaw || '');
  
  return {
    id: rec.id,
    messageCreatorSlack: messageCreatorSlack,
    StarRanking: rec.fields?.StarRanking || 0,
    message: rec.fields?.message || '',
    createdAt: rec.fields?.['Created At'] || rec.createdTime || '',
    messageCreatorBadges: Array.isArray(rec.fields?.messageCreatorBadges) ? rec.fields.messageCreatorBadges : [],
    gameName: gameName,
    gameSlackId: gameSlackId,
  };
}
