import { AsyncLocalStorage } from 'async_hooks';

interface RequestContextData {
  userId?: string;
  username?: string;
}

class RequestContext {
  private storage = new AsyncLocalStorage<RequestContextData>();

  run(context: RequestContextData, callback: () => void) {
    this.storage.run(context, callback);
  }

  get(): RequestContextData | undefined {
    return this.storage.getStore();
  }

  getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  setUser(userId: string, username?: string) {
    const store = this.storage.getStore();
    if (store) {
      store.userId = userId;
      store.username = username;
    }
  }
}

export const requestContext = new RequestContext();
