FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

FROM base AS builder
WORKDIR /app
ARG BUILD_DATABASE_URL="file:./prisma/build.db"
ENV DATABASE_URL=${BUILD_DATABASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

RUN mkdir -p /app/prisma /app/public/uploads && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:./prisma/prod.db"

CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate && node server.js"]
