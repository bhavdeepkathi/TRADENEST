FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare npm@10.8.2 --activate

COPY package-lock.json package.json ./
COPY apps ./apps
COPY libs ./libs

RUN npm ci


# Copy source code
COPY . .

# Build shared libraries in dependency order
WORKDIR /app/libs/common
RUN npm run build

WORKDIR /app/libs/auth
RUN npm run build


# Make compiled shared libraries available to the gateway
RUN mkdir -p /app/apps/backend/gateway/node_modules/@tradenest && \
    cp -r /app/libs/common /app/apps/backend/gateway/node_modules/@tradenest/common && \
    cp -r /app/libs/auth /app/apps/backend/gateway/node_modules/@tradenest/auth

# Build only the gateway workspace (libs are pre-built)
WORKDIR /app/apps/backend/gateway
RUN npm run build

# ---- Runner --------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/backend/gateway/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/libs/common/dist ./libs/common/dist
COPY --from=builder --chown=node:node /app/libs/auth/dist ./libs/auth/dist
USER node
EXPOSE 4000
ENTRYPOINT ["dumb-init","--"]
CMD ["node","dist/main.js"]
