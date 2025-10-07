import { useEffect } from "react";
import ShibaFunnelChart from "../components/ShibaFunnelChart";
import SignupCountComponent from "../components/SignupCountComponent";
import HoursPerDayChart from "../components/HoursPerDayChart";
import ReviewBacklogChart from "../components/ReviewBacklogChart";
import DaysActiveChart from "../components/DaysActiveChart";
import DailyActiveUsersChart from "../components/DailyActiveUsersChart";
import ActivityChart from "../components/ActivityChart";

export default function AnalyticsPage({ funnelData, signupData, hoursPerDayData, reviewBacklogData, daysActiveData, dailyActiveUsersData, activityData }) {
  useEffect(() => {
    // Disable the animated background for this page
    const animatedBackground = document.querySelector('[style*="backgroundImage"]');
    if (animatedBackground) {
      animatedBackground.style.opacity = '0';
    }
    
    // Cleanup function to restore background when leaving page
    return () => {
      if (animatedBackground) {
        animatedBackground.style.opacity = '0.2';
      }
    };
  }, []);

  return (
    <div style={{ 
      backgroundColor: 'white', 
      display: "flex", 
      justifyContent: "center", 
      backgroundImage: 'none', 
      width: '100vw', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: "100%", 
        maxWidth: "800px", 
        paddingBottom: 32 
      }}>
        <p style={{marginTop: 0, fontWeight: 600, marginBottom: 16}}>Analytics for Shiba</p>
        <p>In the spirit of open source, we're publicly sharing our analytics dashboard for Shiba. This is the data the team uses to see how the program is doing and to make decisions on what to add to the platform.</p>
        
        <ShibaFunnelChart {...funnelData} />
        
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginTop: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <SignupCountComponent {...signupData} />
          </div>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <ReviewBacklogChart data={reviewBacklogData} />
          </div>
        </div>
        
        {/* <HoursPerDayChart data={hoursPerDayData} /> */}
        
        <DaysActiveChart data={daysActiveData} />
        
        <DailyActiveUsersChart data={dailyActiveUsersData} />
        
        <ActivityChart data={activityData} />
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appg245A41MWc6Rej';
  const AIRTABLE_USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
  const AIRTABLE_POSTS_TABLE = process.env.AIRTABLE_POSTS_TABLE || 'Posts';
  const AIRTABLE_ACTIVITY_TABLE = process.env.AIRTABLE_ACTIVITY_TABLE || 'User Activity';
  const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

  console.log('🔍 Analytics Debug Info:');
  console.log('  AIRTABLE_API_KEY:', AIRTABLE_API_KEY ? `${AIRTABLE_API_KEY.substring(0, 8)}...` : 'MISSING');
  console.log('  AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID);
  console.log('  AIRTABLE_USERS_TABLE:', AIRTABLE_USERS_TABLE);
  console.log('  AIRTABLE_POSTS_TABLE:', AIRTABLE_POSTS_TABLE);
  console.log('  AIRTABLE_ACTIVITY_TABLE:', AIRTABLE_ACTIVITY_TABLE);

  // Import Airtable for review backlog data
  const Airtable = require('airtable');
  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

  if (!AIRTABLE_API_KEY) {
    console.error('Missing AIRTABLE_API_KEY');
    return {
      props: {
        funnelData: { signedUp: 0, onboarded: 0, connectedHackatime: 0, slack: 0, logged10Hours: 0, logged20Hours: 0, logged30Hours: 0, logged40Hours: 0, logged50Hours: 0, logged60Hours: 0, logged70Hours: 0, logged80Hours: 0, logged90Hours: 0, logged100Hours: 0 },
        signupData: { totalSignups: 0, hackClubCommunity: 0, referrals: 0 },
        hoursPerDayData: [],
        reviewBacklogData: [],
        daysActiveData: [],
        dailyActiveUsersData: [],
        gameTimeAnalytics: {
          totalSessions: 0,
          totalGameTimeMinutes: 0,
          averageSessionLengthMinutes: 0,
          sessionsByGame: {},
          dailyGameTimeArray: [],
          hourlyGameTimeArray: []
        },
        activityData: [],
      },
      // Cache for 1 hour (3600 seconds) in production, 60 seconds in development
      revalidate: process.env.NODE_ENV === 'production' ? 3600 : 60
    };
  }

  try {
    // Helper function to make Airtable requests
    async function airtableRequest(path, options = {}) {
      const url = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${path}`;
      console.log(`🌐 Making Airtable request to: ${path}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      console.log(`📡 Response status: ${response.status} for ${path}`);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error(`❌ Airtable error for ${path}:`, {
          status: response.status,
          statusText: response.statusText,
          body: text
        });
        throw new Error(`Airtable error ${response.status}: ${text}`);
      }
      return response.json();
    }

    // Helper function to fetch all records from a table
    async function fetchAllAirtableRecords(tableName) {
      console.log(`📊 Fetching records from table: ${tableName}`);
      let allRecords = [];
      let offset;
      let pageCount = 0;
      
      do {
        pageCount++;
        console.log(`📄 Fetching page ${pageCount} for ${tableName}${offset ? ` (offset: ${offset})` : ''}`);
        
        const params = new URLSearchParams();
        params.set('pageSize', '100');
        if (offset) params.set('offset', offset);
        
        const page = await airtableRequest(`${encodeURIComponent(tableName)}?${params.toString()}`, { method: 'GET' });
        allRecords = allRecords.concat(page?.records || []);
        offset = page?.offset;
        
        console.log(`✅ Page ${pageCount} complete: ${page?.records?.length || 0} records (total so far: ${allRecords.length})`);
      } while (offset);
      
      console.log(`🎯 Total records fetched from ${tableName}: ${allRecords.length}`);
      return allRecords;
    }

    // Fetch all users, posts, and activity data in parallel
    console.log('🚀 Starting parallel fetch of all tables...');
    
    let allUsers = [], allPosts = [], allActivity = [];
    
    try {
      console.log(`📊 Fetching ${AIRTABLE_USERS_TABLE}...`);
      allUsers = await fetchAllAirtableRecords(AIRTABLE_USERS_TABLE);
      console.log(`✅ ${AIRTABLE_USERS_TABLE}: ${allUsers.length} records`);
    } catch (error) {
      console.error(`❌ Error fetching ${AIRTABLE_USERS_TABLE}:`, error.message);
    }
    
    try {
      console.log(`📊 Fetching ${AIRTABLE_POSTS_TABLE}...`);
      allPosts = await fetchAllAirtableRecords(AIRTABLE_POSTS_TABLE);
      console.log(`✅ ${AIRTABLE_POSTS_TABLE}: ${allPosts.length} records`);
    } catch (error) {
      console.error(`❌ Error fetching ${AIRTABLE_POSTS_TABLE}:`, error.message);
    }
    
    // TEMPORARILY DISABLED - causing build timeouts
    // try {
    //   console.log(`📊 Fetching ${AIRTABLE_ACTIVITY_TABLE}...`);
    //   allActivity = await fetchAllAirtableRecords(AIRTABLE_ACTIVITY_TABLE);
    //   console.log(`✅ ${AIRTABLE_ACTIVITY_TABLE}: ${allActivity.length} records`);
    // } catch (error) {
    //   console.error(`❌ Error fetching ${AIRTABLE_ACTIVITY_TABLE}:`, error.message);
    // }
    console.log('⚠️  User Activity fetch temporarily disabled to prevent build timeout');
    
    console.log('🎯 Table fetch summary:');
    console.log(`  Users: ${allUsers.length} records`);
    console.log(`  Posts: ${allPosts.length} records`);
    console.log(`  Activity: ${allActivity.length} records`);

    // Process daysActive data from all users
    const dailyHours = {};
    const dailyActiveUsers = {};
    
    allUsers.forEach(user => {
      const daysActive = user.fields?.['daysActive'];
      
      if (daysActive && typeof daysActive === 'string' && daysActive.trim() !== '') {
        // Parse the daysActive string format: "M/D/YY: hours, M/D/YY: hours"
        const entries = daysActive.split(',').map(entry => entry.trim());
        
        entries.forEach(entry => {
          const [dateStr, hoursStr] = entry.split(':').map(s => s.trim());
          if (dateStr && hoursStr) {
            try {
              const hours = parseFloat(hoursStr);
              if (!isNaN(hours) && hours > 0) {
                // Convert M/D/YY to YYYY-MM-DD format
                const [month, day, year] = dateStr.split('/').map(n => parseInt(n));
                const fullYear = 2000 + year; // Convert YY to YYYY
                const date = new Date(fullYear, month - 1, day);
                const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                
                // Sum hours for daysActive chart
                if (!dailyHours[dateKey]) {
                  dailyHours[dateKey] = 0;
                }
                dailyHours[dateKey] += hours;
                
                // Count users for daily active users chart
                if (!dailyActiveUsers[dateKey]) {
                  dailyActiveUsers[dateKey] = 0;
                }
                dailyActiveUsers[dateKey] += 1; // Count each user once per day
              }
            } catch (error) {
              console.warn(`Failed to parse daysActive entry: ${entry}`, error);
            }
          }
        });
      }
    });

    // Convert to array format and sort by date
    const daysActiveArray = Object.entries(dailyHours)
      .map(([date, hours]) => ({
        date,
        hours: Math.round(hours * 100) / 100 // Round to 2 decimal places
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const dailyActiveUsersArray = Object.entries(dailyActiveUsers)
      .map(([date, userCount]) => ({
        date,
        userCount
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Process funnel data
    const signedUp = allUsers.length;
    const onboarded = allUsers.filter(user => user.fields?.hasOnboarded === true).length;
    const connectedHackatime = allUsers.filter(user => {
      const hackatimeProjects = user.fields?.['Hackatime Projects'];
      return hackatimeProjects && hackatimeProjects.length > 0;
    }).length;
    const slack = allUsers.filter(user => {
      const slackId = user.fields?.['slack id'];
      return typeof slackId === 'string' && slackId.trim() !== '';
    }).length;

    const logged10Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 10;
    }).length;
    const logged20Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 20;
    }).length;
    const logged30Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 30;
    }).length;
    const logged40Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 40;
    }).length;
    const logged50Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 50;
    }).length;
    const logged60Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 60;
    }).length;
    const logged70Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 70;
    }).length;
    const logged80Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 80;
    }).length;
    const logged90Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 90;
    }).length;
    const logged100Hours = allUsers.filter(user => {
      const hoursSpent = user.fields?.['Hours Spent'];
      return typeof hoursSpent === 'number' && hoursSpent >= 100;
    }).length;

    // Process signup data
    let hackClubCommunity = 0;
    let referrals = 0;
    
    allUsers.forEach(user => {
      const referredBy = user.fields?.ReferredBy;
      
      if (!referredBy || referredBy === '' || referredBy === null || referredBy === undefined) {
        hackClubCommunity++;
      } else {
        referrals++;
      }
    });

    // Process hours per day data
    const startDate = new Date('2025-05-18T00:00:00Z');
    const filteredPosts = allPosts.filter(post => {
      const createdAt = post.fields?.['Created At'];
      if (!createdAt) return false;
      
      const postDate = new Date(createdAt);
      return postDate >= startDate;
    });

    const hoursPerDay = {};
    
    filteredPosts.forEach(post => {
      const createdAt = post.fields?.['Created At'];
      const hoursSpent = post.fields?.['HoursSpent'];
      
      if (createdAt && typeof hoursSpent === 'number' && hoursSpent > 0) {
        const date = new Date(createdAt);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!hoursPerDay[dateKey]) {
          hoursPerDay[dateKey] = 0;
        }
        hoursPerDay[dateKey] += hoursSpent;
      }
    });

    const hoursPerDayArray = Object.entries(hoursPerDay)
      .map(([date, hours]) => ({
        date,
        hours: Math.round(hours * 100) / 100 // Round to 2 decimal places
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const funnelData = {
      signedUp,
      onboarded,
      slack,
      connectedHackatime,
      logged10Hours,
      logged20Hours,
      logged30Hours,
      logged40Hours,
      logged50Hours,
      logged60Hours,
      logged70Hours,
      logged80Hours,
      logged90Hours,
      logged100Hours
    };

    const signupData = {
      totalSignups: signedUp,
      hackClubCommunity,
      referrals
    };

    // Fetch review backlog data
    console.log('📋 Fetching review backlog data...');
    const reviewStatuses = {
      'Needs Review': 0,
      'Needs Rereview': 0,
      'Reviewed': 0
    };

    let allReviewRecords = [];

    try {
      // Fetch all records from Active YSWS Record table (100 at a time)
      console.log('🔍 Attempting to fetch from "Active YSWS Record" table...');
      await base('Active YSWS Record')
        .select({
          pageSize: 100,
          fields: ['ReviewStatus']
        })
        .eachPage((records, fetchNextPage) => {
          console.log(`📄 Review records page: ${records.length} records`);
          allReviewRecords = allReviewRecords.concat(records);
          fetchNextPage();
        });
      console.log(`✅ Review backlog fetch complete: ${allReviewRecords.length} records`);
    } catch (reviewError) {
      console.error('❌ Error fetching review backlog:', reviewError);
      console.log('🔄 Continuing without review backlog data...');
    }

    // Count ReviewStatus values
    allReviewRecords.forEach(record => {
      const status = record.get('ReviewStatus');
      if (status && reviewStatuses.hasOwnProperty(status)) {
        reviewStatuses[status]++;
      }
    });

    // Format data for chart
    const reviewBacklogData = [
      {
        label: 'Needs Review',
        value: reviewStatuses['Needs Review'],
        color: '#ff6b6b'
      },
      {
        label: 'Needs Rereview',
        value: reviewStatuses['Needs Rereview'],
        color: '#ffa726'
      },
      {
        label: 'Reviewed',
        value: reviewStatuses['Reviewed'],
        color: '#66bb6a'
      }
    ];

    // Process game time analytics from activity data
    const processGameTimeAnalytics = (activityRecords) => {
      // Filter for heartbeat activities
      const heartbeats = activityRecords.filter(record => {
        const activityType = record.fields?.['Activity Type'];
        return activityType === 'heartbeat';
      });


      // Group heartbeats by IP and session
      const sessionsByIP = {};
      
      heartbeats.forEach(heartbeat => {
        const metadata = JSON.parse(heartbeat.fields?.Metadata || '{}');
        const clientIP = metadata.clientIP || 'unknown';
        const timestamp = new Date(heartbeat.fields?.Timestamp || heartbeat.createdTime);
        const sessionId = heartbeat.fields?.['Session ID'];
        const gameId = heartbeat.fields?.Game?.[0]; // Game record ID
        
        if (!sessionsByIP[clientIP]) {
          sessionsByIP[clientIP] = {};
        }
        
        if (!sessionsByIP[clientIP][sessionId]) {
          sessionsByIP[clientIP][sessionId] = {
            sessionId,
            ip: clientIP,
            gameId,
            heartbeats: [],
            startTime: timestamp,
            endTime: timestamp
          };
        }
        
        sessionsByIP[clientIP][sessionId].heartbeats.push(timestamp);
        sessionsByIP[clientIP][sessionId].endTime = timestamp;
      });

      // Calculate session durations and game time
      const gameTimeData = {
        totalSessions: 0,
        totalGameTime: 0,
        averageSessionLength: 0,
        sessionsByGame: {},
        dailyGameTime: {},
        hourlyGameTime: {}
      };

      Object.values(sessionsByIP).forEach(ipSessions => {
        Object.values(ipSessions).forEach(session => {
          const sessionDuration = (session.endTime - session.startTime) / 1000; // seconds
          const gameTime = sessionDuration; // Each heartbeat represents 15 seconds of activity
          
          gameTimeData.totalSessions++;
          gameTimeData.totalGameTime += gameTime;
          
          // Track by game
          if (session.gameId) {
            if (!gameTimeData.sessionsByGame[session.gameId]) {
              gameTimeData.sessionsByGame[session.gameId] = {
                totalTime: 0,
                sessionCount: 0
              };
            }
            gameTimeData.sessionsByGame[session.gameId].totalTime += gameTime;
            gameTimeData.sessionsByGame[session.gameId].sessionCount++;
          }
          
          // Track by day
          const dayKey = session.startTime.toISOString().split('T')[0];
          if (!gameTimeData.dailyGameTime[dayKey]) {
            gameTimeData.dailyGameTime[dayKey] = 0;
          }
          gameTimeData.dailyGameTime[dayKey] += gameTime;
          
          // Track by hour
          const hourKey = session.startTime.getHours();
          if (!gameTimeData.hourlyGameTime[hourKey]) {
            gameTimeData.hourlyGameTime[hourKey] = 0;
          }
          gameTimeData.hourlyGameTime[hourKey] += gameTime;
        });
      });

      // Calculate averages
      if (gameTimeData.totalSessions > 0) {
        gameTimeData.averageSessionLength = gameTimeData.totalGameTime / gameTimeData.totalSessions;
      }

      // Convert to arrays for charts
      const dailyGameTimeArray = Object.entries(gameTimeData.dailyGameTime)
        .map(([date, time]) => ({
          date,
          time: Math.round(time / 60) // Convert to minutes
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const hourlyGameTimeArray = Object.entries(gameTimeData.hourlyGameTime)
        .map(([hour, time]) => ({
          hour: parseInt(hour),
          time: Math.round(time / 60) // Convert to minutes
        }))
        .sort((a, b) => a.hour - b.hour);

      return {
        ...gameTimeData,
        dailyGameTimeArray,
        hourlyGameTimeArray,
        totalGameTimeMinutes: Math.round(gameTimeData.totalGameTime / 60),
        averageSessionLengthMinutes: Math.round(gameTimeData.averageSessionLength / 60)
      };
    };

    const gameTimeAnalytics = processGameTimeAnalytics(allActivity);

    // Process activity data for the new chart
    const processActivityData = (activityRecords) => {
      console.log('📊 Processing activity data for chart...');
      
      const activityByDate = {};
      
      activityRecords.forEach(record => {
        const timestamp = new Date(record.fields?.Timestamp || record.createdTime);
        const dateKey = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD format
        const activityType = record.fields?.['Activity Type'];
        
        if (!activityByDate[dateKey]) {
          activityByDate[dateKey] = {
            date: dateKey,
            heartbeats: 0,
            tabSwitches: 0,
            gamePlays: 0
          };
        }
        
        switch (activityType) {
          case 'heartbeat':
            activityByDate[dateKey].heartbeats++;
            break;
          case 'tab_switch':
          case 'tabswitch':
          case 'tab switch':
          case 'tab_switch_start':
          case 'tabswitch_start':
            activityByDate[dateKey].tabSwitches++;
            break;
          case 'game_play':
          case 'gameplay':
          case 'game play':
          case 'game_play_start':
          case 'gameplay_start':
          case 'game_play_end':
          case 'gameplay_end':
          case 'play_game':
          case 'playgame':
            activityByDate[dateKey].gamePlays++;
            break;
          default:
            // Log unknown activity types for debugging
            if (activityType && !activityType.includes('heartbeat')) {
              console.log(`Unknown activity type: ${activityType}`);
            }
        }
      });
      
      // Convert to array and sort by date
      const activityArray = Object.values(activityByDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      console.log(`✅ Processed ${activityArray.length} days of activity data`);
      console.log(`  Total heartbeats: ${activityArray.reduce((sum, d) => sum + d.heartbeats, 0)}`);
      console.log(`  Total tab switches: ${activityArray.reduce((sum, d) => sum + d.tabSwitches, 0)}`);
      console.log(`  Total game plays: ${activityArray.reduce((sum, d) => sum + d.gamePlays, 0)}`);
      
      return activityArray;
    };

    const activityData = processActivityData(allActivity);

    return {
      props: {
        funnelData,
        signupData,
        hoursPerDayData: hoursPerDayArray,
        reviewBacklogData,
        daysActiveData: daysActiveArray,
        dailyActiveUsersData: dailyActiveUsersArray,
        activityData,
      },
      // Cache for 1 hour (3600 seconds) in production, 60 seconds in development
      revalidate: process.env.NODE_ENV === 'production' ? 3600 : 60
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    
    // Return fallback data if API fails
    return {
      props: {
        funnelData: {
          signedUp: 1200,
          onboarded: 850,
          connectedHackatime: 600,
          logged10Hours: 400,
          logged20Hours: 250,
          logged30Hours: 150,
          logged40Hours: 100,
          logged50Hours: 80,
          logged60Hours: 60,
          logged70Hours: 45,
          logged80Hours: 35,
          logged90Hours: 25,
          logged100Hours: 20
        },
        signupData: {
          totalSignups: 1200,
          hackClubCommunity: 800,
          referrals: 400
        },
        hoursPerDayData: [],
        reviewBacklogData: [],
        daysActiveData: [],
        dailyActiveUsersData: [],
        gameTimeAnalytics: {
          totalSessions: 0,
          totalGameTimeMinutes: 0,
          averageSessionLengthMinutes: 0,
          sessionsByGame: {},
          dailyGameTimeArray: [],
          hourlyGameTimeArray: []
        },
        activityData: [],
      },
      // Cache for 1 hour (3600 seconds) in production, 60 seconds in development
      revalidate: process.env.NODE_ENV === 'production' ? 3600 : 60
    };
  }
}
