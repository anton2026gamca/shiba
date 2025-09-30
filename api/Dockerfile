# Build stage
FROM golang:1.24 AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./main.go

# Runtime stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates curl
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup
COPY --from=builder /src/server /server
RUN chown appuser:appgroup /server
# Create games directory with proper permissions
RUN mkdir -p /games && chown appuser:appgroup /games
# Declare volume for persistent storage
VOLUME ["/games"]

# Set timeout environment variables for large file uploads
ENV NGINX_CLIENT_MAX_BODY_SIZE=100M
ENV NGINX_PROXY_READ_TIMEOUT=300s
ENV NGINX_PROXY_CONNECT_TIMEOUT=300s
ENV NGINX_PROXY_SEND_TIMEOUT=300s

EXPOSE 3001
USER appuser
HEALTHCHECK CMD exit 0
CMD ["/server"]
