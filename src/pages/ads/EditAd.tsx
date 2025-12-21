import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adsApi, CreateAdData } from '@/api/ads.api';
import { AD_TYPES, COUNTRIES } from '@/utils/constants';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { showToast } from '@/utils/toast';

const editAdSchema = z.object({
  Name: z.string().min(1, 'Ad name is required'),
  Type: z.string().min(1, 'Ad type is required'),
  ClickUrl: z.string().url('Invalid URL'),
  Title: z.string().optional(),
  Description: z.string().optional(),
  Position: z.string().optional(),
  Width: z.number().optional(),
  Height: z.number().optional(),
  StartDate: z.string().optional(),
  EndDate: z.string().optional(),
  Priority: z.number().optional(),
  AdvertiserName: z.string().optional(),
  AdvertiserEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  IsActive: z.boolean().optional(),
});

type EditAdFormData = z.infer<typeof editAdSchema>;

export const EditAd = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const { data: adData, isLoading } = useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsApi.getById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditAdFormData>({
    resolver: zodResolver(editAdSchema),
  });

  useEffect(() => {
    if (adData?.data) {
      const ad = adData.data;
      reset({
        Name: ad.Name,
        Type: ad.Type,
        ClickUrl: ad.ClickUrl,
        Title: ad.Title,
        Description: ad.Description,
        Position: ad.Position,
        Width: ad.Width,
        Height: ad.Height,
        StartDate: ad.StartDate ? new Date(ad.StartDate).toISOString().slice(0, 16) : '',
        EndDate: ad.EndDate ? new Date(ad.EndDate).toISOString().slice(0, 16) : '',
        Priority: ad.Priority,
        AdvertiserName: ad.AdvertiserName,
        AdvertiserEmail: ad.AdvertiserEmail,
        IsActive: ad.IsActive,
      });
      if (ad.TargetCountries) {
        setSelectedCountries(ad.TargetCountries);
      }
    }
  }, [adData, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateAdData>) => adsApi.update(id!, data),
    onSuccess: (data) => {
      showToast.success(data.message || 'Ad updated successfully!');
      navigate('/ads');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update ad';
      showToast.error(message);
    },
  });

  const onSubmit = async (data: EditAdFormData) => {
    const formData: Partial<CreateAdData> = {
      Name: data.Name,
      Type: data.Type,
      ClickUrl: data.ClickUrl,
      Title: data.Title,
      Description: data.Description,
      Position: data.Position,
      Width: data.Width,
      Height: data.Height,
      StartDate: data.StartDate,
      EndDate: data.EndDate,
      Priority: data.Priority,
      AdvertiserName: data.AdvertiserName,
      AdvertiserEmail: data.AdvertiserEmail,
      TargetCountries: selectedCountries.length > 0 ? selectedCountries : undefined,
      image: imageFile || undefined,
      video: videoFile || undefined,
    };

    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Ad</h1>
        <p className="text-gray-600">Update advertisement details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Ad Name *"
            {...register('Name')}
            error={errors.Name?.message}
          />
          <Select
            label="Ad Type *"
            options={AD_TYPES.map((type) => ({ value: type.value, label: type.label }))}
            {...register('Type')}
            error={errors.Type?.message}
          />
          <Input
            label="Click URL *"
            type="url"
            {...register('ClickUrl')}
            error={errors.ClickUrl?.message}
          />
          <Input
            label="Title"
            {...register('Title')}
            error={errors.Title?.message}
          />
          <Input
            label="Position"
            {...register('Position')}
            error={errors.Position?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Width"
              type="number"
              {...register('Width', { valueAsNumber: true })}
              error={errors.Width?.message}
            />
            <Input
              label="Height"
              type="number"
              {...register('Height', { valueAsNumber: true })}
              error={errors.Height?.message}
            />
          </div>
          <Input
            label="Start Date"
            type="datetime-local"
            {...register('StartDate')}
            error={errors.StartDate?.message}
          />
          <Input
            label="End Date"
            type="datetime-local"
            {...register('EndDate')}
            error={errors.EndDate?.message}
          />
          <Input
            label="Priority"
            type="number"
            {...register('Priority', { valueAsNumber: true })}
            error={errors.Priority?.message}
          />
          <Input
            label="Advertiser Name"
            {...register('AdvertiserName')}
            error={errors.AdvertiserName?.message}
          />
          <Input
            label="Advertiser Email"
            type="email"
            {...register('AdvertiserEmail')}
            error={errors.AdvertiserEmail?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            className="input"
            rows={4}
            {...register('Description')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Countries</label>
          <select
            multiple
            className="input"
            value={selectedCountries}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, (option) => option.value);
              setSelectedCountries(values);
            }}
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            label="Ad Image"
            accept="image/*"
            maxSize={10}
            onChange={(files) => setImageFile(files?.[0] || null)}
            preview={adData?.data.ImageUrl || (imageFile ? URL.createObjectURL(imageFile) : undefined)}
          />
          <FileUpload
            label="Ad Video"
            accept="video/*"
            maxSize={5000}
            onChange={(files) => setVideoFile(files?.[0] || null)}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/ads')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateMutation.isPending}>
            Update Ad
          </Button>
        </div>
      </form>
    </div>
  );
};

