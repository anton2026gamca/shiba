# Build stage
FROM node:18-alpine AS builder
WORKDIR /src
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:18-alpine
RUN apk --no-cache add ca-certificates curl
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Create app directory
WORKDIR /hackatimeSync

# Copy node modules and source code
COPY --from=builder /src/node_modules ./node_modules
COPY . .

# Set proper ownership
RUN chown -R appuser:appgroup /hackatimeSync

# Create directory for logs/data if needed
RUN mkdir -p /data && chown appuser:appgroup /data

# Declare volume for persistent storage
VOLUME ["/data"]

EXPOSE 3001
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "index.js"]
