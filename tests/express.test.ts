import * as express from 'express';
import * as request from 'supertest';
import { adapters, HttpContext } from '../src';

describe('Express Adapter', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express.default();
    app.use(adapters.express());
  });

  test('should create and maintain context through request lifecycle', async () => {
    // Create a route that accesses context
    app.get('/test', (req, res) => {
      const requestId = HttpContext.get('requestId');
      const startTime = HttpContext.get('startTime');

      // Store some custom value
      HttpContext.set('customValue', 'test123');

      res.json({
        requestId,
        startTimeExists: !!startTime,
        customValue: HttpContext.get('customValue'),
      });
    });

    const response = await request.default(app).get('/test');

    expect(response.status).toBe(200);
    expect(response.body.requestId).toBeDefined();
    expect(response.body.startTimeExists).toBe(true);
    expect(response.body.customValue).toBe('test123');
  });

  test('should use x-request-id header when provided', async () => {
    app.get('/with-header', (req, res) => {
      const requestId = HttpContext.get('requestId');
      res.json({ requestId });
    });

    const customRequestId = 'custom-request-id-12345';
    const response = await request
      .default(app)
      .get('/with-header')
      .set('x-request-id', customRequestId);

    expect(response.status).toBe(200);
    expect(response.body.requestId).toBe(customRequestId);
  });

  test('should include req/res in context when enabled', async () => {
    // Create a new app with includeReqRes option
    const appWithReqRes = express.default();
    appWithReqRes.use(adapters.express({ includeReqRes: true }));

    appWithReqRes.get('/with-req-res', (req, res) => {
      const contextReq = HttpContext.get('req');
      const contextRes = HttpContext.get('res');

      res.json({
        hasReq: !!contextReq,
        hasRes: !!contextRes,
        pathMatch: contextReq?.path === '/with-req-res',
      });
    });

    const response = await request.default(appWithReqRes).get('/with-req-res');

    expect(response.status).toBe(200);
    expect(response.body.hasReq).toBe(true);
    expect(response.body.hasRes).toBe(true);
    expect(response.body.pathMatch).toBe(true);
  });

  test('should calculate request duration', async () => {
    app.get('/duration', (req, res) => {
      // Simulate some processing time
      setTimeout(() => {
        res.json({ success: true });
      }, 50);
    });

    // Add middleware to capture duration after request is processed
    app.use((req, res, next) => {
      res.on('finish', () => {
        const duration = HttpContext.get('requestDuration');
        expect(duration).toBeDefined();
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThanOrEqual(50);
      });
      next();
    });

    await request.default(app).get('/duration');
  });

  test('should maintain separate contexts for concurrent requests', async () => {
    app.get('/request1', (req, res) => {
      HttpContext.set('value', 'request1');

      // Add a small delay to ensure requests overlap
      setTimeout(() => {
        const value = HttpContext.get('value');
        res.json({ value });
      }, 50);
    });

    app.get('/request2', (req, res) => {
      HttpContext.set('value', 'request2');
      res.json({ value: HttpContext.get('value') });
    });

    // Start both requests nearly simultaneously
    const promise1 = request.default(app).get('/request1');
    const promise2 = request.default(app).get('/request2');

    const [response1, response2] = await Promise.all([promise1, promise2]);

    expect(response1.body.value).toBe('request1');
    expect(response2.body.value).toBe('request2');
  });
});
