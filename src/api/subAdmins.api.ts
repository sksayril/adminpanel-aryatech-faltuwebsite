import axiosInstance from './axios';

const BASE_URL = '/sub-admins';

// Interfaces
export interface SubAdminRole {
  _id: string;
  Name: string;
  Slug: string;
  Permissions: string[];
}

export interface SubAdmin {
  _id: string;
  Email: string;
  Name: string;
  Role: string;
  IsSubAdmin: boolean;
  PlainPassword?: string;
  Roles?: SubAdminRole[];
  Permissions?: string[];
  IsActive: boolean;
  CreatedBy?: {
    _id: string;
    Name: string;
    Email: string;
  };
  LastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubAdminStatistics {
  totalTasks: number;
  byPermission: {
    [key: string]: {
      created?: number;
      viewed?: number;
      reachedOut?: number;
      notesAdded?: number;
      total?: number;
      accessed?: boolean;
      managed?: number;
      permission?: string;
      note?: string;
    };
  };
  recentActivity: {
    [key: string]: number;
  };
  last30Days: {
    total: number;
    breakdown: {
      [key: string]: number;
    };
  };
}

export interface SubAdminDetails extends SubAdmin {
  statistics: SubAdminStatistics;
}

export interface CreateSubAdminData {
  Email: string;
  Password: string;
  Name: string;
  Roles?: string[];
}

export interface UpdateSubAdminData {
  Name?: string;
  Email?: string;
  IsActive?: boolean;
  Password?: string;
}

export interface AssignRolesData {
  Roles: string[];
}

export interface SubAdminsListResponse {
  success: boolean;
  data: SubAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Functions
export const subAdminsApi = {
  // Get all sub-admins
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<SubAdminsListResponse> => {
    const response = await axiosInstance.get(BASE_URL, { params });
    return response.data;
  },

  // Get sub-admin by ID
  getById: async (id: string): Promise<SubAdmin> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  // Create sub-admin
  create: async (data: CreateSubAdminData): Promise<SubAdmin> => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data.data;
  },

  // Update sub-admin
  update: async (id: string, data: UpdateSubAdminData): Promise<SubAdmin> => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  // Assign roles to sub-admin
  assignRoles: async (id: string, data: AssignRolesData): Promise<SubAdmin> => {
    const response = await axiosInstance.patch(`${BASE_URL}/${id}/assign-roles`, data);
    return response.data.data;
  },

  // Delete sub-admin
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },

  // Get sub-admin details with statistics
  getDetails: async (id: string): Promise<SubAdminDetails> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}/details`);
    return response.data.data;
  },

  // Get own details (for sub-admin)
  getMyDetails: async (): Promise<SubAdminDetails> => {
    const response = await axiosInstance.get(`${BASE_URL}/me/details`);
    return response.data.data;
  },
};

