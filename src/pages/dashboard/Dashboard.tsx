import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';
import { useAuth } from '@/hooks/useAuth';
import { SkeletonStats, SkeletonCard, Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import {
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  ServerIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const Dashboard = () => {
  const { isSubAdmin } = useAuth();
  const [viewsWatchTimePeriod, setViewsWatchTimePeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [userGrowthType, setUserGrowthType] = useState<'daily' | 'weekly'>('daily');
  const [peakStreamingDays, setPeakStreamingDays] = useState<number>(7);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard overview
  const { data: overviewData, isLoading: isLoadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardApi.getOverview(),
  });

  // Fetch views vs watch time
  const { data: viewsWatchTimeData, isLoading: isLoadingViewsWatchTime, refetch: refetchViewsWatchTime } = useQuery({
    queryKey: ['dashboard-views-watchtime', viewsWatchTimePeriod],
    queryFn: () => dashboardApi.getViewsWatchTime({ period: viewsWatchTimePeriod }),
  });

  // Fetch user growth
  const { data: userGrowthData, isLoading: isLoadingUserGrowth, refetch: refetchUserGrowth } = useQuery({
    queryKey: ['dashboard-user-growth', userGrowthType],
    queryFn: () => dashboardApi.getUserGrowth({ type: userGrowthType }),
  });

  // Fetch peak streaming
  const { data: peakStreamingData, isLoading: isLoadingPeakStreaming, refetch: refetchPeakStreaming } = useQuery({
    queryKey: ['dashboard-peak-streaming', peakStreamingDays],
    queryFn: () => dashboardApi.getPeakStreaming({ days: peakStreamingDays }),
  });

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchOverview(),
        refetchViewsWatchTime(),
        refetchUserGrowth(),
        refetchPeakStreaming(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading =
    isLoadingOverview || isLoadingViewsWatchTime || isLoadingUserGrowth || isLoadingPeakStreaming;

  const overview = overviewData?.data;

  if (isSubAdmin) {
    return (
      <div className="space-y-6">
        <div className="card max-w-xl mx-auto mt-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-4">
            You do not have permission to view the dashboard. Please contact the administrator if you
            believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to the admin panel</p>
        </div>
        <Button
          onClick={handleRefresh}
          isLoading={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats Cards */}
      {overview && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Today's Views</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{overview.todayViews.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">Watch Time: {overview.todayWatchTimeFormatted}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <EyeIcon className="h-8 w-8 text-blue-700" />
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Active Users</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{overview.activeUsers}</p>
                  <p className="text-xs text-green-600 mt-1">Live Viewers: {overview.liveViewers}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <UserGroupIcon className="h-8 w-8 text-green-700" />
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Avg Watch Time</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    {overview.avgWatchTimePerUserFormatted}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Per User Today</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <ClockIcon className="h-8 w-8 text-purple-700" />
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Completion Rate</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">{overview.completionRate.toFixed(1)}%</p>
                  <p className="text-xs text-orange-600 mt-1">Bounce Rate: {overview.bounceRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-lg">
                  <ChartBarIcon className="h-8 w-8 text-orange-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Monthly Watch Time</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-2">{overview.monthWatchTimeFormatted}</p>
                  <p className="text-xs text-indigo-600 mt-1">
                    Total: {overview.monthWatchTime.toLocaleString()} seconds
                  </p>
                </div>
                <ClockIcon className="h-10 w-10 text-indigo-600" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Server Status</p>
                  <p className="text-2xl font-bold text-pink-900 mt-2">
                    {overview.serverLoad.memoryUsagePercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-pink-600 mt-1">
                    CPU: {(overview.serverLoad.cpuUsage * 100).toFixed(1)}% | Uptime:{' '}
                    {formatUptime(overview.serverLoad.uptime)}
                  </p>
                </div>
                <ServerIcon className="h-10 w-10 text-pink-600" />
              </div>
            </div>
          </div>

          {/* Server Load Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ServerIcon className="h-5 w-5" />
              Server Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">CPU Usage</label>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">Load Average</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {(overview.serverLoad.cpuUsage * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${overview.serverLoad.cpuUsage * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Memory Usage</label>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">Used / Total</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {overview.serverLoad.memoryUsagePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${overview.serverLoad.memoryUsagePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatBytes(overview.serverLoad.usedMemory)} / {formatBytes(overview.serverLoad.totalMemory)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">System Uptime</label>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatUptime(overview.serverLoad.uptime)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Free Memory: {formatBytes(overview.serverLoad.freeMemory)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Views vs Watch Time Chart */}
      {viewsWatchTimeData?.data && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Views vs Watch Time</h3>
            <select
              className="input text-sm"
              value={viewsWatchTimePeriod}
              onChange={(e) => setViewsWatchTimePeriod(e.target.value as '7d' | '30d' | '90d')}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={viewsWatchTimeData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="views" fill="#3b82f6" name="Views" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="watchTime"
                stroke="#10b981"
                strokeWidth={2}
                name="Watch Time (seconds)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* User Growth Chart */}
      {userGrowthData?.data && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
            <select
              className="input text-sm"
              value={userGrowthType}
              onChange={(e) => setUserGrowthType(e.target.value as 'daily' | 'weekly')}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={userGrowthData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="newUsers"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="New Users"
              />
              <Line
                type="monotone"
                dataKey="cumulativeUsers"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Cumulative Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Peak Streaming Time Chart */}
      {peakStreamingData?.data && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Peak Streaming Times</h3>
            <select
              className="input text-sm"
              value={peakStreamingDays}
              onChange={(e) => setPeakStreamingDays(Number(e.target.value))}
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={peakStreamingData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hourLabel" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="views" fill="#3b82f6" name="Views" />
              <Bar yAxisId="left" dataKey="uniqueUsers" fill="#10b981" name="Unique Users" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="watchTime"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Watch Time (seconds)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
