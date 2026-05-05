# SwiftCart Backend

Monorepo for the SwiftCart backend microservices.

## Repository structure

```text
swiftcart-backend/
├─ apps/
│  ├─ api-gateway/
│  ├─ auth-service/
│  ├─ product-service/
│  ├─ inventory-service/
│  ├─ order-service/
│  └─ notification-service/
├─ libs/
│  └─ common/
│     └─ src/
│        ├─ dto/
│        ├─ events/
│        ├─ guards/
│        ├─ interceptors/
│        ├─ filters/
│        ├─ rabbitmq/
│        ├─ redis/
│        └─ database/
├─ docker/
│  ├─ postgres/
│  └─ rabbitmq/
├─ k8s/
│  ├─ base/
│  └─ dev/
├─ docker-compose.yml
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Notes

- Some directories currently contain `.gitkeep` placeholders so implementation can be added incrementally without another structural migration.
- Shared contracts and integrations should be centralized in `libs/common/src`.
