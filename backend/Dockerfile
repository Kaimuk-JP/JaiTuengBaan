# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

ARG BUILD_DATE=unknown
ENV BUILD_DATE=${BUILD_DATE}

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

ENV NPM_CONFIG_FETCH_TIMEOUT=600000 \
    NPM_CONFIG_FETCH_RETRIES=10 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=30000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=300000 \
    NPM_CONFIG_MAXSOCKETS=1
RUN rm -rf node_modules \
    && npm ci --ignore-scripts \
    || (npm cache clean --force && rm -rf node_modules && npm ci --ignore-scripts)

COPY src ./src

RUN DATABASE_URL=\"postgresql://dummy:dummy@localhost:5432/dummy\" npx prisma generate

RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

ARG BUILD_DATE=unknown
ENV BUILD_DATE=${BUILD_DATE}
ENV NODE_ENV=production

ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV npm_config_platform=linux
ENV npm_config_arch=x64
ENV npm_config_libc=musl

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN npm prune --omit=dev --ignore-scripts \
    && npm cache clean --force \
    && rm -rf node_modules/@img/sharp-win32-* \
              node_modules/@img/sharp-darwin-* \
              node_modules/@img/sharp-linux-arm* \
              node_modules/@img/sharp-linuxmusl-arm* \
    && rm -rf node_modules/prisma \
              node_modules/@prisma/engines \
              node_modules/@prisma/engines-version \
    && find node_modules -name "*.md" -o -name "*.map" -o -name "LICENSE*" -o -name "CHANGELOG*" | head -5000 | xargs rm -f 2>/dev/null || true \
    && find node_modules -name "*.d.ts" -not -path "*/prisma/*" | xargs rm -f 2>/dev/null || true

COPY prisma ./prisma/
COPY prisma.config.ts ./

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /app/node_modules/@prisma/engines-version ./node_modules/@prisma/engines-version

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]
