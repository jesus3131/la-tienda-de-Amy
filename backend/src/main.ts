import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { env } from './config/env';
import { pool, connectWithRetry } from './config/database';
import { errorHandler } from './shared/middleware/errorHandler';
import { initWebSocket } from './shared/websocket/wsServer';
import { startOutboxPublisher } from './shared/outbox/publisher';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { createLocalNodeStatus } from './shared/sync/localStatus';
import { isAllowedFrontendOrigin } from './config/env';
import { requestContext } from './shared/middleware/requestContext';

// module routes
import { authRoutes } from './modules/auth/presentation/authController';
import { productRoutes } from './modules/products/presentation/productController';
import { categoryRoutes } from './modules/categories/presentation/categoryController';
import { supplierRoutes } from './modules/suppliers/presentation/supplierController';
import { customerRoutes } from './modules/customers/presentation/customerController';
import { inventoryRoutes } from './modules/inventory/presentation/inventoryController';
import { purchaseRoutes } from './modules/purchases/presentation/purchaseController';
import { saleRoutes } from './modules/sales/presentation/saleController';
import { cashRoutes } from './modules/cash/presentation/cashController';
import { reportRoutes } from './modules/reports/presentation/reportController';

const app = express();
app.use(requestContext);
app.use(helmet({ contentSecurityPolicy: false }));
const rateLimitMax = process.env.NODE_ENV === 'production' ? 300 : 10000;
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: rateLimitMax, standardHeaders: true, legacyHeaders: false }));
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || !isAllowedFrontendOrigin(requestOrigin)) {
        callback(null, false);
        return;
      }
      callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(require('path').join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'erp-pos-backend' }));
app.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', service: 'erp-pos-backend' });
  } catch {
    res.status(503).json({ status: 'not_ready', service: 'erp-pos-backend' });
  }
});

app.get('/sync/status', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE published=false AND failed=false)::int AS pending,
         COUNT(*) FILTER (WHERE failed=true)::int AS failed
       FROM outbox_events`,
    );
    res.json({ ...createLocalNodeStatus(env.NODE_ROLE, env.NODE_ID, rows[0]?.pending || 0), failedOutbox: rows[0]?.failed || 0 });
  } catch {
    res.status(503).json({
      mode: env.NODE_ROLE === 'local' ? 'local' : 'central',
      nodeId: env.NODE_ID,
      syncConfigured: false,
      error: 'sync_status_unavailable',
    });
  }
});

authRoutes(app);
productRoutes(app);
categoryRoutes(app);
supplierRoutes(app);
customerRoutes(app);
inventoryRoutes(app);
purchaseRoutes(app);
saleRoutes(app);
cashRoutes(app);
reportRoutes(app);

app.use(errorHandler);

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'ERP/POS API', version: '1.0.0' },
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  },
  apis: [],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const server = http.createServer(app);
initWebSocket(server);

server.listen(env.PORT, env.HOST, async () => {
  try {
    await connectWithRetry();
    console.log(`ERP/POS backend running on ${env.HOST}:${env.PORT} as ${env.NODE_ROLE} node`);
    startOutboxPublisher();
  } catch (e) {
    console.error('DB connection failed', e);
  }
});
