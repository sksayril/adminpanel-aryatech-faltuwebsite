import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adsApi } from '@/api/ads.api';
import { AD_TYPES } from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/utils/toast';

export const AdsList = () => {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; adId: string | null }>({
    isOpen: false,
    adId: null,
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['ads', { type: typeFilter, isActive: statusFilter, page, limit: 20 }],
    queryFn: () => adsApi.getAll({ type: typeFilter, isActive: statusFilter, page, limit: 20 }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adsApi.toggleStatus(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      showToast.success(data.message || 'Ad status updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update ad status';
      showToast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adsApi.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      setDeleteModal({ isOpen: false, adId: null });
      showToast.success(data.message || 'Ad deleted successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete ad';
      showToast.error(message);
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads Management</h1>
          <p className="text-gray-600">Manage all your advertisements</p>
        </div>
        <Link to="/ads/create">
          <Button>Create New Ad</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Filter by Type"
          options={[
            { value: '', label: 'All Types' },
            ...AD_TYPES.map((type) => ({ value: type.value, label: type.label })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
        <Select
          label="Filter by Status"
          options={[
            { value: '', label: 'All Status' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {/* Ads Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ad Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impressions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CTR
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.data.map((ad) => {
              const ctr = ad.Impressions > 0 ? ((ad.Clicks / ad.Impressions) * 100).toFixed(2) : '0.00';
              return (
                <tr key={ad._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {ad.ImageUrl && (
                        <img className="h-10 w-10 rounded-lg object-cover mr-3" src={ad.ImageUrl} alt={ad.Name} />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ad.Name}</div>
                        {ad.Title && <div className="text-sm text-gray-500">{ad.Title}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {ad.Type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Switch
                      checked={ad.IsActive}
                      onChange={() => handleToggleStatus(ad._id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ad.Impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ad.Clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ctr}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link to={`/ads/${ad._id}/analytics`}>
                        <Button variant="outline" size="sm">Analytics</Button>
                      </Link>
                      <Link to={`/ads/${ad._id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteModal({ isOpen: true, adId: ad._id })}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} ads
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, adId: null })}
        title="Delete Ad"
      >
        <p className="text-gray-600 mb-4">Are you sure you want to delete this ad? This action cannot be undone.</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, adId: null })}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteModal.adId && handleDelete(deleteModal.adId)}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

