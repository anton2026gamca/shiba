#!/bin/bash

# Script to run the API with persistent volume for local testing
# Make sure to create a .env file with your environment variables

echo "🐳 Building Shiba API with persistent storage..."

# Create volume if it doesn't exist
docker volume create games-data

# Build and run with volume
docker build -t shiba-api .

echo "🚀 Starting Shiba API with persistent /games volume..."
echo "📁 Games data will persist across container restarts"
echo "🔗 API will be available at http://localhost:3001"
echo "❤️  Health check: http://localhost:3001/health"

docker run -d \
  --name shiba-api \
  -p 3001:3001 \
  -v games-data:/games \
  --env-file .env \
  --restart unless-stopped \
  shiba-api

echo "✅ Container started! Check status with: docker ps"
echo "📝 View logs with: docker logs -f shiba-api"
echo "🛑 Stop with: docker stop shiba-api && docker rm shiba-api"
