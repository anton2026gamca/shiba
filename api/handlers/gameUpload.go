package handlers

import (
	"archive/zip"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"shiba-api/structs"
	"shiba-api/sync"

	"github.com/google/uuid"
)

func validateZipFilePath(filePath, destDir string) bool {
	cleanPath := filepath.Clean(filePath)

	absDestDir, err := filepath.Abs(destDir)
	if err != nil {
		return false
	}

	absFilePath, err := filepath.Abs(filepath.Join(destDir, cleanPath))
	if err != nil {
		return false
	}

	return strings.HasPrefix(absFilePath, absDestDir+string(os.PathSeparator))
}

func GameUploadHandler(srv *structs.Server) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if err := r.ParseMultipartForm(100 << 20); err != nil { // 100 MB max
			http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
			return
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "Missing file field 'file': "+err.Error(), http.StatusBadRequest)
			return
		}
		defer file.Close()

		tmpFile, err := os.CreateTemp("", "game-upload-*.zip")
		if err != nil {
			http.Error(w, "Failed to create temporary file: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer os.Remove(tmpFile.Name())

		if _, err := io.Copy(tmpFile, file); err != nil {
			tmpFile.Close()
			http.Error(w, "Failed to write uploaded file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if err := tmpFile.Close(); err != nil {
			http.Error(w, "Failed to close temp file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		zr, err := zip.OpenReader(tmpFile.Name())
		if err != nil {
			http.Error(w, "Uploaded file is not a valid zip: "+err.Error(), http.StatusBadRequest)
			return
		}
		defer zr.Close()

		id, err := uuid.NewV7()
		if err != nil {
			log.Fatal(err)
		}

		destDir := filepath.Join("./games/" + id.String() + "/")
		if err := os.MkdirAll(destDir, 0755); err != nil {
			http.Error(w, "Failed to create game directory: "+err.Error(), http.StatusInternalServerError)
			return
		}

		rootPrefix := getSingleRootPrefix(zr.File)

		for _, f := range zr.File {
			// Skip macOS junk
			if strings.HasPrefix(f.Name, "__MACOSX/") {
				continue
			}

			name := f.Name
			if rootPrefix != "" && strings.HasPrefix(name, rootPrefix) {
				name = strings.TrimPrefix(name, rootPrefix)
				if name == "" {
					continue
				}
			}

			if !validateZipFilePath(name, destDir) {
				http.Error(w, "Invalid file path in zip: "+f.Name, http.StatusBadRequest)
				return
			}

			fpath := filepath.Join(destDir, name)

			if f.FileInfo().IsDir() {
				os.MkdirAll(fpath, f.Mode())
				continue
			}

			if err := os.MkdirAll(filepath.Dir(fpath), 0755); err != nil {
				http.Error(w, "Failed to create directory: "+err.Error(), http.StatusInternalServerError)
				return
			}

			rc, err := f.Open()
			if err != nil {
				http.Error(w, "Failed to open file in zip: "+err.Error(), http.StatusInternalServerError)
				return
			}
			defer rc.Close()

			outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
			if err != nil {
				http.Error(w, "Failed to create file: "+err.Error(), http.StatusInternalServerError)
				return
			}

			if _, err := io.Copy(outFile, rc); err != nil {
				outFile.Close()
				http.Error(w, "Failed to write file: "+err.Error(), http.StatusInternalServerError)
				return
			}
			outFile.Close()
		}

		log.Printf("User successfully uploaded a new game snapshot!")

		go func(folder string, srv *structs.Server) {
			if err := sync.UploadFolder(folder, *srv); err != nil {
				log.Printf("Failed to sync folder %s to R2: %v", folder, err)
			}
		}(destDir, srv)

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		resp := struct {
			Ok      bool   `json:"ok"`
			GameID  string `json:"gameId"`
			PlayURL string `json:"playUrl"`
		}{
			Ok:      true,
			GameID:  id.String(),
			PlayURL: "/play/" + id.String() + "/",
		}

		responseBytes, _ := json.Marshal(resp)
		response := string(responseBytes)
		if _, err := w.Write([]byte(response)); err != nil {
			log.Printf("Failed to write response: %v", err)
			http.Error(w, "Failed to write response", http.StatusInternalServerError)
			return
		}
	}
}

func getSingleRootPrefix(files []*zip.File) string {
	var root string
	for _, f := range files {
		if strings.HasPrefix(f.Name, "__MACOSX/") {
			continue
		}
		parts := strings.SplitN(f.Name, "/", 2)
		if len(parts) < 2 {
			return ""
		}
		if root == "" {
			root = parts[0]
		} else if parts[0] != root {
			return ""
		}
	}
	if root != "" {
		return root + "/"
	}
	return ""
}
