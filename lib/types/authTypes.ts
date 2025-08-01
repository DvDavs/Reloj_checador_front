export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  expiresIn: number;
  roles: string[]; // Viene como un array de strings desde el backend
}
