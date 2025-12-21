import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '@/api/movies.api';
import { Button } from '@/components/ui/Button';

export const EditMovie = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => moviesApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Movie</h1>
        <p className="text-gray-600">{data?.data.Title}</p>
      </div>
      <div className="card">
        <p className="text-gray-600">Edit movie form will be implemented here.</p>
        <Button variant="outline" onClick={() => navigate('/movies')} className="mt-4">
          Back to Movies
        </Button>
      </div>
    </div>
  );
};

