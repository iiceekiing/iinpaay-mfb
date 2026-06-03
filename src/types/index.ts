export type LangCode = 'en' | 'ha' | 'yo' | 'ig';
export type Page =
  | 'welcome' | 'register' | 'login' | 'dashboard'
  | 'send' | 'add' | 'payupfront' | 'refundrequest' | 'history' | 'profile';
export type Gender = 'male' | 'female';
export type TransferType = 'standard' | 'protected' | 'payupfront';

export type ProjectStatus =
  | 'active'
  | 'completed'
  | 'refund_requested'
  | 'refund_review_pending'
  | 'escalated'
  | 'refunded';

export interface TimelineEvent {
  id: string;
  event: string;          // human-readable description
  timestamp: string;      // ISO
  actor?: string;         // who performed it
}

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
  purpose?: string;
  recipientPhone?: string;
  recipientName?: string;
  fromUserId?: string;
  fromUserName?: string;
  projectId?: string;
  status: 'completed' | 'pending' | 'released' | 'refunded';
  timestamp: string;
}

export interface Project {
  id: string;
  userId: string;               // sender / project creator
  title: string;
  description?: string;
  totalAmount: number;
  upfrontAmount: number;
  recipientPhone: string;
  recipientName: string;
  recipientUserId?: string;     // resolved recipient user id
  deadline: string;
  status: ProjectStatus;
  senderTransactionId?: string;
  recipientTransactionId?: string;
  timeline: TimelineEvent[];
  createdAt: string;
}

export interface RefundRequest {
  id: string;
  projectId: string;
  requesterId: string;          // sender who requested refund
  requesterName: string;
  freelancerPhone: string;
  freelancerName: string;
  freelancerUserId?: string;
  reason: string;
  status: 'pending' | 'accepted' | 'contested' | 'escalated';
  freelancerResponse?: string;  // freelancer's explanation
  createdAt: string;
  respondedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;               // who receives it
  title: string;
  message: string;
  type: 'refund_request' | 'payment_released' | 'refund_accepted' | 'refund_contested' | 'deadline' | 'info';
  relatedProjectId?: string;
  relatedRefundId?: string;
  read: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  transactionId: string;
  projectId?: string;
  userId: string;
  description: string;
  proofFileName?: string;
  proofFileType?: string;
  proofFileData?: string;
  status: 'submitted' | 'resolved';
  createdAt: string;
}
