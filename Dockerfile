# dependencies
FROM node:alpine AS deps
# https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# build
FROM node:alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run next:build
RUN npm run ts:build

# production container
FROM node:12-alpine
WORKDIR /app
ENV NODE_ENV=production
# git needed by unknown npm library
RUN apk add git
# ffmpeg needed for encoding videos
RUN apk add ffmpeg
COPY --from=builder /app/public ./public
# reduce installed packages to production-only.
COPY package.json .
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --production
COPY --from=builder /app/dist ./
COPY --from=builder /app/.next ./.next

# run
EXPOSE 3000
CMD ["node", "./index.js"]
