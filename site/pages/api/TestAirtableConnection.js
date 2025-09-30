import { safeEscapeFormulaString } from './utils/security.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appg245A41MWc6Rej';
const AIRTABLE_USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const AIRTABLE_ACTIVITY_TABLE = 'User Activity';
const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

export default async function handler(req, res) {
  console.log('🧪 Testing Airtable connection...');
  
  if (!AIRTABLE_API_KEY) {
    return res.status(500).json({ 
      error: 'Missing AIRTABLE_API_KEY',
      message: 'Server configuration error' 
    });
  }

  try {
    // Test 1: Check if we can access the base
    console.log('📊 Testing base access...');
    const baseUrl = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}`;
    const baseResponse = await fetch(baseUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      }
    });
    
    console.log('Base response status:', baseResponse.status);
    
    if (!baseResponse.ok) {
      const errorText = await baseResponse.text();
      return res.status(500).json({
        error: 'Cannot access Airtable base',
        status: baseResponse.status,
        details: errorText
      });
    }

    // Test 2: Check if Users table exists
    console.log('👥 Testing Users table access...');
    const usersUrl = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_USERS_TABLE)}?maxRecords=1`;
    const usersResponse = await fetch(usersUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      }
    });
    
    console.log('Users table response status:', usersResponse.status);
    
    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      return res.status(500).json({
        error: 'Cannot access Users table',
        status: usersResponse.status,
        details: errorText,
        tableName: AIRTABLE_USERS_TABLE
      });
    }

    // Test 3: Check if User Activity table exists
    console.log('📈 Testing User Activity table access...');
    const activityUrl = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_ACTIVITY_TABLE)}?maxRecords=1`;
    const activityResponse = await fetch(activityUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      }
    });
    
    console.log('User Activity table response status:', activityResponse.status);
    
    if (!activityResponse.ok) {
      const errorText = await activityResponse.text();
      return res.status(500).json({
        error: 'Cannot access User Activity table',
        status: activityResponse.status,
        details: errorText,
        tableName: AIRTABLE_ACTIVITY_TABLE,
        suggestion: 'Make sure the "User Activity" table exists in your Airtable base'
      });
    }

    // Test 4: Try to create a test record
    console.log('📝 Testing record creation...');
    const testRecord = {
      fields: {
        'Activity Type': 'test',
        'Time Spent (seconds)': 1,
        'Component': 'TestComponent',
        'Session ID': 'test_session_123',
        'Timestamp': new Date().toISOString(),
        'Metadata': '{"test": true}'
      }
    };

    const createResponse = await fetch(`${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_ACTIVITY_TABLE)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRecord)
    });

    console.log('Create record response status:', createResponse.status);
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return res.status(500).json({
        error: 'Cannot create test record',
        status: createResponse.status,
        details: errorText,
        testRecord
      });
    }

    const createdRecord = await createResponse.json();
    console.log('✅ Test record created:', createdRecord);

    return res.status(200).json({
      success: true,
      message: 'All Airtable tests passed!',
      tests: {
        baseAccess: '✅',
        usersTable: '✅',
        activityTable: '✅',
        recordCreation: '✅'
      },
      createdRecord: createdRecord.id
    });

  } catch (error) {
    console.error('❌ Airtable test failed:', error);
    return res.status(500).json({
      error: 'Airtable test failed',
      message: error.message,
      stack: error.stack
    });
  }
}
