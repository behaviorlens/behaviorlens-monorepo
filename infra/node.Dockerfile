# Shared image for the Node parts (frontend, demo site, recorder build). Dependencies are installed at
# build time for Linux; docker-compose mounts the source on top for live reload.
FROM node:22-bookworm-slim

WORKDIR /repo

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY examples/demo-site/package.json examples/demo-site/package.json
COPY recorder/package.json recorder/package.json
RUN npm ci --ignore-scripts

COPY . .
