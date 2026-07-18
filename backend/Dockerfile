FROM node:24-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

# TODO: laeft im test modus (start:dev) fuer entwicklungsphase
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && pnpm run start:dev""]
