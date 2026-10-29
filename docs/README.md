# Documentation

These guides distinguish between the architecture implemented by the code today
and the conventions recommended for new features. If a guide conflicts with the
code, verify the implementation first and update the documentation when changing
it.

## Guides

- [Backend architecture](ARCHITECTURE.md): layers, CQRS, persistence boundaries,
  and verification with dependency-cruiser.
- [SOLID, CQRS, and audits](ARCHITECTURE_SOLID_CQRS.md): backend responsibilities,
  testability, and verification commands.
- [Frontend architecture](frontend-architecture.md): current organization,
  coupling findings, and a recommended structure without forcing DDD onto every
  screen.
- [Frontend conventions and criteria](frontend-conventions.md): practical rules
  for new features, testing, state, and code review.

## How to use these guides

1. Read the guide for the area you are changing.
2. Treat the code and tests as the source of truth for current behavior.
3. Add abstractions when they protect a real rule or boundary; avoid layers for
   ceremony's sake.
4. Update the relevant guide along with architectural changes.
