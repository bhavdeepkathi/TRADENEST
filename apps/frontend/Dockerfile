# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies - cache layer
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy source
COPY . .

# Build with production env
ENV NODE_ENV=production
RUN npm run build

# Production stage - minimal nginx
FROM nginx:alpine AS runner

# Install security updates and dumb-init
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nginx && adduser -S nginx -u 1001 -G nginx

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets with correct ownership
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Security: drop capabilities
USER nginx

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]