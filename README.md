# http-context-middleware

# HTTP Context Middleware for Node.js Framework

[![npm version](https://img.shields.io/npm/v/@zakyyudha/http-context-middleware.svg)](https://www.npmjs.com/package/@zakyyudha/http-context-middleware)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, framework-agnostic middleware for managing HTTP context across Node.js applications using AsyncLocalStorage.

## Features

- 🌐 Access request context from anywhere in your codebase
- 🔄 Thread-safe for concurrent requests
- 🧩 Framework-agnostic (adapters available for Express, more coming soon)
- 📋 TypeScript support with full type definitions
- 🔍 Request tracking with automatic IDs and timing
- 🧪 Well-tested

## Installation

```bash
npm install @zakyyudha/http-context-middleware
```

## Features

- Framework-agnostic context management
- Built-in adapters for Express (with more to come)
- Request tracking with unique request IDs
- Request timing out of the box
- Simple API for getting and setting context values

## Usage

### With Express.js

```javascript
const express = require('express');
const { HttpContext, adapters } = require('@zakyyudha/http-context-middleware');

const app = express();

// Apply the middleware
app.use(adapters.express());

// Use context in other middleware
app.use((req, res, next) => {
  // Store values in context
  HttpContext.set('user', { id: 1, name: 'John' });
  next();
});

app.get('/', (req, res) => {
  // Retrieve values from context
  const requestId = HttpContext.get('requestId');
  const user = HttpContext.get('user');

  res.json({
    message: 'Hello World',
    requestId,
    user,
  });
});

app.listen(3000);
```

### Core API

- `HttpContext.getContext()` - Returns the entire context object or null
- `HttpContext.get(key)` - Gets a value from the context
- `HttpContext.set(key, value)` - Sets a value in the context
- `HttpContext.runWithContext(context, callback)` - Runs a function with a given context

### Express Adapter

- `adapters.express(options)` - Creates Express middleware
  - Options:
    - `includeReqRes`: Whether to include req/res objects in context (default: false)

## Future Plans

- Support for more frameworks: Koa, Fastify, Hapi, etc.
- Typescript support
- Context persistence across async boundaries
- Integration with logging libraries

## License

MIT
