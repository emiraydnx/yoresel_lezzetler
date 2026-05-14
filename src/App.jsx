import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import CityPage from './pages/CityPage';
import FoodDetailPage from './pages/FoodDetailPage';
import GourmetReviewPage from './pages/GourmetReviewPage';
import HomePage from './pages/HomePage';
import RestaurantPage from './pages/RestaurantPage';
import ReviewsPage from './pages/ReviewsPage';
import TopFoodsPage from './pages/TopFoodsPage';
import TopRestaurantsPage from './pages/TopRestaurantsPage';
import LoginPage from './pages/LoginPage';
import PublicUserProfilePage from './pages/PublicUserProfilePage';
import RegionPage from './pages/RegionPage';
import RegisterPage from './pages/RegisterPage';
import AdminFoods from './pages/admin/AdminFoods';
import AdminPage from './pages/admin/AdminPage';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminReviews from './pages/admin/AdminReviews';
import AdminUsers from './pages/admin/AdminUsers';
import ProfilePage from './pages/userProfilePage';

const AppShell = () => {
  const { currentUser, userProfile } = useAuth();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link className="font-semibold" to="/">
              Yöresel Lezzetler
            </Link>

            <div className="flex items-center gap-4 text-sm">
              <Link to="/">Ana Sayfa</Link>
              {userProfile?.role === 'admin' && <Link to="/admin">Admin</Link>}
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded border px-3 py-2 hover:bg-slate-50"
                  >
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt="Profil"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {(userProfile?.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span>{userProfile?.displayName || currentUser.email}</span>
                  </Link>
                </div>
              ) : (
                <>
                  <Link to="/login">Giriş</Link>
                  <Link className="rounded bg-slate-900 px-3 py-2 text-white" to="/register">
                    Kayıt
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">
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
            <Route path="/profile" element={<ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>} />
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
        </main>
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
