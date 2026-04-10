FROM node:18-alpine

WORKDIR /app

# Install backend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy application code
COPY frontend/ frontend/
COPY config/ config/

EXPOSE 5001
CMD ["sh", "-c", "cd frontend && npm run server"]
