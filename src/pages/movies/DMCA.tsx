import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { moviesApi } from '@/api/movies.api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { showToast } from '@/utils/toast';

export const DMCA = () => {
  const navigate = useNavigate();
  const [selectedMovie, setSelectedMovie] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const { data: moviesData } = useQuery({
    queryKey: ['movies', { limit: 100 }],
    queryFn: () => moviesApi.getAll({ limit: 100 }),
  });

  const dmcaMutation = useMutation({
    mutationFn: () => {
      if (!selectedMovie) throw new Error('Please select a movie');
      return moviesApi.dmcaTakedown(selectedMovie, reason);
    },
    onSuccess: (data) => {
      showToast.success(data.message || 'DMCA takedown applied successfully!');
      navigate('/movies');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to apply DMCA takedown';
      showToast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMovie && reason) {
      dmcaMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">DMCA Takedown</h1>
        <p className="text-gray-600">Apply DMCA takedown to a movie</p>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
          <textarea
            className="input"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Copyright violation reported by content owner"
            required
          />
        </div>
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/movies')}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={dmcaMutation.isPending}>
            Apply DMCA Takedown
          </Button>
        </div>
      </form>
    </div>
  );
};

