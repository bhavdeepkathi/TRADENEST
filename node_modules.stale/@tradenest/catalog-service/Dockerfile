
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare npm@10.8.2 --activate

# Copy package manifests and workspace directories
COPY package-lock.json package.json ./
COPY apps ./apps
COPY libs ./libs

# Install dependencies using the complete workspace structure
RUN CYPRESS_INSTALL_BINARY=0 npm ci

# Copy source code
COPY . .

# Build shared libraries before the catalog service
WORKDIR /app/libs/common
RUN npm run build

WORKDIR /app/libs/auth
RUN npm run build

# Generate Prisma client and compile catalog
WORKDIR /app/apps/backend/catalog
RUN npm run build

# ---- Runner --------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/backend/catalog/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/libs/common/dist ./libs/common/dist
COPY --from=builder --chown=node:node /app/libs/auth/dist ./libs/auth/dist

USER node
EXPOSE 4002
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]