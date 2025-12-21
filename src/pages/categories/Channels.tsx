import { useQuery } from '@tanstack/react-query';
import { channelsApi } from '@/api/channels.api';
import { Button } from '@/components/ui/Button';

export const Channels = () => {
  const { isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsApi.getAll(),
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
          <p className="text-gray-600">Manage channels</p>
        </div>
        <Button>Create Channel</Button>
      </div>

      <div className="card">
        <p className="text-gray-600">Channels list will be implemented here.</p>
      </div>
    </div>
  );
};

