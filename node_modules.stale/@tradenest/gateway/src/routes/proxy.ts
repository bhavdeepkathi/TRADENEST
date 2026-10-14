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
    pathRewrite: { '^/auth': '/api/auth' },
    authRequired: false,
  },
  {
    path: '/api/users',
    target: gatewayConfig.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/users': '/api/users' },
    authRequired: true,
  },
  {
    path: '/api/products',
    target: gatewayConfig.CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/products': '/api/products' },
    authRequired: false,
  },
  {
    path: '/api/categories',
    target: gatewayConfig.CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/categories': '/api/categories' },
    authRequired: false,
  },
  {
    path: '/api/orders',
    target: gatewayConfig.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/orders': '/api/orders' },
    authRequired: true,
  },
  {
    path: '/api/cart',
    target: gatewayConfig.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/cart': '/api/cart' },
    authRequired: true,
  },
  {
    path: '/api/payments',
    target: gatewayConfig.PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/payments': '/api/payments' },
    authRequired: true,
  },
  {
    path: '/api/wallet',
    target: gatewayConfig.PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/wallet': '/api/wallet' },
    authRequired: true,
  },
  {
    path: '/api/ai',
    target: gatewayConfig.AI_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/ai': '/api/ai' },
    authRequired: true,
  },
  {
    path: '/api/notifications',
    target: gatewayConfig.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/notifications': '/api/notifications' },
    authRequired: true,
  },
  {
    path: '/api/preferences',
    target: gatewayConfig.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/preferences': '/api/preferences' },
    authRequired: true,
  },
];

function getTargetForPath(path: string): { target: string; changeOrigin: boolean; pathRewrite: Record<string, string> } | undefined {
  // path is the full request path (e.g., /api/categories)
  const route = serviceRoutes.find(r => path.startsWith(r.path));
  if (!route) return undefined;
  return {
    target: route.target,
    changeOrigin: route.changeOrigin,
    pathRewrite: route.pathRewrite || {},
  };
}

export function createProxyMiddlewareForGateway() {
  return createProxyMiddleware({
    router: (req: any) => {
      const path = req.originalUrl.split('?')[0];
      console.log(`[Proxy] Router called with path: ${path}`);
      const config = getTargetForPath(path);
      if (!config) {
        console.log(`[Proxy] No config found for ${path}`);
        return undefined;
      }
      console.log(`[Proxy] Routing ${req.method} ${path} -> ${config.target}`);
      return config.target;
    },
    changeOrigin: true,
    pathRewrite: (path: string, req: any) => {
      const fullPath = req.originalUrl.split('?')[0];
      console.log(`[Proxy] pathRewrite called with: ${path}, fullPath: ${fullPath}`);
      const config = getTargetForPath(fullPath);
      if (!config || !config.pathRewrite) {
        console.log(`[Proxy] No config or pathRewrite for ${fullPath}`);
        return path;
      }

      let rewritten = path;
      for (const [pattern, replacement] of Object.entries(config.pathRewrite)) {
        const regex = new RegExp(pattern);
        const before = rewritten;
        rewritten = rewritten.replace(regex, replacement);
        console.log(`[Proxy] Pattern ${pattern} -> ${replacement}: ${before} -> ${rewritten}`);
      }
      console.log(`[Proxy] Path rewrite final: ${path} -> ${rewritten}`);
      return rewritten;
    },
    on: {
      proxyReq: (proxyReq: any, req: any) => {
        console.log(`[Proxy] onProxyReq: ${req.method} ${req.path}, user: ${!!(req as any).user}`);
        if ((req as any).user) {
          const user = (req as any).user;
          console.log(`[Proxy] Setting x-user-id: ${user.id}`);
          proxyReq.setHeader('x-user-id', user.id);
          proxyReq.setHeader('x-user-email', user.email);
          proxyReq.setHeader('x-user-role', user.role);
          if (user.sessionId) {
            proxyReq.setHeader('x-session-id', user.sessionId);
          }
        }
        proxyReq.setHeader('x-forwarded-for', req.ip || '');
        proxyReq.setHeader('x-forwarded-proto', req.protocol);
      },
      proxyRes: (proxyRes: any, req: any, res: any) => {
        console.log(`[Proxy] Response: ${req.method} ${req.path} -> ${proxyRes.statusCode}`);
      },
      error: (err: any, req: any, res: any, target: any) => {
        console.error(`Proxy error:`, err);
        if (!res.headersSent) {
          res.status(502).json({
            code: 'BAD_GATEWAY',
            message: 'Service temporarily unavailable',
          });
        }
      },
    },
    timeout: 30000,
    proxyTimeout: 30000,
  });
}

export { serviceRoutes };