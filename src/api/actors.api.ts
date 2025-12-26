import axiosInstance from './axios';

export interface Actor {
  _id: string;
  Name: string;
  Slug: string;
  Description?: string;
  Image?: string;
  DateOfBirth?: string;
  Nationality?: string;
  IsActive: boolean;
  SortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActorData {
  Name: string;
  Description?: string;
  DateOfBirth?: string;
  Nationality?: string;
  SortOrder?: number;
  IsActive?: boolean;
  image?: File;
}

export interface UpdateActorData {
  Name?: string;
  Description?: string;
  DateOfBirth?: string;
  Nationality?: string;
  SortOrder?: number;
  IsActive?: boolean;
  image?: File;
}

export interface ActorsListResponse {
  success: boolean;
  data: Actor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const actorsApi = {
  getAll: async (params?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ActorsListResponse> => {
    const response = await axiosInstance.get<ActorsListResponse>('/actors', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Actor }> => {
    const response = await axiosInstance.get<{ success: boolean; data: Actor }>(`/actors/${id}`);
    return response.data;
  },

  create: async (data: CreateActorData): Promise<{ success: boolean; message: string; data: Actor }> => {
    const formData = new FormData();
    
    formData.append('Name', data.Name);
    if (data.Description) formData.append('Description', data.Description);
    if (data.DateOfBirth) formData.append('DateOfBirth', data.DateOfBirth);
    if (data.Nationality) formData.append('Nationality', data.Nationality);
    if (data.SortOrder !== undefined) formData.append('SortOrder', data.SortOrder.toString());
    if (data.IsActive !== undefined) formData.append('IsActive', data.IsActive.toString());
    if (data.image) formData.append('image', data.image);

    const response = await axiosInstance.post<{ success: boolean; message: string; data: Actor }>(
      '/actors',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  update: async (id: string, data: UpdateActorData): Promise<{ success: boolean; message: string; data: Actor }> => {
    const formData = new FormData();
    
    if (data.Name) formData.append('Name', data.Name);
    if (data.Description !== undefined) formData.append('Description', data.Description);
    if (data.DateOfBirth !== undefined) formData.append('DateOfBirth', data.DateOfBirth || '');
    if (data.Nationality !== undefined) formData.append('Nationality', data.Nationality || '');
    if (data.SortOrder !== undefined) formData.append('SortOrder', data.SortOrder.toString());
    if (data.IsActive !== undefined) formData.append('IsActive', data.IsActive.toString());
    if (data.image) formData.append('image', data.image);

    const response = await axiosInstance.put<{ success: boolean; message: string; data: Actor }>(
      `/actors/${id}`,
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
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/actors/${id}`);
    return response.data;
  },
};

