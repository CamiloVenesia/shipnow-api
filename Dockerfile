# ---------- Etapa 1: dependencias ----------
FROM node:20-alpine AS deps

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

# ---------- Etapa 2: imagen final ----------
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Usuario no-root por seguridad (buena práctica en producción)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiamos solo node_modules ya resueltos de la etapa anterior
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# Creamos la carpeta de logs y le damos permisos al usuario no-root
RUN mkdir -p logs && chown -R appuser:appgroup /usr/src/app

USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]