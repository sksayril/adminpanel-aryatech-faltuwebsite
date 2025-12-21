import axiosInstance from './axios';

export interface SubCategory {
  _id: string;
  Name: string;
  Slug: string;
  Category: string | { _id: string; Name: string };
  Description?: string;
  Image?: string;
  IsActive: boolean;
  SortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubCategoryData {
  Name: string;
  Category: string;
  Description?: string;
  SortOrder?: number;
  IsActive?: boolean;
}

export const subcategoriesApi = {
  getAll: async (params?: { category?: string; isActive?: string }): Promise<{ success: boolean; data: SubCategory[] }> => {
    const response = await axiosInstance.get<{ success: boolean; data: SubCategory[] }>('/subcategories', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: SubCategory }> => {
    const response = await axiosInstance.get<{ success: boolean; data: SubCategory }>(`/subcategories/${id}`);
    return response.data;
  },

  create: async (data: CreateSubCategoryData): Promise<{ success: boolean; message: string; data: SubCategory }> => {
    // Ensure required fields are not empty
    if (!data.Name || !data.Name.trim()) {
      throw new Error('Name is required');
    }
    if (!data.Category || !data.Category.trim()) {
      throw new Error('Category is required');
    }

    const requestBody: any = {
      Name: data.Name.trim(),
      Category: data.Category.trim(),
    };

    if (data.Description && data.Description.trim()) {
      requestBody.Description = data.Description.trim();
    }
    if (data.SortOrder !== undefined && data.SortOrder !== null) {
      requestBody.SortOrder = data.SortOrder;
    }
    if (data.IsActive !== undefined) {
      requestBody.IsActive = data.IsActive;
    }

    const response = await axiosInstance.post<{ success: boolean; message: string; data: SubCategory }>(
      '/subcategories',
      requestBody
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateSubCategoryData>
  ): Promise<{ success: boolean; message: string; data: SubCategory }> => {
    const requestBody: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'Name' && typeof value === 'string') {
          requestBody[key] = value.trim();
        } else if (key === 'Category' && typeof value === 'string') {
          requestBody[key] = value.trim();
        } else if (key === 'Description' && typeof value === 'string' && value.trim()) {
          requestBody[key] = value.trim();
        } else if (key !== 'image') {
          requestBody[key] = value;
        }
      }
    });

    const response = await axiosInstance.put<{ success: boolean; message: string; data: SubCategory }>(
      `/subcategories/${id}`,
      requestBody
    );
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/subcategories/${id}`);
    return response.data;
  },
};

