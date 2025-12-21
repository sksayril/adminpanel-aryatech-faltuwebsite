import { useMutation } from '@tanstack/react-query';
import { seoApi } from '@/api/seo.api';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/utils/toast';

export const Sitemap = () => {
  const generateMutation = useMutation({
    mutationFn: () => seoApi.generateSitemap(),
    onSuccess: (data) => {
      showToast.success(data.message || 'Sitemap generated successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to generate sitemap';
      showToast.error(message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sitemap Generator</h1>
        <p className="text-gray-600">Generate sitemap for SEO</p>
      </div>

      <div className="card">
        <p className="text-gray-600 mb-4">Generate a sitemap.xml file for your website to help search engines index your content.</p>
        <Button onClick={() => generateMutation.mutate()} isLoading={generateMutation.isPending}>
          Generate Sitemap
        </Button>
        {generateMutation.data && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">Sitemap generated successfully!</p>
            <p className="text-sm text-green-600 mt-1">URL: {generateMutation.data.data.url}</p>
            <p className="text-sm text-green-600">Total URLs: {generateMutation.data.data.totalUrls}</p>
          </div>
        )}
      </div>
    </div>
  );
};

