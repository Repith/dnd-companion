export class User {
  id: string;
  email?: string;
  passwordHash?: string;
  provider?: string;
  providerId?: string;
  isActive: boolean;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}