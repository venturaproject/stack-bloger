# Backend architecture

## Layers and dependency direction

The backend is organized around two domain areas (`post` and `user`) and three
architectural layers:

```text
Infrastructure  ->  Application  ->  Domain
```

```text
backend/src/
├── domain/             # business entities, value objects, exceptions, ports
├── application/        # use cases, CQRS messages/handlers, application DTOs
└── infrastructure/    # Nest modules/controllers, TypeORM, HTTP and adapters
```

- **Domain** owns business concepts and repository contracts. It must not import
  Application, Infrastructure, NestJS, TypeORM, or other third-party packages.
- **Application** coordinates use cases and depends on Domain contracts. It must
  not depend on Infrastructure implementations.
- **Infrastructure** is the outer layer: it wires NestJS, HTTP, persistence, and
  adapters to the inward-facing contracts.

The dependency rule is about source imports, not folder naming. The project checks
it with `backend/.dependency-cruiser.cjs`; see [Architecture checks](#architecture-checks).

## Persistence boundary

TypeORM classes belong under `infrastructure/database/entities/`. Domain models
remain free of ORM decorators; mappers translate between ORM and domain models:

```text
TypeORM entity <-> Infrastructure mapper <-> Domain model
```

For example, `PostOrmEntity` is mapped by `PostMapper` to the pure
`domain/post/entities/post.entity.ts` model. Refresh tokens follow the same rule:
the repository maps the TypeORM row to
`domain/user/entities/user-refresh-token.entity.ts` and the repository contract
does not expose a database entity.

When adding persistence, keep ORM relations and database-specific details in
Infrastructure. Do not import ORM entities from Domain or Application.

## CQRS

CQRS is currently applied to post CRUD and post read operations. The messages live
in `application/post/commands/` and `queries/`; their handlers coordinate through
`IPostRepository`. The Nest controllers dispatch through `CommandBus` or
`QueryBus`, and `PostModule` registers the handlers.

```text
HTTP controller -> CommandBus / QueryBus -> handler -> repository port
                                                   -> repository adapter -> TypeORM
```

Writes use commands; reads use queries. This separates the operation's intent and
handler without requiring separate databases or event sourcing. CQRS is not yet a
requirement for the other contexts. Category, tag, and user use cases remain
use-case classes; social post interactions are also not fully migrated and some
public endpoints still use TypeORM repositories directly.

The Application layer currently uses NestJS CQRS and Nest dependency-injection
decorators. This is an explicit framework coupling; the Domain layer remains
framework-independent. If framework portability becomes a requirement, move
framework-specific dispatch and registration behind Application-owned ports.

## Adding a feature

1. Put business state, invariants, and domain types in `domain/<context>/`.
2. Add a use case or, where CQRS is used, a command/query and its handler in
   `application/<context>/`.
3. Depend on a repository or service contract owned by Domain or Application;
   do not import a concrete adapter inward.
4. Implement persistence and external integrations in Infrastructure. Map ORM
   entities at that boundary.
5. Keep controllers focused on HTTP adaptation, authorization, dispatch, and
   response mapping. Avoid putting business rules there.
6. Add focused tests for business behavior and run the architecture check.

## Architecture checks

Dependency-cruiser is the TypeScript equivalent used here for Deptrac-style
dependency rules. It currently rejects these imports:

- Domain -> Application
- Domain -> Infrastructure
- Domain -> npm/framework packages
- Application -> Infrastructure

Run it from `backend/`:

```sh
pnpm architecture:check
```

These rules guard structural dependency direction. They do not prove that a class
has a single responsibility, that a domain model contains all business rules, or
that every controller is thin. Review those concerns in code review and tests.
