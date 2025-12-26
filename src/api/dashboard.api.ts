import axiosInstance from './axios';

export interface DashboardOverview {
  todayViews: number;
  todayWatchTime: number;
  todayWatchTimeFormatted: string;
  activeUsers: number;
  liveViewers: number;
  monthWatchTime: number;
  monthWatchTimeFormatted: string;
  avgWatchTimePerUser: number;
  avgWatchTimePerUserFormatted: string;
  bounceRate: number;
  completionRate: number;
  serverLoad: {
    cpuUsage: number;
    totalMemory: number;
    freeMemory: number;
    usedMemory: number;
    memoryUsagePercent: number;
    uptime: number;
  };
}

export interface ViewsWatchTimeData {
  date: string;
  views: number;
  watchTime: number;
  watchTimeFormatted: string;
}

export interface UserGrowthData {
  period: string;
  newUsers: number;
  cumulativeUsers: number;
}

export interface PeakStreamingData {
  hour: number;
  hourLabel: string;
  views: number;
  watchTime: number;
  watchTimeFormatted: string;
  uniqueUsers: number;
}

export const dashboardApi = {
  getOverview: async (): Promise<{ success: boolean; data: DashboardOverview }> => {
    const response = await axiosInstance.get<{ success: boolean; data: DashboardOverview }>('/dashboard/overview');
    return response.data;
  },

  getViewsWatchTime: async (params?: {
    period?: '7d' | '30d' | '90d';
  }): Promise<{ success: boolean; data: ViewsWatchTimeData[]; period: string }> => {
    const response = await axiosInstance.get<{ success: boolean; data: ViewsWatchTimeData[]; period: string }>(
      '/dashboard/views-watchtime',
      { params }
    );
    return response.data;
  },

  getUserGrowth: async (params?: {
    type?: 'daily' | 'weekly';
  }): Promise<{ success: boolean; data: UserGrowthData[]; type: string }> => {
    const response = await axiosInstance.get<{ success: boolean; data: UserGrowthData[]; type: string }>(
      '/dashboard/user-growth',
      { params }
    );
    return response.data;
  },

  getPeakStreaming: async (params?: {
    days?: number;
  }): Promise<{ success: boolean; data: PeakStreamingData[]; days: number }> => {
    const response = await axiosInstance.get<{ success: boolean; data: PeakStreamingData[]; days: number }>(
      '/dashboard/peak-streaming',
      { params }
    );
    return response.data;
  },
};

