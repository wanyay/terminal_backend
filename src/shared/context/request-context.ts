import { AsyncLocalStorage } from 'async_hooks';

interface RequestContextData {
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
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

  getUsername(): string | undefined {
    return this.storage.getStore()?.username;
  }

  getIpAddress(): string | undefined {
    return this.storage.getStore()?.ipAddress;
  }

  getUserAgent(): string | undefined {
    return this.storage.getStore()?.userAgent;
  }

  setUser(userId: string, username?: string) {
    const store = this.storage.getStore();
    if (store) {
      store.userId = userId;
      store.username = username;
    }
  }

  setRequestMeta(ipAddress?: string, userAgent?: string) {
    const store = this.storage.getStore();
    if (store) {
      store.ipAddress = ipAddress;
      store.userAgent = userAgent;
    }
  }
}

export const requestContext = new RequestContext();
