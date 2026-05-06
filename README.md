# SwiftCart Backend

SwiftCart Backend is a NestJS microservices monorepo for an e-commerce backend.
It includes an API Gateway plus domain services for authentication, products,
inventory, orders, payments, and notifications.

It supports:

- User registration
- User login
- JWT authentication
- Product creation and listing
- Redis product caching
- Order creation
- Inventory reservation
- Simulated payment processing
- Notification event logging
- RabbitMQ-based asynchronous communication
- Docker Compose local infrastructure

---

## Tech Stack

| Area | Technology |
|---|---|
| Language | TypeScript |
| Backend Framework | NestJS |
| Database | PostgreSQL |
| Cache | Redis |
| Message Broker | RabbitMQ |
| Authentication | JWT, Passport |
| ORM | TypeORM |
| Local Infrastructure | Docker Compose |
| Container Runtime | Docker |
| Validation | class-validator, class-transformer, Joi |
| HTTP Client | Axios via `@nestjs/axios` |

---

## Architecture

```txt
Client
  |
  | HTTP
  v
API Gateway
  |
  | HTTP internal calls
  v
Auth Service
Product Service
Order Service
Inventory Service
Payment Service
Notification Service
  |
  | SQL / Cache / Events
  v
PostgreSQL
Redis
RabbitMQ
```

The API Gateway is the public entry point. Internal services own their own business logic and data.

RabbitMQ is used for asynchronous workflows such as:

```txt
order.created
  -> inventory.reserved
  -> payment.succeeded
  -> order status PAID
```

---

## Services

### API Gateway

Public entry point for clients.

Responsibilities:

- Exposes public HTTP routes
- Validates JWTs
- Forwards requests to internal services
- Adds correlation IDs
- Applies request logging

Default port:

```txt
3000
```

---

### Auth Service

Owns user identity.

Responsibilities:

- Register users
- Hash passwords with bcrypt
- Log users in
- Issue JWT access tokens
- Validate authenticated users

Default port:

```txt
3001
```

Main table:

```txt
users
```

---

### Product Service

Owns product catalog data.

Responsibilities:

- Create products
- List products
- Get product details
- Update products
- Cache product reads in Redis
- Publish `product.created`

Default port:

```txt
3002
```

Main table:

```txt
products
```

Redis keys:

```txt
products:list
products:detail:<product-id>
```

---

### Notification Service

Consumes events and simulates notifications through logs.

Responsibilities:

- Listen for domain events
- Log notification messages
- Help verify event-driven workflows

Default port:

```txt
3003
```

---

### Order Service

Owns customer orders.

Responsibilities:

- Create orders
- Store order items
- Publish `order.created`
- Update order status after inventory and payment events

Default port:

```txt
3004
```

Main tables:

```txt
orders
order_items
```

Order statuses:

```txt
PENDING
INVENTORY_RESERVED
CANCELLED
PAID
PAYMENT_FAILED
```

---

### Inventory Service

Owns stock counts and reservations.

Responsibilities:

- Create inventory records
- Add stock
- Reserve stock after `order.created`
- Publish `inventory.reserved`
- Publish `inventory.reservation_failed`
- Confirm stock after payment success
- Release stock after payment failure

Default port:

```txt
3005
```

Main tables:

```txt
inventory_items
stock_reservations
```

---

### Payment Service

Simulates payment processing.

Responsibilities:

- Consume `inventory.reserved`
- Create payment records
- Simulate payment success or failure
- Publish `payment.succeeded`
- Publish `payment.failed`

Default port:

```txt
3006
```

Main table:

```txt
payments
```

---

## Event Flow

### Successful Checkout

```txt
1. Client creates an order.
2. Order Service stores order as PENDING.
3. Order Service publishes order.created.
4. Inventory Service reserves stock.
5. Inventory Service publishes inventory.reserved.
6. Order Service updates status to INVENTORY_RESERVED.
7. Payment Service processes payment.
8. Payment Service publishes payment.succeeded.
9. Order Service updates status to PAID.
10. Inventory Service confirms stock reservation.
11. Notification Service logs related events.
```

### Inventory Failure

```txt
1. Client creates an order.
2. Order Service stores order as PENDING.
3. Order Service publishes order.created.
4. Inventory Service detects insufficient stock.
5. Inventory Service publishes inventory.reservation_failed.
6. Order Service updates status to CANCELLED.
```

### Payment Failure

```txt
1. Inventory is reserved successfully.
2. Payment Service simulates failed payment.
3. Payment Service publishes payment.failed.
4. Order Service updates status to PAYMENT_FAILED.
5. Inventory Service releases reserved stock.
```

---

## Project Structure

```text
swiftcart-backend/
├── apps/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── product-service/
│   ├── inventory-service/
│   ├── order-service/
│   ├── payment-service/
│   └── notification-service/
├── libs/
│   └── common/
│       └── src/
            ├── config/
│           ├── database/
│           ├── dto/
│           ├── events/
│           ├── guards/
│           ├── http/
│           ├── rabbitmq/
│           └── redis/
├── docker-compose.yml
├── nest-cli.json
├── package.json
└── tsconfig.json
```
---

## Shared Common Library

Shared code lives in `libs/common/src` and should be imported with
`@app/common`.

| Folder      | Purpose                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `database/` | Shared PostgreSQL/TypeORM setup helpers.                                                                   |
| `dto/`      | Shared request DTOs used by the gateway and services.                                                      |
| `events/`   | Domain event names, payload contracts, and message metadata types.                                         |
| `guards/`   | Shared Nest guards such as `JwtAuthGuard`.                                                                 |
| `http/`     | Correlation ID middleware, request logging, exception filter, app bootstrap, and proxy forwarding helpers. |
| `rabbitmq/` | RabbitMQ module, publisher, queue setup, retry/dead-letter helpers, and domain event consumer helper.      |
| `redis/`    | Shared Redis module and DI token.                                                                          |

---

## Prerequisites

- Node.js 20+
- npm
- Docker
- Docker Compose
- NestJS CLI

---

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Start local infrastructure:

   ```bash
   npm run infra:up
   ```

4. Start services in separate terminals as needed:

   ```bash
   npm run start:api-gateway:dev
   npm run start:auth-service:dev
   npm run start:product-service:dev
   npm run start:inventory-service:dev
   npm run start:order-service:dev
   npm run start:payment-service:dev
   npm run start:notification-service:dev
   ```

5. Open the API Gateway at:

   ```text
   http://localhost:3000
   ```

---

## HTTP Endpoints

Most client traffic should go through the API Gateway at
`http://localhost:3000`. Internal service endpoints are listed for local
debugging and service-to-service context.

### API Gateway (`localhost:3000`)

| Method  | Path                                    | Auth   | Description                                           |
| ------- | --------------------------------------- | ------ | ----------------------------------------------------- |
| `GET`   | `/health`                               | Public | Basic API Gateway health response.                    |
| `GET`   | `/health/live`                          | Public | Liveness check.                                       |
| `GET`   | `/health/ready`                         | Public | Readiness check.                                      |
| `POST`  | `/auth/register`                        | Public | Register a user account.                              |
| `POST`  | `/auth/login`                           | Public | Log in and receive a JWT.                             |
| `POST`  | `/products`                             | JWT    | Create a product.                                     |
| `GET`   | `/products`                             | JWT    | List products.                                        |
| `GET`   | `/products/:id`                         | JWT    | Get one product by ID.                                |
| `PATCH` | `/products/:id`                         | JWT    | Update one product by ID.                             |
| `POST`  | `/inventory/items`                      | JWT    | Create an inventory item for a product.               |
| `GET`   | `/inventory/items`                      | JWT    | List inventory items.                                 |
| `GET`   | `/inventory/items/:productId`           | JWT    | Get inventory by product ID.                          |
| `PATCH` | `/inventory/items/:productId/add-stock` | JWT    | Add stock to a product inventory row.                 |
| `POST`  | `/orders`                               | JWT    | Create an order for the authenticated user.           |
| `GET`   | `/orders`                               | JWT    | List orders for the authenticated user.               |
| `GET`   | `/orders/:id`                           | JWT    | Get one order for the authenticated user.             |

### Auth Service (`localhost:3001`)

| Method | Path             | Auth   | Description                           |
| ------ | ---------------- | ------ | ------------------------------------- |
| `GET`  | `/health/live`   | Public | Liveness check.                       |
| `GET`  | `/health/ready`  | Public | Readiness check.                      |
| `POST` | `/auth/register` | Public | Register a user account.              |
| `POST` | `/auth/login`    | Public | Log in and receive a JWT.             |
| `GET`  | `/auth/me`       | JWT    | Return the authenticated JWT payload. |

### Product Service (`localhost:3002`)

| Method  | Path            | Auth     | Description                                              |
| ------- | --------------- | -------- | -------------------------------------------------------- |
| `GET`   | `/health/live`  | Public   | Liveness check.                                          |
| `GET`   | `/health/ready` | Public   | Readiness check.                                         |
| `POST`  | `/products`     | Internal | Create a product and publish `product.created`.          |
| `GET`   | `/products`     | Internal | List products, using Redis cache when available.         |
| `GET`   | `/products/:id` | Internal | Get one product by ID, using Redis cache when available. |
| `PATCH` | `/products/:id` | Internal | Update one product and invalidate product caches.        |

### Inventory Service (`localhost:3005`)

| Method  | Path                                    | Auth     | Description                             |
| ------- | --------------------------------------- | -------- | --------------------------------------- |
| `GET`   | `/health/live`                          | Public   | Liveness check.                         |
| `GET`   | `/health/ready`                         | Public   | Readiness check.                        |
| `POST`  | `/inventory/items`                      | Internal | Create an inventory item for a product. |
| `GET`   | `/inventory/items`                      | Internal | List inventory items.                   |
| `GET`   | `/inventory/items/:productId`           | Internal | Get inventory by product ID.            |
| `PATCH` | `/inventory/items/:productId/add-stock` | Internal | Add stock to a product inventory row.   |

### Order Service (`localhost:3004`)

| Method | Path            | Auth             | Description                                  |
| ------ | --------------- | ---------------- | -------------------------------------------- |
| `GET`  | `/health/live`  | Public           | Liveness check.                              |
| `GET`  | `/health/ready` | Public           | Readiness check.                             |
| `POST` | `/orders`       | Internal headers | Create an order and publish `order.created`. |
| `GET`  | `/orders`       | Internal headers | List orders for the forwarded user ID.       |
| `GET`  | `/orders/:id`   | Internal headers | Get one order for the forwarded user ID.     |

Order Service expects API Gateway to forward `x-user-id` and `x-correlation-id`
headers.

### Payment Service (`localhost:3006`)

| Method | Path            | Auth           | Description                                          |
| ------ | --------------- | -------------- | ---------------------------------------------------- |
| `GET`  | `/health/live`  | Public         | Liveness check.                                      |
| `GET`  | `/health/ready` | Public         | Readiness check.                                     |
| `GET`  | `/payments`     | Internal/debug | List payment records for local event-flow debugging. |

### Notification Service (`localhost:3003`)

| Method | Path            | Auth   | Description      |
| ------ | --------------- | ------ | ---------------- |
| `GET`  | `/health/live`  | Public | Liveness check.  |
| `GET`  | `/health/ready` | Public | Readiness check. |

Notification Service primarily consumes RabbitMQ events and does not expose
domain HTTP routes.

---

## Useful Scripts

| Command                                  | Description                                     |
| ---------------------------------------- | ----------------------------------------------- |
| `npm run infra:up`                       | Start PostgreSQL, Redis, and RabbitMQ.          |
| `npm run infra:down`                     | Stop local infrastructure.                      |
| `npm run infra:logs`                     | Follow infrastructure logs.                     |
| `npm run infra:ps`                       | Show infrastructure container status.           |
| `npm run start:api-gateway:dev`          | Start API Gateway in watch mode.                |
| `npm run start:auth-service:dev`         | Start Auth Service in watch mode.               |
| `npm run start:product-service:dev`      | Start Product Service in watch mode.            |
| `npm run start:inventory-service:dev`    | Start Inventory Service in watch mode.          |
| `npm run start:order-service:dev`        | Start Order Service in watch mode.              |
| `npm run start:payment-service:dev`      | Start Payment Service in watch mode.            |
| `npm run start:notification-service:dev` | Start Notification Service in watch mode.       |
| `npm run format`                         | Format TypeScript files in `apps/` and `libs/`. |

---

## Environment Variables

Use `.env.example` as the source of truth for local values. Key groups include:

- Service ports and internal URLs
- PostgreSQL connection settings
- Redis connection settings and product cache TTL
- JWT secret and expiry
- RabbitMQ connection string and exchange names
- Payment simulation mode

---

## Development Notes

- Keep reusable cross-service logic in `libs/common/src`.
- Only create shared folders when there is real duplication or cross-service
  reuse.
- Keep service-specific business logic inside the owning app.
- Prefer importing shared contracts and helpers from `@app/common`.
- `NODE_ENV=development` enables TypeORM `synchronize` for local learning
  convenience. Use migrations instead for production.

--- 

## License
This project is licensed under the [MIT License](LICENSE).