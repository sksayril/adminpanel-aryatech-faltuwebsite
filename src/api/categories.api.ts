import axiosInstance from './axios';

export interface Category {
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

export interface CreateCategoryData {
  Name: string;
  Description?: string;
  SortOrder?: number;
}

export const categoriesApi = {
  getAll: async (params?: { isActive?: string }): Promise<{ success: boolean; data: Category[] }> => {
    const response = await axiosInstance.get<{ success: boolean; data: Category[] }>('/categories', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Category }> => {
    const response = await axiosInstance.get<{ success: boolean; data: Category }>(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryData): Promise<{ success: boolean; message: string; data: Category }> => {
    const requestBody: any = {
      Name: data.Name.trim(),
    };
    
    if (data.Description && data.Description.trim()) {
      requestBody.Description = data.Description.trim();
    }
    if (data.SortOrder !== undefined && data.SortOrder !== null) {
      requestBody.SortOrder = data.SortOrder;
    }

    const response = await axiosInstance.post<{ success: boolean; message: string; data: Category }>(
      '/categories',
      requestBody
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateCategoryData>
  ): Promise<{ success: boolean; message: string; data: Category }> => {
    const requestBody: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'Name' && typeof value === 'string') {
          requestBody[key] = value.trim();
        } else if (key === 'Description' && typeof value === 'string' && value.trim()) {
          requestBody[key] = value.trim();
        } else if (key !== 'image') {
          requestBody[key] = value;
        }
      }
    });

    const response = await axiosInstance.put<{ success: boolean; message: string; data: Category }>(
      `/categories/${id}`,
      requestBody
    );
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/categories/${id}`);
    return response.data;
  },
};

