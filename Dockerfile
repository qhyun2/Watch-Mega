
# build
FROM node:12 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci --quiet
COPY ./src ./src
RUN npm run build

# copy to fresh container
FROM node:12-alpine
ENV NODE_ENV=production
# git needed by unknown npm library
RUN apk add git
WORKDIR /app
COPY package*.json ./
RUN npm install --quiet --only=production
COPY --from=builder /usr/src/app/dist ./
COPY ./src/public ./public
COPY ./src/views ./views

# run
EXPOSE 3000
CMD ["node", "./server.js"]
