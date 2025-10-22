// Basic types for the business management application
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  passwordHash?: string; // Apenas para backend - não retornar ao frontend
  approvedBy?: string; // ID do admin que aprovou
  approvedAt?: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  PENDING = 'PENDING'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}