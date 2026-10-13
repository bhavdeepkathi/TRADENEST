
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare npm@10.8.2 --activate

# Copy the complete workspace structure
COPY package-lock.json package.json ./
COPY apps ./apps
COPY libs ./libs

# Install workspace dependencies without downloading Cypress
RUN CYPRESS_INSTALL_BINARY=0 npm ci

# Copy remaining source and configuration files
COPY . .

# Build shared libraries before dependent services
WORKDIR /app/libs/common
RUN npm run build

WORKDIR /app/libs/auth
RUN npm run build

# Generate the payment Prisma client and compile the service
WORKDIR /app/apps/backend/payment
RUN npm run build

# ---- Runner --------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init openssl

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/backend/payment/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/libs/common/dist ./libs/common/dist
COPY --from=builder --chown=node:node /app/libs/auth/dist ./libs/auth/dist

USER node
EXPOSE 4004
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]