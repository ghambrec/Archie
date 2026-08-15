COMPOSE := docker compose -f ./docker-compose.yml
COMPOSE_TEST := docker compose -p documents-system-test -f ./docker-compose.test.yml
PNPM := pnpm

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

unit:
	cd $(NEST_DIR) && $(PNPM) test || echo -n

test:
	${COMPOSE_TEST} build nest-server-test && \
	${COMPOSE_TEST} up -d --wait postgres-test redis-test minio-test && \
	${COMPOSE_TEST} up minio-init-test && \
	${COMPOSE_TEST} run --rm nest-server-test; \
	status=$$?; \
	${COMPOSE_TEST} down -v; \
	exit $$status

deps-check:
	cd $(NEST_DIR) && $(PNPM) install --frozen-lockfile
	cd $(FRONTEND_DIR) && $(PNPM) install --frozen-lockfile

deps-repair:
	cd $(NEST_DIR) && $(PNPM) install --no-frozen-lockfile
	cd $(FRONTEND_DIR) && $(PNPM) install --no-frozen-lockfile


.PHONY: re clean fclean down up setup deps-check deps-repair unit test
