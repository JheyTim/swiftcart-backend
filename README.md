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
- Local Kubernetes deployment

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
| Orchestration | Kubernetes |
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
├── k8s/
├── libs/
│   └── common/
│       └── src/
│           ├── config/
│           ├── database/
│           ├── dto/
│           ├── events/
│           ├── guards/
│           ├── http/
│           ├── rabbitmq/
│           └── redis/
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── LICENSE
├── nest-cli.json
├── package-lock.json
├── package.json
├── README.md
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
- kubectl
- Docker Desktop Kubernetes

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

## API Testing Flow

### 1. Register User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: register-1" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

---

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: login-1" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Store the returned token:

```bash
TOKEN="PASTE_ACCESS_TOKEN_HERE"
```

---

### 3. Create Product

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-correlation-id: product-1" \
  -d '{
    "name": "Mechanical Keyboard",
    "description": "A compact mechanical keyboard for developers",
    "priceCents": 499900,
    "isActive": true
  }'
```

Store the product ID:

```bash
PRODUCT_ID="PASTE_PRODUCT_ID_HERE"
```

---

### 4. List Products

```bash
curl http://localhost:3000/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-correlation-id: products-list-1"
```

---

### 5. Seed Inventory

```bash
curl -X POST http://localhost:3000/inventory/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-correlation-id: inventory-1" \
  -d '{
    "productId": "'"$PRODUCT_ID"'",
    "availableQuantity": 10
  }'
```

---

### 6. Create Order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-correlation-id: order-1" \
  -d '{
    "items": [
      {
        "productId": "'"$PRODUCT_ID"'",
        "productName": "Mechanical Keyboard",
        "unitPriceCents": 499900,
        "quantity": 2
      }
    ]
  }'
```

Store the order ID:

```bash
ORDER_ID="PASTE_ORDER_ID_HERE"
```

---

### 7. Check Order Status

Because this project uses asynchronous events, the order status may take a moment to update.

```bash
curl http://localhost:3000/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-correlation-id: order-status-1"
```

Expected successful final status:

```txt
PAID
```

Expected payment failure final status:

```txt
PAYMENT_FAILED
```

Expected inventory failure final status:

```txt
CANCELLED
```

---

## RabbitMQ Dashboard

Open:

```txt
http://localhost:15672
```

Credentials:

```txt
Username: swiftcart
Password: swiftcart_password
```

Useful sections:

```txt
Exchanges
Queues
Bindings
```

Expected exchanges:

```txt
swiftcart.events
swiftcart.retry
swiftcart.dead-letter
```

Expected queues include:

```txt
notification.product-created
notification.order-created
inventory.order-created
payment.inventory-reserved
order.inventory-reserved
order.inventory-reservation-failed
order.payment-succeeded
order.payment-failed
inventory.payment-succeeded
inventory.payment-failed
```

---

## Kubernetes Local Deployment

### Build Docker Images

```bash
docker build --build-arg APP_NAME=api-gateway -t swiftcart/api-gateway:local .
docker build --build-arg APP_NAME=auth-service -t swiftcart/auth-service:local .
docker build --build-arg APP_NAME=product-service -t swiftcart/product-service:local .
docker build --build-arg APP_NAME=order-service -t swiftcart/order-service:local .
docker build --build-arg APP_NAME=inventory-service -t swiftcart/inventory-service:local .
docker build --build-arg APP_NAME=payment-service -t swiftcart/payment-service:local .
docker build --build-arg APP_NAME=notification-service -t swiftcart/notification-service:local .
```

Because the Kubernetes manifests use `imagePullPolicy: Never`, the images must exist inside the local Kubernetes cluster.

For Docker Desktop Kubernetes, locally built Docker images are usually available directly.

---

### Apply Kubernetes Manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-service.yaml
kubectl apply -f k8s/redis-statefulset.yaml
kubectl apply -f k8s/rabbitmq-service.yaml
kubectl apply -f k8s/rabbitmq-statefulset.yaml

kubectl apply -f k8s/api-gateway-service.yaml
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/auth-service-deployment.yaml
kubectl apply -f k8s/product-service.yaml
kubectl apply -f k8s/product-service-deployment.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/order-service-deployment.yaml
kubectl apply -f k8s/inventory-service.yaml
kubectl apply -f k8s/inventory-service-deployment.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/payment-service-deployment.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/notification-service-deployment.yaml
```

Or apply everything:

```bash
kubectl apply -f k8s/
```

For a fresh setup, applying the files in order is easier to debug. Once everything is stable, `kubectl apply -f k8s/` is fine.

Check status:

```bash
kubectl get all -n swiftcart
kubectl get pods -n swiftcart
kubectl get svc -n swiftcart
kubectl get endpoints -n swiftcart
kubectl get pvc -n swiftcart
```

---

### Access API Gateway in Kubernetes

Check the API Gateway LoadBalancer service:

```bash
kubectl get svc api-gateway -n swiftcart
```

If `EXTERNAL-IP` is `localhost`, access the API Gateway at `http://localhost:3000`.

Expected example:

```txt
NAME          TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)
api-gateway   LoadBalancer   10.x.x.x       localhost     3000:xxxxx/TCP
```

Test:

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

---

### Internal Kubernetes Service Names

Inside the `swiftcart` namespace, services communicate using these names:

| Component | Internal Address |
|---|---|
| PostgreSQL | `postgres:5432` |
| Redis | `redis:6379` |
| RabbitMQ | `rabbitmq:5672` |
| API Gateway | `http://api-gateway:3000` |
| Auth Service | `http://auth-service:3001` |
| Product Service | `http://product-service:3002` |
| Notification Service | `http://notification-service:3003` |
| Order Service | `http://order-service:3004` |
| Inventory Service | `http://inventory-service:3005` |
| Payment Service | `http://payment-service:3006` |

---

### Access RabbitMQ Dashboard in Kubernetes

```bash
kubectl port-forward -n swiftcart service/rabbitmq 15672:15672
```

Keep this command running while using the dashboard.

Open:

```txt
http://localhost:15672
```

Credentials come from `k8s/secret.yaml`.

---

### Restart App Deployments After Rebuild

Rebuild the Docker images before restarting deployments.

```bash
kubectl rollout restart deployment -n swiftcart
```

---

### Stop Workloads Without Deleting Data

```bash
kubectl scale deployment --all -n swiftcart --replicas=0
kubectl scale statefulset --all -n swiftcart --replicas=0
```

---

### Start Workloads Again

```bash
kubectl scale statefulset --all -n swiftcart --replicas=1
kubectl scale deployment --all -n swiftcart --replicas=1
```

---

### Delete Kubernetes Resources

```bash
kubectl delete namespace swiftcart
```

This removes all resources in the namespace, including pods, services, deployments, statefulsets, configmaps, secrets, and persistent volume claims.

---

### Kubernetes Debugging

Replace `<service-name>` with a service label such as `api-gateway`, `auth-service`, or `product-service`.

```bash
kubectl logs -n swiftcart -l app=<service-name>
```

Check pods:

```bash
kubectl get pods -n swiftcart
```

Check service endpoints:

```bash
kubectl get endpoints -n swiftcart
```

View API Gateway logs:

```bash
kubectl logs -n swiftcart -l app=api-gateway
```

Follow API Gateway logs:

```bash
kubectl logs -n swiftcart -l app=api-gateway --follow
```

View logs for a specific service:

```bash
kubectl logs -n swiftcart -l app=auth-service
kubectl logs -n swiftcart -l app=product-service
kubectl logs -n swiftcart -l app=order-service
```

Describe a failing pod:

```bash
kubectl describe pod -n swiftcart -l app=api-gateway
```

Check previous logs after a restart:

```bash
kubectl logs -n swiftcart -l app=api-gateway --previous
```


---

## Correlation IDs

Every request can include:

```txt
x-correlation-id
```

Example:

```bash
curl http://localhost:3000/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-correlation-id: local-debug-123"
```

Expected behavior:

```txt
API Gateway logs include local-debug-123
Internal service logs include local-debug-123
RabbitMQ event metadata may include local-debug-123
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