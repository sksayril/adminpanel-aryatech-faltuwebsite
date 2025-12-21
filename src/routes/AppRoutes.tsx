import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { AdsList } from '@/pages/ads/AdsList';
import { CreateAd } from '@/pages/ads/CreateAd';
import { EditAd } from '@/pages/ads/EditAd';
import { AdAnalytics } from '@/pages/ads/AdAnalytics';
import { MoviesList } from '@/pages/movies/MoviesList';
import { CreateMovie } from '@/pages/movies/CreateMovie';
import { EditMovie } from '@/pages/movies/EditMovie';
import { MovieDetails } from '@/pages/movies/MovieDetails';
import { UploadVideo } from '@/pages/movies/UploadVideo';
import { UploadSubtitle } from '@/pages/movies/UploadSubtitle';
import { DMCA } from '@/pages/movies/DMCA';
import { Categories } from '@/pages/categories/Categories';
import { SubCategories } from '@/pages/categories/SubCategories';
import { SubSubCategories } from '@/pages/categories/SubSubCategories';
import { Channels } from '@/pages/categories/Channels';
import { MovieSEO } from '@/pages/seo/MovieSEO';
import { Sitemap } from '@/pages/seo/Sitemap';
import { SEOAnalytics } from '@/pages/seo/SEOAnalytics';
import { ReferralsList } from '@/pages/referrals/ReferralsList';
import { ReferralStats } from '@/pages/referrals/ReferralStats';
import { UploadQueues } from '@/pages/movies/UploadQueues';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Navigate to="/dashboard" replace />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      {/* Ads Routes */}
      <Route
        path="/ads"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdsList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ads/create"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <CreateAd />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ads/:id/edit"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <EditAd />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ads/:id/analytics"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      {/* Movies Routes */}
      <Route
        path="/movies"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <MoviesList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies/create"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <CreateMovie />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies/:id"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <MovieDetails />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies/:id/edit"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <EditMovie />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies/upload-video"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <UploadVideo />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies/:id/upload-video"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <UploadVideo />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies/:id/upload-subtitle"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <UploadSubtitle />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dmca"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <DMCA />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      {/* Upload Queues Route */}
      <Route
        path="/upload-queues"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <UploadQueues />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      {/* Categories Routes */}
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Categories />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subcategories"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <SubCategories />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subsubcategories"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <SubSubCategories />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/channels"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Channels />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      {/* SEO Routes */}
      <Route
        path="/seo/movie"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <MovieSEO />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/seo/sitemap"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Sitemap />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/seo/analytics"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <SEOAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      {/* Referrals Routes */}
      <Route
        path="/referrals"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ReferralsList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals/stats"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ReferralStats />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      {/* 404 Route */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900">404 - Page Not Found</h1>
                <p className="text-gray-600 mt-2">The page you're looking for doesn't exist.</p>
              </div>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

