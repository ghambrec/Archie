FROM node:24-alpine

WORKDIR /app

# Corepack provides pnpm without installing it globally.
RUN corepack enable

# Keep dependency installation in a cacheable image layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV CI=true

EXPOSE 3000

# It is not the bust solution, but for me it enough for now.
CMD ["sh", "-c", "pnpm run migration:run && exec pnpm run start:dev"]
