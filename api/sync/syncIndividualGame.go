package sync

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"shiba-api/structs"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func FetchGameFromR2(server *structs.Server, gameID string) error {
	localFolder := "./games"
	bucket := os.Getenv("R2_BUCKET")
	client := server.S3Client

	key := "games/" + gameID
	localPath := filepath.Join(localFolder, gameID)

	if _, err := os.Stat(localPath); err == nil {
		fmt.Printf("Game %s already exists locally at %s\n", gameID, localPath)
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(localPath), 0755); err != nil {
		return fmt.Errorf("failed to create directory for %s: %v", localPath, err)
	}

	resp, err := client.GetObject(context.Background(), &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to download %s from R2: %v", key, err)
	}
	defer resp.Body.Close()

	outFile, err := os.Create(localPath)
	if err != nil {
		return fmt.Errorf("failed to create local file %s: %v", localPath, err)
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, resp.Body)
	if err != nil {
		return fmt.Errorf("failed to write game %s to disk: %v", localPath, err)
	}

	fmt.Printf("Downloaded game %s -> %s\n", key, localPath)
	return nil
}
