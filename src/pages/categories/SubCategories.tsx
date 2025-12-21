import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { subcategoriesApi, CreateSubCategoryData } from '@/api/subcategories.api';
import { categoriesApi } from '@/api/categories.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/utils/toast';

const createSubCategorySchema = z.object({
  Name: z.string().min(1, 'Sub category name is required').trim(),
  Category: z.string().min(1, 'Category is required').refine((val) => val !== '', {
    message: 'Please select a category',
  }),
  Description: z.string().optional(),
  SortOrder: z.number().optional(),
});

type CreateSubCategoryFormData = z.infer<typeof createSubCategorySchema>;

export const SubCategories = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; subCategoryId: string | null }>({
    isOpen: false,
    subCategoryId: null,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['subcategories', { category: categoryFilter }],
    queryFn: () => subcategoriesApi.getAll({ category: categoryFilter || undefined }),
  });

  const { data: editSubCategoryData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ['subcategory', editingSubCategoryId],
    queryFn: () => subcategoriesApi.getById(editingSubCategoryId!),
    enabled: !!editingSubCategoryId && isEditModalOpen,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateSubCategoryFormData>({
    resolver: zodResolver(createSubCategorySchema),
    defaultValues: {
      Name: '',
      Category: '',
      Description: '',
      SortOrder: undefined,
    },
  });

  const watchedCategory = watch('Category');

  // Load edit data into form
  useEffect(() => {
    if (editSubCategoryData?.data && isEditModalOpen) {
      const subCategory = editSubCategoryData.data;
      const categoryId = typeof subCategory.Category === 'string' 
        ? subCategory.Category 
        : subCategory.Category._id;
      
      setValue('Name', subCategory.Name);
      setValue('Category', categoryId);
      setValue('Description', subCategory.Description || '');
      setValue('SortOrder', subCategory.SortOrder);
    }
  }, [editSubCategoryData, isEditModalOpen, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateSubCategoryData) => subcategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      setIsCreateModalOpen(false);
      reset({
        Name: '',
        Category: '',
        Description: '',
        SortOrder: undefined,
      });
      showToast.success('Sub category created successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create sub category';
      showToast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateSubCategoryData>) => {
      if (!editingSubCategoryId) throw new Error('No subcategory ID');
      return subcategoriesApi.update(editingSubCategoryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategory', editingSubCategoryId] });
      setIsEditModalOpen(false);
      setEditingSubCategoryId(null);
      reset({
        Name: '',
        Category: '',
        Description: '',
        SortOrder: undefined,
      });
      showToast.success('Sub category updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update sub category';
      showToast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subcategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      setDeleteModal({ isOpen: false, subCategoryId: null });
      showToast.success('Sub category deleted successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete sub category';
      showToast.error(message);
    },
  });

  const onSubmit = async (data: CreateSubCategoryFormData) => {
    // Validate required fields
    if (!data.Name || !data.Name.trim()) {
      showToast.error('Sub category name is required');
      return;
    }
    
    if (!data.Category || !data.Category.trim()) {
      showToast.error('Please select a main category');
      return;
    }

    const formData: CreateSubCategoryData = {
      Name: data.Name.trim(),
      Category: data.Category.trim(),
      Description: data.Description?.trim() || undefined,
      SortOrder: data.SortOrder || undefined,
      IsActive: true, // Default to active
    };
    
    if (isEditModalOpen && editingSubCategoryId) {
      // Update existing subcategory
      updateMutation.mutate(formData);
    } else {
      // Create new subcategory
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (id: string) => {
    setEditingSubCategoryId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Filter subcategories by search query
  const filteredSubCategories = data?.data.filter((subCategory) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      subCategory.Name.toLowerCase().includes(searchLower) ||
      subCategory.Description?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const getCategoryName = (category: string | { _id: string; Name: string }) => {
    if (typeof category === 'string') {
      return categoriesData?.data.find((cat) => cat._id === category)?.Name || 'Unknown';
    }
    return category.Name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub Categories</h1>
          <p className="text-gray-600">Manage sub categories</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create Sub Category</Button>
      </div>

      {/* Search and Filter Section */}
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Search Sub Categories"
          placeholder="Search by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select
          label="Filter by Category"
          options={[
            { value: '', label: 'All Categories' },
            ...(categoriesData?.data?.map((cat) => ({ value: cat._id, label: cat.Name })) || []),
          ]}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
      </div>

      {/* Sub Categories Grid */}
      {filteredSubCategories && filteredSubCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSubCategories.map((subCategory) => (
            <div key={subCategory._id} className="card">
              {subCategory.Image && (
                <img
                  src={subCategory.Image}
                  alt={subCategory.Name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              <div className="mb-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {getCategoryName(subCategory.Category)}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{subCategory.Name}</h3>
              <p className="text-sm text-gray-600 mb-4">{subCategory.Description}</p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(subCategory._id)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteModal({ isOpen: true, subCategoryId: subCategory._id })}
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
            {searchQuery || categoryFilter
              ? 'No sub categories found matching your criteria.'
              : 'No sub categories found. Create your first sub category!'}
          </p>
        </div>
      )}

      {/* Create Sub Category Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset({
            Name: '',
            Category: '',
            Description: '',
            SortOrder: undefined,
          });
        }}
        title="Create New Sub Category"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Main Category *"
            placeholder="Select a category"
            options={categoriesData?.data?.map((cat) => ({ value: cat._id, label: cat.Name })) || []}
            value={watchedCategory || ''}
            {...register('Category', {
              required: 'Category is required',
              validate: (value) => {
                if (!value || value === '') {
                  return 'Please select a category';
                }
                return true;
              },
            })}
            error={errors.Category?.message}
          />
          <Input
            label="Sub Category Name *"
            {...register('Name')}
            error={errors.Name?.message}
            placeholder="Superhero"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="input"
              rows={3}
              {...register('Description')}
              placeholder="Superhero subcategory"
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
                  Category: '',
                  Description: '',
                  SortOrder: undefined,
                });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Sub Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Sub Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSubCategoryId(null);
          reset({
            Name: '',
            Category: '',
            Description: '',
            SortOrder: undefined,
          });
        }}
        title="Edit Sub Category"
        size="md"
      >
        {isLoadingEdit ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Select
              label="Main Category *"
              placeholder="Select a category"
              options={categoriesData?.data?.map((cat) => ({ value: cat._id, label: cat.Name })) || []}
              value={watchedCategory || ''}
              {...register('Category', {
                required: 'Category is required',
                validate: (value) => {
                  if (!value || value === '') {
                    return 'Please select a category';
                  }
                  return true;
                },
              })}
              error={errors.Category?.message}
            />
            <Input
              label="Sub Category Name *"
              {...register('Name')}
              error={errors.Name?.message}
              placeholder="Superhero"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="input"
                rows={3}
                {...register('Description')}
                placeholder="Superhero subcategory"
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
                  setEditingSubCategoryId(null);
                  reset({
                    Name: '',
                    Category: '',
                    Description: '',
                    SortOrder: undefined,
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Update Sub Category
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, subCategoryId: null })}
        title="Delete Sub Category"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this sub category? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setDeleteModal({ isOpen: false, subCategoryId: null })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteModal.subCategoryId && handleDelete(deleteModal.subCategoryId)}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

