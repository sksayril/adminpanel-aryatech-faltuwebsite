import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { withdrawalsApi, Withdrawal, UpdateWithdrawalStatusData } from '@/api/withdrawals.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { SkeletonTable, SkeletonStats, Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/utils/toast';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const updateStatusSchema = z.object({
  Status: z.enum(['pending', 'approved', 'rejected', 'paid', 'failed']),
  AdminNotes: z.string().optional(),
  TransactionId: z.string().optional(),
  RejectionReason: z.string().optional(),
}).refine((data) => {
  if (data.Status === 'rejected' && !data.RejectionReason) {
    return false;
  }
  return true;
}, {
  message: 'Rejection reason is required when status is rejected',
  path: ['RejectionReason'],
});

type UpdateStatusFormData = z.infer<typeof updateStatusSchema>;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-blue-100 text-blue-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentMethodLabel = (method: string) => {
  return method === 'upi' ? 'UPI' : 'Bank Transfer';
};

export const Withdrawals = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Build query params
  const queryParams: any = { page, limit: 20 };
  if (searchQuery) queryParams.search = searchQuery;
  if (statusFilter) queryParams.status = statusFilter;
  if (paymentMethodFilter) queryParams.paymentMethod = paymentMethodFilter;

  // Fetch withdrawals
  const { data, isLoading } = useQuery({
    queryKey: ['withdrawals', queryParams],
    queryFn: () => withdrawalsApi.getAll(queryParams),
  });

  // Fetch statistics
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['withdrawals-stats'],
    queryFn: () => withdrawalsApi.getStats(),
  });

  // Fetch withdrawal details
  const { data: withdrawalDetails } = useQuery({
    queryKey: ['withdrawal', selectedWithdrawal?._id],
    queryFn: () => withdrawalsApi.getById(selectedWithdrawal!._id),
    enabled: !!selectedWithdrawal?._id && isDetailsModalOpen,
  });

  // Status update form
  const {
    register: registerStatus,
    handleSubmit: handleSubmitStatus,
    formState: { errors: statusErrors },
    reset: resetStatus,
    setValue: setStatusValue,
    watch: watchStatus,
  } = useForm<UpdateStatusFormData>({
    resolver: zodResolver(updateStatusSchema),
  });

  // Load withdrawal data into status form
  useEffect(() => {
    if (selectedWithdrawal && isStatusModalOpen) {
      setStatusValue('Status', selectedWithdrawal.Status);
      setStatusValue('AdminNotes', selectedWithdrawal.AdminNotes || '');
      setStatusValue('TransactionId', selectedWithdrawal.TransactionId || '');
    }
  }, [selectedWithdrawal, isStatusModalOpen, setStatusValue]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWithdrawalStatusData }) =>
      withdrawalsApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals-stats'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal', selectedWithdrawal?._id] });
      setIsStatusModalOpen(false);
      resetStatus();
      showToast.success('Withdrawal status updated successfully');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to update withdrawal status');
    },
  });

  // Handlers
  const handleUpdateStatus = (data: UpdateStatusFormData) => {
    if (!selectedWithdrawal) return;
    updateStatusMutation.mutate({
      id: selectedWithdrawal._id,
      data: {
        Status: data.Status,
        AdminNotes: data.AdminNotes,
        TransactionId: data.TransactionId,
        RejectionReason: data.RejectionReason,
      },
    });
  };

  const handleViewDetails = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatusClick = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setStatusValue('Status', withdrawal.Status);
    setStatusValue('AdminNotes', withdrawal.AdminNotes || '');
    setStatusValue('TransactionId', withdrawal.TransactionId || '');
    setIsStatusModalOpen(true);
  };

  const withdrawals = data?.data || [];
  const pagination = data?.pagination;
  const stats = statsData;

  if (isLoading || isLoadingStats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton variant="text" height={32} width={200} />
            <Skeleton variant="text" height={20} width={300} className="mt-2" />
          </div>
        </div>
        <SkeletonStats />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-600">Manage user withdrawal requests and payments</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                <p className="text-xs text-yellow-700 mt-1">₹{stats.totalAmount.pending.toLocaleString()}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Approved</p>
                <p className="text-2xl font-bold text-blue-900">{stats.approved}</p>
                <p className="text-xs text-blue-700 mt-1">₹{stats.totalAmount.approved.toLocaleString()}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Paid</p>
                <p className="text-2xl font-bold text-green-900">{stats.paid}</p>
                <p className="text-xs text-green-700 mt-1">₹{stats.totalAmount.paid.toLocaleString()}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total</p>
                <p className="text-2xl font-bold text-purple-900">{stats.total}</p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by user email or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            label="Status"
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'paid', label: 'Paid' },
              { value: 'failed', label: 'Failed' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Payment Method"
            options={[
              { value: '', label: 'All Methods' },
              { value: 'upi', label: 'UPI' },
              { value: 'bank', label: 'Bank Transfer' },
            ]}
            value={paymentMethodFilter}
            onChange={(e) => {
              setPaymentMethodFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Request Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <BanknotesIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No withdrawal requests found</p>
                      <p className="text-sm text-gray-500">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{withdrawal.User.Name}</div>
                        <div className="text-sm text-gray-500">{withdrawal.User.Email}</div>
                        <div className="text-xs text-gray-400">Coins: {withdrawal.User.Coins}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">₹{withdrawal.Amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {getPaymentMethodLabel(withdrawal.PaymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          withdrawal.Status
                        )} capitalize`}
                      >
                        {withdrawal.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(withdrawal)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatusClick(withdrawal)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Update Status"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit + 1).toLocaleString()} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()} of{' '}
              {pagination.total.toLocaleString()} requests
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedWithdrawal(null);
        }}
        title="Withdrawal Request Details"
        size="2xl"
      >
        {withdrawalDetails ? (
          <div className="space-y-6">
            {/* User Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">User Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{withdrawalDetails.User.Name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{withdrawalDetails.User.Email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Coins</label>
                  <p className="text-sm text-gray-900">{withdrawalDetails.User.Coins}</p>
                </div>
              </div>
            </div>

            {/* Withdrawal Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <p className="text-lg font-bold text-gray-900">₹{withdrawalDetails.Amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    withdrawalDetails.Status
                  )} capitalize`}
                >
                  {withdrawalDetails.Status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <p className="text-sm text-gray-900">{getPaymentMethodLabel(withdrawalDetails.PaymentMethod)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
                <p className="text-sm text-gray-900">{new Date(withdrawalDetails.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Payment Details */}
            {withdrawalDetails.PaymentMethod === 'upi' ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">UPI Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <p className="text-sm text-gray-900">{withdrawalDetails.UPIId}</p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <p className="text-sm text-gray-900">{withdrawalDetails.BankName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    <p className="text-sm text-gray-900">{withdrawalDetails.AccountHolderName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <p className="text-sm font-mono text-gray-900">{withdrawalDetails.AccountNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <p className="text-sm font-mono text-gray-900">{withdrawalDetails.IFSCode}</p>
                  </div>
                  {withdrawalDetails.BankBranch && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                      <p className="text-sm text-gray-900">{withdrawalDetails.BankBranch}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Processing Information */}
            {withdrawalDetails.ProcessedBy && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Processing Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Processed By</label>
                    <p className="text-sm text-gray-900">{withdrawalDetails.ProcessedBy.Name}</p>
                  </div>
                  {withdrawalDetails.ProcessedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Processed At</label>
                      <p className="text-sm text-gray-900">{new Date(withdrawalDetails.ProcessedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {withdrawalDetails.TransactionId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                      <p className="text-sm font-mono text-gray-900">{withdrawalDetails.TransactionId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {withdrawalDetails.AdminNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{withdrawalDetails.AdminNotes}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {withdrawalDetails.RejectionReason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-red-700 mb-1">Rejection Reason</label>
                <p className="text-sm text-red-900">{withdrawalDetails.RejectionReason}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedWithdrawal(null);
                }}
              >
                Close
              </Button>
              <Button onClick={() => handleUpdateStatusClick(withdrawalDetails)}>
                Update Status
              </Button>
            </div>
          </div>
        ) : (
          <Skeleton variant="rectangular" height={400} />
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedWithdrawal(null);
        }}
        title="Update Withdrawal Status"
        size="lg"
      >
        <form onSubmit={handleSubmitStatus(handleUpdateStatus)} className="space-y-6">
          <Select
            label="Status *"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'paid', label: 'Paid' },
              { value: 'failed', label: 'Failed' },
            ]}
            {...registerStatus('Status')}
            error={statusErrors.Status?.message}
          />
          {watchStatus('Status') === 'rejected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                {...registerStatus('RejectionReason')}
                rows={3}
                className={`input w-full ${statusErrors.RejectionReason ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter reason for rejection..."
              />
              {statusErrors.RejectionReason && (
                <p className="mt-1 text-sm text-red-600">{statusErrors.RejectionReason.message}</p>
              )}
            </div>
          )}
          <Input
            label="Transaction ID"
            {...registerStatus('TransactionId')}
            error={statusErrors.TransactionId?.message}
            placeholder="Enter transaction ID (optional)"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
            <textarea
              {...registerStatus('AdminNotes')}
              rows={4}
              className="input w-full"
              placeholder="Add admin notes about this withdrawal..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsStatusModalOpen(false);
                setSelectedWithdrawal(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateStatusMutation.isPending}>
              Update Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

