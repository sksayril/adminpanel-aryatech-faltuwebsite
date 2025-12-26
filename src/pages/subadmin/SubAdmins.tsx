import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { subAdminsApi, CreateSubAdminData, SubAdmin, UpdateSubAdminData } from '@/api/subAdmins.api';
import { rolesApi } from '@/api/roles.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { SkeletonTable, Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/utils/toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

const createSubAdminSchema = z.object({
  Email: z.string().email('Invalid email address'),
  Password: z.string().min(6, 'Password must be at least 6 characters'),
  Name: z.string().min(1, 'Name is required'),
  Roles: z.array(z.string()).optional(),
});

const updateSubAdminSchema = z.object({
  Name: z.string().min(1, 'Name is required'),
  Email: z.string().email('Invalid email address'),
  IsActive: z.boolean().optional(),
  Password: z.string().optional(),
});

type CreateSubAdminFormData = z.infer<typeof createSubAdminSchema>;
type UpdateSubAdminFormData = z.infer<typeof updateSubAdminSchema>;

export const SubAdmins = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignRolesModalOpen, setIsAssignRolesModalOpen] = useState(false);
  const [editingSubAdminId, setEditingSubAdminId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; subAdminId: string | null }>({
    isOpen: false,
    subAdminId: null,
  });
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSubAdminId, setSelectedSubAdminId] = useState<string | null>(null);

  // Build query params
  const queryParams: any = { page, limit: 20 };
  if (searchQuery) queryParams.search = searchQuery;

  // Fetch roles for dropdown
  const { data: rolesData } = useQuery({
    queryKey: ['roles', { page: 1, limit: 100 }],
    queryFn: () => rolesApi.getAll({ page: 1, limit: 100 }),
  });

  // Fetch sub-admins
  const { data, isLoading } = useQuery({
    queryKey: ['sub-admins', queryParams],
    queryFn: () => subAdminsApi.getAll(queryParams),
  });

  // Fetch sub-admin for editing
  const { data: editSubAdminData } = useQuery({
    queryKey: ['sub-admin', editingSubAdminId],
    queryFn: () => subAdminsApi.getById(editingSubAdminId!),
    enabled: !!editingSubAdminId && isEditModalOpen,
  });

  // Fetch sub-admin details with statistics
  const { data: subAdminDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['sub-admin-details', selectedSubAdminId],
    queryFn: () => subAdminsApi.getDetails(selectedSubAdminId!),
    enabled: !!selectedSubAdminId && isDetailsModalOpen,
  });

  // Create form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
    watch: watchCreate,
  } = useForm<CreateSubAdminFormData>({
    resolver: zodResolver(createSubAdminSchema),
  });

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue,
    watch: watchEdit,
  } = useForm<UpdateSubAdminFormData>({
    resolver: zodResolver(updateSubAdminSchema),
  });

  // Load edit data into form
  useEffect(() => {
    if (editSubAdminData && isEditModalOpen) {
      const subAdmin = editSubAdminData;
      setEditValue('Name', subAdmin.Name);
      setEditValue('Email', subAdmin.Email);
      setEditValue('IsActive', subAdmin.IsActive);
    }
  }, [editSubAdminData, isEditModalOpen, setEditValue]);

  // Reset create form
  useEffect(() => {
    if (!isCreateModalOpen) {
      resetCreate();
      setSelectedRoles([]);
    }
  }, [isCreateModalOpen, resetCreate]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateSubAdminData) => subAdminsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] });
      setIsCreateModalOpen(false);
      resetCreate();
      setSelectedRoles([]);
      showToast.success(`Sub-admin created successfully! Password: ${data.PlainPassword || 'N/A'}`);
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to create sub-admin');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubAdminData }) =>
      subAdminsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] });
      queryClient.invalidateQueries({ queryKey: ['sub-admin', editingSubAdminId] });
      setIsEditModalOpen(false);
      setEditingSubAdminId(null);
      resetEdit();
      if (data.PlainPassword) {
        showToast.success(`Sub-admin updated successfully! New Password: ${data.PlainPassword}`);
      } else {
        showToast.success('Sub-admin updated successfully');
      }
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to update sub-admin');
    },
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) =>
      subAdminsApi.assignRoles(id, { Roles: roles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] });
      queryClient.invalidateQueries({ queryKey: ['sub-admin', editingSubAdminId] });
      setIsAssignRolesModalOpen(false);
      setSelectedRoles([]);
      showToast.success('Roles assigned successfully');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to assign roles');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subAdminsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] });
      setDeleteModal({ isOpen: false, subAdminId: null });
      showToast.success('Sub-admin deleted successfully');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to delete sub-admin');
    },
  });

  // Handlers
  const handleCreate = (data: CreateSubAdminFormData) => {
    createMutation.mutate({
      Email: data.Email,
      Password: data.Password,
      Name: data.Name,
      Roles: selectedRoles.length > 0 ? selectedRoles : undefined,
    });
  };

  const handleEdit = (data: UpdateSubAdminFormData) => {
    if (!editingSubAdminId) return;
    const updateData: UpdateSubAdminData = {
      Name: data.Name,
      Email: data.Email,
      IsActive: data.IsActive,
    };
    if (data.Password && data.Password.trim() !== '') {
      updateData.Password = data.Password;
    }
    updateMutation.mutate({
      id: editingSubAdminId,
      data: updateData,
    });
  };

  const handleAssignRoles = () => {
    if (!editingSubAdminId) return;
    assignRolesMutation.mutate({
      id: editingSubAdminId,
      roles: selectedRoles,
    });
  };

  const handleDelete = () => {
    if (deleteModal.subAdminId) {
      deleteMutation.mutate(deleteModal.subAdminId);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditClick = (subAdmin: SubAdmin) => {
    setEditingSubAdminId(subAdmin._id);
    setIsEditModalOpen(true);
  };

  const handleAssignRolesClick = (subAdmin: SubAdmin) => {
    setEditingSubAdminId(subAdmin._id);
    setSelectedRoles(subAdmin.Roles?.map((r) => r._id) || []);
    setIsAssignRolesModalOpen(true);
  };

  const subAdmins = data?.data || [];
  const pagination = data?.pagination;
  const roles = rolesData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton variant="text" height={32} width={200} />
            <Skeleton variant="text" height={20} width={300} className="mt-2" />
          </div>
        </div>
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Admin Management</h1>
          <p className="text-gray-600">Manage sub-admin users and their roles</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create Sub-Admin
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Password
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subAdmins.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No sub-admins found
                  </td>
                </tr>
              ) : (
                subAdmins.map((subAdmin) => (
                  <tr key={subAdmin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{subAdmin.Name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subAdmin.Email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {subAdmin.PlainPassword ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-700">
                            {showPassword[subAdmin._id] ? subAdmin.PlainPassword : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(subAdmin._id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {showPassword[subAdmin._id] ? (
                              <EyeSlashIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not available</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {subAdmin.Roles && subAdmin.Roles.length > 0 ? (
                          subAdmin.Roles.map((role) => (
                            <span
                              key={role._id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {role.Name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {subAdmin.Permissions?.length || 0} permission
                          {(subAdmin.Permissions?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subAdmin.IsActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {subAdmin.IsActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subAdmin.CreatedBy?.Name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubAdminId(subAdmin._id);
                            setIsDetailsModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(subAdmin)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleAssignRolesClick(subAdmin)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Assign Roles"
                        >
                          <KeyIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, subAdminId: subAdmin._id })}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
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
              {pagination.total.toLocaleString()} sub-admins
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

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Sub-Admin"
        size="xl"
      >
        <form onSubmit={handleSubmitCreate(handleCreate)} className="space-y-6">
          <Input
            label="Name"
            {...registerCreate('Name')}
            error={createErrors.Name?.message}
            placeholder="Sub Admin User"
          />
          <Input
            label="Email"
            type="email"
            {...registerCreate('Email')}
            error={createErrors.Email?.message}
            placeholder="subadmin@example.com"
          />
          <Input
            label="Password"
            type="password"
            {...registerCreate('Password')}
            error={createErrors.Password?.message}
            placeholder="Minimum 6 characters"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles (Optional)
            </label>
            <MultiSelect
              options={
                (roles || []).map((role) => ({
                  value: role._id,
                  label: role.Name,
                  description: role.Description,
                }))
              }
              value={selectedRoles}
              onChange={setSelectedRoles}
              placeholder="Select roles..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Sub-Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSubAdminId(null);
        }}
        title="Edit Sub-Admin"
        size="xl"
      >
        <form onSubmit={handleSubmitEdit(handleEdit)} className="space-y-6">
          <Input
            label="Name"
            {...registerEdit('Name')}
            error={editErrors.Name?.message}
          />
          <Input
            label="Email"
            type="email"
            {...registerEdit('Email')}
            error={editErrors.Email?.message}
          />
          <Input
            label="New Password (Leave empty to keep current)"
            type="password"
            {...registerEdit('Password')}
            error={editErrors.Password?.message}
            placeholder="Leave empty to keep current password"
          />

          <div className="flex items-center gap-2">
            <Switch
              checked={watchEdit('IsActive') ?? true}
              onChange={(checked) => setEditValue('IsActive', checked)}
            />
            <label className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingSubAdminId(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Update Sub-Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Roles Modal */}
      <Modal
        isOpen={isAssignRolesModalOpen}
        onClose={() => {
          setIsAssignRolesModalOpen(false);
          setEditingSubAdminId(null);
          setSelectedRoles([]);
        }}
        title="Assign Roles"
        size="xl"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Roles
            </label>
            <MultiSelect
              options={
                (roles || []).map((role) => ({
                  value: role._id,
                  label: role.Name,
                  description: role.Description,
                }))
              }
              value={selectedRoles}
              onChange={setSelectedRoles}
              placeholder="Select roles to assign..."
            />
            <p className="text-sm text-gray-500 mt-2">
              Selected: {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAssignRolesModalOpen(false);
                setEditingSubAdminId(null);
                setSelectedRoles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignRoles}
              isLoading={assignRolesMutation.isPending}
            >
              Assign Roles
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, subAdminId: null })}
        title="Delete Sub-Admin"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this sub-admin? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, subAdminId: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sub-Admin Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedSubAdminId(null);
        }}
        title="Sub-Admin Details & Statistics"
        size="2xl"
      >
        {isLoadingDetails ? (
          <Skeleton variant="rectangular" height={600} />
        ) : subAdminDetails ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900">{subAdminDetails.Name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{subAdminDetails.Email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    subAdminDetails.IsActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {subAdminDetails.IsActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {subAdminDetails.LastLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                  <p className="text-sm text-gray-900">
                    {new Date(subAdminDetails.LastLogin).toLocaleString()}
                  </p>
                </div>
              )}
              {subAdminDetails.CreatedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <p className="text-sm text-gray-900">{subAdminDetails.CreatedBy.Name}</p>
                </div>
              )}
              {subAdminDetails.PlainPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <p className="text-sm font-mono text-gray-900">{subAdminDetails.PlainPassword}</p>
                </div>
              )}
            </div>

            {/* Roles */}
            {subAdminDetails.Roles && subAdminDetails.Roles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {subAdminDetails.Roles.map((role) => (
                    <span
                      key={role._id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role.Name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions */}
            {subAdminDetails.Permissions && subAdminDetails.Permissions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {subAdminDetails.Permissions.map((perm) => (
                    <span
                      key={perm}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics */}
            {subAdminDetails.statistics && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>

                {/* Total Tasks */}
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tasks Completed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {subAdminDetails.statistics.totalTasks}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistics by Permission */}
                {subAdminDetails.statistics.byPermission &&
                  Object.keys(subAdminDetails.statistics.byPermission).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Activity by Permission</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(subAdminDetails.statistics.byPermission).map(
                          ([key, stats]: [string, any]) => (
                            <div
                              key={key}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 capitalize">
                                  {key}
                                </span>
                                {stats.permission && (
                                  <span className="text-xs text-gray-500">{stats.permission}</span>
                                )}
                              </div>
                              <div className="space-y-1">
                                {stats.created !== undefined && (
                                  <p className="text-xs text-gray-600">
                                    Created: <span className="font-semibold">{stats.created}</span>
                                  </p>
                                )}
                                {stats.viewed !== undefined && (
                                  <p className="text-xs text-gray-600">
                                    Viewed: <span className="font-semibold">{stats.viewed}</span>
                                  </p>
                                )}
                                {stats.reachedOut !== undefined && (
                                  <p className="text-xs text-gray-600">
                                    Reached Out: <span className="font-semibold">{stats.reachedOut}</span>
                                  </p>
                                )}
                                {stats.notesAdded !== undefined && (
                                  <p className="text-xs text-gray-600">
                                    Notes Added: <span className="font-semibold">{stats.notesAdded}</span>
                                  </p>
                                )}
                                {stats.total !== undefined && (
                                  <p className="text-xs text-gray-600">
                                    Total: <span className="font-semibold">{stats.total}</span>
                                  </p>
                                )}
                                {stats.managed !== undefined && (
                                  <p className="text-xs text-gray-600">
                                    Managed: <span className="font-semibold">{stats.managed}</span>
                                  </p>
                                )}
                                {stats.accessed !== undefined && (
                                  <p className="text-xs text-gray-600">
                                    Access: <span className="font-semibold">{stats.accessed ? 'Yes' : 'No'}</span>
                                  </p>
                                )}
                                {stats.note && (
                                  <p className="text-xs text-gray-500 italic">{stats.note}</p>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Recent Activity */}
                {subAdminDetails.statistics.recentActivity &&
                  Object.keys(subAdminDetails.statistics.recentActivity).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity (Last 30 Days)</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(subAdminDetails.statistics.recentActivity).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Last 30 Days Summary */}
                {subAdminDetails.statistics.last30Days && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Last 30 Days Summary</h4>
                    <p className="text-lg font-bold text-gray-900 mb-2">
                      Total: {subAdminDetails.statistics.last30Days.total} tasks
                    </p>
                    {subAdminDetails.statistics.last30Days.breakdown &&
                      Object.keys(subAdminDetails.statistics.last30Days.breakdown).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(subAdminDetails.statistics.last30Days.breakdown).map(
                            ([key, value]) => (
                              <span
                                key={key}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300"
                              >
                                {key}: {value}
                              </span>
                            )
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedSubAdminId(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No details available</div>
        )}
      </Modal>
    </div>
  );
};

