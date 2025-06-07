# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
# Install Python3 and numpy for strategy evaluation
RUN apk add --no-cache python3 py3-numpy
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm", "start"] 