export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
  };
  jwt: {
    accessSecret: string;
    accessExpiry: string;
    refreshSecret: string;
    refreshExpiry: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  meilisearch: {
    host: string;
    apiKey: string;
  };
  s3: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
  };
  cors: {
    origins: string[];
  };
  throttle: {
    ttl: number;
    limit: number;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  apiPrefix: process.env['API_PREFIX'] ?? 'api/v1',
  database: {
    url: process.env['DATABASE_URL'] ?? '',
  },
  redis: {
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
  },
  jwt: {
    accessSecret: process.env['JWT_ACCESS_SECRET'] ?? '',
    accessExpiry: process.env['JWT_ACCESS_EXPIRY'] ?? '15m',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] ?? '',
    refreshExpiry: process.env['JWT_REFRESH_EXPIRY'] ?? '7d',
  },
  stripe: {
    secretKey: process.env['STRIPE_SECRET_KEY'] ?? '',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] ?? '',
  },
  meilisearch: {
    host: process.env['MEILISEARCH_HOST'] ?? 'http://localhost:7700',
    apiKey: process.env['MEILISEARCH_API_KEY'] ?? '',
  },
  s3: {
    endpoint: process.env['S3_ENDPOINT'] ?? '',
    accessKey: process.env['S3_ACCESS_KEY'] ?? '',
    secretKey: process.env['S3_SECRET_KEY'] ?? '',
    bucket: process.env['S3_BUCKET'] ?? 'lankamart-uploads',
    region: process.env['S3_REGION'] ?? 'ap-south-1',
  },
  cors: {
    origins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:3000').split(','),
  },
  throttle: {
    ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60000', 10),
    limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '100', 10),
  },
});
