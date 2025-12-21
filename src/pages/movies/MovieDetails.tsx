import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '@/api/movies.api';
import { Button } from '@/components/ui/Button';
import { CustomVideoPlayer } from '@/components/video/CustomVideoPlayer';
import { SkeletonVideoPlayer, SkeletonCard, Skeleton } from '@/components/ui/Skeleton';
import {
  CalendarIcon,
  UserIcon,
  StarIcon,
  EyeIcon,
  TagIcon,
  FilmIcon,
} from '@heroicons/react/24/outline';

export const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => moviesApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" height={36} width={300} />
            <Skeleton variant="text" height={20} width={500} />
          </div>
          <Skeleton variant="rectangular" width={120} height={40} />
        </div>

        {/* Video Player Skeleton */}
        <SkeletonVideoPlayer />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load movie details</p>
        <Link to="/movies">
          <Button variant="outline">Back to Movies</Button>
        </Link>
      </div>
    );
  }

  const movie = data.data;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryName = (category: any): string => {
    if (typeof category === 'string') return category;
    return category?.Name || 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{movie.Title}</h1>
          <p className="text-gray-600 mt-1">{movie.Description}</p>
        </div>
        <Link to={`/movies/${id}/edit`}>
          <Button>Edit Movie</Button>
        </Link>
      </div>

      {/* Video Player */}
      {movie.Videos && movie.Videos.length > 0 ? (
        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <CustomVideoPlayer
              videos={movie.Videos}
              title={movie.Title}
              poster={movie.Poster}
              subtitles={movie.Subtitles}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-full max-w-3xl card bg-gray-100 aspect-video flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FilmIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No video available</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Movie Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Movie Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-sm text-gray-900 capitalize">{movie.Status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Views</label>
                <p className="text-sm text-gray-900 flex items-center gap-1">
                  <EyeIcon className="h-4 w-4" />
                  {movie.Views.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Rating</label>
                <p className="text-sm text-gray-900 flex items-center gap-1">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  {movie.Rating.toFixed(1)} / 5.0
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Likes</label>
                <p className="text-sm text-gray-900">{movie.Likes || 0}</p>
              </div>
              {movie.Year && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Year</label>
                  <p className="text-sm text-gray-900">{movie.Year}</p>
                </div>
              )}
              {movie.ReleaseDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Release Date</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(movie.ReleaseDate)}
                  </p>
                </div>
              )}
              {movie.Director && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Director</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <UserIcon className="h-4 w-4" />
                    {movie.Director}
                  </p>
                </div>
              )}
              {movie.AgeRestriction && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Age Restriction</label>
                  <p className="text-sm text-gray-900">{movie.AgeRestriction}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Is Premium</label>
                <p className="text-sm text-gray-900">{movie.IsPremium ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Is DMCA</label>
                <p className="text-sm text-gray-900">{movie.IsDMCA ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Categories</h2>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-sm text-gray-900">{getCategoryName(movie.Category)}</p>
              </div>
              {movie.SubCategory && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Sub Category</label>
                  <p className="text-sm text-gray-900">{getCategoryName(movie.SubCategory)}</p>
                </div>
              )}
              {movie.SubSubCategory && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Sub Sub Category</label>
                  <p className="text-sm text-gray-900">
                    {typeof movie.SubSubCategory === 'string' ? movie.SubSubCategory : getCategoryName(movie.SubSubCategory)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Genre & Cast */}
          {(movie.Genre && movie.Genre.length > 0) || (movie.Cast && movie.Cast.length > 0) ? (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Genre & Cast</h2>
              <div className="space-y-4">
                {movie.Genre && movie.Genre.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Genre</label>
                    <div className="flex flex-wrap gap-2">
                      {movie.Genre.map((genre, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {movie.Cast && movie.Cast.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Cast</label>
                    <div className="flex flex-wrap gap-2">
                      {movie.Cast.map((cast, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {cast}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Tags & Meta Keywords */}
          {(movie.Tags && movie.Tags.length > 0) || (movie.MetaKeywords && movie.MetaKeywords.length > 0) ? (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Tags & Keywords</h2>
              <div className="space-y-4">
                {movie.Tags && movie.Tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-1">
                      <TagIcon className="h-4 w-4" />
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {movie.Tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {movie.MetaKeywords && movie.MetaKeywords.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Meta Keywords</label>
                    <div className="flex flex-wrap gap-2">
                      {movie.MetaKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* SEO Information */}
          {(movie.MetaTitle || movie.MetaDescription) && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">SEO Information</h2>
              <div className="space-y-3">
                {movie.MetaTitle && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Meta Title</label>
                    <p className="text-sm text-gray-900">{movie.MetaTitle}</p>
                  </div>
                )}
                {movie.MetaDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Meta Description</label>
                    <p className="text-sm text-gray-900">{movie.MetaDescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Blocked Countries */}
          {movie.BlockedCountries && movie.BlockedCountries.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Blocked Countries</h2>
              <div className="flex flex-wrap gap-2">
                {movie.BlockedCountries.map((country, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Thumbnail */}
          {movie.Thumbnail && (
            <div className="card p-0 overflow-hidden">
              <img src={movie.Thumbnail} alt={movie.Title} className="w-full rounded-lg" />
            </div>
          )}

          {/* Poster */}
          {movie.Poster && (
            <div className="card p-0 overflow-hidden">
              <img src={movie.Poster} alt={`${movie.Title} Poster`} className="w-full rounded-lg" />
            </div>
          )}

          {/* Video Qualities */}
          {movie.Videos && movie.Videos.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 text-gray-900">Available Qualities</h3>
              <div className="space-y-2">
                {movie.Videos.map((video, index) => (
                  <div
                    key={video._id || index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{video.Quality}</span>
                      {video.IsOriginal && (
                        <span className="ml-2 text-xs text-blue-600">(Original)</span>
                      )}
                    </div>
                    {video.FileSize && (
                      <span className="text-xs text-gray-500">
                        {(video.FileSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtitles */}
          {movie.Subtitles && movie.Subtitles.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 text-gray-900">Subtitles</h3>
              <div className="space-y-2">
                {movie.Subtitles.map((subtitle, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-900">{subtitle.Language}</span>
                    <span className="text-xs text-gray-500">{subtitle.LanguageCode}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Qualities */}
          {movie.PendingQualities && movie.PendingQualities.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 text-gray-900">Pending Qualities</h3>
              <div className="flex flex-wrap gap-2">
                {movie.PendingQualities.map((quality, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                  >
                    {quality}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Created By */}
          {movie.CreatedBy && (
            <div className="card">
              <h3 className="font-semibold mb-3 text-gray-900">Created By</h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">{movie.CreatedBy.Name}</p>
                <p className="text-xs text-gray-500">{movie.CreatedBy.Email}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="card">
            <h3 className="font-semibold mb-3 text-gray-900">Timestamps</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(movie.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>
                <span className="ml-2 text-gray-900">{formatDate(movie.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
