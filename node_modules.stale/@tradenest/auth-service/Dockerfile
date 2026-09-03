FROM node:20-alpine AS builder
WORKDIR /app
# Enable corepack and prepare npm (bundled with Node 20)
RUN corepack enable && corepack prepare npm@10.8.2 --activate

# Copy lock file and manifests first for better caching
COPY package-lock.json package.json ./
COPY apps/*/package.json ./apps/
COPY libs/*/package.json ./libs/

# Install dependencies (frozen lockfile for reproducibility)
RUN npm ci

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
