FROM node:24-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 4200

CMD ["sh", "-c", "pnpm start --host 0.0.0.0"]





# --- PROD Server (port in docker-compose umstellen auf nginx 80) --- #
# --- auch keine volumes mehr dann nötig?

	# FROM node:24-alpine AS build

	# RUN corepack enable && corepack prepare pnpm@latest --activate

	# ENV CI=true

	# WORKDIR /app

	# COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
	# RUN pnpm install

	# COPY . .
	# RUN pnpm run build

	# FROM nginx:alpine

	# COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

	# EXPOSE 80
