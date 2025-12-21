import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { moviesApi } from '@/api/movies.api';
import { SUBTITLE_LANGUAGES } from '@/utils/constants';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { showToast } from '@/utils/toast';

export const UploadSubtitle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('English');
  const [languageCode, setLanguageCode] = useState<string>('en');

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!subtitleFile || !id) throw new Error('Subtitle file is required');
      return moviesApi.uploadSubtitle(id, subtitleFile, language, languageCode);
    },
    onSuccess: (data) => {
      showToast.success(data.message || 'Subtitle uploaded successfully!');
      navigate(`/movies/${id}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to upload subtitle';
      showToast.error(message);
    },
  });

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = SUBTITLE_LANGUAGES.find((lang) => lang.name === e.target.value);
    if (selectedLang) {
      setLanguage(selectedLang.name);
      setLanguageCode(selectedLang.code);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtitleFile) {
      uploadMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Subtitle</h1>
        <p className="text-gray-600">Upload a subtitle file for this movie</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <Select
          label="Language"
          options={SUBTITLE_LANGUAGES.map((lang) => ({ value: lang.name, label: `${lang.name} (${lang.code})` }))}
          value={language}
          onChange={handleLanguageChange}
        />
        <FileUpload
          label="Subtitle File (SRT/VTT)"
          accept=".srt,.vtt"
          maxSize={10}
          onChange={(files) => setSubtitleFile(files?.[0] || null)}
        />
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate(`/movies/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={uploadMutation.isPending} disabled={!subtitleFile}>
            Upload Subtitle
          </Button>
        </div>
      </form>
    </div>
  );
};

