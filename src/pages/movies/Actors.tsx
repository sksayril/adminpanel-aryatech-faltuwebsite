import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { actorsApi, CreateActorData, Actor } from '@/api/actors.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { FileUpload } from '@/components/ui/FileUpload';
import { SkeletonTable, Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/utils/toast';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const createActorSchema = z.object({
  Name: z.string().min(1, 'Actor name is required'),
  Description: z.string().optional(),
  DateOfBirth: z.string().optional(),
  Nationality: z.string().optional(),
  SortOrder: z.number().optional(),
  IsActive: z.boolean().optional(),
});

type CreateActorFormData = z.infer<typeof createActorSchema>;

export const Actors = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActorId, setEditingActorId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; actorId: string | null }>({
    isOpen: false,
    actorId: null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Build query params
  const queryParams: any = { page, limit: 20 };
  if (searchQuery) queryParams.search = searchQuery;
  if (isActiveFilter) queryParams.isActive = isActiveFilter === 'true';

  // Fetch actors
  const { data, isLoading } = useQuery({
    queryKey: ['actors', queryParams],
    queryFn: () => actorsApi.getAll(queryParams),
  });

  // Fetch actor for editing
  const { data: editActorData } = useQuery({
    queryKey: ['actor', editingActorId],
    queryFn: () => actorsApi.getById(editingActorId!),
    enabled: !!editingActorId && isEditModalOpen,
  });

  // Create form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
    watch: watchCreate,
    setValue: setCreateValue,
  } = useForm<CreateActorFormData>({
    resolver: zodResolver(createActorSchema),
    defaultValues: {
      IsActive: true,
      SortOrder: 0,
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
  } = useForm<CreateActorFormData>({
    resolver: zodResolver(createActorSchema),
  });

  // Load edit data into form
  useEffect(() => {
    if (editActorData?.data && isEditModalOpen) {
      const actor = editActorData.data;
      setEditValue('Name', actor.Name);
      setEditValue('Description', actor.Description || '');
      setEditValue('DateOfBirth', actor.DateOfBirth ? actor.DateOfBirth.split('T')[0] : '');
      setEditValue('Nationality', actor.Nationality || '');
      setEditValue('SortOrder', actor.SortOrder || 0);
      setEditValue('IsActive', actor.IsActive);
    }
  }, [editActorData, isEditModalOpen, setEditValue]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateActorData) => actorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
      setIsCreateModalOpen(false);
      resetCreate();
      setImageFile(null);
      showToast.success('Actor created successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to create actor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; data: CreateActorData }) => actorsApi.update(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
      setIsEditModalOpen(false);
      setEditingActorId(null);
      resetEdit();
      setImageFile(null);
      showToast.success('Actor updated successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to update actor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => actorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
      setDeleteModal({ isOpen: false, actorId: null });
      showToast.success('Actor deleted successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to delete actor');
    },
  });

  const onCreateSubmit = (data: CreateActorFormData) => {
    createMutation.mutate({
      Name: data.Name,
      Description: data.Description,
      DateOfBirth: data.DateOfBirth,
      Nationality: data.Nationality,
      SortOrder: data.SortOrder,
      IsActive: data.IsActive ?? true,
      image: imageFile || undefined,
    });
  };

  const onEditSubmit = (data: CreateActorFormData) => {
    if (!editingActorId) return;
    updateMutation.mutate({
      id: editingActorId,
      data: {
        Name: data.Name,
        Description: data.Description,
        DateOfBirth: data.DateOfBirth,
        Nationality: data.Nationality,
        SortOrder: data.SortOrder,
        IsActive: data.IsActive,
        image: imageFile || undefined,
      },
    });
  };

  const handleEdit = (actor: Actor) => {
    setEditingActorId(actor._id);
    setIsEditModalOpen(true);
    setImageFile(null);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton variant="text" height={32} width={200} />
            <Skeleton variant="text" height={20} width={300} className="mt-2" />
          </div>
          <Skeleton variant="rectangular" width={150} height={40} />
        </div>
        <SkeletonTable rows={10} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actors Management</h1>
          <p className="text-gray-600">Manage all your actors</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Actor
        </Button>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Search Actors"
          placeholder="Search by name, description..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
        />
        <select
          className="input"
          value={isActiveFilter}
          onChange={(e) => {
            setIsActiveFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setIsActiveFilter('');
              setPage(1);
            }}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Actors Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Birth
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nationality
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sort Order
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.data && data.data.length > 0 ? (
              data.data.map((actor) => (
                <tr key={actor._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {actor.Image ? (
                      <img
                        src={actor.Image}
                        alt={actor.Name}
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500">No Image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{actor.Name}</div>
                    <div className="text-xs text-gray-500">{actor.Slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {actor.Description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(actor.DateOfBirth)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {actor.Nationality || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        actor.IsActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {actor.IsActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {actor.SortOrder ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(actor)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteModal({ isOpen: true, actorId: actor._id })}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No actors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} actors
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

      {/* Create Actor Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetCreate();
          setImageFile(null);
        }}
        title="Create Actor"
        size="md"
      >
        <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
          <Input
            label="Name *"
            {...registerCreate('Name')}
            error={createErrors.Name?.message}
            placeholder="Tom Hanks"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="input"
              rows={3}
              {...registerCreate('Description')}
              placeholder="Academy Award-winning actor"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              {...registerCreate('DateOfBirth')}
              error={createErrors.DateOfBirth?.message}
            />
            <Input
              label="Nationality"
              {...registerCreate('Nationality')}
              error={createErrors.Nationality?.message}
              placeholder="American"
            />
          </div>
          <Input
            label="Sort Order"
            type="number"
            {...registerCreate('SortOrder', { valueAsNumber: true })}
            error={createErrors.SortOrder?.message}
            placeholder="0"
          />
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Is Active</label>
            <Switch
              checked={watchCreate('IsActive') ?? true}
              onChange={(checked) => setCreateValue('IsActive', checked)}
            />
          </div>
          <FileUpload
            label="Actor Image"
            accept="image/*"
            maxSize={5}
            onChange={(files) => setImageFile(files?.[0] || null)}
            preview={imageFile ? URL.createObjectURL(imageFile) : undefined}
          />
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetCreate();
                setImageFile(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Actor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Actor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingActorId(null);
          resetEdit();
          setImageFile(null);
        }}
        title="Edit Actor"
        size="md"
      >
        {editActorData?.data && (
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <Input
              label="Name *"
              {...registerEdit('Name')}
              error={editErrors.Name?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="input"
                rows={3}
                {...registerEdit('Description')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                {...registerEdit('DateOfBirth')}
                error={editErrors.DateOfBirth?.message}
              />
              <Input
                label="Nationality"
                {...registerEdit('Nationality')}
                error={editErrors.Nationality?.message}
              />
            </div>
            <Input
              label="Sort Order"
              type="number"
              {...registerEdit('SortOrder', { valueAsNumber: true })}
              error={editErrors.SortOrder?.message}
            />
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Is Active</label>
              <Switch
                checked={watchEdit('IsActive') ?? false}
                onChange={(checked) => setEditValue('IsActive', checked)}
              />
            </div>
            <FileUpload
              label="Actor Image"
              accept="image/*"
              maxSize={5}
              onChange={(files) => setImageFile(files?.[0] || null)}
              preview={
                imageFile
                  ? URL.createObjectURL(imageFile)
                  : editActorData.data.Image
                  ? editActorData.data.Image
                  : undefined
              }
            />
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingActorId(null);
                  resetEdit();
                  setImageFile(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Update Actor
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, actorId: null })}
        title="Delete Actor"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this actor? This action cannot be undone. The actor image will also be deleted from storage.
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setDeleteModal({ isOpen: false, actorId: null })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (deleteModal.actorId) {
                deleteMutation.mutate(deleteModal.actorId);
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

