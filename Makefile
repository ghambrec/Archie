COMPOSE := docker compose -f ./docker-compose.yml 
PNPM := corepack pnpm

NEST_DIR := backend/nest-server
FRONT_DIR := frontend/
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

deps-repair:
	cd $(NEST_DIR) && $(PNPM) install --no-frozen-lockfile
	cd $(FRONTEND_DIR) && $(PNPM) install --no-frozen-lockfile


# Github actions
deps-nest:
	cd $(NEST_DIR) && $(PNPM) install --frozen-lockfile
deps-front:
	cd $(FRONT_DIR) && $(PNPM) install --frozen-lockfile

build-nest:
	cd $(NEST_DIR) && $(PNPM) run build
build-front:
	cd $(FRONT_DIR) && $(PNPM) run build


.PHONY: re clean fclean down up deps-nest deps-front build-nest build-front
