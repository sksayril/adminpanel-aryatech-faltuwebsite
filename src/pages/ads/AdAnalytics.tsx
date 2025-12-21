import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adsApi } from '@/api/ads.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export const AdAnalytics = () => {
  const { id } = useParams<{ id: string }>();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['ad-analytics', id],
    queryFn: () => adsApi.getAnalytics(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (!analyticsData?.data) {
    return <div className="text-center py-12">No analytics data available</div>;
  }

  const { impressions, clicks, clickThroughRate, ad } = analyticsData.data;

  // Mock time series data - Replace with real API data
  const timeSeriesData = [
    { date: 'Jan 1', impressions: 100, clicks: 3 },
    { date: 'Jan 2', impressions: 150, clicks: 5 },
    { date: 'Jan 3', impressions: 200, clicks: 6 },
    { date: 'Jan 4', impressions: 180, clicks: 5 },
    { date: 'Jan 5', impressions: 250, clicks: 8 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ad Analytics</h1>
        <p className="text-gray-600">{ad.name} - {ad.type}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Impressions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{impressions.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Clicks</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{clicks.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Click-Through Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{clickThroughRate}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} name="Impressions" />
            <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} name="Clicks" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

