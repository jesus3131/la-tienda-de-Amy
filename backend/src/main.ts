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
app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'erp-pos-backend' }));

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

server.listen(env.PORT, async () => {
  try {
    await connectWithRetry();
    console.log(`ERP/POS backend running on port ${env.PORT}`);
    startOutboxPublisher();
  } catch (e) {
    console.error('DB connection failed', e);
  }
});
