# Dockerfile
# This multi-stage Dockerfile builds and runs one NestJS app from the monorepo.
# The target app is selected using the APP_NAME build argument.

# ---------- Build stage ----------
# Use a specific Node.js Alpine image for a smaller build base.
FROM node:24.14.1-alpine AS builder

# Set the working directory inside the container.
WORKDIR /usr/src/app

# Copy package files first so Docker can cache dependency installation.
COPY package*.json ./

# Install dependencies needed to build the NestJS app.
RUN npm ci

# Copy the full source code after dependencies are installed.
COPY . .

# APP_NAME decides which NestJS app to build.
# Example: api-gateway, auth-service, product-service.
ARG APP_NAME

# Build only the selected NestJS app.
RUN npm run build -- ${APP_NAME}

# ---------- Runtime stage ----------
# Runtime image only contains production dependencies and compiled JavaScript.
FROM node:24.14.1-alpine AS runner

# Set production mode inside the container.
ENV NODE_ENV=production

# Set the working directory for the runtime container.
WORKDIR /usr/src/app

# Copy package files so we can install production dependencies only.
COPY package*.json ./

# Install only production dependencies.
RUN npm ci --omit=dev

# APP_NAME is needed again in the runtime stage.
ARG APP_NAME

# Store APP_NAME as an environment variable so CMD can use it.
ENV APP_NAME=${APP_NAME}

# Copy compiled app output from builder stage.
COPY --from=builder /usr/src/app/dist ./dist

# Run as the non-root node user included in the official Node image.
USER node

# Start the selected app's compiled main.js.
CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]