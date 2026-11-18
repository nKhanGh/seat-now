FROM node:20-bookworm-slim AS web-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim AS api-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:20-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=api-build /app/backend/node_modules ./backend/node_modules
COPY --from=api-build /app/backend/dist ./backend/dist
COPY --from=api-build /app/backend/package.json ./backend/package.json
COPY --from=web-build /app/frontend/dist ./frontend/dist
USER node
CMD ["npm", "--prefix", "backend", "start"]
