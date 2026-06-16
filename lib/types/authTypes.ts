export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  expiresIn: number;
  roles: string[];
  permissions: string[];
  username: string;
}

export interface AuthUser {
  username: string;
  roles: Set<string>;
  permissions: Set<string>;
}
