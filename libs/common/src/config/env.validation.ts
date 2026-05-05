import * as Joi from 'joi';

// This schema validates environment variables at service startup.
// If a required variable is missing or invalid, the service fails fast.
export const envValidationSchema = Joi.object({
  // Runtime environment.
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  // Service ports.
  API_GATEWAY_PORT: Joi.number().default(3000),
  AUTH_SERVICE_PORT: Joi.number().default(3001),
  PRODUCT_SERVICE_PORT: Joi.number().default(3002),
  NOTIFICATION_SERVICE_PORT: Joi.number().default(3003),
  ORDER_SERVICE_PORT: Joi.number().default(3004),
  INVENTORY_SERVICE_PORT: Joi.number().default(3005),
  PAYMENT_SERVICE_PORT: Joi.number().default(3006),

  // Internal service URLs used by the API Gateway.
  AUTH_SERVICE_URL: Joi.string().uri().required(),
  PRODUCT_SERVICE_URL: Joi.string().uri().required(),
  ORDER_SERVICE_URL: Joi.string().uri().required(),
  INVENTORY_SERVICE_URL: Joi.string().uri().required(),

  // PostgreSQL connection settings.
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  // Redis connection settings.
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  PRODUCT_CACHE_TTL_SECONDS: Joi.number().default(60),

  // RabbitMQ connection settings.
  RABBITMQ_URL: Joi.string().required(),
  RABBITMQ_EXCHANGE: Joi.string().default('swiftcart.events'),
  RABBITMQ_DEAD_LETTER_EXCHANGE: Joi.string().default('swiftcart.dead-letter'),
  RABBITMQ_RETRY_EXCHANGE: Joi.string().default('swiftcart.retry'),

  // JWT settings.
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),

  // Local payment simulation.
  PAYMENT_SIMULATION_MODE: Joi.string()
    .valid('always_success', 'always_fail', 'random')
    .default('random'),
});
