package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"shiba-api/structs"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/go-chi/chi/v5"
)

// responseWriter wraps http.ResponseWriter to track if headers have been written
type responseWriter struct {
	http.ResponseWriter
	written bool
}

func (rw *responseWriter) WriteHeader(statusCode int) {
	rw.written = true
	rw.ResponseWriter.WriteHeader(statusCode)
}

func (rw *responseWriter) Write(data []byte) (int, error) {
	rw.written = true
	return rw.ResponseWriter.Write(data)
}

func (rw *responseWriter) Written() bool {
	return rw.written
}

func ServeMiscFileHandler(srv *structs.Server) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Wrap the response writer to track if headers have been written
		rw := &responseWriter{ResponseWriter: w}
		
		fileId := chi.URLParam(r, "fileId")
		if fileId == "" {
			http.Error(rw, "File ID is required", http.StatusBadRequest)
			return
		}
		
		// Extract file extension from the URL path
		path := r.URL.Path
		ext := ""
		if idx := strings.LastIndex(path, "."); idx != -1 {
			ext = path[idx:] // Include the dot
		}

		// Get bucket name from environment
		bucket := os.Getenv("R2_BUCKET")
		if bucket == "" {
			bucket = "shiba-arcade" // fallback
		}

		// Construct the key with the file extension
		key := "misc-files/" + fileId + ext
		log.Printf("Looking for file with key: %s", key)

		// Get the object from R2
		log.Printf("Attempting to get file from R2: bucket=%s, key=%s", bucket, key)
		resp, err := srv.S3Client.GetObject(context.Background(), &s3.GetObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(key),
		})
		if err != nil {
			log.Printf("Failed to get file %s from R2: %v", fileId, err)
			http.Error(rw, "File not found", http.StatusNotFound)
			return
		}
		defer resp.Body.Close()

		// Set appropriate headers
		if resp.ContentType != nil {
			rw.Header().Set("Content-Type", *resp.ContentType)
		}
		if resp.ContentLength != nil {
			rw.Header().Set("Content-Length", fmt.Sprintf("%d", *resp.ContentLength))
		}
		rw.Header().Set("Cache-Control", "public, max-age=31536000") // Cache for 1 year

		// Stream the file content
		_, err = io.Copy(rw, resp.Body)
		if err != nil {
			log.Printf("Failed to stream file %s: %v", fileId, err)
			// Only send error response if headers haven't been written yet
			if !rw.Written() {
				http.Error(rw, "Failed to serve file", http.StatusInternalServerError)
			}
			return
		}
	}
}
