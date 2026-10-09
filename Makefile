.PHONY: up down restart build build-no-cache logs logs-backend logs-frontend \
        ps shell-backend shell-frontend shell-db \
        install-frontend tsc migration clean-volumes help

DC      = docker compose -f compose.yml -f compose.dev.yml
BACKEND = boilerplate-blog-backend-1

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Servicios ─────────────────────────────────────────────────────────────────

up: ## Levanta todos los servicios en segundo plano
	$(DC) up -d

down: ## Detiene y elimina todos los contenedores
	$(DC) down

restart: ## Reinicia todos los servicios
	$(DC) restart

build: ## Reconstruye las imágenes
	$(DC) up -d --build

build-no-cache: ## Reconstruye sin caché
	$(DC) build --no-cache

logs: ## Logs en tiempo real (todos)
	$(DC) logs -f

logs-backend: ## Logs solo del backend NestJS
	$(DC) logs -f backend

logs-frontend: ## Logs solo del frontend Vite
	$(DC) logs -f frontend

ps: ## Estado de los contenedores
	$(DC) ps

# ── Shells ────────────────────────────────────────────────────────────────────

shell-backend: ## Shell en el contenedor backend
	$(DC) exec backend sh

shell-frontend: ## Shell en el contenedor frontend
	$(DC) exec frontend sh

shell-db: ## psql directo en postgres
	$(DC) exec postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-boilerplate}

# ── Frontend ──────────────────────────────────────────────────────────────────

install-frontend: ## pnpm install en el frontend
	$(DC) exec frontend pnpm install

tsc: ## TypeScript check en el frontend
	$(DC) exec frontend pnpm exec tsc --noEmit

# ── Backend ───────────────────────────────────────────────────────────────────

migration-run: ## Ejecuta migraciones pendientes
	$(DC) exec backend pnpm run migration:run

migration-revert: ## Revierte la última migración
	$(DC) exec backend pnpm run migration:revert

migration-generate: ## Genera una nueva migración. Ej: make migration-generate NAME=AddUserRoles
	$(DC) exec backend pnpm run migration:generate src/infrastructure/database/migrations/$(NAME)

# ── Limpieza ──────────────────────────────────────────────────────────────────

clean-volumes: ## Elimina contenedores y volúmenes ⚠️ borra datos
	$(DC) down -v
