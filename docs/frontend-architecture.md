# Frontend Architecture

This guide describes the current React/TypeScript application and a pragmatic
approach to evolving it. The frontend is a client-side SPA for an API; it **does
not need to duplicate the backend's aggregates or authoritative domain rules**.
DDD and Clean Architecture here are tools for separating responsibilities and
dependencies, not for creating domain classes for every form.

## Current organization

The frontend is organized mainly by technical responsibility and pages:

| Area | Location | Current use |
| --- | --- | --- |
| Composition and routes | `frontend/src/app.tsx`, `providers.tsx` | Mounts providers, guards, and routes; declares lazy-loaded screens. |
| Screens and forms | `frontend/src/pages/` | Presents content and contains some interaction and data coordination. |
| Route data loading | `frontend/src/pages/_loaders.tsx`, `frontend/src/hooks/` | Uses React Query and, in several cases, Axios to fetch data and adapt props. |
| API | `frontend/src/services/` | Concrete per-area objects that call the shared Axios client. |
| Client and utilities | `frontend/src/lib/`, `config/` | Axios, authentication, navigation, configuration, and helpers. |
| Shared UI | `frontend/src/components/`, `layouts/` | Generic primitives, layouts, and some feature-specific components. |
| Client state | `context/`, `hooks/`, `lib/auth.ts` | UI and session state, plus reusable hooks. |

This is a useful separation, but **it is not a consistent hexagonal architecture**:
there are no `features/*` modules with Domain/Application/Infrastructure layers,
services are concrete adapters, and several screens access the transport directly.

## Review findings

The following are verifiable coupling points in the code, not a claim that the
frontend should have the same architecture as the backend:

1. **HTTP access from presentation.** `pages/_loaders.tsx` imports Axios and
   defines `useQuery`/requests; many pages (including users, roles, permissions,
   settings, dashboard, and blog) also call the client. Some components do too:
   notifications import bare `axios`, while theme/settings, profile, device,
   phone-action, and upload UI components call the shared client. This makes
   presentation aware of endpoints, response formats, and transport details.
2. **Services are not consistent or fully typed end to end.** The `services/`
   directory currently has wrappers for posts, tags, categories, users, and API
   clients, but many other resources are accessed elsewhere; some wrappers return
   `res.data` without a response type. The `ApiData = ReturnType<typeof JSON.parse>`
   alias in `_loaders.tsx` does not provide a useful response contract.
3. **Types and components cross page boundaries.** The public blog imports `Post`
   from `pages/posts/columns.tsx` (an admin table presentation module). Roles and
   permissions import `AccessControlTabs` from `pages/users/`; `pages/charts`
   reuses components from `pages/dashboard`. These are dependencies on
   presentation details, not feature contracts.
4. **Data loading is centralized and heterogeneous.** `_loaders.tsx` coordinates
   many areas and combines React Query, Axios, wire-format transformations, and
   screen selection in one module. Other screens also define query functions
   inline, so data access has no single consistent feature boundary.
5. **The composition root contains part of the authentication flow.** `AuthSync`
   in `app.tsx` calls `/api/v1/auth/me`, interprets the response, and updates the
   authentication store. This works, but mixes composition with session
   coordination.
6. **Potential template-content inventory.** `pages/tasks`, `mail`, `chats`,
   `apps`, `pricing`, `playground`, and some calls to phone or notification routes
   unrelated to the CMS appear to come from the template or another application.
   Do not remove them without checking usage, routes, and intended scope; confirm
   whether they are part of the product.

Items 1–5 are coupling debt if a cleaner boundary is desired; they do not, by
themselves, prevent the SPA from working. Item 6 requires a product decision, not
an automatic refactor.

The current frontend therefore **does not yet conform to the dependency rules in
the conventions guide**. The rules are the standard for new code and code changed
substantially; existing direct-HTTP screens, centralized loaders, and
cross-page imports are known migration debt, not examples to copy. See
[Frontend conventions and criteria](frontend-conventions.md) for the target rules
and the limits of their application (for example, browser `fetch` used internally
to read a blob is not an API adapter violation).

The posts feature has begun this migration: its HTTP adapter now lives under
`features/posts/infrastructure/`, its shared post type no longer lives in the
admin table module, and create/edit image uploads go through that adapter. The
route loaders still own posts queries, and the broader API response contracts
remain to be typed; this is a first slice, not full compliance.

## Incremental target direction

For features that grow or change frequently, group code by feature and separate
layers where there is a boundary worth protecting:

```text
src/
├── app/                         # router, providers, and composition
├── features/
│   └── posts/
│       ├── domain/              # pure types/rules only if the client needs them
│       ├── application/         # actions/use cases and ports when valuable
│       ├── infrastructure/      # HTTP, API DTOs, and mappers
│       └── presentation/        # pages, components, UI hooks
└── shared/
    ├── api/                     # shared HTTP client/configuration
    ├── ui/                      # components without business semantics
    └── lib/                     # genuinely cross-cutting utilities
```

This is an **evolutionary target**, not a requirement to migrate all existing
code. For a simple CRUD feature, a hook and a small adapter may be enough. Do not
add a separate domain unless a client-side rule or model justifies it.

Recommended direction:

```text
App -> assembles adapters and routes
Presentation -> Application -> internal models/contracts
Infrastructure -> implements contracts; translates HTTP/JSON
```

Dependencies should stay within the same feature or pass through a stable public
API. A feature should not import another feature's private page, table, or
component. If a piece is truly generic, move it to `shared`; if it is shared by a
business area (for example, access control and permissions), place it under that
shared feature rather than arbitrarily under `users`.

## Library responsibilities

- **React** and React Router belong to presentation and composition.
- **React Query** manages remote state, caching, and invalidation; it is not the
  domain.
- **Zustand/Context** are for shared client state, not for duplicating responses
  already managed by React Query.
- **Axios/fetch** should sit behind the HTTP adapter or feature data-access
  functions, not be scattered across visual components.
- **Zod and React Hook Form** can validate forms and improve UX. The backend
  remains authoritative; client-side validation alone cannot guarantee critical
  business invariants.
- **`components/ui`** should be visual and reusable; it should not know about
  endpoints or CMS-specific entities.

## Current verification

TypeScript, Oxlint, the build, Playwright E2E, and a scoped dependency-cruiser
check are configured in `frontend/package.json`. The architecture check currently
enforces layer rules inside `features/*/{domain,application,presentation}`; it
does not yet cover legacy imports from `pages/` or all component boundaries. The
frontend has no dedicated unit-test suite for rules/adapters. See [Frontend
conventions and criteria](frontend-conventions.md) before creating a new module.
