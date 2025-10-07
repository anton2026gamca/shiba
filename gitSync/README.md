# Git Sync - Airtable Posts & Git Changes Analyzer

This service continuously fetches posts from Airtable, clones their GitHub repositories, analyzes commit history between posts, and updates Airtable with structured git changes data.

## Setup

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file based on `env.example`:
```bash
cp env.example .env
```

3. Update the `.env` file with your Airtable credentials:
   - `AIRTABLE_API_KEY`: Your Airtable API key
   - `AIRTABLE_BASE_ID`: Your Airtable base ID

### Run as Server (Continuous Sync)

```bash
python server.py
```

This starts a Flask server on port 3002 that:
- Continuously syncs posts every 60 seconds
- Provides health check endpoint at `/health`
- Provides sync status at `/api/sync-status`
- Allows manual sync trigger via POST to `/api/sync`

### Run Once (Manual)

```bash
python main.py
```

## Docker Deployment

### Build and Run with Docker Compose (Recommended)

```bash
# Create .env file first
cp env.example .env
# Edit .env with your credentials

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### Build and Run with Docker

```bash
docker build -t gitsync .
docker run -d \
  -p 3002:3002 \
  -e AIRTABLE_API_KEY=your_key \
  -e AIRTABLE_BASE_ID=your_base_id \
  --name gitsync \
  gitsync
```

### Deploy to Coolify

1. Push code to Git repository
2. In Coolify, create a new application
3. Select your Git repository
4. Set environment variables:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
5. Coolify will automatically detect the Dockerfile and deploy
6. Health checks run on `/health` endpoint

The script will:
- Fetch all posts from Airtable that have GitHubUrl and GitHubUsername
- Group posts by GitHub repository
- Clone each repository locally (temporarily)
- Analyze git commit history between consecutive posts
- For the first post in a repo, include all commits up to that post's creation time
- For subsequent posts, include commits between the previous post and current post
- Extract file changes (old and new versions) for each commit
- Update Airtable's GitChanges field with structured JSON data
- Save the complete data to `posts_data.json`

## Environment Variables

- `AIRTABLE_API_KEY` (required): Your Airtable API key
- `AIRTABLE_BASE_ID` (required): Your Airtable base ID

## Output

The script outputs:
1. Console output showing progress for each repository and post
2. JSON file `posts_data.json` with grouped data by repository
3. Updates Airtable's GitChanges field with structured commit data

### GitChanges Data Structure

The GitChanges field contains a compact JSON object with file stats and GitHub links:
```json
{
  "commits": [
    {
      "hash": "abc123f",
      "author": "John Doe",
      "date": "2025-09-01 10:30:00 -0400",
      "message": "Add new feature",
      "github_link": "https://github.com/owner/repo/commit/abc123f...",
      "files": [
        {
          "filepath": "src/app.js",
          "additions": 15,
          "deletions": 3,
          "is_binary": false,
          "github_link": "https://github.com/owner/repo/commit/abc123f#diff-..."
        }
      ],
      "stats": {
        "files_changed": 2,
        "total_additions": 25,
        "total_deletions": 8
      }
    }
  ],
  "summary": {
    "total_commits": 3,
    "total_files_changed": 5,
    "total_additions": 150,
    "total_deletions": 30
  }
}
```

This compact format:
- Stores only file paths, addition/deletion counts, and GitHub links
- Stays well under Airtable's 100,000 character limit
- Provides direct links to view changes on GitHub
- Includes summary statistics for quick reference

## API Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `GET /api/sync-status` - Get current sync status
- `POST /api/sync` - Manually trigger a sync

## Requirements

- Python 3.11+
- Git installed and available in PATH
- Internet connection to clone repositories and access Airtable API
- Port 3002 available (configurable via PORT env var)

## How It Works

1. **Continuous Loop**: Server runs sync every 60 seconds
2. **Filters Posts**: Only processes posts where `GitHubUrl`, `GitHubUsername` are filled and `TimeSpentOnAsset` is empty
3. **Clones Repos**: Uses blobless clone (`--filter=blob:none`) for speed
4. **Analyzes Commits**: Gets commits between post timestamps
5. **Updates Airtable**: Stores git changes data in `GitChanges` field
6. **Error Handling**: Retries on errors with 30s delay

