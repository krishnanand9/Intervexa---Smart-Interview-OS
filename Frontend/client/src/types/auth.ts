export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  accessToken?: string;
}
