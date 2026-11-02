# Shared image for the Node apps (web, demo-site, recorder build). Dependencies are installed at
# build time for Linux; docker-compose mounts the source on top for live reload.
FROM node:22-bookworm-slim

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/demo-site/package.json apps/demo-site/package.json
COPY packages/recorder/package.json packages/recorder/package.json
RUN npm ci --ignore-scripts

COPY . .
