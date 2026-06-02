export type LangCode = 'en' | 'ha' | 'yo' | 'ig';
export type Page = 'welcome' | 'register' | 'login' | 'dashboard' | 'send' | 'add' | 'projects' | 'history' | 'profile';
export type Gender = 'male' | 'female';
export type TransferType = 'standard' | 'protected';

export interface User {
  id: string;
  fullName: string;
  dateOfBirth: string;   // ISO date string
  gender: Gender;
  phone: string;
  pin: string;           // stored as plain text for demo
  accountNumber: string;
  balance: number;       // naira
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  transferType?: TransferType;
  amount: number;
  description: string;
  recipientPhone?: string;
  recipientName?: string;
  status: 'completed' | 'pending';
  timestamp: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: 'active' | 'completed';
  createdAt: string;
}
