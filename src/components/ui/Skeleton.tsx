import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
};

// Pre-built skeleton components
export const SkeletonCard = () => {
  return (
    <div className="card space-y-4">
      <Skeleton variant="rectangular" height={200} className="w-full" />
      <div className="space-y-2">
        <Skeleton variant="text" height={24} width="80%" />
        <Skeleton variant="text" height={20} width="60%" />
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => {
  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3 text-left">
                <Skeleton variant="text" height={20} width={100} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton variant="text" height={16} width={Math.random() * 50 + 50} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const SkeletonVideoPlayer = () => {
  return (
    <div className="w-full max-w-3xl mx-auto aspect-video bg-gray-200 rounded-lg overflow-hidden">
      <Skeleton variant="rectangular" className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-gray-300 animate-pulse"></div>
      </div>
    </div>
  );
};

export const SkeletonList = ({ items = 5 }: { items?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={20} width="60%" />
            <Skeleton variant="text" height={16} width="40%" />
          </div>
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
      ))}
    </div>
  );
};

export const SkeletonMovieCard = () => {
  return (
    <div className="card p-0 overflow-hidden">
      <Skeleton variant="rectangular" height={300} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" height={24} width="80%" />
        <Skeleton variant="text" height={16} width="100%" />
        <Skeleton variant="text" height={16} width="60%" />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
          <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonForm = () => {
  return (
    <div className="card space-y-6">
      <div className="space-y-2">
        <Skeleton variant="text" height={20} width={100} />
        <Skeleton variant="rectangular" height={40} className="w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" height={20} width={100} />
        <Skeleton variant="rectangular" height={100} className="w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" height={20} width={80} />
          <Skeleton variant="rectangular" height={40} className="w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" height={20} width={80} />
          <Skeleton variant="rectangular" height={40} className="w-full" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </div>
  );
};

export const SkeletonStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="card text-center">
          <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-2" />
          <Skeleton variant="text" height={32} width={60} className="mx-auto mb-1" />
          <Skeleton variant="text" height={16} width={80} className="mx-auto" />
        </div>
      ))}
    </div>
  );
};

