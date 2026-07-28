.PHONY: all up fclean down

all: up

up:
	docker compose up -d

down:
	docker compose down

fclean:
	docker compose down --volumes