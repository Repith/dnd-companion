import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  async create(userData: Partial<User>): Promise<User> {
    const user = {
      id: this.generateId(),
      email: userData.email,
      passwordHash: userData.passwordHash,
      provider: userData.provider,
      providerId: userData.providerId,
      isActive: true,
      roles: userData.roles || ['user'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    
    this.users.push(user);
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async findByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    return this.users.find(user => 
      user.provider === provider && user.providerId === providerId
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}