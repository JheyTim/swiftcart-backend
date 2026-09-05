# SwiftCart Backend

An event-driven e-commerce backend built as a NestJS monorepo. SwiftCart uses
an API Gateway for public HTTP traffic and dedicated services for identity,
catalog, ordering, inventory, payments, and notifications.

> **Project status:** Portfolio and local-development project. Payments and
> notifications are simulated; they are not integrations with real providers.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Services](#services)
- [Getting started](#getting-started)
- [Try the checkout flow](#try-the-checkout-flow)
- [API reference](#api-reference)
- [Configuration](#configuration)
- [Local Kubernetes deployment](#local-kubernetes-deployment)
- [Observability and RabbitMQ](#observability-and-rabbitmq)
- [Development notes](#development-notes)

## Features

- User registration and JWT authentication
- Product creation, listing, lookup, and updates
- Cache-aside product reads with Redis
- User-owned orders with item and price snapshots
- Transactional inventory reservation and release
- Configurable payment simulation
- Event-driven notifications through application logs
- RabbitMQ retries and dead-letter queues
- Correlation IDs across HTTP requests and domain events
- Health endpoints for every service
- Docker Compose infrastructure and local Kubernetes manifests

## Architecture

```text
                         synchronous HTTP
Client ──────────────▶ API Gateway ─────────────┬─▶ Auth Service
                                               ├─▶ Product Service ─▶ Redis
                                               ├─▶ Order Service
                                               └─▶ Inventory Service

                         asynchronous events
Order Service ── order.created ──▶ Inventory Service
                                      │
                         inventory.reserved / reservation_failed
                                      │
                                      ├─▶ Order Service
                                      └─▶ Payment Service
                                                │
                                  payment.succeeded / payment.failed
                                                │
                                                ├─▶ Order Service
                                                ├─▶ Inventory Service
                                                └─▶ Notification Service

Persistent data: PostgreSQL       Event broker: RabbitMQ
```

The API Gateway is the public entry point. It validates JWTs, attaches a
correlation ID, and proxies requests to the service that owns the relevant
domain. RabbitMQ decouples the checkout steps that do not need to finish during
the original HTTP request.

### Checkout lifecycle

On a successful checkout:

1. The Order Service stores an order as `PENDING` and publishes
   `order.created`.
2. The Inventory Service reserves all requested stock in a transaction and
   publishes `inventory.reserved`.
3. The Order Service changes the status to `INVENTORY_RESERVED`.
4. The Payment Service records a simulated payment and publishes
   `payment.succeeded`.
5. The Order Service changes the status to `PAID`, while the Inventory Service
   confirms the reservation.
6. The Notification Service logs the events it consumes.

If stock is unavailable, `inventory.reservation_failed` moves the order to
`CANCELLED`. If payment fails, `payment.failed` moves the order to
`PAYMENT_FAILED` and releases its reserved stock.

## Technology stack

| Area                   | Technology                              |
| ---------------------- | --------------------------------------- |
| Language and framework | TypeScript, NestJS                      |
| Persistence            | PostgreSQL, TypeORM                     |
| Cache                  | Redis, ioredis                          |
| Messaging              | RabbitMQ, amqplib                       |
| Authentication         | JWT, Passport, bcrypt                   |
| Validation             | class-validator, class-transformer, Joi |
| Internal HTTP          | Axios through `@nestjs/axios`           |
| Infrastructure         | Docker, Docker Compose, Kubernetes      |

## Services

| Service              | Port | Responsibility                                           | Primary data                            |
| -------------------- | ---: | -------------------------------------------------------- | --------------------------------------- |
| API Gateway          | 3000 | Public routes, authentication, request proxying, logging | —                                       |
| Auth Service         | 3001 | Registration, login, JWT issuance                        | `users`                                 |
| Product Service      | 3002 | Product catalog and Redis caching                        | `products`                              |
| Notification Service | 3003 | Consume and log domain events                            | —                                       |
| Order Service        | 3004 | Orders, items, and status transitions                    | `orders`, `order_items`                 |
| Inventory Service    | 3005 | Available stock and reservations                         | `inventory_items`, `stock_reservations` |
| Payment Service      | 3006 | Simulated payment processing                             | `payments`                              |

Reusable DTOs, event contracts, guards, HTTP helpers, and infrastructure
modules live in `libs/common/src` and are imported through `@app/common`.

<details>
<summary>Repository layout</summary>

```text
swiftcart-backend/
├── apps/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── product-service/
│   ├── notification-service/
│   ├── order-service/
│   ├── inventory-service/
│   └── payment-service/
├── libs/common/src/
│   ├── config/
│   ├── database/
│   ├── dto/
│   ├── events/
│   ├── guards/
│   ├── http/
│   ├── rabbitmq/
│   └── redis/
├── k8s/
├── docker-compose.yml
└── Dockerfile
```

</details>

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- Docker with Docker Compose

Kubernetes deployment additionally requires `kubectl` and a local Kubernetes
cluster such as Docker Desktop Kubernetes.

### Install and run

```bash
# Install dependencies and create local configuration.
npm install
cp .env.example .env

# Start PostgreSQL, Redis, and RabbitMQ.
npm run infra:up
```

Start each application in its own terminal:

```bash
npm run start:api-gateway:dev
npm run start:auth-service:dev
npm run start:product-service:dev
npm run start:notification-service:dev
npm run start:order-service:dev
npm run start:inventory-service:dev
npm run start:payment-service:dev
```

The public API is available at `http://localhost:3000`. Verify it with:

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

Stop the infrastructure when finished:

```bash
npm run infra:down
```

## Try the checkout flow

The examples below use only the API Gateway.

### 1. Register and log in

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'

curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Copy the returned access token:

```bash
TOKEN='PASTE_ACCESS_TOKEN_HERE'
```

### 2. Create a product and inventory

Prices are represented in the smallest currency unit. For example, `499900`
means 4,999.00 in a two-decimal currency.

```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Mechanical Keyboard",
    "description": "A compact mechanical keyboard",
    "priceCents": 499900,
    "isActive": true
  }'

PRODUCT_ID='PASTE_PRODUCT_ID_HERE'

curl -X POST http://localhost:3000/inventory/items \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"availableQuantity\": 10
  }"
```

### 3. Create and inspect an order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"items\": [{
      \"productId\": \"$PRODUCT_ID\",
      \"productName\": \"Mechanical Keyboard\",
      \"unitPriceCents\": 499900,
      \"quantity\": 2
    }]
  }"

ORDER_ID='PASTE_ORDER_ID_HERE'

curl http://localhost:3000/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

Checkout is asynchronous, so the first response may show `PENDING` or
`INVENTORY_RESERVED`. Query the order again to see its final status: `PAID`,
`PAYMENT_FAILED`, or `CANCELLED`.

Set `PAYMENT_SIMULATION_MODE` in `.env` to `always_success`, `always_fail`, or
`random` when testing a specific outcome.

## API reference

Clients should use the API Gateway rather than calling domain services
directly.

| Method  | Gateway path                               | Auth   | Description                          |
| ------- | ------------------------------------------ | ------ | ------------------------------------ |
| `GET`   | `/health`, `/health/live`, `/health/ready` | Public | Gateway health checks                |
| `POST`  | `/auth/register`                           | Public | Create a user                        |
| `POST`  | `/auth/login`                              | Public | Return a JWT access token            |
| `POST`  | `/products`                                | JWT    | Create a product                     |
| `GET`   | `/products`                                | JWT    | List products                        |
| `GET`   | `/products/:id`                            | JWT    | Get a product                        |
| `PATCH` | `/products/:id`                            | JWT    | Update a product                     |
| `POST`  | `/inventory/items`                         | JWT    | Create product inventory             |
| `GET`   | `/inventory/items`                         | JWT    | List inventory                       |
| `GET`   | `/inventory/items/:productId`              | JWT    | Get product inventory                |
| `PATCH` | `/inventory/items/:productId/add-stock`    | JWT    | Add stock                            |
| `POST`  | `/orders`                                  | JWT    | Create an order                      |
| `GET`   | `/orders`                                  | JWT    | List the authenticated user's orders |
| `GET`   | `/orders/:id`                              | JWT    | Get one owned order                  |

Every domain service also exposes `/health/live` and `/health/ready`. Internal
HTTP routes intentionally remain behind the API Gateway in the application
architecture, even though their ports are accessible during local development.

## Configuration

Copy `.env.example` to `.env`; the example file is the source of truth for
local defaults and descriptions.

| Group           | Important variables                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Service routing | `*_SERVICE_PORT`, `*_SERVICE_URL`                                                               |
| PostgreSQL      | `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`           |
| Redis           | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `PRODUCT_CACHE_TTL_SECONDS`                       |
| Authentication  | `JWT_SECRET`, `JWT_EXPIRES_IN`                                                                  |
| RabbitMQ        | `RABBITMQ_URL`, `RABBITMQ_EXCHANGE`, `RABBITMQ_RETRY_EXCHANGE`, `RABBITMQ_DEAD_LETTER_EXCHANGE` |
| Payments        | `PAYMENT_SIMULATION_MODE`                                                                       |

Configuration is validated with Joi when each application starts. Development
uses TypeORM schema synchronization for convenience; production deployments
should use migrations instead.

## Local Kubernetes deployment

### Build images

```bash
for app in api-gateway auth-service product-service notification-service \
  order-service inventory-service payment-service; do
  docker build --build-arg APP_NAME="$app" -t "swiftcart/$app:local" .
done
```

The manifests use `imagePullPolicy: Never`, so these images must be available
to the local cluster's container runtime.

### Deploy and verify

```bash
kubectl apply -f k8s/
kubectl get pods -n swiftcart
kubectl get svc -n swiftcart
kubectl get pvc -n swiftcart
```

With Docker Desktop Kubernetes, the API Gateway load balancer is typically
available at `http://localhost:3000`. If it is not, inspect the service:

```bash
kubectl get svc api-gateway -n swiftcart
```

Useful lifecycle and debugging commands:

```bash
# Follow logs for one component.
kubectl logs -n swiftcart -l app=api-gateway --follow

# Restart applications after rebuilding images.
kubectl rollout restart deployment -n swiftcart

# Stop and restart workloads without intentionally deleting persistent data.
kubectl scale deployment --all -n swiftcart --replicas=0
kubectl scale statefulset --all -n swiftcart --replicas=0
kubectl scale statefulset --all -n swiftcart --replicas=1
kubectl scale deployment --all -n swiftcart --replicas=1

# Remove the complete local deployment, including namespace-scoped claims.
kubectl delete namespace swiftcart
```

## Observability and RabbitMQ

The gateway accepts an optional `x-correlation-id` header. If it is omitted, a
UUID is generated. The ID is returned in the response and propagated through
internal HTTP calls and event metadata.

```bash
curl http://localhost:3000/products \
  -H "Authorization: Bearer $TOKEN" \
  -H 'x-correlation-id: local-debug-123'
```

RabbitMQ Management is available locally at <http://localhost:15672> with the
credentials from `docker-compose.yml` (`swiftcart` / `swiftcart_password`). The
main exchanges are:

- `swiftcart.events`
- `swiftcart.retry`
- `swiftcart.dead-letter`

Consumers acknowledge messages only after successful handling. Failed messages
are delayed through retry queues and eventually routed to a dead-letter queue.

For Kubernetes, forward the management port first:

```bash
kubectl port-forward -n swiftcart service/rabbitmq 15672:15672
```

## Development notes

### Useful scripts

| Command                       | Description                                 |
| ----------------------------- | ------------------------------------------- |
| `npm run infra:up`            | Start PostgreSQL, Redis, and RabbitMQ       |
| `npm run infra:down`          | Stop local infrastructure                   |
| `npm run infra:logs`          | Follow infrastructure logs                  |
| `npm run infra:ps`            | Show infrastructure status                  |
| `npm run start:<service>:dev` | Start a named service in watch mode         |
| `npm run format`              | Format TypeScript under `apps/` and `libs/` |
| `npm test`                    | Run Jest tests                              |

### Current scope and production improvements

This repository demonstrates service boundaries and event-driven workflows; it
does not claim production readiness. Important next steps include:

- transactional outbox publishing for database and event consistency;
- explicit consumer idempotency and unique event identifiers;
- row locking or atomic updates for concurrent stock reservations;
- authoritative server-side catalog pricing during order creation;
- a real payment provider with idempotency keys and verified webhooks;
- database migrations, secrets management, metrics, tracing, and broader tests.

## License

Licensed under the [MIT License](LICENSE).
