import { IHttpContext, HttpContext } from '../src';

describe('httpContext', () => {
  describe('HttpContext.getContext', () => {
    it('should return null when not in a context', () => {
      expect(HttpContext.getContext()).toBeNull();
    });

    it('should return the current context when in a context', () => {
      const testContext: IHttpContext = {
        requestId: 'test-id',
        startTime: Date.now(),
      };

      HttpContext.runWithContext(testContext, () => {
        expect(HttpContext.getContext()).toEqual(testContext);
      });
    });
  });

  describe('get', () => {
    it('should return undefined when not in a context', () => {
      expect(HttpContext.get('anyKey')).toBeUndefined();
    });

    it('should return the value for the given key when in a context', () => {
      const testContext: IHttpContext = {
        requestId: 'test-id',
        startTime: Date.now(),
        testKey: 'test-value',
      };

      HttpContext.runWithContext(testContext, () => {
        expect(HttpContext.get('testKey')).toBe('test-value');
      });
    });

    it('should return undefined when the key does not exist in the context', () => {
      const testContext: IHttpContext = {
        requestId: 'test-id',
        startTime: Date.now(),
      };

      HttpContext.runWithContext(testContext, () => {
        expect(HttpContext.get('nonExistentKey')).toBeUndefined();
      });
    });
  });

  describe('set', () => {
    it('should return false when not in a context', () => {
      expect(HttpContext.set('key', 'value')).toBe(false);
    });

    it('should set the value for the given key and return true when in a context', () => {
      const testContext: IHttpContext = {
        requestId: 'test-id',
        startTime: Date.now(),
      };

      HttpContext.runWithContext(testContext, () => {
        expect(HttpContext.set('newKey', 'new-value')).toBe(true);
        expect(HttpContext.get('newKey')).toBe('new-value');
      });
    });

    it('should update existing values', () => {
      const testContext: IHttpContext = {
        requestId: 'test-id',
        startTime: Date.now(),
        existingKey: 'old-value',
      };

      HttpContext.runWithContext(testContext, () => {
        expect(HttpContext.get('existingKey')).toBe('old-value');
        expect(HttpContext.set('existingKey', 'updated-value')).toBe(true);
        expect(HttpContext.get('existingKey')).toBe('updated-value');
      });
    });
  });

  describe('HttpContext.runWithContext', () => {
    it('should run the callback with the provided context', () => {
      const testContext: IHttpContext = {
        requestId: 'test-id',
        startTime: Date.now(),
      };

      HttpContext.runWithContext(testContext, () => {
        expect(HttpContext.getContext()).toEqual(testContext);
      });
    });

    it('should return the result of the callback', () => {
      const testContext: IHttpContext = {
        requestId: 'test-id',
        startTime: Date.now(),
      };

      const result = HttpContext.runWithContext(testContext, () => 'test-result');
      expect(result).toBe('test-result');
    });

    it('should preserve context in async functions', async () => {
      const testContext: IHttpContext = {
        requestId: 'test-id',
        startTime: Date.now(),
      };

      await HttpContext.runWithContext(testContext, async () => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(HttpContext.getContext()).toEqual(testContext);
      });
    });

    it('should isolate nested contexts', () => {
      const outerContext: IHttpContext = {
        requestId: 'outer-id',
        startTime: Date.now(),
      };

      const innerContext: IHttpContext = {
        requestId: 'inner-id',
        startTime: Date.now() + 1000,
      };

      HttpContext.runWithContext(outerContext, () => {
        expect(HttpContext.get('requestId')).toBe('outer-id');

        HttpContext.runWithContext(innerContext, () => {
          expect(HttpContext.get('requestId')).toBe('inner-id');
        });

        // After inner context, we should be back to outer context
        expect(HttpContext.get('requestId')).toBe('outer-id');
      });
    });
  });

  describe('generateRequestId', () => {
    it('should generate a non-empty string', () => {
      const requestId = HttpContext.generateRequestId();
      expect(typeof requestId).toBe('string');
      expect(requestId.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(HttpContext.generateRequestId());
      }
      expect(ids.size).toBe(100);
    });
  });

  // Additional test for multiple asynchronous contexts
  describe('async context isolation', () => {
    it('should maintain separate contexts for concurrent async operations', async () => {
      // Create two separate contexts
      const context1: IHttpContext = {
        requestId: 'req-1',
        startTime: Date.now(),
      };

      const context2: IHttpContext = {
        requestId: 'req-2',
        startTime: Date.now(),
      };

      // Function that waits and then accesses context
      const delayedCheck = async (expectedId: string, delayMs: number) => {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        const id = HttpContext.get<string>('requestId');
        expect(id).toBe(expectedId);
        return id;
      };

      // Start both operations with different contexts
      const promise1 = HttpContext.runWithContext(context1, () => delayedCheck('req-1', 50));
      const promise2 = HttpContext.runWithContext(context2, () => delayedCheck('req-2', 10));

      // Wait for both to complete
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Verify results
      expect(result1).toBe('req-1');
      expect(result2).toBe('req-2');
    });
  });
});
