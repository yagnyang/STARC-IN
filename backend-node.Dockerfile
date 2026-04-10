FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy application code
COPY frontend/ frontend/
COPY config/ config/

EXPOSE 5001
CMD ["sh", "-c", "cd frontend && npm run server"]
