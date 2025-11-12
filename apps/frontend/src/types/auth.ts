export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  subscriptionTier: string;
  profile: any;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  locale?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
