# Bloger — Blog CMS

<p align="center">
  <img src="docs/stack.bloger.png" alt="Bloger — stack moderna para crear blogs y plataformas de contenido" width="100%" />
</p>

CMS y blog público construido con React, NestJS y PostgreSQL. Incluye gestión editorial, publicación programada, comunidad con comentarios y reacciones, y una API externa de solo lectura con credenciales y permisos por scope.

## Índice

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación con Docker](#instalación-con-docker)
- [Configuración](#configuración)
- [Desarrollo local sin Docker](#desarrollo-local-sin-docker)
- [API](#api)
- [Clientes API externos](#clientes-api-externos)
- [Seguridad](#seguridad)
- [Pruebas y calidad](#pruebas-y-calidad)
- [Migraciones](#migraciones)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Limitaciones conocidas](#limitaciones-conocidas)

## Características

### Blog y lectura pública

- Listado paginado de artículos publicados con búsqueda full-text, orden por recientes/antiguos/populares y filtros por categoría y etiqueta en la API.
- Vistas en tarjetas y horizontal; búsqueda con debounce, estado vacío accionable y atajo `⌘K` / `Ctrl+K`.
- Página de artículo con metadatos Open Graph, JSON-LD, tiempo estimado de lectura, progreso de lectura y artículos relacionados.
- RSS en `/feed.xml` y sitemap en `/sitemap.xml`.
- Sanitización de contenido HTML al renderizar artículos.

### Administración editorial

- Crear, editar, programar, publicar, archivar y eliminar artículos.
- Gestión de categorías, etiquetas, usuarios, roles y permisos.
- Subida de imágenes y selección de imagen destacada.
- Autosalvado local de borradores en el formulario de creación.
- Dashboard con publicaciones recientes y artículos más leídos.

### Comunidad

- Reacciones a artículos, contador de lecturas y guardado por usuario autenticado.
- Comentarios asociados a usuario y artículo. Los comentarios nuevos quedan pendientes y no aparecen en la vista pública hasta que sean aprobados.

## Stack tecnológico

| Área | Tecnologías |
| --- | --- |
| Frontend | React 19, TypeScript 7, Vite 8, Tailwind CSS 4, React Router, TanStack Query y Tiptap |
| Backend | Node.js 22, NestJS 12, TypeORM y PostgreSQL 16 |
| Rate limiting | Redis 7 y `@nestjs/throttler` |
| Proxy / producción | Nginx y Docker Compose |
| Paquetes | pnpm 12.4.2 |

Las versiones instaladas se fijan en `frontend/pnpm-lock.yaml` y `backend/pnpm-lock.yaml`.

## Arquitectura

El backend organiza el dominio en capas:

- `backend/src/domain`: entidades, excepciones y contratos de repositorio.
- `backend/src/application`: casos de uso y DTOs.
- `backend/src/infrastructure`: controladores Nest, persistencia TypeORM, autenticación y servicios externos.

El frontend usa páginas, loaders, servicios de API, componentes compartidos y React Query. La arquitectura actual separa lecturas y escrituras mediante casos de uso, pero **no implementa CQRS completo ni modelos de lectura independientes**.

## Requisitos

- Docker y Docker Compose para levantar el entorno completo.
- Para desarrollo local: Node.js 22 y pnpm 12.4.2.
- Para ejecutar los E2E: Chromium instalado por Playwright.

## Instalación con Docker

1. Copiar la plantilla de entorno:

   ```sh
   cp .env.example .env
   ```

2. Ajustar en `.env` los valores de PostgreSQL, JWT y el puerto si corresponde. No reutilizar las credenciales de ejemplo en un despliegue real.

3. Arrancar en modo desarrollo:

   ```sh
   docker compose -f compose.yml -f compose.dev.yml up -d --build
   ```

   Vite ofrece HMR y los servicios de PostgreSQL y Redis quedan dentro de la red Docker. Abrir `http://localhost:${NGINX_PORT}`; por defecto, `NGINX_PORT=8080`.

4. Arrancar el perfil de producción local:

   ```sh
   docker compose up -d --build
   ```

   El frontend se compila y sirve como estático. El backend ejecuta las migraciones pendientes antes de iniciar Nest. Nginx expone el puerto configurado en `NGINX_PORT`.

Comandos útiles del entorno de desarrollo:

```sh
make help
make ps
make logs
make logs-backend
make logs-frontend
```

## Configuración

La plantilla completa está en `.env.example`. Variables principales:

| Variable | Uso |
| --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Inicialización de PostgreSQL |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión del backend a PostgreSQL |
| `JWT_SECRET` | Firma de sesiones web; debe tener al menos 32 bytes |
| `API_CLIENT_JWT_SECRET` | Clave independiente opcional para tokens de integración. Si se omite, se deriva de `JWT_SECRET` con una etiqueta criptográfica separada |
| `JWT_EXPIRES_IN_SECONDS` | Vida del token de acceso web |
| `JWT_REFRESH_TTL_MINUTES` | Vida máxima del refresh token |
| `REDIS_URL` | Redis para contadores de rate limiting; Compose usa `redis://redis:6379` |
| `FRONTEND_URL` | Origen frontend permitido por CORS y verificación CSRF |
| `NGINX_PORT` | Puerto HTTP publicado por Nginx |
| `VITE_BACKEND_URL`, `VITE_PUBLIC_API_URL` | Configuración de API/proxy de Vite |

El backend falla al iniciar si falta `JWT_SECRET` o su longitud es inferior a 32 bytes.

## Desarrollo local sin Docker

El backend requiere PostgreSQL y Redis accesibles. Desde cada directorio:

```sh
# backend
cd backend
pnpm install
pnpm dev
```

```sh
# frontend, en otra terminal
cd frontend
pnpm install
pnpm dev
```

Configurar `backend/.env` con `DB_*`, `JWT_SECRET`, `FRONTEND_URL` y `REDIS_URL`. Para Vite, configurar `VITE_BACKEND_URL` según dónde se ejecute el backend.

## API

Todas las rutas están versionadas bajo `/api/v1`.

### API interna

- Sesión: `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/auth/me`.
- Administración: `/api/v1/posts`, `/api/v1/users`, `/api/v1/categories`, `/api/v1/tags` y recursos de configuración.
- Blog público: `/api/v1/public/posts`, `/api/v1/public/categories`, `/api/v1/public/tags`.
- Interacción: comentarios, reacciones, marcadores y lecturas bajo `/api/v1/public/posts/:slug/...`.

La sesión del navegador usa cookies `HttpOnly`; los tokens no se devuelven en el JSON de login ni se guardan en `localStorage`.

### Documentación OpenAPI

Swagger está disponible en desarrollo bajo `/api/docs`. En producción queda desactivado, salvo habilitación explícita mediante `SWAGGER_ENABLED=true`.

## Clientes API externos

La pestaña **Usuarios → Clientes API** permite crear y revocar clientes. El secreto se muestra una sola vez; en base de datos solo se guarda su hash. El cliente intercambia sus credenciales por un token `client_credentials` de 15 minutos.

Scopes disponibles:

- `posts:read`
- `categories:read`
- `tags:read`

Los recursos protegidos son `/api/v1/integrations/posts`, `/categories` y `/tags`. Ejemplos completos con `curl` están en [`backend/API_CLIENTS.md`](backend/API_CLIENTS.md).

## Seguridad

- Cookies de sesión `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- Verificación de `Origin`/`Referer` para operaciones mutables con cookies, incluido login CSRF.
- Refresh tokens aleatorios, persistidos hasheados, rotados atómicamente y con detección de reutilización.
- Gestión de roles en la API interna; clientes externos tienen JWT separado por firma derivada/override, `issuer`, `audience`, expiración y scopes explícitos.
- Rate limiting compartido por Redis; Nginx reenvía la IP y Express confía solo en el salto proxy configurado.
- Errores 500 se responden de forma genérica, sin filtrar mensajes internos.
- Avatares e imágenes subidas tienen límite de tamaño y validación de firma.
- Clientes externos antiguos con wildcard `*` se revocan mediante migración; los clientes nuevos solo admiten scopes explícitos.

Los límites de rate limiting predeterminados son 100 solicitudes por minuto; login limita a 5 por minuto, emisión de tokens a 10 por minuto, uploads a 20 por hora e integraciones a 120 por minuto.

## Pruebas y calidad

### Backend

```sh
cd backend
pnpm tsc
pnpm lint
pnpm test
```

Hay pruebas para programación de artículos, login/cookies, OAuth de clientes externos, scopes, CSRF y refresh tokens. La prueba del rate limiter Redis se omite si no se define `REDIS_TEST_URL`.

En Docker Compose de desarrollo, ejecuta la suite completa incluyendo la prueba contra Redis:

```sh
docker compose -f compose.yml -f compose.dev.yml exec \
  -e REDIS_TEST_URL=redis://redis:6379 backend pnpm test
```

### Frontend

```sh
cd frontend
pnpm tsc
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Los E2E de Playwright usan fixtures de API y no necesitan la base de datos ni credenciales. Cubren búsqueda, vistas, paginación y detalle del blog. Instrucciones adicionales: [`frontend/E2E.md`](frontend/E2E.md).

### Auditoría de dependencias

```sh
cd backend && pnpm audit --prod
cd ../frontend && pnpm audit --prod
```

## Migraciones

Migraciones TypeORM en `backend/src/infrastructure/database/migrations/`.

- En producción, el entrypoint del contenedor aplica migraciones pendientes antes de iniciar la API.
- En desarrollo, TypeORM tiene `synchronize` habilitado; el comando manual sigue disponible con `make migration-run`.

Para generar una migración en desarrollo:

```sh
make migration-generate NAME=NombreDescriptivo
```

## Estructura del repositorio

```text
backend/          API NestJS, dominio, casos de uso, persistencia y migraciones
frontend/         Aplicación React, blog, administración y E2E Playwright
infrastructure/   Dockerfiles y configuración Nginx
compose.yml       Stack de producción local
compose.dev.yml   Overrides para Vite/Nest en desarrollo
Makefile          Atajos para Compose, logs y migraciones
```

## Limitaciones conocidas

- La moderación guarda comentarios nuevos como pendientes, pero aún falta una interfaz administrativa completa para aprobarlos/rechazarlos.
- Los marcadores se pueden alternar en el artículo; aún no hay una página de usuario con la lista de artículos guardados.
- El rate limiter comparte contadores vía Redis, pero la topología Redis incluida en Compose es standalone; para alta disponibilidad se debería usar Redis administrado o una topología HA.
- Los E2E actuales cubren los recorridos públicos principales; aún no automatizan todo el panel administrativo.
