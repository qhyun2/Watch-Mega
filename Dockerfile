# dependencies
FROM node:15-alpine AS deps
# https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci

# build next
FROM node:alpine AS builder_next
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json .
COPY tsconfig.json .
COPY ./styles ./styles
COPY ./lib ./lib
COPY ./src ./src
COPY ./components ./components
COPY ./pages ./pages
RUN npm run next:build

# build typescript
FROM node:15-alpine AS builder_ts
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json .
COPY tsconfig.server.json .
COPY ./lib ./lib
COPY ./src ./src
RUN npm run ts:build

# production container
FROM node:15-alpine
WORKDIR /app
ENV NODE_ENV=production
# git needed by unknown npm library
# ffmpeg needed for encoding videos
RUN apk add git && apk add ffmpeg
COPY ./public ./public
# reduce installed packages to production-only.
COPY package.json .
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --production
COPY --from=builder_ts /app/dist ./
COPY --from=builder_next /app/.next ./.next

# run
EXPOSE 3000
CMD ["node", "src/index.js"]
