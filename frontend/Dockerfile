FROM node:24-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV CI=true

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install

COPY . .
RUN pnpm run build

FROM nginx:alpine

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
