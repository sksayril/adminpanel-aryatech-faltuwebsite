import { useRef, ChangeEvent, ReactNode } from 'react';
import clsx from 'clsx';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toast';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  label?: string;
  error?: string;
  helperText?: string;
  preview?: string | string[];
  maxSize?: number; // in MB
  className?: string;
}

export const FileUpload = ({
  accept,
  multiple = false,
  onChange,
  label,
  error,
  helperText,
  preview,
  maxSize,
  className,
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && maxSize) {
      const oversizedFiles = Array.from(files).filter(
        (file) => file.size > maxSize * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        showToast.warning(`File size exceeds ${maxSize}MB limit. Please select a smaller file.`);
        e.target.value = ''; // Reset input
        return;
      }
    }
    onChange(files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const previews = Array.isArray(preview) ? preview : preview ? [preview] : [];

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div
        onClick={handleClick}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          {
            'border-gray-300 hover:border-primary-400': !error,
            'border-red-300': error,
          }
        )}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        />
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <span className="text-primary-600 font-medium">Click to upload</span>
          <span className="text-gray-500"> or drag and drop</span>
        </div>
        {accept && (
          <p className="mt-1 text-xs text-gray-500">
            {accept.split(',').join(', ')}
            {maxSize && ` (Max ${maxSize}MB)`}
          </p>
        )}
      </div>
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((url, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

