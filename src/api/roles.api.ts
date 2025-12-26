import axiosInstance from './axios';

const BASE_URL = '/roles';

// Interfaces
export interface Permission {
  [key: string]: string;
  // Expected permissions include:
  // CONTACT_VIEW: 'contact:read'
  // CONTACT_UPDATE: 'contact:update'
  // CONTACT_DELETE: 'contact:delete'
  // And other permissions like movies:view, categories:view, etc.
}

export interface PermissionsByCategory {
  [category: string]: string[];
  // Expected categories include:
  // "movies": ["movies:view", "movies:create", "movies:edit", "movies:delete"]
  // "categories": ["categories:view", "categories:create", "categories:edit", "categories:delete"]
  // "channels": ["channels:view", "channels:create", "channels:edit", "channels:delete"]
  // "contact": ["contact:read", "contact:update", "contact:delete"]
  // And other categories as defined by the backend
}

export interface PermissionsResponse {
  permissions: Permission;
  categories: PermissionsByCategory;
}

export interface Role {
  _id: string;
  Name: string;
  Slug: string;
  Description?: string;
  Permissions: string[];
  IsActive: boolean;
  CreatedBy?: {
    _id: string;
    Name: string;
    Email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRoleData {
  Name: string;
  Description?: string;
  Permissions: string[];
  IsActive?: boolean;
}

export interface UpdateRoleData {
  Name?: string;
  Description?: string;
  Permissions?: string[];
  IsActive?: boolean;
}

export interface RolesListResponse {
  data: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Functions
export const rolesApi = {
  // Get available permissions
  getPermissions: async (): Promise<PermissionsResponse> => {
    const response = await axiosInstance.get(`${BASE_URL}/permissions`);
    return response.data.data;
  },

  // Get all roles
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<RolesListResponse> => {
    const response = await axiosInstance.get(BASE_URL, { params });
    return response.data;
  },

  // Get role by ID
  getById: async (id: string): Promise<Role> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  // Create role
  create: async (data: CreateRoleData): Promise<Role> => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data.data;
  },

  // Update role
  update: async (id: string, data: UpdateRoleData): Promise<Role> => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  // Delete role
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },
};

