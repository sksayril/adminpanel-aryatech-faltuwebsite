import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { rolesApi, CreateRoleData, Role, PermissionsResponse } from '@/api/roles.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { SkeletonTable, Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/utils/toast';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const createRoleSchema = z.object({
  Name: z.string().min(1, 'Role name is required'),
  Description: z.string().optional(),
  Permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  IsActive: z.boolean().optional(),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

export const Roles = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; roleId: string | null }>({
    isOpen: false,
    roleId: null,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Build query params
  const queryParams: any = { page, limit: 20 };
  if (searchQuery) queryParams.search = searchQuery;
  if (isActiveFilter) queryParams.isActive = isActiveFilter === 'true';

  // Fetch permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesApi.getPermissions(),
  });

  // Ensure contact permissions are included (fallback if backend doesn't return them)
  // This ensures contact permissions are always available for selection
  const processedPermissionsData = permissionsData
    ? {
        ...permissionsData,
        categories: {
          ...permissionsData.categories,
          // Add contact category if it doesn't exist (check both singular and plural)
          ...(!permissionsData.categories.contact && !permissionsData.categories.contacts
            ? {
                contact: ['contact:read', 'contact:update', 'contact:delete'],
              }
            : {}),
        },
      }
    : permissionsData;

  // Fetch roles
  const { data, isLoading } = useQuery({
    queryKey: ['roles', queryParams],
    queryFn: () => rolesApi.getAll(queryParams),
  });

  // Fetch role for editing
  const { data: editRoleData } = useQuery({
    queryKey: ['role', editingRoleId],
    queryFn: () => rolesApi.getById(editingRoleId!),
    enabled: !!editingRoleId && isEditModalOpen,
  });

  // Create form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
    watch: watchCreate,
    setValue: setCreateValue,
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      IsActive: true,
      Permissions: [],
    },
  });

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue,
    watch: watchEdit,
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
  });

  // Load edit data into form
  useEffect(() => {
    if (editRoleData && isEditModalOpen) {
      const role = editRoleData;
      setEditValue('Name', role.Name);
      setEditValue('Description', role.Description || '');
      setEditValue('Permissions', role.Permissions || []);
      setEditValue('IsActive', role.IsActive);
      setSelectedPermissions(role.Permissions || []);
    }
  }, [editRoleData, isEditModalOpen, setEditValue]);

  // Reset create form
  useEffect(() => {
    if (!isCreateModalOpen) {
      resetCreate();
      setSelectedPermissions([]);
    }
  }, [isCreateModalOpen, resetCreate]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateRoleData) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateModalOpen(false);
      resetCreate();
      setSelectedPermissions([]);
      showToast.success('Role created successfully');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRoleData }) => rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', editingRoleId] });
      setIsEditModalOpen(false);
      setEditingRoleId(null);
      resetEdit();
      setSelectedPermissions([]);
      showToast.success('Role updated successfully');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteModal({ isOpen: false, roleId: null });
      showToast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to delete role');
    },
  });

  // Handlers
  const handleCreate = (data: CreateRoleFormData) => {
    createMutation.mutate({
      Name: data.Name,
      Description: data.Description,
      Permissions: selectedPermissions,
      IsActive: data.IsActive ?? true,
    });
  };

  const handleEdit = (data: CreateRoleFormData) => {
    if (!editingRoleId) return;
    updateMutation.mutate({
      id: editingRoleId,
      data: {
        Name: data.Name,
        Description: data.Description,
        Permissions: selectedPermissions,
        IsActive: data.IsActive,
      },
    });
  };

  const handleDelete = () => {
    if (deleteModal.roleId) {
      deleteMutation.mutate(deleteModal.roleId);
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) => {
      const newPerms = prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission];
      // Update form value
      if (isCreateModalOpen) {
        setCreateValue('Permissions', newPerms);
      } else if (isEditModalOpen) {
        setEditValue('Permissions', newPerms);
      }
      return newPerms;
    });
  };

  const toggleCategoryPermissions = (category: string, permissions: string[]) => {
    const allSelected = permissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      const newPerms = selectedPermissions.filter((p) => !permissions.includes(p));
      setSelectedPermissions(newPerms);
      if (isCreateModalOpen) {
        setCreateValue('Permissions', newPerms);
      } else if (isEditModalOpen) {
        setEditValue('Permissions', newPerms);
      }
    } else {
      const newPerms = [...selectedPermissions];
      permissions.forEach((p) => {
        if (!newPerms.includes(p)) {
          newPerms.push(p);
        }
      });
      setSelectedPermissions(newPerms);
      if (isCreateModalOpen) {
        setCreateValue('Permissions', newPerms);
      } else if (isEditModalOpen) {
        setEditValue('Permissions', newPerms);
      }
    }
  };

  const roles = data?.data || [];
  const pagination = data?.pagination;

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
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Manage roles and permissions for sub-admins</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create Role
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value);
              setPage(1);
            }}
            className="input"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Description
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
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No roles found
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{role.Name}</div>
                      <div className="text-sm text-gray-500">{role.Slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {role.Description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {role.Permissions.length} permission{role.Permissions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          role.IsActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {role.IsActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role.CreatedBy?.Name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingRoleId(role._id);
                            setIsEditModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, roleId: role._id })}
                          className="text-red-600 hover:text-red-900"
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
              {pagination.total.toLocaleString()} roles
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
        title="Create Role"
        size="2xl"
      >
        <form onSubmit={handleSubmitCreate(handleCreate)} className="space-y-6">
          <Input
            label="Role Name"
            {...registerCreate('Name')}
            error={createErrors.Name?.message}
            placeholder="e.g., Movie Manager"
          />
          <Input
            label="Description"
            {...registerCreate('Description')}
            error={createErrors.Description?.message}
            placeholder="Brief description of the role"
          />

          {/* Permissions Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions <span className="text-red-500">*</span>
            </label>
            {createErrors.Permissions && (
              <p className="text-red-500 text-sm mt-1">{createErrors.Permissions.message}</p>
            )}
            <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
              {processedPermissionsData?.categories ? (
                Object.entries(processedPermissionsData.categories).map(([category, perms]) => {
                  const allSelected = perms.every((p) => selectedPermissions.includes(p));
                  const someSelected = perms.some((p) => selectedPermissions.includes(p));

                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleCategoryPermissions(category, perms)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label className="font-semibold text-gray-900 capitalize">
                          {category}
                        </label>
                      </div>
                      <div className="ml-6 space-y-2">
                        {perms.map((perm) => (
                          <div key={perm} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm)}
                              onChange={() => togglePermission(perm)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label className="text-sm text-gray-700">{perm}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <Skeleton variant="rect" height={200} />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Selected: {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={watchCreate('IsActive') ?? true}
              onChange={(checked) => setCreateValue('IsActive', checked)}
            />
            <label className="text-sm font-medium text-gray-700">Active</label>
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
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRoleId(null);
        }}
        title="Edit Role"
        size="2xl"
      >
        <form onSubmit={handleSubmitEdit(handleEdit)} className="space-y-6">
          <Input
            label="Role Name"
            {...registerEdit('Name')}
            error={editErrors.Name?.message}
          />
          <Input
            label="Description"
            {...registerEdit('Description')}
            error={editErrors.Description?.message}
          />

          {/* Permissions Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions <span className="text-red-500">*</span>
            </label>
            {editErrors.Permissions && (
              <p className="text-red-500 text-sm mt-1">{editErrors.Permissions.message}</p>
            )}
            <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
              {processedPermissionsData?.categories ? (
                Object.entries(processedPermissionsData.categories).map(([category, perms]) => {
                  const allSelected = perms.every((p) => selectedPermissions.includes(p));
                  const someSelected = perms.some((p) => selectedPermissions.includes(p));

                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleCategoryPermissions(category, perms)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label className="font-semibold text-gray-900 capitalize">
                          {category}
                        </label>
                      </div>
                      <div className="ml-6 space-y-2">
                        {perms.map((perm) => (
                          <div key={perm} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm)}
                              onChange={() => togglePermission(perm)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label className="text-sm text-gray-700">{perm}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <Skeleton variant="rect" height={200} />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Selected: {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''}
            </p>
          </div>

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
                setEditingRoleId(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Update Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, roleId: null })}
        title="Delete Role"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this role? This action cannot be undone. Note: This will
            not remove the role from sub-admins who have it assigned.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, roleId: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

