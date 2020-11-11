
# build
FROM node:12 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci --quiet
COPY ./src ./src
RUN npm run build

# copy to fresh container
FROM node:12
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --quiet --only=production
COPY --from=builder /usr/src/app/dist ./
COPY ./src/public ./public

# run
EXPOSE 3000
CMD ["node", "./server.js"]
