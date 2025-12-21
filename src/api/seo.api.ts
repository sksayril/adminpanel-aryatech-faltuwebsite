import axiosInstance from './axios';

export interface UpdateMovieSEOData {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  customSlug?: string;
}

export interface SEOAnalytics {
  totalMovies: number;
  moviesWithSEO: number;
  moviesWithoutSEO: number;
  seoCoverage: string;
}

export interface SitemapResponse {
  url: string;
  totalUrls: number;
}

export const seoApi = {
  updateMovieSEO: async (
    movieId: string,
    data: UpdateMovieSEOData
  ): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await axiosInstance.put<{ success: boolean; message: string; data: any }>(
      `/seo/movie/${movieId}`,
      data
    );
    return response.data;
  },

  generateSitemap: async (): Promise<{ success: boolean; message: string; data: SitemapResponse }> => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: SitemapResponse }>(
      '/seo/sitemap/generate'
    );
    return response.data;
  },

  getAnalytics: async (): Promise<{ success: boolean; data: SEOAnalytics }> => {
    const response = await axiosInstance.get<{ success: boolean; data: SEOAnalytics }>('/seo/analytics');
    return response.data;
  },
};

