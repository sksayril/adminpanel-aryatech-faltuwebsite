import { useQuery } from '@tanstack/react-query';
import { referralsApi } from '@/api/referrals.api';

export const ReferralStats = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['referrals-stats'],
    queryFn: () => referralsApi.getStats(),
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const stats = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Statistics</h1>
        <p className="text-gray-600">Overview of referral program performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Referrals</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalReferrals || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.completedReferrals || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pendingReferrals || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Earnings</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${stats?.totalEarnings.toLocaleString() || 0}</p>
        </div>
      </div>
    </div>
  );
};

