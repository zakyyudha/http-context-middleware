import express from 'express';
// Import the specific functions and types we need
import { HttpContext, adapters } from '../src';

const app = express();

// Apply the http-context-middleware middleware
app.use(adapters.express({ includeReqRes: false }));

// Add a logger middleware that uses context
app.use((req, res, next) => {
  const requestId = HttpContext.get('requestId');
  console.log(`[${requestId}] ${req.method} ${req.path} - Request started`);

  // Add a response hook
  res.on('finish', () => {
    const duration = HttpContext.get('requestDuration');
    console.log(
      `[${requestId}] ${req.method} ${req.path} - Request completed in ${duration}ms with status ${res.statusCode}`
    );
  });

  next();
});

// Example route that stores custom data in context
app.get('/api/users', (req, res) => {
  // Store user information in the context
  HttpContext.set('userId', '12345');
  HttpContext.set('userRole', 'admin');

  // Business logic can access this context
  processUserRequest();

  res.json({ message: 'User data processed successfully' });
});

// Route that causes an error
app.get('/api/error', (req, res) => {
  HttpContext.set('errorType', 'Simulated error');

  // Throw an error for demonstration
  throw new Error('Something went wrong');
});

// Error handler middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = HttpContext.get('requestId');
  const errorType = HttpContext.get('errorType') || 'Unknown';

  console.error(`[${requestId}] Error (${errorType}): ${err.message}`);

  res.status(500).json({
    error: err.message,
    requestId,
    errorType,
  });
});

// Business logic in another function can access the same context
function processUserRequest() {
  const requestId = HttpContext.get('requestId');
  const userId = HttpContext.get('userId');
  const userRole = HttpContext.get('userRole');

  console.log(`[${requestId}] Processing request for user ${userId} with role ${userRole}`);

  // Do some processing...
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/api/users`);
  console.log(`Try accessing: http://localhost:${PORT}/api/error`);
});
