import { useQuery } from '@tanstack/react-query';
import { seoApi } from '@/api/seo.api';

export const SEOAnalytics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['seo-analytics'],
    queryFn: () => seoApi.getAnalytics(),
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const analytics = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SEO Analytics</h1>
        <p className="text-gray-600">SEO coverage and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Movies</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.totalMovies || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Movies with SEO</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.moviesWithSEO || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Movies without SEO</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.moviesWithoutSEO || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">SEO Coverage</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.seoCoverage || '0.00'}%</p>
        </div>
      </div>
    </div>
  );
};

