import axiosInstance from './axios';

const BASE_URL = '/withdrawals';

// Interfaces
export interface WithdrawalUser {
  _id: string;
  Name: string;
  Email: string;
  Coins: number;
}

export interface ProcessedBy {
  _id: string;
  Name: string;
  Email: string;
}

export interface Withdrawal {
  _id: string;
  User: WithdrawalUser;
  Amount: number;
  PaymentMethod: 'upi' | 'bank';
  UPIId?: string;
  BankName?: string;
  AccountNumber?: string;
  IFSCode?: string;
  AccountHolderName?: string;
  BankBranch?: string;
  Status: 'pending' | 'approved' | 'rejected' | 'paid' | 'failed';
  AdminNotes?: string;
  ProcessedBy?: ProcessedBy;
  ProcessedAt?: string;
  TransactionId?: string;
  RejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateWithdrawalStatusData {
  Status: 'pending' | 'approved' | 'rejected' | 'paid' | 'failed';
  AdminNotes?: string;
  TransactionId?: string;
  RejectionReason?: string;
}

export interface WithdrawalsListResponse {
  success: boolean;
  data: Withdrawal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface WithdrawalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  failed: number;
  totalAmount: {
    pending: number;
    approved: number;
    paid: number;
  };
  byPaymentMethod: {
    upi: number;
    bank: number;
  };
}

// API Functions
export const withdrawalsApi = {
  // Get all withdrawals
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    search?: string;
  }): Promise<WithdrawalsListResponse> => {
    const response = await axiosInstance.get(BASE_URL, { params });
    return response.data;
  },

  // Get withdrawal by ID
  getById: async (id: string): Promise<Withdrawal> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  // Update withdrawal status
  updateStatus: async (id: string, data: UpdateWithdrawalStatusData): Promise<Withdrawal> => {
    const response = await axiosInstance.patch(`${BASE_URL}/${id}/status`, data);
    return response.data.data;
  },

  // Get withdrawal statistics
  getStats: async (): Promise<WithdrawalStats> => {
    const response = await axiosInstance.get(`${BASE_URL}/stats`);
    return response.data.data;
  },
};








