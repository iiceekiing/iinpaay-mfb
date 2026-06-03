export type LangCode = 'en' | 'ha' | 'yo' | 'ig';
export type Page =
  | 'welcome' | 'register' | 'login' | 'dashboard'
  | 'send' | 'add' | 'payupfront' | 'history' | 'profile';
export type Gender = 'male' | 'female';
export type TransferType = 'standard' | 'protected' | 'payupfront';

export interface User {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  pin: string;
  accountNumber: string;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  transferType?: TransferType;
  amount: number;
  description: string;
  purpose?: string;           // project title or payment purpose
  recipientPhone?: string;
  recipientName?: string;
  fromUserId?: string;        // for credit txns: who sent
  fromUserName?: string;      // for credit txns: sender name
  projectId?: string;         // linked Pay Upfront project
  status: 'completed' | 'pending' | 'released' | 'refunded';
  timestamp: string;
}

export interface Project {
  id: string;
  userId: string;               // the sender / project creator
  title: string;
  description?: string;
  totalAmount: number;
  upfrontAmount: number;
  recipientPhone: string;
  recipientName: string;
  deadline: string;             // ISO date string
  status: 'active' | 'completed' | 'refunded';
  senderTransactionId?: string;       // debit txn on sender side
  recipientTransactionId?: string;    // pending credit txn on recipient side
  createdAt: string;
}

export interface Complaint {
  id: string;
  transactionId: string;
  projectId?: string;
  userId: string;               // complainant (recipient)
  description: string;
  proofFileName?: string;
  proofFileType?: string;
  proofFileData?: string;       // base64
  status: 'submitted' | 'resolved';
  createdAt: string;
}
