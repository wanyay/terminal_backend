export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  CANCEL = 'CANCEL',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
}

export enum AuditModule {
  AUTH = 'auth',
  TRUCKS = 'trucks',
  VEHICLES = 'vehicles',
  VISITORS = 'visitors',
  USERS = 'users',
  GATES = 'gates',
  BLACKLIST = 'blacklist',
}
