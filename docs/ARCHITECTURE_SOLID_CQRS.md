# SOLID, CQRS and testability

This guide describes how the current NestJS backend uses architectural patterns.
CQRS and SOLID are complementary: CQRS separates reads from writes; SOLID helps
keep the resulting components focused and substitutable. Neither one guarantees
good design by itself.

## SOLID in this codebase

### S — Single Responsibility

A command or query represents one operation; its handler coordinates that
operation. For example, `CreatePostHandler` handles post creation, while
`GetPostBySlugHandler` handles a read. Controllers adapt HTTP input and dispatch;
they should not duplicate those use-case rules.

### O — Open/Closed

New post operations can be added as messages and handlers without adding more
branches to a single controller service. New repository adapters can implement
the existing ports without changing their application consumers.

### L — Liskov Substitution

An implementation of `IPostRepository` or `IUserRefreshTokenRepository` should
preserve that contract's expected behavior, whether it is TypeORM-backed or a test
fake. The interface alone is not proof; tests should exercise relevant behavior
such as missing records, pagination, and token reuse.

### I — Interface Segregation

Commands and queries are narrow messages, so a handler receives only the data for
its operation. Repository interfaces may still group several capabilities; split
them only when consumers have materially different needs or implementations.

### D — Dependency Inversion

Application handlers depend on repository interfaces and injection tokens owned
inward, while Infrastructure provides TypeORM implementations. The dependency
cruiser rules prevent Application and Domain from importing those implementations.

## CQRS flow

For posts, the current flow is:

```text
POST/PUT/DELETE -> controller -> CommandBus -> command handler -> IPostRepository
GET             -> controller -> QueryBus   -> query handler   -> IPostRepository
```

Commands include create, update, delete, view increment, and scheduled publishing.
Queries include list, by ID, by slug, related posts, and statistics. Read and write
handlers currently use the same repository and database; CQRS does not imply
separate storage, eventual consistency, or event sourcing.

The scheduled-post service dispatches its command after application bootstrap so
Nest has registered its handlers. Social interactions are outside the current
CQRS scope; some public comment/reaction/bookmark endpoints still access TypeORM
repositories in Infrastructure and are candidates for a later Application-layer
use case migration.

## Testability and cohesion

Handlers can be tested with fake repository ports; dispatch integration can be
tested with Nest's CQRS buses. Keep tests focused on observable behavior rather
than asserting framework internals. The same repository contract makes it possible
to test application rules without a running database.

## DTOs and model boundaries

- HTTP DTOs validate/adapt request input at the Infrastructure boundary.
- Commands and queries carry use-case input; they are not persistence models.
- Domain entities express business state and behavior.
- TypeORM entities represent storage and are mapped at the Infrastructure edge.
- Response resources shape API output; do not expose ORM entities as API contracts.

Some application DTOs currently use Nest validation decorators and messages extend
Nest CQRS classes. That is a pragmatic framework dependency in Application, not a
claim that the whole Application layer is framework-neutral. The Domain remains
pure and its no-framework rule is checked automatically.

## Dependency and security audits

Run production dependency audits from the repository root:

```sh
(cd backend && pnpm audit --prod)
(cd frontend && pnpm audit --prod)
```

In Docker development, the backend audit can run in a one-off container:

```sh
docker compose -f compose.yml -f compose.dev.yml run --rm --no-deps backend pnpm audit --prod
```

The `--prod` audit checks production dependencies; it does not claim that all
development-tool dependencies are vulnerability-free. Dependency overrides in
`backend/pnpm-workspace.yaml` keep patched transitive `body-parser` and `multer`
versions selected; direct frontend dependencies `dompurify` and `zod` are also kept
at patched ranges. Keep both lockfiles committed whenever dependency versions
change, and rerun both audits afterwards.

Useful backend checks, also listed in the root README:

```sh
cd backend
pnpm tsc
pnpm lint
pnpm architecture:check
pnpm test
```
