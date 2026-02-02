FROM mcr.microsoft.com/devcontainers/typescript-node:18

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Expose ports
EXPOSE 3000 5672 15672 8080

CMD ["/bin/bash"]
