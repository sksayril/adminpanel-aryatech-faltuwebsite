import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { moviesApi } from '@/api/movies.api';
import { MOVIE_QUALITIES } from '@/utils/constants';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { showToast } from '@/utils/toast';

export const UploadVideo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<string>('720p');

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!videoFile || !id) throw new Error('Video file is required');
      return moviesApi.uploadVideo(id, videoFile, quality);
    },
    onSuccess: (data) => {
      showToast.success(data.message || 'Video uploaded successfully!');
      navigate(`/movies/${id}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to upload video';
      showToast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoFile) {
      uploadMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Video Quality</h1>
        <p className="text-gray-600">Upload a video file for this movie</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <Select
          label="Video Quality"
          options={MOVIE_QUALITIES.map((q) => ({ value: q, label: q }))}
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
        />
        <FileUpload
          label="Video File"
          accept="video/*"
          maxSize={5000}
          onChange={(files) => setVideoFile(files?.[0] || null)}
        />
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate(`/movies/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={uploadMutation.isPending} disabled={!videoFile}>
            Upload Video
          </Button>
        </div>
      </form>
    </div>
  );
};

