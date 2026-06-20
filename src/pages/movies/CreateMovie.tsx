import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { moviesApi, CreateMovieData } from '@/api/movies.api';
import { categoriesApi } from '@/api/categories.api';
import { AGE_RESTRICTIONS, MOVIE_QUALITIES } from '@/utils/constants';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { showToast } from '@/utils/toast';

const createMovieSchema = z.object({
  Title: z.string().min(1, 'Title is required'),
  Category: z.string().min(1, 'Category is required'),
  Description: z.string().optional(),
  SubCategory: z.string().optional(),
  Channel: z.string().optional(),
  MetaTitle: z.string().optional(),
  MetaDescription: z.string().optional(),
  AgeRestriction: z.string().optional(),
  Year: z.number().optional(),
  ReleaseDate: z.string().optional(),
  Director: z.string().optional(),
  TrailerUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  IsPremium: z.boolean().optional(),
  sourceQuality: z.enum(['480p', '720p', '1080p']).optional(),
});

type CreateMovieFormData = z.infer<typeof createMovieSchema> & {
  Genre?: string[];
  Cast?: string[];
  BlockedCountries?: string[];
};

export const CreateMovie = () => {
  const navigate = useNavigate();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMovieFormData>({
    resolver: zodResolver(createMovieSchema),
    defaultValues: {
      sourceQuality: '1080p',
      IsPremium: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMovieData) => moviesApi.queueUpload(data),
    onSuccess: (res) => {
      showToast.success(res.message || 'Movie created and files queued for upload');
      const id = res.data.movie?._id;
      if (id) {
        navigate(`/movies/${id}`);
        return;
      }
      navigate('/movies');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create movie';
      showToast.error(message);
    },
  });

  const onSubmit = async (data: CreateMovieFormData) => {
    if (video && !thumbnail) {
      showToast.error('When uploading a video, a thumbnail is required in the same request');
      return;
    }

    const formData: CreateMovieData = {
      Title: data.Title,
      Category: data.Category,
      Description: data.Description,
      SubCategory: data.SubCategory,
      Channel: data.Channel,
      MetaTitle: data.MetaTitle,
      MetaDescription: data.MetaDescription,
      AgeRestriction: data.AgeRestriction,
      ReleaseDate: data.ReleaseDate,
      Director: data.Director,
      TrailerUrl: data.TrailerUrl || undefined,
      Year: data.Year,
      Genre: data.Genre?.length ? data.Genre : undefined,
      Cast: data.Cast?.length ? data.Cast : undefined,
      BlockedCountries: data.BlockedCountries?.length ? data.BlockedCountries : undefined,
      IsPremium: data.IsPremium ?? false,
      sourceQuality: data.sourceQuality || '1080p',
      thumbnail: thumbnail || undefined,
      poster: poster || undefined,
      video: video || undefined,
    };

    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload New Movie</h1>
        <p className="text-gray-600">
          Creates the movie via <code className="text-sm bg-gray-100 px-1 rounded">POST /api/admin/movies/queue-upload</code> using
          your admin session token.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Select
            label="Source quality (single video label)"
            options={MOVIE_QUALITIES.map((q) => ({ value: q, label: q }))}
            {...register('sourceQuality')}
          />
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Premium movie</span>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={watch('IsPremium') || false}
                onChange={(e) => setValue('IsPremium', e.target.checked)}
                className="rounded border-gray-300 text-purple-600"
              />
              IsPremium
            </label>
          </div>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            className="input"
            rows={4}
            {...register('Description')}
            placeholder="Movie description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            label="Thumbnail (required if you add a video)"
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
          <div className="md:col-span-2">
            <FileUpload
              label="Video (optional for queue — max 100GB)"
              accept="video/*"
              maxSize={102400}
              onChange={(files) => setVideo(files?.[0] || null)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/movies')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Queue upload
          </Button>
        </div>
      </form>
    </div>
  );
};
