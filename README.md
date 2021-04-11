# Watch-Mega

![Last Commit](https://img.shields.io/github/last-commit/qhyun2/Watch-Mega)
![Build Status](https://img.shields.io/docker/cloud/build/qhyun2/watch-mega)

Watch videos in sync with your friends!

![Demo](public/demo.png)

## Docker Hub Repository

https://hub.docker.com/repository/docker/qhyun2/watch-mega

## Quick Start

### Run as docker container

```sh
docker pull qhyun2/watch-mega:latest
wget https://raw.githubusercontent.com/qhyun2/Watch-Mega/master/docker-compose.yml
wget https://raw.githubusercontent.com/qhyun2/Watch-Mega/master/.env.example
mv .env.example .docker.env
docker-compose up
```
