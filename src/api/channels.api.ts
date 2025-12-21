import axiosInstance from './axios';

export interface Channel {
  _id: string;
  Name: string;
  Slug: string;
  Description?: string;
  Image?: string;
  IsActive: boolean;
  SortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelData {
  Name: string;
  Description?: string;
  SortOrder?: number;
  image?: File;
}

export const channelsApi = {
  getAll: async (params?: { isActive?: string }): Promise<{ success: boolean; data: Channel[] }> => {
    const response = await axiosInstance.get<{ success: boolean; data: Channel[] }>('/channels', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Channel }> => {
    const response = await axiosInstance.get<{ success: boolean; data: Channel }>(`/channels/${id}`);
    return response.data;
  },

  create: async (data: CreateChannelData): Promise<{ success: boolean; message: string; data: Channel }> => {
    const formData = new FormData();
    formData.append('Name', data.Name);
    if (data.Description) formData.append('Description', data.Description);
    if (data.SortOrder) formData.append('SortOrder', data.SortOrder.toString());
    if (data.image) formData.append('image', data.image);

    const response = await axiosInstance.post<{ success: boolean; message: string; data: Channel }>(
      '/channels',
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
    data: Partial<CreateChannelData>
  ): Promise<{ success: boolean; message: string; data: Channel }> => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'number') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value as string);
        }
      }
    });

    const response = await axiosInstance.put<{ success: boolean; message: string; data: Channel }>(
      `/channels/${id}`,
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
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/channels/${id}`);
    return response.data;
  },
};

