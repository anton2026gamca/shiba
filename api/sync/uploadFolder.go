package sync

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"shiba-api/structs"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func UploadFolder(folderPath string, server structs.Server) error {
	fmt.Println("Syncing folder:", folderPath)

	// Check environment variables
	bucket := os.Getenv("R2_BUCKET")
	if bucket == "" {
		return fmt.Errorf("R2_BUCKET environment variable is not set")
	}
	
	fmt.Printf("Using bucket: %s\n", bucket)
	fmt.Printf("S3 Client configured: %v\n", server.S3Client != nil)

	uploader := manager.NewUploader(server.S3Client)

	err := filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		f, err := os.Open(path)
		if err != nil {
			fmt.Printf("Failed to open file %s: %v\n", path, err)
			return nil
		}
		defer f.Close()

		relPath, err := filepath.Rel(folderPath, path)
		if err != nil {
			fmt.Printf("Failed to get relative path for %s: %v\n", path, err)
			return nil
		}

		s3Key := filepath.ToSlash("games/" + filepath.Base(folderPath) + "/" + relPath)

		fmt.Printf("Attempting to upload %s to %s\n", path, s3Key)
		
		_, err = uploader.Upload(context.Background(), &s3.PutObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(s3Key),
			Body:   f,
		})
		if err != nil {
			fmt.Printf("Failed to upload %s to R2: %v\n", path, err)
			// Check if it's an authentication error
			if strings.Contains(err.Error(), "Unauthorized") || strings.Contains(err.Error(), "invalid or missing upload token") {
				fmt.Printf("Authentication error detected. Please check R2 credentials:\n")
				fmt.Printf("- R2_ACCESS_KEY_ID: %s\n", os.Getenv("R2_ACCESS_KEY_ID"))
				fmt.Printf("- R2_SECRET_ACCESS_KEY: %s\n", os.Getenv("R2_SECRET_ACCESS_KEY"))
				fmt.Printf("- R2_ENDPOINT: %s\n", os.Getenv("R2_ENDPOINT"))
				fmt.Printf("- R2_BUCKET: %s\n", os.Getenv("R2_BUCKET"))
			}
		} else {
			fmt.Printf("Uploaded %s to R2 as %s\n", path, s3Key)
		}
		return nil
	})

	if err != nil {
		return fmt.Errorf("error walking folder: %v", err)
	}

	fmt.Println("Sync complete for folder:", folderPath)
	return nil
}
