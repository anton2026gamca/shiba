# Activity Tracking System

This system tracks user activity time within the SocialStartScreen component and logs it to Airtable for analytics.

## Components

### 1. API Endpoint (`/api/LogActivity`)
- **Purpose**: Logs user activity to Airtable
- **Method**: POST
- **Required Fields**: `token`, `activityType`, `timeSpent`
- **Optional Fields**: `component`, `metadata`

### 2. useActivityTracker Hook
- **Purpose**: Tracks user activity in React components
- **Features**:
  - Automatic activity detection (mouse, keyboard, scroll, touch)
  - Session time tracking
  - Inactivity timeout detection
  - Specific activity logging

### 3. Activity Utils
- **Purpose**: Utility functions for time formatting and activity management
- **Functions**: Time formatting, session calculation, debouncing, throttling

## Usage

### Basic Implementation
```javascript
import { useActivityTracker } from './useActivityTracker';

function MyComponent({ token }) {
  const { isActive, totalTimeSpent, logSpecificActivity } = useActivityTracker(
    'MyComponent', 
    token, 
    {
      activityThreshold: 30, // Log sessions of 30+ seconds
      heartbeatInterval: 10000, // Check activity every 10 seconds
      inactivityTimeout: 60000 // Consider inactive after 1 minute
    }
  );

  const handleButtonClick = () => {
    logSpecificActivity('button_click', { buttonId: 'submit' });
  };

  return (
    <div>
      {isActive && <div>User is active</div>}
      <button onClick={handleButtonClick}>Click me</button>
    </div>
  );
}
```

### Activity Types Tracked in SocialStartScreen

1. **Session**: General user activity time
2. **Tab Switch**: Switching between Games/Posts tabs
3. **Load More**: Loading additional posts
4. **Game Play Start**: Starting to play a game
5. **Game Fullscreen Start**: Game entering fullscreen mode
6. **Creator Profile Click**: Clicking on creator profile

### Configuration Options

```javascript
const options = {
  activityThreshold: 30,    // Minimum seconds to log activity
  heartbeatInterval: 10000, // How often to check for activity (ms)
  inactivityTimeout: 60000 // Time before considering inactive (ms)
};
```

## Data Structure

### Airtable Fields
- **User**: Linked to Users table
- **Activity Type**: Type of activity (session, tab_switch, etc.)
- **Time Spent (seconds)**: Duration of activity
- **Component**: Component name (SocialStartScreen)
- **Timestamp**: When activity occurred
- **Metadata**: JSON string with additional data

### Metadata Examples
```javascript
// Tab switch metadata
{
  fromTab: "Games",
  toTab: "Posts",
  postsCount: 25
}

// Game play metadata
{
  gameId: "abc123",
  gameName: "My Game",
  playId: "play456"
}
```

## Development Features

### Activity Indicator
In development mode, an activity indicator shows:
- 🟢 Active / ⚪ Inactive status
- Total time spent in minutes

### Console Logging
Activity events are logged to console for debugging:
```
Activity logged: 45s in SocialStartScreen
```

## Privacy Considerations

- Only tracks activity when user has a valid token
- Respects user privacy by not tracking personal data
- Activity data is aggregated and anonymized
- No sensitive user information is logged

## Performance

- Uses throttled event listeners to prevent excessive API calls
- Batches activity logging to reduce server load
- Automatic cleanup on component unmount
- Minimal impact on component performance

## Testing

Run tests with:
```bash
npm test useActivityTracker
```

The test suite covers:
- Hook initialization
- Activity tracking
- API calls
- Inactivity detection
- Token validation
