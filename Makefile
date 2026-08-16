COMPOSE := docker compose -f ./docker-compose.yml 
PNPM := corepack pnpm

NEST_DIR := backend/nest-server
FRONTEND_DIR := frontend


up:
	${COMPOSE} up

down:
	${COMPOSE} down

clean:
	${COMPOSE} down --rmi all

fclean:
	${COMPOSE} down -v --rmi all

re:
	make clean
	make up

deps-check:
	cd $(NEST_DIR) && $(PNPM) install --frozen-lockfile
	cd $(FRONTEND_DIR) && $(PNPM) install --frozen-lockfile

build:
	cd $(NEST_DIR) && $(PNPM) install --frozen-lockfile && $(PNPM) run build

deps-repair:
	cd $(NEST_DIR) && $(PNPM) install --no-frozen-lockfile
	cd $(FRONTEND_DIR) && $(PNPM) install --no-frozen-lockfile


.PHONY: re clean fclean down up setup build
