import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '@/api/movies.api';
import { adsApi } from '@/api/ads.api';
import { referralsApi } from '@/api/referrals.api';
import { SkeletonStats, SkeletonCard, Skeleton } from '@/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export const Dashboard = () => {
  const { data: moviesData, isLoading: isLoadingMovies } = useQuery({
    queryKey: ['movies', { limit: 1 }],
    queryFn: () => moviesApi.getAll({ limit: 1 }),
  });

  const { data: adsData, isLoading: isLoadingAds } = useQuery({
    queryKey: ['ads', { limit: 1 }],
    queryFn: () => adsApi.getAll({ limit: 1 }),
  });

  const { data: referralsStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['referrals-stats'],
    queryFn: () => referralsApi.getStats(),
  });

  const isLoading = isLoadingMovies || isLoadingAds || isLoadingStats;

  const totalMovies = moviesData?.pagination?.total || 0;
  const activeAds = adsData?.data?.filter((ad) => ad.IsActive).length || 0;
  const totalEarnings = referralsStats?.data?.totalEarnings || 0;
  
  // Calculate average CTR
  const ads = adsData?.data || [];
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.Impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.Clicks, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  // Mock chart data - Replace with real data from API
  const trendingMoviesData = [
    { name: 'Jan', views: 4000 },
    { name: 'Feb', views: 3000 },
    { name: 'Mar', views: 5000 },
    { name: 'Apr', views: 4500 },
    { name: 'May', views: 6000 },
  ];

  const adsPerformanceData = [
    { name: 'Pre-Roll', impressions: 12000, clicks: 360 },
    { name: 'Mid-Roll', impressions: 8000, clicks: 240 },
    { name: 'Banner Top', impressions: 15000, clicks: 450 },
    { name: 'Banner Bottom', impressions: 10000, clicks: 300 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton variant="text" height={32} width={200} />
          <Skeleton variant="text" height={20} width={300} className="mt-2" />
        </div>
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the admin panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Movies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalMovies}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Ads</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeAds}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average CTR</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{avgCTR}%</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${totalEarnings.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Movies</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendingMoviesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ads Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={adsPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="impressions" fill="#3b82f6" />
              <Bar dataKey="clicks" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

