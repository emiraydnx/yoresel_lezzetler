import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/UI/LoadingSpinner';
import { AuthProvider, useAuth } from './context/AuthContext';
import CityPage from './pages/CityPage';
import FoodDetailPage from './pages/FoodDetailPage';
import GourmetReviewPage from './pages/GourmetReviewPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PublicUserProfilePage from './pages/PublicUserProfilePage';
import RegionPage from './pages/RegionPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantPage from './pages/RestaurantPage';
import ReviewsPage from './pages/ReviewsPage';
import TopFoodsPage from './pages/TopFoodsPage';
import TopRestaurantsPage from './pages/TopRestaurantsPage';
import AdminFoods from './pages/admin/AdminFoods';
import AdminPage from './pages/admin/AdminPage';
import AdminRestaurantFoods from './pages/admin/AdminRestaurantFoods';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminReviews from './pages/admin/AdminReviews';
import AdminUsers from './pages/admin/AdminUsers';
import ProfilePage from './pages/userProfilePage';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/cities/:citySlug" element={<CityPage />} />
    <Route path="/foods/:foodSlug" element={<FoodDetailPage />} />
    <Route path="/restaurants/:restaurantSlug" element={<RestaurantPage />} />
    <Route path="/top-foods" element={<TopFoodsPage />} />
    <Route path="/top-restaurants" element={<TopRestaurantsPage />} />
    <Route path="/reviews" element={<ReviewsPage />} />
    <Route path="/regions/:regionSlug" element={<RegionPage />} />
    <Route path="/reviews/:reviewId" element={<GourmetReviewPage />} />
    <Route path="/users/:userId" element={<PublicUserProfilePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/foods"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminFoods />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/restaurants"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminRestaurants />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/restaurant-foods"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminRestaurantFoods />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/reviews"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminReviews />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminUsers />
        </ProtectedRoute>
      }
    />
  </Routes>
);

const AppShell = () => {
  const { loading } = useAuth();

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {loading ? (
            <LoadingSpinner className="py-16" label="Oturum bilgileri yukleniyor..." size="lg" />
          ) : (
            <AppRoutes />
          )}
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
};

const App = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
