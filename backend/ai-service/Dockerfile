FROM  python:3.14-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD curl -f "http://localhost:5001/health" || exit 1

CMD ["uv", "run", "python", "main.py"]
