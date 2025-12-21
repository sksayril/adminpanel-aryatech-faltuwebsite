import axiosInstance from './axios';

export interface SubSubCategory {
  _id: string;
  Name: string;
  Slug: string;
  SubCategory: string | { _id: string; Name: string; Slug: string };
  Description?: string;
  IsActive: boolean;
  SortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubSubCategoryData {
  Name: string;
  SubCategory: string;
  Description?: string;
  SortOrder?: number;
  IsActive?: boolean;
}

export const subsubcategoriesApi = {
  getAll: async (params?: { subCategory?: string; isActive?: string }): Promise<{ success: boolean; data: SubSubCategory[] }> => {
    const response = await axiosInstance.get<{ success: boolean; data: SubSubCategory[] }>('/subsubcategories', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: SubSubCategory }> => {
    const response = await axiosInstance.get<{ success: boolean; data: SubSubCategory }>(`/subsubcategories/${id}`);
    return response.data;
  },

  create: async (data: CreateSubSubCategoryData): Promise<{ success: boolean; message: string; data: SubSubCategory }> => {
    // Ensure required fields are not empty
    if (!data.Name || !data.Name.trim()) {
      throw new Error('Name is required');
    }
    if (!data.SubCategory || !data.SubCategory.trim()) {
      throw new Error('SubCategory is required');
    }

    const requestBody: any = {
      Name: data.Name.trim(),
      SubCategory: data.SubCategory.trim(),
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

    const response = await axiosInstance.post<{ success: boolean; message: string; data: SubSubCategory }>(
      '/subsubcategories',
      requestBody
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateSubSubCategoryData>
  ): Promise<{ success: boolean; message: string; data: SubSubCategory }> => {
    const requestBody: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'Name' && typeof value === 'string') {
          requestBody[key] = value.trim();
        } else if (key === 'SubCategory' && typeof value === 'string') {
          requestBody[key] = value.trim();
        } else if (key === 'Description' && typeof value === 'string' && value.trim()) {
          requestBody[key] = value.trim();
        } else {
          requestBody[key] = value;
        }
      }
    });

    const response = await axiosInstance.put<{ success: boolean; message: string; data: SubSubCategory }>(
      `/subsubcategories/${id}`,
      requestBody
    );
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/subsubcategories/${id}`);
    return response.data;
  },
};

