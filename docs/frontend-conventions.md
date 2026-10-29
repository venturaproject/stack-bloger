# Frontend Conventions and Criteria

These criteria define a pragmatic application of Hexagonal Architecture and
Clean Architecture to the frontend. They aim to protect dependency boundaries
and make behavior testable without copying the backend's DDD model into an SPA.
They distinguish conventions for new or substantially changed features from the
gradual migration of existing modules.

## 1. Layers and dependency direction

Organize a feature around responsibilities, introducing only the layers it
needs:

```text
Presentation -> Application -> Domain (optional)
Infrastructure -> implements Application ports
App/composition root -> wires concrete adapters to the feature
```

- **Domain** contains pure client-side rules and concepts only when the client
  genuinely owns behavior that benefits from them. It must not depend on React,
  React Query, Axios, routing, or browser APIs.
- **Application** coordinates a user action or workflow. It may depend on
  domain-level types and ports, but not on Axios, a concrete API service, React,
  or a UI component. For simple CRUD, a dedicated use-case layer may add no
  value; do not create empty/intermediary classes just to match a diagram.
- **Infrastructure** implements ports and handles external details such as HTTP,
  storage, browser APIs, and mapping API DTOs to feature-facing data. It may
  depend on the shared HTTP client and on contracts defined inward, but inward
  layers must not import it.
- **Presentation** (pages, components, UI hooks) renders state and gathers user
  input. It can invoke application actions and use UI/framework facilities, but
  should not own transport details or business workflows.
- **The composition root** (app setup/router or feature setup) is the allowed
  place to select and connect concrete implementations. Avoid resolving
  dependencies throughout the feature with global service locators.

The dependency rule is more important than folder names: source-code dependencies
point inward toward policy. Runtime calls may flow outward through an injected
port to an adapter, but the policy does not import or know the adapter. Do not
introduce a port for every function; use one when it protects a meaningful
boundary, makes policy independently testable, or permits a real implementation
to be substituted.

## 2. Feature-based organization

- Keep a page, its private components, hooks, types, and data access together as
  the feature grows.
- `shared` should contain only code with more than one real consumer and no
  semantics exclusive to a single feature.
- Do not import presentation files from another page. Export types/contracts from
  a feature module or move the component to a location with a clear owner.
- Avoid making a public-facing screen depend on an admin dashboard table.

## 3. Ports, adapters, and HTTP contracts

- Visual components must not import `axios` or call `fetch` to access the API.
- Keep HTTP operations in an infrastructure adapter/service for the feature;
  share a single Axios client for configuration, credentials, common errors, and
  session refresh. The UI should not be the adapter.
- Define an application-facing port only when application policy needs to depend
  on an abstraction (for example, `PostsRepository`). Keep the port free of Axios
  types and HTTP response objects; implement it with an HTTP adapter.
- Type every operation: input (request), HTTP response (DTO/wire format), and the
  result consumed by the view. Do not use `any` or a type derived from `JSON.parse`
  as a generic contract.
- Convert names, date formats, and API structures in the adapter when they differ
  from the screen model. Do not repeat normalization in pages.
- Normalize technical errors at the adapter boundary; the UI decides how to
  present them. Do not silently ignore mutation errors the user should know about.

An adapter does not have to be a class, and a repository is not mandatory. A
typed function can implement a port. Keep React Query in the presentation/data
orchestration boundary unless a concrete need justifies a different arrangement;
it is not itself a domain repository or business rule.

## 4. Remote state and UI state

- Use React Query for remote data; define stable query keys per feature and
  explicitly update/invalidate the cache after mutations.
- Do not copy the same remote data into Zustand or `useState` without a reason
  (for example, unsaved local edits).
- Keep ephemeral UI details in local state: an open dialog, a temporary field, or
  a local selection.
- Query hooks can live alongside their feature; the router/composition root
  should not become the place where all queries are concentrated.

## 5. Types, validation, and business rules

- Separate API response types, form values, and domain/UI models when their
  responsibilities or formats differ.
- Do not create frontend entities to automatically mirror every backend entity.
  Create client-side domain types/models only when justified by client-side
  business behavior.
- Form validation provides early feedback; it does not replace server-side
  validation, authorization, or rules.
- Reuse shared types from a stable contract; do not import a type from
  `columns.tsx`, a page, or a component just to avoid declaring an interface.

## 6. Presentation, routes, and lazy loading

- Keep page components focused on composition and visible states (loading, error,
  empty, success); extract logic with its own responsibility into feature hooks
  or services.
- The router declares routes and guards and connects components. Authentication
  may require global coordination, but the session request and its mapping should
  live in a reusable function/adapter.
- Lazy-load large screens/routes when it reduces the initial bundle; do not split
  tiny components by default.
- Components in `components/ui` must not know about business routes, specific
  permissions, or endpoints.

## 7. Tests and acceptance criteria

When reviewing a feature, confirm that:

1. Relevant rules can be tested without mounting the whole application.
2. Data access can be replaced or verified without a real Axios request in a
   presentation test.
3. Loading, error, empty, and mutation states are handled where applicable.
4. Remote data is not duplicated in client-side stores.
5. Request/response types describe the data actually consumed.
6. Imports respect feature boundaries and do not cross into another page.
7. `pnpm tsc`, `pnpm lint`, `pnpm architecture:check`, `pnpm build`, and relevant
   E2E tests are run.

The frontend currently configures Playwright E2E, but has no dedicated unit-test
runner. When extracting critical pure rules, adapters, or mappers, consider
adding unit tests and the corresponding runner; do not use E2E tests to test every
small function.

## 8. Evolution and exceptions

- Migrate one feature at a time as it is touched; the entire frontend does not
  need to be rewritten before delivering improvements.
- Treat existing direct-HTTP pages/components and imports across page boundaries
  as known legacy exceptions, not precedent for new work. When modifying one,
  avoid expanding the coupling and move the touched operation behind the feature
  boundary when practical.
- If a CRUD screen has no rules of its own, do not invent empty Domain and
  Application layers.
- Document temporary exceptions with a reason and a boundary; remove the
  exception when migrating the consumer.
- Before deleting pages that appear to be template content, confirm routes, links,
  expected use, and product scope.

## Current codebase status

The current frontend does **not** satisfy all of these criteria yet. In
particular, API calls are made directly from pages and shared components,
`pages/_loaders.tsx` combines data access with route presentation, and several
pages import presentation modules from other pages. These are documented
migration items in [Frontend architecture](frontend-architecture.md); do not
interpret the guide as a claim that the existing code has already been migrated.

`pnpm architecture:check` runs dependency-cruiser over `frontend/src` and currently
enforces dependency direction inside feature layer folders: Domain cannot depend
on frameworks or outer layers, Application cannot depend on Infrastructure or
Presentation, and Presentation cannot depend on Infrastructure. The check passes
for the current tree, but legacy code outside these feature-layer folders is not
yet covered; expand its rules as features migrate rather than treating a clean
result as proof that every frontend boundary is already clean.

For this guide, “direct HTTP in presentation” means a request to an application
API endpoint. Browser `fetch` used by an editor to read a local/blob URL, for
example, is not an API access adapter and does not by itself violate the HTTP
boundary. Similarly, third-party UI library internals are outside feature
architecture rules.
