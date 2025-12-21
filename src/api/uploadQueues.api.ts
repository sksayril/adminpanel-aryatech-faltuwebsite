import axiosInstance from './axios';

export interface UploadQueueJob {
  _id: string;
  movie: {
    _id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    description?: string;
    poster?: string;
    category?: string;
    subCategory?: string;
  } | null;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  fileType: 'video' | 'thumbnail' | 'poster' | 'subtitle';
  fileName: string;
  fileSize: number;
  mimeType?: string;
  folder?: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedSize: number;
  s3Key?: string;
  s3Url?: string;
  errorMessage?: string | null;
  metadata?: {
    quality?: string;
    isOriginal?: boolean;
    language?: string;
    languageCode?: string;
  };
  retries: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface UploadQueuesResponse {
  success: boolean;
  data: {
    jobs: UploadQueueJob[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    statistics?: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
      retrying: number;
    };
    matchedMovies?: Array<{
      _id: string;
      title: string;
      slug: string;
    }>;
  };
}

export const uploadQueuesApi = {
  getAll: async (params?: {
    status?: string;
    fileType?: string;
    movieId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<UploadQueuesResponse> => {
    const response = await axiosInstance.get<UploadQueuesResponse>('/upload-queues', { params });
    return response.data;
  },

  getPending: async (params?: {
    fileType?: string;
    page?: number;
    limit?: number;
  }): Promise<UploadQueuesResponse> => {
    const response = await axiosInstance.get<UploadQueuesResponse>('/upload-queues/pending', { params });
    return response.data;
  },

  search: async (params: {
    title: string;
    status?: string;
    fileType?: string;
    page?: number;
    limit?: number;
  }): Promise<UploadQueuesResponse> => {
    const response = await axiosInstance.get<UploadQueuesResponse>('/upload-queues/search', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: UploadQueueJob }> => {
    const response = await axiosInstance.get<{ success: boolean; data: UploadQueueJob }>(`/upload-queues/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/upload-queues/${id}`);
    return response.data;
  },
};

