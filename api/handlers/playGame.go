package handlers

import (
	"fmt"
	"html"
	"log"
	"net/http"
	"net/url"
	"os"

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
		
		log.Printf("Loading game %s from R2 via iframe: %s", gameId, r2URL)
		
		// Return HTML with iframe that loads the game from R2
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		
		htmlContent := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game: %s</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%%;
            height: 100%%;
            overflow: hidden;
        }
        iframe {
            border: none;
            width: 100%%;
            height: 100%%;
            display: block;
        }
    </style>
</head>
<body>
    <iframe src="%s" allowfullscreen allow="gamepad; microphone; camera; autoplay"></iframe>
</body>
</html>`, html.EscapeString(gameId), html.EscapeString(r2URL))
		
		w.Write([]byte(htmlContent))
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
		
		if assetPath == "" {
			r2URL = fmt.Sprintf("%s/games/%s/index.html", r2PublicURL, url.PathEscape(gameId))
		} else {
			r2URL = fmt.Sprintf("%s/games/%s/%s", r2PublicURL, url.PathEscape(gameId), assetPath)
		}
		
		log.Printf("Redirecting asset to R2: %s", r2URL)
		
		// Assets should still redirect directly (for scripts, images, etc.)
		http.Redirect(w, r, r2URL, http.StatusTemporaryRedirect)
	}
}
