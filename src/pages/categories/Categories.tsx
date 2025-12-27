import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { categoriesApi, CreateCategoryData, Category } from '@/api/categories.api';
import { subcategoriesApi, SubCategory } from '@/api/subcategories.api';
import { subsubcategoriesApi, SubSubCategory } from '@/api/subsubcategories.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { SkeletonList, Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/utils/toast';
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const createCategorySchema = z.object({
  Name: z.string().min(1, 'Category name is required'),
  Description: z.string().optional(),
  SortOrder: z.number().optional(),
});

const createSubCategorySchema = z.object({
  Name: z.string().min(1, 'Sub category name is required').trim(),
  Category: z.string().min(1, 'Category is required'),
  Description: z.string().optional(),
  SortOrder: z.number().optional(),
});

const createSubSubCategorySchema = z.object({
  Name: z.string().min(1, 'Sub sub category name is required').trim(),
  SubCategory: z.string().min(1, 'Sub category is required'),
  Description: z.string().optional(),
  SortOrder: z.number().optional(),
});

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
type CreateSubCategoryFormData = z.infer<typeof createSubCategorySchema>;
type CreateSubSubCategoryFormData = z.infer<typeof createSubSubCategorySchema>;

interface CategoryTreeItem extends Category {
  subCategories?: (SubCategory & { subSubCategories?: SubSubCategory[] })[];
}

export const Categories = () => {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  
  // Category modals
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  // SubCategory modals
  const [isCreateSubCategoryModalOpen, setIsCreateSubCategoryModalOpen] = useState(false);
  const [isEditSubCategoryModalOpen, setIsEditSubCategoryModalOpen] = useState(false);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  
  // SubSubCategory modals
  const [isCreateSubSubCategoryModalOpen, setIsCreateSubSubCategoryModalOpen] = useState(false);
  const [isEditSubSubCategoryModalOpen, setIsEditSubSubCategoryModalOpen] = useState(false);
  const [editingSubSubCategoryId, setEditingSubSubCategoryId] = useState<string | null>(null);
  const [parentSubCategoryId, setParentSubCategoryId] = useState<string | null>(null);

  // Category form
  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    formState: { errors: categoryErrors },
    reset: resetCategory,
    setValue: setCategoryValue,
  } = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
  });

  // SubCategory form
  const {
    register: registerSubCategory,
    handleSubmit: handleSubmitSubCategory,
    formState: { errors: subCategoryErrors },
    reset: resetSubCategory,
    setValue: setSubCategoryValue,
    watch: watchSubCategory,
  } = useForm<CreateSubCategoryFormData>({
    resolver: zodResolver(createSubCategorySchema),
  });

  // SubSubCategory form
  const {
    register: registerSubSubCategory,
    handleSubmit: handleSubmitSubSubCategory,
    formState: { errors: subSubCategoryErrors },
    reset: resetSubSubCategory,
    setValue: setSubSubCategoryValue,
    watch: watchSubSubCategory,
  } = useForm<CreateSubSubCategoryFormData>({
    resolver: zodResolver(createSubSubCategorySchema),
  });

  // Fetch data
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: subCategoriesData, isLoading: isLoadingSubCategories } = useQuery({
    queryKey: ['subcategories'],
    queryFn: () => subcategoriesApi.getAll(),
  });

  const { data: subSubCategoriesData, isLoading: isLoadingSubSubCategories } = useQuery({
    queryKey: ['subsubcategories'],
    queryFn: () => subsubcategoriesApi.getAll(),
  });

  const { data: editCategoryData, isLoading: isLoadingEditCategory } = useQuery({
    queryKey: ['category', editingCategoryId],
    queryFn: () => categoriesApi.getById(editingCategoryId!),
    enabled: !!editingCategoryId && isEditCategoryModalOpen,
  });

  const { data: editSubCategoryData, isLoading: isLoadingEditSubCategory } = useQuery({
    queryKey: ['subcategory', editingSubCategoryId],
    queryFn: () => subcategoriesApi.getById(editingSubCategoryId!),
    enabled: !!editingSubCategoryId && isEditSubCategoryModalOpen,
  });

  const { data: editSubSubCategoryData, isLoading: isLoadingEditSubSubCategory } = useQuery({
    queryKey: ['subsubcategory', editingSubSubCategoryId],
    queryFn: () => subsubcategoriesApi.getById(editingSubSubCategoryId!),
    enabled: !!editingSubSubCategoryId && isEditSubSubCategoryModalOpen,
  });

  const isLoading = isLoadingCategories || isLoadingSubCategories || isLoadingSubSubCategories;

  // Build tree structure
  const categoryTree: CategoryTreeItem[] = (categoriesData?.data || []).map((category) => {
    const subCategories = (subCategoriesData?.data || []).filter((subCat) => {
      if (!subCat.Category) return false;
      const categoryId = typeof subCat.Category === 'string' ? subCat.Category : subCat.Category._id;
      return categoryId === category._id;
    });

    const subCategoriesWithSubSub = subCategories.map((subCat) => {
      const subSubCategories = (subSubCategoriesData?.data || []).filter((subSubCat) => {
        if (!subSubCat.SubCategory) return false;
        const subCategoryId = typeof subSubCat.SubCategory === 'string' ? subSubCat.SubCategory : subSubCat.SubCategory._id;
        return subCategoryId === subCat._id;
      });
      return { ...subCat, subSubCategories };
    });

    return { ...category, subCategories: subCategoriesWithSubSub };
  });

  // Load edit data into forms
  useEffect(() => {
    if (editCategoryData?.data && isEditCategoryModalOpen) {
      const category = editCategoryData.data;
      setCategoryValue('Name', category.Name);
      setCategoryValue('Description', category.Description || '');
      setCategoryValue('SortOrder', category.SortOrder);
    }
  }, [editCategoryData, isEditCategoryModalOpen, setCategoryValue]);

  useEffect(() => {
    if (editSubCategoryData?.data && isEditSubCategoryModalOpen) {
      const subCategory = editSubCategoryData.data;
      if (!subCategory.Category) return;
      const categoryId = typeof subCategory.Category === 'string' ? subCategory.Category : subCategory.Category._id;
      setSubCategoryValue('Name', subCategory.Name);
      setSubCategoryValue('Category', categoryId);
      setSubCategoryValue('Description', subCategory.Description || '');
      setSubCategoryValue('SortOrder', subCategory.SortOrder);
    }
  }, [editSubCategoryData, isEditSubCategoryModalOpen, setSubCategoryValue]);

  useEffect(() => {
    if (editSubSubCategoryData?.data && isEditSubSubCategoryModalOpen) {
      const subSubCategory = editSubSubCategoryData.data;
      if (!subSubCategory.SubCategory) return;
      const subCategoryId = typeof subSubCategory.SubCategory === 'string' ? subSubCategory.SubCategory : subSubCategory.SubCategory._id;
      setSubSubCategoryValue('Name', subSubCategory.Name);
      setSubSubCategoryValue('SubCategory', subCategoryId);
      setSubSubCategoryValue('Description', subSubCategory.Description || '');
      setSubSubCategoryValue('SortOrder', subSubCategory.SortOrder);
    }
  }, [editSubSubCategoryData, isEditSubSubCategoryModalOpen, setSubSubCategoryValue]);

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryData) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreateCategoryModalOpen(false);
      resetCategory();
      showToast.success('Category created successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to create category');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: Partial<CreateCategoryData>) => {
      if (!editingCategoryId) throw new Error('No category ID');
      return categoriesApi.update(editingCategoryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditCategoryModalOpen(false);
      setEditingCategoryId(null);
      resetCategory();
      showToast.success('Category updated successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to update category');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['subsubcategories'] });
      showToast.success('Category deleted successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to delete category');
    },
  });

  const createSubCategoryMutation = useMutation({
    mutationFn: (data: any) => subcategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      setIsCreateSubCategoryModalOpen(false);
      resetSubCategory();
      setParentCategoryId(null);
      showToast.success('Sub category created successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to create sub category');
    },
  });

  const updateSubCategoryMutation = useMutation({
    mutationFn: (data: any) => {
      if (!editingSubCategoryId) throw new Error('No sub category ID');
      return subcategoriesApi.update(editingSubCategoryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      setIsEditSubCategoryModalOpen(false);
      setEditingSubCategoryId(null);
      resetSubCategory();
      showToast.success('Sub category updated successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to update sub category');
    },
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: (id: string) => subcategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['subsubcategories'] });
      showToast.success('Sub category deleted successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to delete sub category');
    },
  });

  const createSubSubCategoryMutation = useMutation({
    mutationFn: (data: any) => subsubcategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsubcategories'] });
      setIsCreateSubSubCategoryModalOpen(false);
      resetSubSubCategory();
      setParentSubCategoryId(null);
      showToast.success('Sub sub category created successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to create sub sub category');
    },
  });

  const updateSubSubCategoryMutation = useMutation({
    mutationFn: (data: any) => {
      if (!editingSubSubCategoryId) throw new Error('No sub sub category ID');
      return subsubcategoriesApi.update(editingSubSubCategoryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsubcategories'] });
      setIsEditSubSubCategoryModalOpen(false);
      setEditingSubSubCategoryId(null);
      resetSubSubCategory();
      showToast.success('Sub sub category updated successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to update sub sub category');
    },
  });

  const deleteSubSubCategoryMutation = useMutation({
    mutationFn: (id: string) => subsubcategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsubcategories'] });
      showToast.success('Sub sub category deleted successfully!');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to delete sub sub category');
    },
  });

  // Form handlers
  const onCategorySubmit = async (data: CreateCategoryFormData) => {
    if (!data.Name || !data.Name.trim()) {
      showToast.error('Category name is required');
      return;
    }

    const formData: CreateCategoryData = {
      Name: data.Name.trim(),
      Description: data.Description?.trim() || undefined,
      SortOrder: data.SortOrder || undefined,
    };

    if (isEditCategoryModalOpen && editingCategoryId) {
      updateCategoryMutation.mutate(formData);
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  const onSubCategorySubmit = async (data: CreateSubCategoryFormData) => {
    if (!data.Name || !data.Name.trim()) {
      showToast.error('Sub category name is required');
      return;
    }
    if (!data.Category || !data.Category.trim()) {
      showToast.error('Please select a category');
      return;
    }

    const formData = {
      Name: data.Name.trim(),
      Category: data.Category.trim(),
      Description: data.Description?.trim() || undefined,
      SortOrder: data.SortOrder || undefined,
      IsActive: true,
    };

    if (isEditSubCategoryModalOpen && editingSubCategoryId) {
      updateSubCategoryMutation.mutate(formData);
    } else {
      createSubCategoryMutation.mutate(formData);
    }
  };

  const onSubSubCategorySubmit = async (data: CreateSubSubCategoryFormData) => {
    if (!data.Name || !data.Name.trim()) {
      showToast.error('Sub sub category name is required');
      return;
    }
    if (!data.SubCategory || !data.SubCategory.trim()) {
      showToast.error('Please select a sub category');
      return;
    }

    const formData = {
      Name: data.Name.trim(),
      SubCategory: data.SubCategory.trim(),
      Description: data.Description?.trim() || undefined,
      SortOrder: data.SortOrder || undefined,
      IsActive: true,
    };

    if (isEditSubSubCategoryModalOpen && editingSubSubCategoryId) {
      updateSubSubCategoryMutation.mutate(formData);
    } else {
      createSubSubCategoryMutation.mutate(formData);
    }
  };

  // Toggle expand/collapse
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleSubCategory = (subCategoryId: string) => {
    setExpandedSubCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subCategoryId)) {
        newSet.delete(subCategoryId);
      } else {
        newSet.add(subCategoryId);
      }
      return newSet;
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
        <SkeletonList items={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600">Manage categories, sub categories, and sub sub categories</p>
        </div>
        <Button onClick={() => setIsCreateCategoryModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Category
        </Button>
      </div>

      {/* Tree Structure */}
      <div className="card">
        <div className="space-y-2">
          {categoryTree.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No categories found. Create your first category!
            </div>
          ) : (
            categoryTree.map((category) => {
              const isExpanded = expandedCategories.has(category._id);
              return (
                <div key={category._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Main Category */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => toggleCategory(category._id)}
                        className="mr-3 text-gray-600 hover:text-gray-900"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{category.Name}</h3>
                        {category.Description && (
                          <p className="text-sm text-gray-600 mt-1">{category.Description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                          Sort: {category.SortOrder || 0}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            category.IsActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {category.IsActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCategoryId(category._id);
                          setIsEditCategoryModalOpen(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this category?')) {
                            deleteCategoryMutation.mutate(category._id);
                          }
                        }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setParentCategoryId(category._id);
                          setSubCategoryValue('Category', category._id);
                          setIsCreateSubCategoryModalOpen(true);
                        }}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Sub
                      </Button>
                    </div>
                  </div>

                  {/* Sub Categories */}
                  {isExpanded && category.subCategories && category.subCategories.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {category.subCategories.map((subCategory) => {
                        const isSubExpanded = expandedSubCategories.has(subCategory._id);
                        return (
                          <div key={subCategory._id} className="border-b border-gray-200 last:border-b-0">
                            <div className="p-4 pl-12 flex items-center justify-between bg-blue-50">
                              <div className="flex items-center flex-1">
                                <button
                                  onClick={() => toggleSubCategory(subCategory._id)}
                                  className="mr-3 text-gray-600 hover:text-gray-900"
                                >
                                  {isSubExpanded ? (
                                    <ChevronDownIcon className="h-5 w-5" />
                                  ) : (
                                    <ChevronRightIcon className="h-5 w-5" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{subCategory.Name}</h4>
                                  {subCategory.Description && (
                                    <p className="text-sm text-gray-600 mt-1">{subCategory.Description}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                                    Sort: {subCategory.SortOrder || 0}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSubCategoryId(subCategory._id);
                                    setIsEditSubCategoryModalOpen(true);
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this sub category?')) {
                                      deleteSubCategoryMutation.mutate(subCategory._id);
                                    }
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setParentSubCategoryId(subCategory._id);
                                    setSubSubCategoryValue('SubCategory', subCategory._id);
                                    setIsCreateSubSubCategoryModalOpen(true);
                                  }}
                                >
                                  <PlusIcon className="h-4 w-4 mr-1" />
                                  Add Sub Sub
                                </Button>
                              </div>
                            </div>

                            {/* Sub Sub Categories */}
                            {isSubExpanded && subCategory.subSubCategories && subCategory.subSubCategories.length > 0 && (
                              <div className="bg-purple-50">
                                {subCategory.subSubCategories.map((subSubCategory) => (
                                  <div
                                    key={subSubCategory._id}
                                    className="p-4 pl-24 flex items-center justify-between border-b border-gray-200 last:border-b-0"
                                  >
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{subSubCategory.Name}</h5>
                                      {subSubCategory.Description && (
                                        <p className="text-sm text-gray-600 mt-1">{subSubCategory.Description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                                        Sort: {subSubCategory.SortOrder || 0}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingSubSubCategoryId(subSubCategory._id);
                                          setIsEditSubSubCategoryModalOpen(true);
                                        }}
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this sub sub category?')) {
                                            deleteSubSubCategoryMutation.mutate(subSubCategory._id);
                                          }
                                        }}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => {
          setIsCreateCategoryModalOpen(false);
          resetCategory();
        }}
        title="Create New Category"
        size="md"
      >
        <form onSubmit={handleSubmitCategory(onCategorySubmit)} className="space-y-4">
          <Input
            label="Category Name *"
            {...registerCategory('Name')}
            error={categoryErrors.Name?.message}
            placeholder="Action"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="input"
              rows={3}
              {...registerCategory('Description')}
              placeholder="Action movies category"
            />
          </div>
          <Input
            label="Sort Order"
            type="number"
            {...registerCategory('SortOrder', { valueAsNumber: true })}
            error={categoryErrors.SortOrder?.message}
            placeholder="1"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createCategoryMutation.isPending}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditCategoryModalOpen}
        onClose={() => {
          setIsEditCategoryModalOpen(false);
          setEditingCategoryId(null);
          resetCategory();
        }}
        title="Edit Category"
        size="md"
      >
        {isLoadingEditCategory ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <form onSubmit={handleSubmitCategory(onCategorySubmit)} className="space-y-4">
            <Input
              label="Category Name *"
              {...registerCategory('Name')}
              error={categoryErrors.Name?.message}
              placeholder="Action"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="input"
                rows={3}
                {...registerCategory('Description')}
                placeholder="Action movies category"
              />
            </div>
            <Input
              label="Sort Order"
              type="number"
              {...registerCategory('SortOrder', { valueAsNumber: true })}
              error={categoryErrors.SortOrder?.message}
              placeholder="1"
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={updateCategoryMutation.isPending}>
                Update Category
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Sub Category Modal */}
      <Modal
        isOpen={isCreateSubCategoryModalOpen}
        onClose={() => {
          setIsCreateSubCategoryModalOpen(false);
          resetSubCategory();
          setParentCategoryId(null);
        }}
        title="Create New Sub Category"
        size="md"
      >
        <form onSubmit={handleSubmitSubCategory(onSubCategorySubmit)} className="space-y-4">
          <Select
            label="Main Category *"
            placeholder="Select a category"
            options={categoriesData?.data?.map((cat) => ({ value: cat._id, label: cat.Name })) || []}
            value={watchSubCategory('Category') || parentCategoryId || ''}
            {...registerSubCategory('Category', { required: 'Category is required' })}
            error={subCategoryErrors.Category?.message}
          />
          <Input
            label="Sub Category Name *"
            {...registerSubCategory('Name')}
            error={subCategoryErrors.Name?.message}
            placeholder="Superhero"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="input"
              rows={3}
              {...registerSubCategory('Description')}
              placeholder="Superhero subcategory"
            />
          </div>
          <Input
            label="Sort Order"
            type="number"
            {...registerSubCategory('SortOrder', { valueAsNumber: true })}
            error={subCategoryErrors.SortOrder?.message}
            placeholder="1"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateSubCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSubCategoryMutation.isPending}>
              Create Sub Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Sub Category Modal */}
      <Modal
        isOpen={isEditSubCategoryModalOpen}
        onClose={() => {
          setIsEditSubCategoryModalOpen(false);
          setEditingSubCategoryId(null);
          resetSubCategory();
        }}
        title="Edit Sub Category"
        size="md"
      >
        {isLoadingEditSubCategory ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <form onSubmit={handleSubmitSubCategory(onSubCategorySubmit)} className="space-y-4">
            <Select
              label="Main Category *"
              placeholder="Select a category"
              options={categoriesData?.data?.map((cat) => ({ value: cat._id, label: cat.Name })) || []}
              value={watchSubCategory('Category') || ''}
              {...registerSubCategory('Category', { required: 'Category is required' })}
              error={subCategoryErrors.Category?.message}
            />
            <Input
              label="Sub Category Name *"
              {...registerSubCategory('Name')}
              error={subCategoryErrors.Name?.message}
              placeholder="Superhero"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="input"
                rows={3}
                {...registerSubCategory('Description')}
                placeholder="Superhero subcategory"
              />
            </div>
            <Input
              label="Sort Order"
              type="number"
              {...registerSubCategory('SortOrder', { valueAsNumber: true })}
              error={subCategoryErrors.SortOrder?.message}
              placeholder="1"
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditSubCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={updateSubCategoryMutation.isPending}>
                Update Sub Category
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Sub Sub Category Modal */}
      <Modal
        isOpen={isCreateSubSubCategoryModalOpen}
        onClose={() => {
          setIsCreateSubSubCategoryModalOpen(false);
          resetSubSubCategory();
          setParentSubCategoryId(null);
        }}
        title="Create New Sub Sub Category"
        size="md"
      >
        <form onSubmit={handleSubmitSubSubCategory(onSubSubCategorySubmit)} className="space-y-4">
          <Select
            label="Sub Category *"
            placeholder="Select a sub category"
            options={subCategoriesData?.data?.map((subCat) => ({ value: subCat._id, label: subCat.Name })) || []}
            value={watchSubSubCategory('SubCategory') || parentSubCategoryId || ''}
            {...registerSubSubCategory('SubCategory', { required: 'Sub category is required' })}
            error={subSubCategoryErrors.SubCategory?.message}
          />
          <Input
            label="Sub Sub Category Name *"
            {...registerSubSubCategory('Name')}
            error={subSubCategoryErrors.Name?.message}
            placeholder="Marvel"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="input"
              rows={3}
              {...registerSubSubCategory('Description')}
              placeholder="Marvel superhero movies"
            />
          </div>
          <Input
            label="Sort Order"
            type="number"
            {...registerSubSubCategory('SortOrder', { valueAsNumber: true })}
            error={subSubCategoryErrors.SortOrder?.message}
            placeholder="1"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateSubSubCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSubSubCategoryMutation.isPending}>
              Create Sub Sub Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Sub Sub Category Modal */}
      <Modal
        isOpen={isEditSubSubCategoryModalOpen}
        onClose={() => {
          setIsEditSubSubCategoryModalOpen(false);
          setEditingSubSubCategoryId(null);
          resetSubSubCategory();
        }}
        title="Edit Sub Sub Category"
        size="md"
      >
        {isLoadingEditSubSubCategory ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <form onSubmit={handleSubmitSubSubCategory(onSubSubCategorySubmit)} className="space-y-4">
            <Select
              label="Sub Category *"
              placeholder="Select a sub category"
              options={subCategoriesData?.data?.map((subCat) => ({ value: subCat._id, label: subCat.Name })) || []}
              value={watchSubSubCategory('SubCategory') || ''}
              {...registerSubSubCategory('SubCategory', { required: 'Sub category is required' })}
              error={subSubCategoryErrors.SubCategory?.message}
            />
            <Input
              label="Sub Sub Category Name *"
              {...registerSubSubCategory('Name')}
              error={subSubCategoryErrors.Name?.message}
              placeholder="Marvel"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="input"
                rows={3}
                {...registerSubSubCategory('Description')}
                placeholder="Marvel superhero movies"
              />
            </div>
            <Input
              label="Sort Order"
              type="number"
              {...registerSubSubCategory('SortOrder', { valueAsNumber: true })}
              error={subSubCategoryErrors.SortOrder?.message}
              placeholder="1"
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditSubSubCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={updateSubSubCategoryMutation.isPending}>
                Update Sub Sub Category
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
