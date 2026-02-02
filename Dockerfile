FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.base.json ./
COPY nx.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY apps/port-operations-simulator ./apps/port-operations-simulator

# Compilar la aplicación
RUN npx nx build port-operations-simulator --configuration=production

# Exponer puerto (si fuera necesario en el futuro)
# EXPOSE 3000

# Variables de entorno por defecto
ENV RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
ENV SIMULATION_INTERVAL=5000

# Comando para ejecutar la aplicación
CMD ["node", "dist/apps/port-operations-simulator/main.js"]
