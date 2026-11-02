# Gedächtnis für Modul 01 – kleiner Node-Dienst mit SQLite, ohne native Abhängigkeiten.
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY kategorien.json merkmale.mjs speicher.mjs klassifizierer.mjs server.mjs ./
ENV HOST=0.0.0.0 PORT=8787 GEDAECHTNIS_DB=/daten/gedaechtnis.sqlite
VOLUME ["/daten"]
EXPOSE 8787
HEALTHCHECK --interval=60s --timeout=5s CMD wget -qO- http://127.0.0.1:8787/gesund || exit 1
CMD ["node", "--no-warnings=ExperimentalWarning", "server.mjs"]
