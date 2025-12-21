import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { subsubcategoriesApi, CreateSubSubCategoryData } from '@/api/subsubcategories.api';
import { subcategoriesApi } from '@/api/subcategories.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/utils/toast';

const createSubSubCategorySchema = z.object({
  Name: z.string().min(1, 'Sub sub category name is required').trim(),
  SubCategory: z.string().min(1, 'Sub category is required').refine((val) => val !== '', {
    message: 'Please select a sub category',
  }),
  Description: z.string().optional(),
  SortOrder: z.number().optional(),
});

type CreateSubSubCategoryFormData = z.infer<typeof createSubSubCategorySchema>;

export const SubSubCategories = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubSubCategoryId, setEditingSubSubCategoryId] = useState<string | null>(null);
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; subSubCategoryId: string | null }>({
    isOpen: false,
    subSubCategoryId: null,
  });

  const { data: subCategoriesData } = useQuery({
    queryKey: ['subcategories'],
    queryFn: () => subcategoriesApi.getAll(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['subsubcategories', { subCategory: subCategoryFilter }],
    queryFn: () => subsubcategoriesApi.getAll({ subCategory: subCategoryFilter || undefined }),
  });

  const { data: editSubSubCategoryData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ['subsubcategory', editingSubSubCategoryId],
    queryFn: () => subsubcategoriesApi.getById(editingSubSubCategoryId!),
    enabled: !!editingSubSubCategoryId && isEditModalOpen,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateSubSubCategoryFormData>({
    resolver: zodResolver(createSubSubCategorySchema),
    defaultValues: {
      Name: '',
      SubCategory: '',
      Description: '',
      SortOrder: undefined,
    },
  });

  const watchedSubCategory = watch('SubCategory');

  // Load edit data into form
  useEffect(() => {
    if (editSubSubCategoryData?.data && isEditModalOpen) {
      const subSubCategory = editSubSubCategoryData.data;
      const subCategoryId = typeof subSubCategory.SubCategory === 'string' 
        ? subSubCategory.SubCategory 
        : subSubCategory.SubCategory._id;
      
      setValue('Name', subSubCategory.Name);
      setValue('SubCategory', subCategoryId);
      setValue('Description', subSubCategory.Description || '');
      setValue('SortOrder', subSubCategory.SortOrder);
    }
  }, [editSubSubCategoryData, isEditModalOpen, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateSubSubCategoryData) => subsubcategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsubcategories'] });
      setIsCreateModalOpen(false);
      reset({
        Name: '',
        SubCategory: '',
        Description: '',
        SortOrder: undefined,
      });
      showToast.success('Sub sub category created successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create sub sub category';
      showToast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateSubSubCategoryData>) => {
      if (!editingSubSubCategoryId) throw new Error('No sub sub category ID');
      return subsubcategoriesApi.update(editingSubSubCategoryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsubcategories'] });
      queryClient.invalidateQueries({ queryKey: ['subsubcategory', editingSubSubCategoryId] });
      setIsEditModalOpen(false);
      setEditingSubSubCategoryId(null);
      reset({
        Name: '',
        SubCategory: '',
        Description: '',
        SortOrder: undefined,
      });
      showToast.success('Sub sub category updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update sub sub category';
      showToast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subsubcategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsubcategories'] });
      setDeleteModal({ isOpen: false, subSubCategoryId: null });
      showToast.success('Sub sub category deleted successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete sub sub category';
      showToast.error(message);
    },
  });

  const onSubmit = async (data: CreateSubSubCategoryFormData) => {
    // Validate required fields
    if (!data.Name || !data.Name.trim()) {
      showToast.error('Sub sub category name is required');
      return;
    }
    
    if (!data.SubCategory || !data.SubCategory.trim()) {
      showToast.error('Please select a sub category');
      return;
    }

    const formData: CreateSubSubCategoryData = {
      Name: data.Name.trim(),
      SubCategory: data.SubCategory.trim(),
      Description: data.Description?.trim() || undefined,
      SortOrder: data.SortOrder || undefined,
      IsActive: true, // Default to active
    };
    
    if (isEditModalOpen && editingSubSubCategoryId) {
      // Update existing sub sub category
      updateMutation.mutate(formData);
    } else {
      // Create new sub sub category
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (id: string) => {
    setEditingSubSubCategoryId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Filter sub sub categories by search query
  const filteredSubSubCategories = data?.data.filter((subSubCategory) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      subSubCategory.Name.toLowerCase().includes(searchLower) ||
      subSubCategory.Description?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const getSubCategoryName = (subCategory: string | { _id: string; Name: string }) => {
    if (typeof subCategory === 'string') {
      return subCategoriesData?.data.find((subCat) => subCat._id === subCategory)?.Name || 'Unknown';
    }
    return subCategory.Name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub Sub Categories</h1>
          <p className="text-gray-600">Manage sub sub categories</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create Sub Sub Category</Button>
      </div>

      {/* Search and Filter Section */}
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Search Sub Sub Categories"
          placeholder="Search by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select
          label="Filter by Sub Category"
          options={[
            { value: '', label: 'All Sub Categories' },
            ...(subCategoriesData?.data?.map((subCat) => ({ value: subCat._id, label: subCat.Name })) || []),
          ]}
          value={subCategoryFilter}
          onChange={(e) => setSubCategoryFilter(e.target.value)}
        />
      </div>

      {/* Sub Sub Categories Grid */}
      {filteredSubSubCategories && filteredSubSubCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSubSubCategories.map((subSubCategory) => (
            <div key={subSubCategory._id} className="card">
              <div className="mb-2">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  {getSubCategoryName(subSubCategory.SubCategory)}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{subSubCategory.Name}</h3>
              <p className="text-sm text-gray-600 mb-4">{subSubCategory.Description}</p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(subSubCategory._id)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteModal({ isOpen: true, subSubCategoryId: subSubCategory._id })}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600">
            {searchQuery || subCategoryFilter
              ? 'No sub sub categories found matching your criteria.'
              : 'No sub sub categories found. Create your first sub sub category!'}
          </p>
        </div>
      )}

      {/* Create Sub Sub Category Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset({
            Name: '',
            SubCategory: '',
            Description: '',
            SortOrder: undefined,
          });
        }}
        title="Create New Sub Sub Category"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Sub Category *"
            placeholder="Select a sub category"
            options={subCategoriesData?.data?.map((subCat) => ({ value: subCat._id, label: subCat.Name })) || []}
            value={watchedSubCategory || ''}
            {...register('SubCategory', {
              required: 'Sub category is required',
              validate: (value) => {
                if (!value || value === '') {
                  return 'Please select a sub category';
                }
                return true;
              },
            })}
            error={errors.SubCategory?.message}
          />
          <Input
            label="Sub Sub Category Name *"
            {...register('Name')}
            error={errors.Name?.message}
            placeholder="Marvel"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="input"
              rows={3}
              {...register('Description')}
              placeholder="Marvel superhero movies"
            />
          </div>
          <Input
            label="Sort Order"
            type="number"
            {...register('SortOrder', { valueAsNumber: true })}
            error={errors.SortOrder?.message}
            placeholder="1"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                reset({
                  Name: '',
                  SubCategory: '',
                  Description: '',
                  SortOrder: undefined,
                });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Sub Sub Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Sub Sub Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSubSubCategoryId(null);
          reset({
            Name: '',
            SubCategory: '',
            Description: '',
            SortOrder: undefined,
          });
        }}
        title="Edit Sub Sub Category"
        size="md"
      >
        {isLoadingEdit ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Select
              label="Sub Category *"
              placeholder="Select a sub category"
              options={subCategoriesData?.data?.map((subCat) => ({ value: subCat._id, label: subCat.Name })) || []}
              value={watchedSubCategory || ''}
              {...register('SubCategory', {
                required: 'Sub category is required',
                validate: (value) => {
                  if (!value || value === '') {
                    return 'Please select a sub category';
                  }
                  return true;
                },
              })}
              error={errors.SubCategory?.message}
            />
            <Input
              label="Sub Sub Category Name *"
              {...register('Name')}
              error={errors.Name?.message}
              placeholder="Marvel"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="input"
                rows={3}
                {...register('Description')}
                placeholder="Marvel superhero movies"
              />
            </div>
            <Input
              label="Sort Order"
              type="number"
              {...register('SortOrder', { valueAsNumber: true })}
              error={errors.SortOrder?.message}
              placeholder="1"
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingSubSubCategoryId(null);
                  reset({
                    Name: '',
                    SubCategory: '',
                    Description: '',
                    SortOrder: undefined,
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Update Sub Sub Category
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, subSubCategoryId: null })}
        title="Delete Sub Sub Category"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this sub sub category? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setDeleteModal({ isOpen: false, subSubCategoryId: null })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteModal.subSubCategoryId && handleDelete(deleteModal.subSubCategoryId)}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

