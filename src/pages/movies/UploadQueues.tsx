import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadQueuesApi, UploadQueueJob } from '@/api/uploadQueues.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { SkeletonTable, SkeletonStats, Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/utils/toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

type QueueFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

export const UploadQueues = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<QueueFilter>('all');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<UploadQueueJob | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Build query params
  const queryParams: any = { page, limit: 20 };
  if (statusFilter) queryParams.status = statusFilter;
  if (fileTypeFilter) queryParams.fileType = fileTypeFilter;
  if (searchQuery) queryParams.search = searchQuery;

  // Fetch data based on active tab
  const { data, isLoading } = useQuery({
    queryKey: ['upload-queues', activeTab, queryParams],
    queryFn: () => {
      if (activeTab === 'pending') {
        return uploadQueuesApi.getPending({ fileType: fileTypeFilter || undefined, page, limit: 20 });
      } else if (activeTab === 'all') {
        return uploadQueuesApi.getAll(queryParams);
      } else {
        return uploadQueuesApi.getAll({ ...queryParams, status: activeTab });
      }
    },
  });

  // Search query
  const { data: searchData, isLoading: isSearching } = useQuery({
    queryKey: ['upload-queues-search', searchQuery],
    queryFn: () => uploadQueuesApi.search({ title: searchQuery, status: statusFilter || undefined, fileType: fileTypeFilter || undefined, page, limit: 20 }),
    enabled: !!searchQuery && searchQuery.length > 2,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => uploadQueuesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upload-queues'] });
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
      showToast.success('Upload queue deleted successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete upload queue';
      showToast.error(message);
    },
  });

  const handleViewDetails = async (jobId: string) => {
    try {
      const response = await uploadQueuesApi.getById(jobId);
      setSelectedJob(response.data);
      setIsDetailsModalOpen(true);
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || 'Failed to fetch queue details');
    }
  };

  const handleDelete = (jobId: string) => {
    setJobToDelete(jobId);
    setIsDeleteModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'video':
        return 'bg-purple-100 text-purple-800';
      case 'thumbnail':
        return 'bg-pink-100 text-pink-800';
      case 'poster':
        return 'bg-indigo-100 text-indigo-800';
      case 'subtitle':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const displayData = searchQuery && searchQuery.length > 2 ? searchData : data;
  const isLoadingData = searchQuery && searchQuery.length > 2 ? isSearching : isLoading;

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton variant="text" height={32} width={200} />
            <Skeleton variant="text" height={20} width={300} className="mt-2" />
          </div>
        </div>
        <SkeletonStats />
        <SkeletonTable rows={10} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Queues</h1>
          <p className="text-gray-600">Manage and monitor file upload queues</p>
        </div>
      </div>

      {/* Statistics */}
      {data?.data.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.data.statistics.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">{data.data.statistics.processing}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">{data.data.statistics.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-600">{data.data.statistics.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-orange-600">{data.data.statistics.retrying}</div>
            <div className="text-sm text-gray-600">Retrying</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['all', 'pending', 'processing', 'completed', 'failed'] as QueueFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize
                ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab === 'all' ? 'All Queues' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          label="Search by Movie Title"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
        />
        <Select
          label="Filter by Status"
          options={[
            { value: '', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' },
          ]}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Filter by File Type"
          options={[
            { value: '', label: 'All Types' },
            { value: 'video', label: 'Video' },
            { value: 'thumbnail', label: 'Thumbnail' },
            { value: 'poster', label: 'Poster' },
            { value: 'subtitle', label: 'Subtitle' },
          ]}
          value={fileTypeFilter}
          onChange={(e) => {
            setFileTypeFilter(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              setFileTypeFilter('');
              setPage(1);
            }}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Upload Queues Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Movie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData?.data.jobs && displayData.data.jobs.length > 0 ? (
              displayData.data.jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {job.movie ? (
                      <div className="flex items-center">
                        {job.movie.thumbnail && (
                          <img
                            src={job.movie.thumbnail}
                            alt={job.movie.title}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.movie.title}</div>
                          <div className="text-xs text-gray-500">{job.movie.slug}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Movie deleted</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getFileTypeColor(job.fileType)}`}>
                        {job.fileType}
                      </span>
                      <div>
                        <div className="text-sm text-gray-900 truncate max-w-xs">{job.fileName}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(job.fileSize)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            job.status === 'completed'
                              ? 'bg-green-500'
                              : job.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{job.progress}%</span>
                    </div>
                    {job.status === 'processing' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatFileSize(job.uploadedSize)} / {formatFileSize(job.fileSize)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                      {job.status === 'failed' && <XCircleIcon className="h-4 w-4 text-red-500" />}
                      {(job.status === 'processing' || job.status === 'pending') && (
                        <ClockIcon className="h-4 w-4 text-blue-500 animate-spin" />
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    {job.errorMessage && (
                      <div className="text-xs text-red-600 mt-1 truncate max-w-xs" title={job.errorMessage}>
                        {job.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.user.name}</div>
                    <div className="text-xs text-gray-500">{job.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(job.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(job._id)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      {(job.status === 'completed' || job.status === 'failed') && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(job._id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {searchQuery
                    ? 'No upload queues found matching your search.'
                    : 'No upload queues found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {displayData?.data.pagination && displayData.data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, displayData.data.pagination.total)} of {displayData.data.pagination.total} queues
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
              disabled={page === displayData.data.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedJob(null);
        }}
        title="Upload Queue Details"
        size="lg"
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Movie Information */}
            {selectedJob.movie && (
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Movie Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="text-sm text-gray-900">{selectedJob.movie.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Slug</label>
                    <p className="text-sm text-gray-900">{selectedJob.movie.slug}</p>
                  </div>
                  {selectedJob.movie.description && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-sm text-gray-900">{selectedJob.movie.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">File Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">File Type</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedJob.fileType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Name</label>
                  <p className="text-sm text-gray-900 break-all">{selectedJob.fileName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Size</label>
                  <p className="text-sm text-gray-900">{formatFileSize(selectedJob.fileSize)}</p>
                </div>
                {selectedJob.mimeType && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">MIME Type</label>
                    <p className="text-sm text-gray-900">{selectedJob.mimeType}</p>
                  </div>
                )}
                {selectedJob.folder && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Folder</label>
                    <p className="text-sm text-gray-900">{selectedJob.folder}</p>
                  </div>
                )}
                {selectedJob.s3Key && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">S3 Key</label>
                    <p className="text-sm text-gray-900 break-all">{selectedJob.s3Key}</p>
                  </div>
                )}
                {selectedJob.s3Url && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">S3 URL</label>
                    <a
                      href={selectedJob.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {selectedJob.s3Url}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress Information</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedJob.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        selectedJob.status === 'completed'
                          ? 'bg-green-500'
                          : selectedJob.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${selectedJob.progress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-sm">
                      <span className={`px-2 py-1 rounded-full ${getStatusColor(selectedJob.status)}`}>
                        {selectedJob.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Uploaded Size</label>
                    <p className="text-sm text-gray-900">
                      {formatFileSize(selectedJob.uploadedSize)} / {formatFileSize(selectedJob.fileSize)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Retries</label>
                    <p className="text-sm text-gray-900">
                      {selectedJob.retries} / {selectedJob.maxRetries}
                    </p>
                  </div>
                </div>
                {selectedJob.errorMessage && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Error Message</label>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-1">{selectedJob.errorMessage}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            {selectedJob.metadata && (
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedJob.metadata.quality && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quality</label>
                      <p className="text-sm text-gray-900">{selectedJob.metadata.quality}</p>
                    </div>
                  )}
                  {selectedJob.metadata.isOriginal !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Is Original</label>
                      <p className="text-sm text-gray-900">{selectedJob.metadata.isOriginal ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {selectedJob.metadata.language && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Language</label>
                      <p className="text-sm text-gray-900">{selectedJob.metadata.language}</p>
                    </div>
                  )}
                  {selectedJob.metadata.languageCode && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Language Code</label>
                      <p className="text-sm text-gray-900">{selectedJob.metadata.languageCode}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedJob.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated At</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedJob.updatedAt)}</p>
                </div>
                {selectedJob.startedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Started At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedJob.startedAt)}</p>
                  </div>
                )}
                {selectedJob.completedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Completed At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedJob.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedJob(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setJobToDelete(null);
        }}
        title="Delete Upload Queue"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this upload queue? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setJobToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (jobToDelete) {
                deleteMutation.mutate(jobToDelete);
              }
            }}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

