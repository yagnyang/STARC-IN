FROM node:18-alpine AS build

WORKDIR /app

# Build arguments for API routing
ARG VITE_API_URL=http://localhost:5001
ARG VITE_CATALOG_URL=http://localhost:8000

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CATALOG_URL=$VITE_CATALOG_URL

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
