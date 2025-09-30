# CreatePlay Endpoint

## Overview
The `CreatePlay` endpoint creates a new record in the "Plays" table whenever a user starts playing a game. This tracks game play activity and links players to the games they play.

## Endpoint Details
- **URL**: `/api/CreatePlay`
- **Method**: `POST`
- **Authentication**: Requires valid user token

## Request Body
```json
{
  "token": "user_authentication_token",
  "gameName": "name_of_the_game"
}
```

## Response
```json
{
  "ok": true,
  "play": {
    "playId": "random_16_character_id",
    "gameId": "airtable_game_record_id",
    "playerId": "airtable_user_record_id",
    "recordId": "airtable_play_record_id"
  }
}
```

## Database Schema
The "Plays" table contains the following fields:
- **PlayID**: Random 16-character string (primary identifier)
- **Game**: Linked record to the Games table
- **Player**: Linked record to the Users table

## Integration Flow
1. User clicks "Tap to start game" in `PlayGameComponent`
2. Component calls `/api/CreatePlay` with user token and game name
3. API validates token and finds corresponding user and game records
4. Creates new play record with random PlayID
5. Returns play data to component

## Error Handling
- **400**: Missing required fields (token, gameName)
- **401**: Invalid token
- **404**: Game not found
- **500**: Server configuration error or unexpected error

## Usage in Components
The endpoint is automatically called when:
- Playing games from the Global Games feed
- Playing games from My Games posts
- Any other location where `PlayGameComponent` is used with valid token and gameName

## Environment Variables
Requires the following environment variables:
- `AIRTABLE_API_KEY`: Airtable API key
- `AIRTABLE_BASE_ID`: Airtable base ID (defaults to 'appg245A41MWc6Rej')
- `AIRTABLE_USERS_TABLE`: Users table name (defaults to 'Users')
- `AIRTABLE_GAMES_TABLE`: Games table name (defaults to 'Games')
- `AIRTABLE_PLAYS_TABLE`: Plays table name (defaults to 'Plays')
