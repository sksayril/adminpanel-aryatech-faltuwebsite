import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { moviesApi, CreateMovieData } from '@/api/movies.api';
import { categoriesApi } from '@/api/categories.api';
import { subcategoriesApi } from '@/api/subcategories.api';
import { subsubcategoriesApi } from '@/api/subsubcategories.api';
import { AGE_RESTRICTIONS, COUNTRIES, MOVIE_QUALITIES, SUBTITLE_LANGUAGES } from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { SkeletonMovieCard, Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/utils/toast';
import { PlusIcon, XMarkIcon, CheckCircleIcon, XCircleIcon, ClockIcon, Squares2X2Icon, TableCellsIcon, FilmIcon } from '@heroicons/react/24/outline';

const createMovieSchema = z.object({
  Title: z.string().min(1, 'Title is required'),
  Category: z.string().min(1, 'Category is required'),
  Description: z.string().optional(),
  SubCategory: z.string().optional(),
  SubSubCategory: z.string().optional(),
  Channel: z.string().optional(),
  MetaTitle: z.string().optional(),
  MetaDescription: z.string().optional(),
  AgeRestriction: z.string().optional(),
  Year: z.number().optional(),
  ReleaseDate: z.string().optional(),
  Director: z.string().optional(),
  TrailerUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  sourceQuality: z.string().optional(),
  IsPremium: z.boolean().optional(),
});

type CreateMovieFormData = z.infer<typeof createMovieSchema> & {
  Genre?: string[];
  Cast?: string[];
  Tags?: string[];
  MetaKeywords?: string[];
  BlockedCountries?: string[];
};

type MovieFilter = 'all' | 'trending' | 'featured';
type ViewMode = 'grid' | 'table';

export const MoviesList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = (searchParams.get('filter') as MovieFilter) || 'all';
  
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadProgressModalOpen, setIsUploadProgressModalOpen] = useState(false);
  const [uploadingMovieId, setUploadingMovieId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<any>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; movieId: string | null }>({
    isOpen: false,
    movieId: null,
  });

  // Create movie form state
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [subtitle, setSubtitle] = useState<File | null>(null);
  const [subtitleLanguage, setSubtitleLanguage] = useState<string>('');
  const [subtitleLanguageCode, setSubtitleLanguageCode] = useState<string>('');
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]);
  const [genre, setGenre] = useState<string[]>([]);
  const [cast, setCast] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [metaKeywords, setMetaKeywords] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState<string>('');
  const [castInput, setCastInput] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [metaKeywordsInput, setMetaKeywordsInput] = useState<string>('');

  const queryClient = useQueryClient();

  // Build query params based on active filter
  const queryParams: any = { status: statusFilter, page, limit: 20 };
  if (activeFilter === 'trending') {
    queryParams.isTrending = 'true';
  } else if (activeFilter === 'featured') {
    queryParams.isFeatured = 'true';
  }

  const { data, isLoading } = useQuery({
    queryKey: ['movies', queryParams],
    queryFn: () => moviesApi.getAll(queryParams),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateMovieFormData>({
    resolver: zodResolver(createMovieSchema),
  });

  const watchedCategory = watch('Category');
  const watchedSubCategory = watch('SubCategory');

  // Fetch subcategories based on selected category
  const { data: subCategoriesData } = useQuery({
    queryKey: ['subcategories', watchedCategory],
    queryFn: () => subcategoriesApi.getAll({ category: watchedCategory || undefined }),
    enabled: !!watchedCategory,
  });

  // Fetch subsubcategories based on selected subcategory
  const { data: subSubCategoriesData } = useQuery({
    queryKey: ['subsubcategories', watchedSubCategory],
    queryFn: () => subsubcategoriesApi.getAll({ subCategory: watchedSubCategory || undefined }),
    enabled: !!watchedSubCategory,
  });

  // Reset subcategory and subsubcategory when category changes
  useEffect(() => {
    if (watchedCategory) {
      setValue('SubCategory', '');
      setValue('SubSubCategory', '');
    }
  }, [watchedCategory, setValue]);

  // Reset subsubcategory when subcategory changes
  useEffect(() => {
    if (watchedSubCategory) {
      setValue('SubSubCategory', '');
    }
  }, [watchedSubCategory, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateMovieData) => moviesApi.create(data),
    onSuccess: (data) => {
      // Close create modal and reset form
      setIsCreateModalOpen(false);
      reset();
      setThumbnail(null);
      setPoster(null);
      setVideo(null);
      setSubtitle(null);
      setSubtitleLanguage('');
      setSubtitleLanguageCode('');
      setBlockedCountries([]);
      setGenre([]);
      setCast([]);
      setTags([]);
      setMetaKeywords([]);
      setGenreInput('');
      setCastInput('');
      setTagsInput('');
      setMetaKeywordsInput('');

      // Start tracking upload progress if movie ID is returned
      const responseData = data.data as any;
      if (responseData.movie?._id) {
        setUploadingMovieId(responseData.movie._id);
        setIsUploadProgressModalOpen(true);
        startProgressTracking();
        showToast.success(data.message || 'Movie created and files queued for upload');
      } else {
        // If no movie ID, just show success and refresh
        queryClient.invalidateQueries({ queryKey: ['movies'] });
        showToast.success(data.message || 'Movie created successfully!');
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create movie';
      showToast.error(message);
    },
  });

  // Fetch upload progress
  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['upload-progress', uploadingMovieId],
    queryFn: () => moviesApi.getUploadProgress(uploadingMovieId!),
    enabled: !!uploadingMovieId && isUploadProgressModalOpen,
    refetchInterval: (query) => {
      const data = query.state.data?.data;
      if (data?.status === 'completed' || data?.status === 'failed' || data?.status === 'no-jobs') {
        return false; // Stop polling when completed, failed, or no jobs
      }
      return 2000; // Poll every 2 seconds
    },
  });

  useEffect(() => {
    if (progressData?.data) {
      setUploadProgress(progressData.data);
      
      // If upload is completed, refresh movies list and close modal
      if (progressData.data.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['movies'] });
        showToast.success('Movie uploaded and processed successfully!');
        // Close modal after 2 seconds
        setTimeout(() => {
          setIsUploadProgressModalOpen(false);
          setUploadingMovieId(null);
          setUploadProgress(null);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }, 2000);
      } else if (progressData.data.status === 'failed') {
        showToast.error('Upload or processing failed. Please try again.');
        // Keep modal open so user can see the error
      }
    }
  }, [progressData, queryClient]);

  const startProgressTracking = () => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Initial fetch
    refetchProgress();
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const toggleTrendingMutation = useMutation({
    mutationFn: (id: string) => moviesApi.toggleTrending(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      showToast.success(data.message || 'Trending status updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update trending status';
      showToast.error(message);
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: (id: string) => moviesApi.toggleFeatured(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      showToast.success(data.message || 'Featured status updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update featured status';
      showToast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => moviesApi.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      setDeleteModal({ isOpen: false, movieId: null });
      showToast.success(data.message || 'Movie deleted successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete movie';
      showToast.error(message);
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const addToArray = (array: string[], setArray: (arr: string[]) => void, input: string, setInput: (val: string) => void) => {
    if (input.trim() && !array.includes(input.trim())) {
      setArray([...array, input.trim()]);
      setInput('');
    }
  };

  const removeFromArray = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    setArray(array.filter((i) => i !== item));
  };

  const onMovieSubmit = async (data: CreateMovieFormData) => {
    if (!video) {
      showToast.error('Please upload a video file');
      return;
    }

    const formData: CreateMovieData = {
      Title: data.Title,
      Category: data.Category,
      Description: data.Description,
      SubCategory: data.SubCategory,
      SubSubCategory: data.SubSubCategory,
      Channel: data.Channel,
      MetaTitle: data.MetaTitle,
      MetaDescription: data.MetaDescription,
      MetaKeywords: metaKeywords.length > 0 ? metaKeywords : undefined,
      Tags: tags.length > 0 ? tags : undefined,
      AgeRestriction: data.AgeRestriction,
      Genre: genre.length > 0 ? genre : undefined,
      Cast: cast.length > 0 ? cast : undefined,
      Director: data.Director,
      Year: data.Year,
      ReleaseDate: data.ReleaseDate,
      BlockedCountries: blockedCountries.length > 0 ? blockedCountries : undefined,
      TrailerUrl: data.TrailerUrl,
      IsPremium: data.IsPremium || false,
      sourceQuality: data.sourceQuality || '1080p',
      thumbnail: thumbnail || undefined,
      poster: poster || undefined,
      video: video || undefined,
      subtitle: subtitle || undefined,
      subtitleLanguages: subtitleLanguage ? [subtitleLanguage] : undefined,
      subtitleLanguageCodes: subtitleLanguageCode ? [subtitleLanguageCode] : undefined,
    };

    createMutation.mutate(formData);
  };

  const setFilter = (filter: MovieFilter) => {
    setSearchParams({ filter });
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton variant="text" height={32} width={250} />
            <Skeleton variant="text" height={20} width={300} className="mt-2" />
          </div>
          <Skeleton variant="rectangular" width={150} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonMovieCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movies Management</h1>
          <p className="text-gray-600">Manage all your movies</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Upload New Movie
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['all', 'trending', 'featured'] as MovieFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilter(filter)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize
                ${
                  activeFilter === filter
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {filter === 'all' ? 'All Movies' : filter === 'trending' ? 'Trending Movies' : 'Featured Movies'}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="card">
        <Select
          label="Filter by Status"
          options={[
            { value: '', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'blocked', label: 'Blocked' },
            { value: 'dmca', label: 'DMCA' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {/* Movies Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.data.map((movie) => (
          <div key={movie._id} className="card">
            {movie.Thumbnail && (
              <img
                src={movie.Thumbnail}
                alt={movie.Title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="font-semibold text-gray-900 mb-2">{movie.Title}</h3>
            <div className="flex items-center space-x-2 mb-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                movie.Status === 'active' ? 'bg-green-100 text-green-800' :
                movie.Status === 'dmca' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {movie.Status}
              </span>
              {movie.IsTrending && (
                <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                  Trending
                </span>
              )}
              {movie.IsFeatured && (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  Featured
                </span>
              )}
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trending</span>
                <Switch
                  checked={movie.IsTrending}
                  onChange={() => toggleTrendingMutation.mutate(movie._id)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Featured</span>
                <Switch
                  checked={movie.IsFeatured}
                  onChange={() => toggleFeaturedMutation.mutate(movie._id)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to={`/movies/${movie._id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">View</Button>
              </Link>
              <Link to={`/movies/${movie._id}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Edit</Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModal({ isOpen: true, movieId: movie._id })}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Movies Table View */}
      {viewMode === 'table' && (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thumbnail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data.map((movie) => (
                <tr key={movie._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {movie.Thumbnail ? (
                      <img
                        src={movie.Thumbnail}
                        alt={movie.Title}
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FilmIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{movie.Title}</div>
                    {movie.Description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{movie.Description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        movie.Status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : movie.Status === 'dmca'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {movie.Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {typeof movie.Category === 'string' ? movie.Category : movie.Category?.Name || 'N/A'}
                    </div>
                    {movie.SubCategory && (
                      <div className="text-xs text-gray-500">
                        {typeof movie.SubCategory === 'string' ? movie.SubCategory : movie.SubCategory?.Name || ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movie.Views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movie.Rating.toFixed(1)} / 5.0
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Switch
                      checked={movie.IsTrending}
                      onChange={() => toggleTrendingMutation.mutate(movie._id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Switch
                      checked={movie.IsFeatured}
                      onChange={() => toggleFeaturedMutation.mutate(movie._id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/movies/${movie._id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link to={`/movies/${movie._id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteModal({ isOpen: true, movieId: movie._id })}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.data.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600">
            {activeFilter === 'trending' 
              ? 'No trending movies found.' 
              : activeFilter === 'featured'
              ? 'No featured movies found.'
              : 'No movies found. Upload your first movie!'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} movies
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

      {/* Create Movie Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset();
          setThumbnail(null);
          setPoster(null);
          setVideo(null);
          setSubtitle(null);
          setSubtitleLanguage('');
          setSubtitleLanguageCode('');
          setBlockedCountries([]);
          setGenre([]);
          setCast([]);
          setTags([]);
          setMetaKeywords([]);
          setGenreInput('');
          setCastInput('');
          setTagsInput('');
          setMetaKeywordsInput('');
        }}
        title="Upload New Movie"
        size="xl"
      >
        <form onSubmit={handleSubmit(onMovieSubmit)} className="space-y-8 max-h-[85vh] overflow-y-auto px-1">
          {/* Basic Information */}
          <div className="space-y-5 bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <Input
                label="Title *"
                {...register('Title')}
                error={errors.Title?.message}
                placeholder="The Amazing Movie"
              />
              <Select
                label="Category *"
                options={[
                  { value: '', label: 'Select Category' },
                  ...(categoriesData?.data?.map((cat) => ({ value: cat._id, label: cat.Name })) || []),
                ]}
                {...register('Category')}
                error={errors.Category?.message}
              />
              <Select
                label="Sub Category"
                options={[
                  { value: '', label: 'Select Sub Category' },
                  ...(subCategoriesData?.data?.map((subCat) => ({ value: subCat._id, label: subCat.Name })) || []),
                ]}
                {...register('SubCategory')}
                disabled={!watchedCategory}
              />
              <Select
                label="Sub Sub Category"
                options={[
                  { value: '', label: 'Select Sub Sub Category' },
                  ...(subSubCategoriesData?.data?.map((subSubCat) => ({ value: subSubCat._id, label: subSubCat.Name })) || []),
                ]}
                {...register('SubSubCategory')}
                disabled={!watchedSubCategory}
              />
              <Input
                label="Year"
                type="number"
                {...register('Year', { valueAsNumber: true })}
                error={errors.Year?.message}
                placeholder="2024"
              />
              <Select
                label="Age Restriction"
                options={[
                  { value: '', label: 'Select Age Restriction' },
                  ...AGE_RESTRICTIONS.map((age) => ({ value: age.value, label: age.label })),
                ]}
                {...register('AgeRestriction')}
              />
              <Input
                label="Director"
                {...register('Director')}
                error={errors.Director?.message}
                placeholder="Director Name"
              />
              <Input
                label="Release Date"
                type="date"
                {...register('ReleaseDate')}
                error={errors.ReleaseDate?.message}
              />
              <Input
                label="Trailer URL"
                type="url"
                {...register('TrailerUrl')}
                error={errors.TrailerUrl?.message}
                placeholder="https://youtube.com/watch?v=trailer"
              />
              <Select
                label="Source Quality"
                options={MOVIE_QUALITIES.map((q) => ({ value: q, label: q }))}
                {...register('sourceQuality')}
                defaultValue="1080p"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="input"
                rows={5}
                {...register('Description')}
                placeholder="Movie description"
              />
            </div>
          </div>

          {/* SEO & Metadata */}
          <div className="space-y-5 bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">SEO & Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Meta Title"
                {...register('MetaTitle')}
                placeholder="The Amazing Movie - Watch Online Free"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                <textarea
                  className="input"
                  rows={2}
                  {...register('MetaDescription')}
                  placeholder="Watch The Amazing Movie online in HD quality"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {metaKeywords.map((keyword) => (
                  <span key={keyword} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeFromArray(metaKeywords, setMetaKeywords, keyword)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={metaKeywordsInput}
                  onChange={(e) => setMetaKeywordsInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray(metaKeywords, setMetaKeywords, metaKeywordsInput, setMetaKeywordsInput);
                    }
                  }}
                  placeholder="Add meta keyword"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray(metaKeywords, setMetaKeywords, metaKeywordsInput, setMetaKeywordsInput)}
                >
                  Add
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeFromArray(tags, setTags, tag)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray(tags, setTags, tagsInput, setTagsInput);
                    }
                  }}
                  placeholder="Add tag"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray(tags, setTags, tagsInput, setTagsInput)}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Genre & Cast */}
          <div className="space-y-5 bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Genre & Cast</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {genre.map((g) => (
                  <span key={g} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    {g}
                    <button
                      type="button"
                      onClick={() => removeFromArray(genre, setGenre, g)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray(genre, setGenre, genreInput, setGenreInput);
                    }
                  }}
                  placeholder="Add genre"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray(genre, setGenre, genreInput, setGenreInput)}
                >
                  Add
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cast</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {cast.map((c) => (
                  <span key={c} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-800">
                    {c}
                    <button
                      type="button"
                      onClick={() => removeFromArray(cast, setCast, c)}
                      className="ml-2 text-pink-600 hover:text-pink-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={castInput}
                  onChange={(e) => setCastInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray(cast, setCast, castInput, setCastInput);
                    }
                  }}
                  placeholder="Add cast member"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray(cast, setCast, castInput, setCastInput)}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-5 bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Media Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload
                label="Thumbnail"
                accept="image/*"
                maxSize={10}
                onChange={(files) => setThumbnail(files?.[0] || null)}
                preview={thumbnail ? URL.createObjectURL(thumbnail) : undefined}
              />
              <FileUpload
                label="Poster"
                accept="image/*"
                maxSize={10}
                onChange={(files) => setPoster(files?.[0] || null)}
                preview={poster ? URL.createObjectURL(poster) : undefined}
              />
            </div>
            <FileUpload
              label="Video File * (Max 5GB)"
              accept="video/*"
              maxSize={5120}
              onChange={(files) => setVideo(files?.[0] || null)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUpload
                label="Subtitle File (SRT, VTT)"
                accept=".srt,.vtt"
                maxSize={10}
                onChange={(files) => setSubtitle(files?.[0] || null)}
              />
              <div>
                <Select
                  label="Subtitle Language"
                  options={SUBTITLE_LANGUAGES.map((lang) => ({ value: lang.code, label: lang.name }))}
                  value={subtitleLanguage}
                  onChange={(e) => {
                    setSubtitleLanguage(e.target.value);
                    const selectedLang = SUBTITLE_LANGUAGES.find((l) => l.code === e.target.value);
                    if (selectedLang) {
                      setSubtitleLanguageCode(selectedLang.code);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Settings</h3>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Premium Movie</label>
              <Switch
                checked={watch('IsPremium') || false}
                onChange={(checked) => setValue('IsPremium', checked)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blocked Countries</label>
              <Select
                multiple
                options={COUNTRIES.map((country) => ({ value: country.code, label: country.name }))}
                value={blockedCountries}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                  setBlockedCountries(selected);
                }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white pb-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                reset();
                setThumbnail(null);
                setPoster(null);
                setVideo(null);
                setSubtitle(null);
                setSubtitleLanguage('');
                setSubtitleLanguageCode('');
                setBlockedCountries([]);
                setGenre([]);
                setCast([]);
                setTags([]);
                setMetaKeywords([]);
                setGenreInput('');
                setCastInput('');
                setTagsInput('');
                setMetaKeywordsInput('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Upload Movie
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Progress Modal */}
      <Modal
        isOpen={isUploadProgressModalOpen}
        onClose={() => {
          // Always allow closing - upload will continue in background
          setIsUploadProgressModalOpen(false);
          setUploadingMovieId(null);
          setUploadProgress(null);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          // Show info message if still processing
          if (uploadProgress?.status === 'pending' || uploadProgress?.status === 'processing') {
            showToast.success('Upload will continue in background. Check Upload Queues for progress.');
          }
        }}
        title="Upload Progress"
        size="md"
      >
        {uploadProgress ? (
          <div className="space-y-6">
            {/* Overall Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-semibold text-gray-900">{uploadProgress.overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    uploadProgress.status === 'completed'
                      ? 'bg-green-500'
                      : uploadProgress.status === 'failed'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${uploadProgress.overallProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {uploadProgress.status === 'completed' && (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Upload Complete</span>
                    </>
                  )}
                  {uploadProgress.status === 'failed' && (
                    <>
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-red-600 font-medium">Upload Failed</span>
                    </>
                  )}
                  {(uploadProgress.status === 'processing' || uploadProgress.status === 'pending') && (
                    <>
                      <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />
                      <span className="text-sm text-blue-600 font-medium capitalize">
                        {uploadProgress.status === 'pending' ? 'Queued...' : 'Processing...'}
                      </span>
                    </>
                  )}
                  {uploadProgress.status === 'no-jobs' && (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-600 font-medium">No upload jobs</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {uploadProgress.completedJobs || 0} / {uploadProgress.totalJobs || 0} files completed
                </div>
              </div>
            </div>

            {/* File Progress */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">File Upload Progress</h4>
              <div className="space-y-3">
                {uploadProgress.jobs?.map((job: any, index: number) => (
                  <div key={job._id || index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {job.status === 'completed' && (
                          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {job.status === 'failed' && (
                          <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        {(job.status === 'processing' || job.status === 'pending') && (
                          <ClockIcon className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate">{job.fileName}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded flex-shrink-0">
                          {job.fileType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs font-medium text-gray-600">{job.progress || 0}%</span>
                        {job.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await moviesApi.retryUploadJob(job._id);
                                showToast.success('Job queued for retry');
                                refetchProgress();
                              } catch (error: any) {
                                showToast.error(error?.response?.data?.message || 'Failed to retry job');
                              }
                            }}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          job.status === 'completed'
                            ? 'bg-green-500'
                            : job.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${job.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(job.uploadedSize || 0)} / {formatFileSize(job.totalSize || 0)}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{job.status}</span>
                    </div>
                  </div>
                ))}
                {(!uploadProgress.jobs || uploadProgress.jobs.length === 0) && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No upload jobs found
                  </div>
                )}
              </div>
            </div>

            {/* Close button - always show, but warn if still processing */}
            <div className="flex justify-end pt-4 border-t">
              {(uploadProgress.status === 'pending' || uploadProgress.status === 'processing') && (
                <div className="flex-1 mr-4">
                  <p className="text-sm text-amber-600">
                    ⚠️ Upload is still in progress. You can close this modal, but progress will continue in the background.
                  </p>
                </div>
              )}
              <Button
                onClick={() => {
                  setIsUploadProgressModalOpen(false);
                  setUploadingMovieId(null);
                  setUploadProgress(null);
                  if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                  }
                  // Show info message if still processing
                  if (uploadProgress.status === 'pending' || uploadProgress.status === 'processing') {
                    showToast.success('Upload will continue in background. Check Upload Queues for progress.');
                  }
                }}
                variant={uploadProgress.status === 'pending' || uploadProgress.status === 'processing' ? 'outline' : 'primary'}
              >
                {uploadProgress.status === 'pending' || uploadProgress.status === 'processing' ? 'Close (Continue in Background)' : 'Close'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing upload...</p>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, movieId: null })}
        title="Delete Movie"
      >
        <p className="text-gray-600 mb-4">Are you sure you want to delete this movie? This action cannot be undone.</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, movieId: null })}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteModal.movieId && handleDelete(deleteModal.movieId)}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
