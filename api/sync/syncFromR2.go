package sync

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"shiba-api/structs"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func SyncFromR2(server structs.Server) error {
	localFolder := "/games"
	bucket := os.Getenv("R2_BUCKET")
	client := server.S3Client

	// Check if we're in a debug env and not syncing if so

	if os.Getenv("DEBUG_ENV") == "true" {
		fmt.Println("Skipping R2 sync in debug environment")
		return nil
	}

	fmt.Println("Starting sync from R2 to local .games folder...")

	keys, err := ListR2Objects(bucket, "games/", client)
	if err != nil {
		return fmt.Errorf("failed to list R2 objects: %v", err)
	}

	// Group keys by game directory and validate each game has index.html
	validGames := make(map[string]bool)
	gameFiles := make(map[string][]string)
	
	for _, key := range keys {
		// Extract game ID from path like "games/gameId/file"
		parts := strings.Split(strings.TrimPrefix(key, "games/"), "/")
		if len(parts) < 2 {
			continue // Skip malformed paths
		}
		gameId := parts[0]
		fileName := parts[len(parts)-1]
		
		// Check if this game has an index.html file
		if fileName == "index.html" {
			validGames[gameId] = true
		}
		
		// Store all files for this game
		if gameFiles[gameId] == nil {
			gameFiles[gameId] = make([]string, 0)
		}
		gameFiles[gameId] = append(gameFiles[gameId], key)
	}

	fmt.Printf("Found %d games, %d have index.html and will be synced\n", len(gameFiles), len(validGames))

	// Only sync files from games that have index.html
	syncedCount := 0
	skippedCount := 0
	for gameId, files := range gameFiles {
		if !validGames[gameId] {
			fmt.Printf("Skipping game %s (no index.html found)\n", gameId)
			skippedCount++
			continue
		}

		for _, key := range files {
			localPath := filepath.Join(localFolder, strings.TrimPrefix(key, "games/"))
			if _, err := os.Stat(localPath); err == nil {
				continue
			}

			if err := os.MkdirAll(filepath.Dir(localPath), 0755); err != nil {
				fmt.Printf("Failed to create directory for %s: %v\n", localPath, err)
				continue
			}

			resp, err := client.GetObject(context.Background(), &s3.GetObjectInput{
				Bucket: aws.String(bucket),
				Key:    aws.String(key),
			})
			if err != nil {
				fmt.Printf("Failed to download %s: %v\n", key, err)
				continue
			}

			outFile, err := os.Create(localPath)
			if err != nil {
				resp.Body.Close()
				fmt.Printf("Failed to create local file %s: %v\n", localPath, err)
				continue
			}

			_, err = io.Copy(outFile, resp.Body)
			outFile.Close()
			resp.Body.Close()
			if err != nil {
				fmt.Printf("Failed to write file %s: %v\n", localPath, err)
				continue
			}

			fmt.Printf("Downloaded %s -> %s\n", key, localPath)
		}
		syncedCount++
	}

	fmt.Printf("Sync complete! Synced %d valid games, skipped %d invalid games\n", syncedCount, skippedCount)
	return nil
}

func ListR2Objects(bucket, prefix string, client *s3.Client) ([]string, error) {
	var keys []string
	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(prefix),
	}

	paginator := s3.NewListObjectsV2Paginator(client, input)
	for paginator.HasMorePages() {
		page, err := paginator.NextPage(context.Background())
		if err != nil {
			return nil, err
		}
		for _, obj := range page.Contents {
			keys = append(keys, *obj.Key)
		}
	}

	return keys, nil
}
