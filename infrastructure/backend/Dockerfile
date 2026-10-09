FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --ignore-scripts && pnpm rebuild @nestjs/core 2>/dev/null || true
COPY . .
RUN node_modules/.bin/nest build
EXPOSE 3000
CMD ["sh", "-c", "pnpm migration:run && node dist/main"]
