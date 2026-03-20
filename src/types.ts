export type UserRole = 'admin' | 'professor';
export type UserStatus = 'active' | 'blocked';
export type LogType = 'login' | 'logout';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
}

export interface Log {
  id: string;
  professorId: string;
  professorName: string;
  roomNumber: string;
  timestamp: string;
  type: LogType;
}
