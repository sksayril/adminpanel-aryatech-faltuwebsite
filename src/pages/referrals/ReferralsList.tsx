import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralsApi } from '@/api/referrals.api';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export const ReferralsList = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['referrals', { status: statusFilter, page, limit: 20 }],
    queryFn: () => referralsApi.getAll({ status: statusFilter, page, limit: 20 }),
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="text-gray-600">Manage referral program</p>
        </div>
      </div>

      <div className="card">
        <Select
          label="Filter by Status"
          options={[
            { value: '', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referred User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.data.map((referral) => (
              <tr key={referral._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{referral.Referrer.Name}</div>
                  <div className="text-sm text-gray-500">{referral.Referrer.Email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{referral.ReferredUser.Name}</div>
                  <div className="text-sm text-gray-500">{referral.ReferredUser.Email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${referral.Earnings}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    referral.Status === 'completed' ? 'bg-green-100 text-green-800' :
                    referral.Status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {referral.Status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

