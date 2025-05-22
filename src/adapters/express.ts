import { Request, Response, NextFunction } from 'express';
import { IHttpContext, HttpContext } from '../index';

/**
 * Options for the Express middleware
 */
export interface IExpressMiddlewareOptions {
  /**
   * Whether to include req/res objects in the context
   * @default false
   */
  includeReqRes?: boolean;
}

/**
 * Create Express middleware for HTTP context
 * @param options - Configuration options
 * @returns Express middleware function
 */
function expressContextMiddleware(
  options: IExpressMiddlewareOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const { includeReqRes = false } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Create initial context
    const context: IHttpContext = {
      requestId: (req.headers['x-request-id'] as string) || HttpContext.generateRequestId(),
      startTime: Date.now(),
      route: req.path,
      method: req.method,
    };

    // Optionally include req/res objects
    if (includeReqRes) {
      context.req = req;
      context.res = res;
    }

    // Run the middleware chain with this context
    HttpContext.runWithContext(context, () => {
      // Add a response hook to capture timing information
      const originalEnd = res.end;

      // Use any type for the function to avoid TypeScript errors
      // but maintain the same behavior
      res.end = function (this: Response, ...args: any[]): Response {
        // Calculate request duration
        const startTime = HttpContext.get<number>('startTime') || 0;
        const requestDuration = Date.now() - startTime;
        HttpContext.set('requestDuration', requestDuration);

        // Optionally set the request ID in the response headers
        if (context.requestId) {
          res.setHeader('X-Request-ID', context.requestId);
        }

        // Forward all arguments to the original function
        // Ensure we meet the expected signature requirements
        return originalEnd.apply(this, args as [any, BufferEncoding, (() => void) | undefined]);
      } as any;

      next();
    });
  };
}

export default expressContextMiddleware;
