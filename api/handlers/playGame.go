package handlers

import (
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
)

func MainGamePlayHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		gameId := chi.URLParam(r, "gameId")
		if gameId == "" {
			http.Error(w, "Game ID is required", http.StatusBadRequest)
			return
		}

		r2PublicURL := os.Getenv("R2_PUBLIC_URL")
		if r2PublicURL == "" {
			r2PublicURL = "https://juice.hackclub-assets.com"
		}

		// Build R2 URL
		r2URL := fmt.Sprintf("%s/games/%s/index.html", r2PublicURL, url.PathEscape(gameId))
		
		log.Printf("Proxying game %s from R2: %s", gameId, r2URL)
		
		// Fetch from R2
		resp, err := http.Get(r2URL)
		if err != nil {
			log.Printf("Failed to fetch game from R2: %v", err)
			http.Error(w, "Failed to load game", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Printf("R2 returned non-200 status: %d", resp.StatusCode)
			http.Error(w, "Game not found", resp.StatusCode)
			return
		}

		// Set correct content type for HTML
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.WriteHeader(http.StatusOK)
		
		// Copy response body
		if _, err := io.Copy(w, resp.Body); err != nil {
			log.Printf("Failed to copy response body: %v", err)
		}
	}
}

func AssetsPlayHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		gameId := chi.URLParam(r, "gameId")
		if gameId == "" {
			http.Error(w, "Game ID is required", http.StatusBadRequest)
			return
		}

		r2PublicURL := os.Getenv("R2_PUBLIC_URL")
		if r2PublicURL == "" {
			r2PublicURL = "https://juice.hackclub-assets.com"
		}

		assetPath := chi.URLParam(r, "*")
		var r2URL string
		var isIndexHTML bool
		
		if assetPath == "" {
			r2URL = fmt.Sprintf("%s/games/%s/index.html", r2PublicURL, url.PathEscape(gameId))
			isIndexHTML = true
		} else {
			r2URL = fmt.Sprintf("%s/games/%s/%s", r2PublicURL, url.PathEscape(gameId), assetPath)
			isIndexHTML = false
		}
		
		log.Printf("Proxying asset from R2: %s (isIndexHTML: %v)", r2URL, isIndexHTML)
		
		// Fetch from R2 and proxy with correct content-type
		resp, err := http.Get(r2URL)
		if err != nil {
			log.Printf("Failed to fetch asset from R2: %v", err)
			http.Error(w, "Failed to load asset", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			http.Error(w, "Asset not found", resp.StatusCode)
			return
		}

		// Detect content type from file extension
		var contentType string
		if isIndexHTML {
			// Force text/html for index.html
			contentType = "text/html; charset=utf-8"
		} else {
			contentType = mime.TypeByExtension(filepath.Ext(assetPath))
			if contentType == "" {
				// Fall back to R2's content type or octet-stream
				contentType = resp.Header.Get("Content-Type")
				if contentType == "" || contentType == "application/octet-stream" {
					// Try to guess based on extension
					ext := strings.ToLower(filepath.Ext(assetPath))
					switch ext {
					case ".js":
						contentType = "application/javascript"
					case ".css":
						contentType = "text/css"
					case ".png":
						contentType = "image/png"
					case ".jpg", ".jpeg":
						contentType = "image/jpeg"
					case ".gif":
						contentType = "image/gif"
					case ".svg":
						contentType = "image/svg+xml"
					case ".wasm":
						contentType = "application/wasm"
					case ".json":
						contentType = "application/json"
					case ".html":
						contentType = "text/html; charset=utf-8"
					default:
						contentType = "application/octet-stream"
					}
				}
			}
		}

		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.WriteHeader(http.StatusOK)
		
		// Copy response body
		if _, err := io.Copy(w, resp.Body); err != nil {
			log.Printf("Failed to copy asset response: %v", err)
		}
	}
}
