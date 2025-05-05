import { default as expressContextMiddleware, IExpressMiddlewareOptions } from './express';

const adapters = {
  express: expressContextMiddleware,
};

export { adapters, IExpressMiddlewareOptions };
