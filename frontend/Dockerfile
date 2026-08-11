FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Baked in at build time, not read at container runtime — Vite inlines
# import.meta.env.* into the bundle. This has to be an address the *browser*
# (not the frontend container) can reach, since the built JS runs on the
# user's machine. Default assumes the backend's port is published to the
# host, which is what docker-compose.yml below does.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
