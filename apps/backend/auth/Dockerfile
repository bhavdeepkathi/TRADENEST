FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare npm@10.8.2 --activate

# Copy lock file and manifests first for better caching
COPY package-lock.json package.json ./
COPY apps/*/package.json ./apps/
COPY libs/*/package.json ./libs/

# Install all dependencies including dev dependencies for TypeScript compilation
RUN npm ci && npm install --save-dev @types/node@20 @types/express@4.17 @types/cors@2.8 @types/morgan@1.9 @types/express-rate-limit@5.1 @types/ioredis@5.0 helmet morgan express-rate-limit ioredis rate-limit-redis http-proxy-middleware zod pino

# Copy source code
COPY . .

# Build only the auth workspace
WORKDIR /app/apps/backend/auth
RUN npm run build

# ---- Runner --------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 4000
ENTRYPOINT ["dumb-init","--"]
CMD ["node","dist/main.js"]
