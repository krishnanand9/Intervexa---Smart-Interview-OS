import { api, setAccessToken } from "./api";

export interface User {
  _id?: string;
  id?: string;
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
  accessToken?: string;
  user?: User;
  data?: {
    accessToken?: string;
    user?: User;
  };
}

const TOKEN_KEY = "intervexa_access_token";

export async function register(
  name: string,
  email: string,
  password: string
) {
  const { data } = await api.post<AuthResponse>(
    "/auth/register",
    {
      name,
      email,
      password,
    }
  );

  const token = data.accessToken || data.data?.accessToken;
  const user = data.user || data.data?.user;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setAccessToken(token);
  }

  return {
    ...data,
    accessToken: token,
    user,
  };
}

export async function login(
  email: string,
  password: string
) {
  const { data } = await api.post<AuthResponse>(
    "/auth/login",
    {
      email,
      password,
    }
  );

  const token = data.accessToken || data.data?.accessToken;
  const user = data.user || data.data?.user;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setAccessToken(token);
  }

  return {
    ...data,
    accessToken: token,
    user,
  };
}

export async function getMe() {
  const { data } = await api.get<AuthResponse>(
    "/auth/me"
  );

  const user = data.user || data.data?.user;

  return {
    ...data,
    user,
  };
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
  }
}

export async function refreshToken() {
  const { data } = await api.post<AuthResponse>(
    "/auth/refresh"
  );

  const token = data.accessToken || data.data?.accessToken;
  const user = data.user || data.data?.user;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setAccessToken(token);
  }

  return {
    ...data,
    accessToken: token,
    user,
  };
}

export async function updateProfile(
  profile: Partial<User>
) {
  const { data } = await api.patch<AuthResponse>(
    "/auth/profile",
    profile
  );

  const user = data.user || data.data?.user;

  return {
    ...data,
    user,
  };
}