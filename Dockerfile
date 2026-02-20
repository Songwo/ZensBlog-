FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

FROM base AS builder
ARG BUILD_DATABASE_URL="file:./prisma/build.db"
ENV DATABASE_URL=${BUILD_DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Keep full node_modules so prisma CLI has complete deps at runtime.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/public/uploads /app/prisma && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000

# DATABASE_URL should be provided by --env-file / docker-compose in production.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
