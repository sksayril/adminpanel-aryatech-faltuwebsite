import axiosInstance from './axios';

export interface Referral {
  _id: string;
  Referrer: {
    _id: string;
    Name: string;
    Email: string;
    ReferralCode: string;
  };
  ReferredUser: {
    _id: string;
    Name: string;
    Email: string;
  };
  ReferralCode: string;
  Earnings: number;
  Status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ReferralsListResponse {
  success: boolean;
  data: Referral[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
}

export interface UpdateReferralEarningsData {
  earnings: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export const referralsApi = {
  getAll: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ReferralsListResponse> => {
    const response = await axiosInstance.get<ReferralsListResponse>('/referrals', { params });
    return response.data;
  },

  getStats: async (): Promise<{ success: boolean; data: ReferralStats }> => {
    const response = await axiosInstance.get<{ success: boolean; data: ReferralStats }>('/referrals/stats');
    return response.data;
  },

  updateEarnings: async (
    id: string,
    data: UpdateReferralEarningsData
  ): Promise<{ success: boolean; message: string; data: Referral }> => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: Referral }>(
      `/referrals/${id}/earnings`,
      data
    );
    return response.data;
  },
};

