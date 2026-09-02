FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare npm@10.8.2 --activate
COPY package-lock.json package.json ./
COPY apps/*/package.json ./apps/
COPY libs/*/package.json ./libs/
RUN npm ci
COPY . .
WORKDIR /app/apps/backend/payment
RUN npm run build

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
