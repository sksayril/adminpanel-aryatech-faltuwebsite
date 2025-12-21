import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { seoApi } from '@/api/seo.api';
import { moviesApi } from '@/api/movies.api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/utils/toast';

export const MovieSEO = () => {
  const [selectedMovie, setSelectedMovie] = useState<string>('');
  const [metaTitle, setMetaTitle] = useState<string>('');
  const [metaDescription, setMetaDescription] = useState<string>('');
  const [metaKeywords, setMetaKeywords] = useState<string>('');
  const [customSlug, setCustomSlug] = useState<string>('');

  const { data: moviesData } = useQuery({
    queryKey: ['movies', { limit: 100 }],
    queryFn: () => moviesApi.getAll({ limit: 100 }),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selectedMovie) throw new Error('Please select a movie');
      return seoApi.updateMovieSEO(selectedMovie, {
        metaTitle,
        metaDescription,
        metaKeywords: metaKeywords.split(',').map((k) => k.trim()),
        customSlug,
      });
    },
    onSuccess: (data) => {
      showToast.success(data.message || 'SEO updated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update SEO';
      showToast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Movie SEO Editor</h1>
        <p className="text-gray-600">Update SEO settings for movies</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <Select
          label="Select Movie"
          options={[
            { value: '', label: 'Select a movie' },
            ...(moviesData?.data?.map((movie) => ({ value: movie._id, label: movie.Title })) || []),
          ]}
          value={selectedMovie}
          onChange={(e) => setSelectedMovie(e.target.value)}
        />
        <Input
          label="Meta Title"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="The Amazing Movie - Watch Online Free"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
          <textarea
            className="input"
            rows={4}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Watch The Amazing Movie online in HD quality"
          />
        </div>
        <Input
          label="Meta Keywords (comma-separated)"
          value={metaKeywords}
          onChange={(e) => setMetaKeywords(e.target.value)}
          placeholder="action, adventure, thriller"
        />
        <Input
          label="Custom Slug"
          value={customSlug}
          onChange={(e) => setCustomSlug(e.target.value)}
          placeholder="amazing-movie-2024"
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={updateMutation.isPending}>
            Update SEO
          </Button>
        </div>
      </form>
    </div>
  );
};

