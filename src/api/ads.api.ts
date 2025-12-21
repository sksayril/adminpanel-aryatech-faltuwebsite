import axiosInstance from './axios';

export interface Ad {
  _id: string;
  Name: string;
  Type: string;
  ImageUrl?: string;
  VideoUrl?: string;
  ClickUrl: string;
  Title?: string;
  Description?: string;
  Position?: string;
  Width?: number;
  Height?: number;
  IsActive: boolean;
  StartDate?: string;
  EndDate?: string;
  TargetCountries?: string[];
  TargetCategories?: Array<{ _id: string; Name: string; Slug: string }>;
  TargetMovies?: Array<{ _id: string; Title: string }>;
  Priority?: number;
  Impressions: number;
  Clicks: number;
  AdvertiserName?: string;
  AdvertiserEmail?: string;
  CreatedBy?: {
    _id: string;
    Name: string;
    Email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdData {
  Name: string;
  Type: string;
  ClickUrl: string;
  Title?: string;
  Description?: string;
  Position?: string;
  Width?: number;
  Height?: number;
  StartDate?: string;
  EndDate?: string;
  TargetCountries?: string[];
  Priority?: number;
  AdvertiserName?: string;
  AdvertiserEmail?: string;
  image?: File;
  video?: File;
}

export interface AdsListResponse {
  success: boolean;
  data: Ad[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdAnalytics {
  impressions: number;
  clicks: number;
  clickThroughRate: string;
  ad: {
    id: string;
    name: string;
    type: string;
  };
}

export const adsApi = {
  getAll: async (params?: {
    type?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  }): Promise<AdsListResponse> => {
    const response = await axiosInstance.get<AdsListResponse>('/ads', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Ad }> => {
    const response = await axiosInstance.get<{ success: boolean; data: Ad }>(`/ads/${id}`);
    return response.data;
  },

  create: async (data: CreateAdData): Promise<{ success: boolean; message: string; data: Ad }> => {
    const formData = new FormData();
    formData.append('Name', data.Name);
    formData.append('Type', data.Type);
    formData.append('ClickUrl', data.ClickUrl);
    
    if (data.Title) formData.append('Title', data.Title);
    if (data.Description) formData.append('Description', data.Description);
    if (data.Position) formData.append('Position', data.Position);
    if (data.Width) formData.append('Width', data.Width.toString());
    if (data.Height) formData.append('Height', data.Height.toString());
    if (data.StartDate) formData.append('StartDate', data.StartDate);
    if (data.EndDate) formData.append('EndDate', data.EndDate);
    if (data.TargetCountries) {
      formData.append('TargetCountries', JSON.stringify(data.TargetCountries));
    }
    if (data.Priority) formData.append('Priority', data.Priority.toString());
    if (data.AdvertiserName) formData.append('AdvertiserName', data.AdvertiserName);
    if (data.AdvertiserEmail) formData.append('AdvertiserEmail', data.AdvertiserEmail);
    if (data.image) formData.append('image', data.image);
    if (data.video) formData.append('video', data.video);

    const response = await axiosInstance.post<{ success: boolean; message: string; data: Ad }>(
      '/ads',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateAdData>
  ): Promise<{ success: boolean; message: string; data: Ad }> => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'image' || key === 'video') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else if (key === 'TargetCountries' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value as string);
        }
      }
    });

    const response = await axiosInstance.put<{ success: boolean; message: string; data: Ad }>(
      `/ads/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/ads/${id}`);
    return response.data;
  },

  toggleStatus: async (id: string): Promise<{ success: boolean; message: string; data: { _id: string; IsActive: boolean } }> => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: { _id: string; IsActive: boolean } }>(
      `/ads/${id}/toggle-status`
    );
    return response.data;
  },

  getAnalytics: async (id: string): Promise<{ success: boolean; data: AdAnalytics }> => {
    const response = await axiosInstance.get<{ success: boolean; data: AdAnalytics }>(
      `/ads/analytics/${id}`
    );
    return response.data;
  },
};

