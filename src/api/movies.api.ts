import axiosInstance from './axios';

export interface Movie {
  _id: string;
  Title: string;
  Slug: string;
  Description?: string;
  Thumbnail?: string;
  Poster?: string;
  Category: string | { _id: string; Name: string; Slug: string };
  SubCategory?: string | { _id: string; Name: string; Slug?: string } | null;
  SubSubCategory?: string | { _id: string; Name: string; Slug?: string } | null;
  Channel?: string | {
    _id: string;
    Name: string;
    Slug: string;
    Logo?: string;
    Description?: string;
    IsActive: boolean;
  };
  Status: string;
  IsTrending: boolean;
  IsFeatured: boolean;
  IsPremium?: boolean;
  IsDMCA?: boolean;
  AgeRestriction?: string;
  BlockedCountries?: string[];
  Views: number;
  Likes: number;
  LikedBy?: string[];
  Comments?: number;
  Rating: number;
  Videos?: Array<{
    Quality: string;
    Url: string;
    Duration?: number;
    FileSize?: number;
    IsOriginal?: boolean;
    _id?: string;
  }>;
  Subtitles?: Array<{
    Language: string;
    LanguageCode: string;
    Url: string;
  }>;
  MetaTitle?: string;
  MetaDescription?: string;
  MetaKeywords?: string[];
  Tags?: string[];
  Genre?: string[];
  Cast?: string[] | Array<{
    _id: string;
    Name: string;
    Description?: string;
    Image?: string;
    DateOfBirth?: string;
    Nationality?: string;
    Slug?: string;
  }>;
  Director?: string;
  Year?: number;
  ReleaseDate?: string;
  TrailerUrl?: string;
  PendingQualities?: string[];
  CreatedBy?: {
    _id: string;
    Name: string;
    Email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMovieData {
  Title: string;
  Category: string;
  Country?: string;
  Language?: string;
  Description?: string;
  SubCategory?: string;
  SubSubCategory?: string;
  Channel?: string;
  AgeRestriction?: string;
  Director?: string;
  ReleaseDate?: string;
  BlockedCountries?: string[];
  TrailerUrl?: string;
  MetaTitle?: string;
  MetaDescription?: string;
  MetaKeywords?: string[];
  Tags?: string[];
  Genre?: string[];
  Cast?: string[];
  IsPremium?: boolean;
  sourceQuality?: string;
  thumbnail?: File;
  poster?: File;
  video?: File; // Single video file for upload endpoint
  subtitle?: File; // Single subtitle file
  subtitleLanguages?: string[];
  subtitleLanguageCodes?: string[];
}

export interface MoviesListResponse {
  success: boolean;
  data: Movie[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const moviesApi = {
  getAll: async (params?: {
    status?: string;
    category?: string;
    subCategory?: string;
    subSubCategory?: string;
    isTrending?: string;
    isFeatured?: string;
    isPremium?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<MoviesListResponse> => {
    const response = await axiosInstance.get<MoviesListResponse>('/movies', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Movie }> => {
    const response = await axiosInstance.get<{ success: boolean; data: Movie }>(`/movies/${id}`);
    return response.data;
  },

  create: async (data: CreateMovieData): Promise<{
    success: boolean;
    message: string;
    data: {
      movie: {
        _id: string;
        Title: string;
        Slug: string;
      };
      queuedJobs: number;
      jobs: Array<{
        _id: string;
        fileType: string;
        fileName: string;
        status: string;
      }>;
    };
  }> => {
    const formData = new FormData();
    
    // Required fields
    formData.append('Title', data.Title);
    formData.append('Category', data.Category);
    
    // Optional fields
    if (data.Description) formData.append('Description', data.Description);
    if (data.SubCategory) formData.append('SubCategory', data.SubCategory);
    if (data.SubSubCategory) formData.append('SubSubCategory', data.SubSubCategory);
    if (data.Channel) formData.append('Channel', data.Channel);
    if (data.MetaTitle) formData.append('MetaTitle', data.MetaTitle);
    if (data.MetaDescription) formData.append('MetaDescription', data.MetaDescription);
    if (data.MetaKeywords && data.MetaKeywords.length > 0) {
      formData.append('MetaKeywords', JSON.stringify(data.MetaKeywords));
    }
    if (data.Tags && data.Tags.length > 0) {
      formData.append('Tags', JSON.stringify(data.Tags));
    }
    if (data.AgeRestriction) formData.append('AgeRestriction', data.AgeRestriction);
    if (data.Genre && data.Genre.length > 0) {
      formData.append('Genre', JSON.stringify(data.Genre));
    }
    if (data.Cast && data.Cast.length > 0) {
      formData.append('Cast', JSON.stringify(data.Cast));
    }
    if (data.Director) formData.append('Director', data.Director);
    if (data.ReleaseDate) formData.append('ReleaseDate', data.ReleaseDate);
    if (data.BlockedCountries && data.BlockedCountries.length > 0) {
      formData.append('BlockedCountries', JSON.stringify(data.BlockedCountries));
    }
    if (data.TrailerUrl) formData.append('TrailerUrl', data.TrailerUrl);
    if (data.IsPremium !== undefined) formData.append('IsPremium', data.IsPremium.toString());
    if (data.sourceQuality) formData.append('sourceQuality', data.sourceQuality);
    
    // File uploads
    if (data.thumbnail) formData.append('thumbnail', data.thumbnail);
    if (data.poster) formData.append('poster', data.poster);
    if (data.video) formData.append('video', data.video);
    
    // Subtitles with arrays
    if (data.subtitle) {
      formData.append('subtitle', data.subtitle);
      if (data.subtitleLanguages && data.subtitleLanguages.length > 0) {
        data.subtitleLanguages.forEach((lang, index) => {
          formData.append(`subtitleLanguages[${index}]`, lang);
        });
      }
      if (data.subtitleLanguageCodes && data.subtitleLanguageCodes.length > 0) {
        data.subtitleLanguageCodes.forEach((code, index) => {
          formData.append(`subtitleLanguageCodes[${index}]`, code);
        });
      }
    }

    const response = await axiosInstance.post<{
      success: boolean;
      message: string;
      data: {
        movie: {
          _id: string;
          Title: string;
          Slug: string;
        };
        queuedJobs: number;
        jobs: Array<{
          _id: string;
          fileType: string;
          fileName: string;
          status: string;
        }>;
      };
    }>(
      '/movies/queue-upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getUploadProgress: async (movieId: string): Promise<{
    success: boolean;
    data: {
      movieId: string;
      overallProgress: number;
      status: string;
      totalJobs: number;
      completedJobs: number;
      failedJobs: number;
      jobs: Array<{
        _id: string;
        fileType: string;
        fileName: string;
        progress: number;
        status: string;
        uploadedSize: number;
        totalSize: number;
        s3Url?: string;
      }>;
    };
  }> => {
    const response = await axiosInstance.get(`/movies/${movieId}/upload-progress`);
    return response.data;
  },

  retryUploadJob: async (jobId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      _id: string;
      status: string;
      fileType: string;
      fileName: string;
    };
  }> => {
    const response = await axiosInstance.post(`/movies/upload-jobs/${jobId}/retry`);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateMovieData>
  ): Promise<{ success: boolean; message: string; data: Movie }> => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'thumbnail' || key === 'poster') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else if (key === 'videos' && Array.isArray(value)) {
          (value as unknown as Array<{ file: File; quality: string }>).forEach((video, index) => {
            formData.append('video', video.file);
            formData.append(`qualities[${index}]`, video.quality);
          });
        } else if (key === 'subtitles' && Array.isArray(value)) {
          (value as unknown as Array<{ file: File; language: string; languageCode: string }>).forEach((subtitle, index) => {
            formData.append('subtitle', subtitle.file);
            formData.append(`subtitleLanguages[${index}]`, subtitle.language);
            formData.append(`subtitleLanguageCodes[${index}]`, subtitle.languageCode);
          });
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value as string);
        }
      }
    });

    const response = await axiosInstance.put<{ success: boolean; message: string; data: Movie }>(
      `/movies/${id}`,
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
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/movies/${id}`);
    return response.data;
  },

  uploadVideo: async (
    id: string,
    video: File,
    quality: string
  ): Promise<{ success: boolean; message: string; data: Movie }> => {
    const formData = new FormData();
    formData.append('video', video);
    formData.append('quality', quality);

    const response = await axiosInstance.post<{ success: boolean; message: string; data: Movie }>(
      `/movies/${id}/video`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  uploadSubtitle: async (
    id: string,
    subtitle: File,
    language: string,
    languageCode: string
  ): Promise<{ success: boolean; message: string; data: Movie }> => {
    const formData = new FormData();
    formData.append('subtitle', subtitle);
    formData.append('language', language);
    formData.append('languageCode', languageCode);

    const response = await axiosInstance.post<{ success: boolean; message: string; data: Movie }>(
      `/movies/${id}/subtitle`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  toggleTrending: async (id: string): Promise<{ success: boolean; message: string; data: { _id: string; IsTrending: boolean } }> => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: { _id: string; IsTrending: boolean } }>(
      `/movies/${id}/toggle-trending`
    );
    return response.data;
  },

  toggleFeatured: async (id: string): Promise<{ success: boolean; message: string; data: { _id: string; IsFeatured: boolean } }> => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: { _id: string; IsFeatured: boolean } }>(
      `/movies/${id}/toggle-featured`
    );
    return response.data;
  },

  dmcaTakedown: async (
    id: string,
    reason: string
  ): Promise<{ success: boolean; message: string; data: Movie }> => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: Movie }>(
      `/movies/${id}/dmca-takedown`,
      { reason }
    );
    return response.data;
  },

  updateCountryBlock: async (
    id: string,
    countries: string[],
    action: 'block' | 'unblock'
  ): Promise<{ success: boolean; message: string; data: Movie }> => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: Movie }>(
      `/movies/${id}/country-block`,
      { countries, action }
    );
    return response.data;
  },

  updateAgeRestriction: async (
    id: string,
    ageRestriction: string
  ): Promise<{ success: boolean; message: string; data: Movie }> => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: Movie }>(
      `/movies/${id}/age-restriction`,
      { ageRestriction }
    );
    return response.data;
  },
};

