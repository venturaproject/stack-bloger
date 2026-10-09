# API clients

Administrators can create and revoke external clients from **Users → API clients**. Client secrets are returned once and stored as bcrypt hashes.

## Scopes

- `posts:read`: published articles; supports `page`, `perPage`, `search`, `categorySlug`, `tagSlug` and `order`.
- `categories:read`: categories used by published articles.
- `tags:read`: tags used by published articles.

Clients receive explicit scopes only. There is no wildcard scope, so future resources are not granted implicitly.

## Obtain an access token

The token endpoint supports the OAuth 2.0 `client_credentials` grant. It requires HTTPS in deployed environments. Tokens are short-lived (15 minutes), audience-restricted to the integration API, and responses use `no-store` caching headers.

```sh
curl -X POST https://blog.example.com/api/v1/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -u 'blog_CLIENT_ID:CLIENT_SECRET' \
  --data-urlencode 'grant_type=client_credentials'
```

The response contains `access_token`, `token_type`, `expires_in` and granted `scope`. Never log or persist the client secret in source control.

## Call integration resources

```sh
curl 'https://blog.example.com/api/v1/integrations/posts?page=1&perPage=20' \
  -H 'Authorization: Bearer ACCESS_TOKEN'
```

Other resources are `/api/v1/integrations/categories` and `/api/v1/integrations/tags`. Revoking a client invalidates its access tokens immediately.
