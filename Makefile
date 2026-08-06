COMPOSE := docker compose -f ./docker-compose.yml 
PNPM := corepack pnpm

NEST_DIR := backend/nest-server
FRONTEND_DIR := frontend


deps-check:
	cd $(NEST_DIR) && $(PNPM) install --frozen-lockfile
	cd $(FRONTEND_DIR) && $(PNPM) install --frozen-lockfile

deps-repair:
	cd $(NEST_DIR) && $(PNPM) install --no-frozen-lockfile
	cd $(FRONTEND_DIR) && $(PNPM) install --no-frozen-lockfile


up:
	${COMPOSE} up -d

down:
	${COMPOSE} down

clean:
	${COMPOSE} down --rmi all

fclean:
	${COMPOSE} down -v --rmi all

re:
	make clean
	make up

.PHONY: re clean fclean down up setup
