import { createProxyMiddleware } from 'http-proxy-middleware';
import { gatewayConfig } from '../config';

interface ServiceRoute {
  path: string;
  target: string;
  changeOrigin: boolean;
  pathRewrite?: Record<string, string>;
  authRequired?: boolean;
  allowedRoles?: string[];
  rateLimit?: { windowMs: number; max: number };
}

const serviceRoutes: ServiceRoute[] = [
  {
    path: '/api/auth',
    target: gatewayConfig.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/api/auth' },
    authRequired: false,
  },
  {
    path: '/api/users',
    target: gatewayConfig.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/api/users' },
    authRequired: true,
  },
  {
    path: '/api/products',
    target: gatewayConfig.CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/products': '/api/products' },
    authRequired: false,
  },
  {
    path: '/api/categories',
    target: gatewayConfig.CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/categories': '/api/categories' },
    authRequired: false,
  },
  {
    path: '/api/orders',
    target: gatewayConfig.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '/api/orders' },
    authRequired: true,
  },
  {
    path: '/api/payments',
    target: gatewayConfig.PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/payments': '/api/payments' },
    authRequired: true,
  },
  {
    path: '/api/wallet',
    target: gatewayConfig.PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/wallet': '/api/wallet' },
    authRequired: true,
  },
  {
    path: '/api/ai',
    target: gatewayConfig.AI_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/ai': '/api/ai' },
    authRequired: true,
  },
  {
    path: '/api/notifications',
    target: gatewayConfig.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '/api/notifications' },
    authRequired: true,
  },
  {
    path: '/api/preferences',
    target: gatewayConfig.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/preferences': '/api/preferences' },
    authRequired: true,
  },
];

export function createProxyMiddlewareForService(route: ServiceRoute) {
  return createProxyMiddleware({
    target: route.target,
    changeOrigin: route.changeOrigin,
    pathRewrite: route.pathRewrite,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${route.path}:`, err);
      res.status(502).json({
        code: 'BAD_GATEWAY',
        message: 'Service temporarily unavailable',
      });
    },
    onProxyReq: (proxyReq, req) => {
      // Forward user info headers to downstream services
      if ((req as any).user) {
        const user = (req as any).user;
        proxyReq.setHeader('x-user-id', user.id);
        proxyReq.setHeader('x-user-email', user.email);
        proxyReq.setHeader('x-user-role', user.role);
        if (user.sessionId) {
          proxyReq.setHeader('x-session-id', user.sessionId);
        }
      }
      // Forward original IP
      proxyReq.setHeader('x-forwarded-for', req.ip);
      proxyReq.setHeader('x-forwarded-proto', req.protocol);
    },
    timeout: 30000,
    proxyTimeout: 30000,
  });
}

export { serviceRoutes };