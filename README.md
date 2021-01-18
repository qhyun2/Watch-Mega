# Watch-Mega
![Last Commit](https://img.shields.io/github/last-commit/qhyun2/Watch-Mega)

Upload any video file and watch it together in sync with your friends!

![Demo](assets/main.png)

## Docker Hub Repository
https://hub.docker.com/repository/docker/qhyun2/watch-mega

## Quick Start

### Build from source
```sh
git clone https://github.com/qhyun2/Watch-Mega.git
npm install
npm run docker:build
docker-compose up
```

### Run prebuild Docker container
```sh
docker pull qhyun2/watch-mega:latest
wget https://raw.githubusercontent.com/qhyun2/Watch-Mega/master/docker-compose.yml
wget https://raw.githubusercontent.com/qhyun2/Watch-Mega/master/.env.example
docker-compose up
```
