FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node requirements
# We copy everything in frontend because package-lock might be there, and we also need it for build
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

# Copy rest of the application
WORKDIR /app
COPY . .

# Build the frontend client (Vite)
WORKDIR /app/frontend
RUN npm run build

# Configure Start Command
EXPOSE 5001
CMD ["npm", "run", "server"]
