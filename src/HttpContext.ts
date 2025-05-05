import { AsyncLocalStorage } from 'async_hooks';

// Define HTTP context type
export interface IHttpContext {
  requestId: string;
  startTime: number;
  route?: string;
  method?: string;
  requestDuration?: number;
  req?: any;
  res?: any;
  [key: string]: any; // Allow for custom properties
}

// Create AsyncLocalStorage instance
const asyncLocalStorage = new AsyncLocalStorage<IHttpContext>();
class HttpContext {
  private static instance: HttpContext;
  private constructor() {}

  public static getInstance(): HttpContext {
    if (!HttpContext.instance) {
      HttpContext.instance = new HttpContext();
    }
    return HttpContext.instance;
  }

  public getContext(): IHttpContext | null {
    return asyncLocalStorage.getStore() || null;
  }

  public get<T = any>(key: string): T | undefined {
    const context = this.getContext();
    return context ? (context[key] as T) : undefined;
  }

  public set<T = any>(key: string, value: T): boolean {
    const context = this.getContext();
    if (context) {
      context[key] = value;
      return true;
    }
    return false;
  }

  public runWithContext<T>(context: IHttpContext, callback: () => T): T {
    return asyncLocalStorage.run(context, callback);
  }

  public generateRequestId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}

export default HttpContext.getInstance();
