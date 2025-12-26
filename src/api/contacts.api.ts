import axiosInstance from './axios';

const BASE_URL = '/contacts';

// Interfaces
export interface AdminNote {
  _id: string;
  Note: string;
  CreatedBy: {
    _id: string;
    Name: string;
    Email: string;
  };
  createdAt: string;
}

export interface Contact {
  _id: string;
  Name: string;
  Email: string;
  Phone?: string;
  Company?: string;
  Subject?: string;
  Message?: string;
  Type?: 'sponsor' | 'general' | 'support' | 'partnership';
  Status?: 'new' | 'contacted' | 'replied' | 'resolved' | 'archived';
  IsReachedOut?: boolean;
  ReachedOutAt?: string;
  ReachedOutBy?: {
    _id: string;
    Name: string;
    Email: string;
  };
  Priority?: 'low' | 'medium' | 'high' | 'urgent';
  Source?: string;
  Notes?: string;
  AdminNotes?: AdminNote[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateContactStatusData {
  Status?: 'new' | 'contacted' | 'replied' | 'resolved' | 'archived';
  IsReachedOut?: boolean;
  Notes?: string;
  Priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AddNoteData {
  Note: string;
}

export interface ContactsListResponse {
  success: boolean;
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContactStats {
  total: number;
  new: number;
  contacted: number;
  replied: number;
  resolved: number;
  archived: number;
  reachedOut: number;
  notReachedOut: number;
  byType: {
    sponsor: number;
    general: number;
    support: number;
    partnership: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

// API Functions
export const contactsApi = {
  // Get all contacts
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    isReachedOut?: boolean;
    priority?: string;
  }): Promise<ContactsListResponse> => {
    const response = await axiosInstance.get(BASE_URL, { params });
    return response.data;
  },

  // Get contact by ID
  getById: async (id: string): Promise<Contact> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  // Update contact status
  updateStatus: async (id: string, data: UpdateContactStatusData): Promise<Contact> => {
    const response = await axiosInstance.patch(`${BASE_URL}/${id}/status`, data);
    return response.data.data;
  },

  // Add admin note
  addNote: async (id: string, data: AddNoteData): Promise<Contact> => {
    const response = await axiosInstance.post(`${BASE_URL}/${id}/notes`, data);
    return response.data.data;
  },

  // Delete contact
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },

  // Get contact statistics
  getStats: async (): Promise<ContactStats> => {
    const response = await axiosInstance.get(`${BASE_URL}/stats`);
    return response.data.data;
  },
};

