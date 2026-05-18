import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigationItems = [
  { label: 'Ana Sayfa', to: '/' },
  { label: 'Lezzetler', to: '/top-foods' },
  { label: 'Restoranlar', to: '/top-restaurants' },
  { label: 'Yorumlar', to: '/reviews' },
];

const getInitial = (value = '') => value.trim().charAt(0).toUpperCase() || 'U';

const NavbarLink = ({ children, to, onClick }) => (
  <NavLink
    className={({ isActive }) =>
      [
        'rounded px-3 py-2 text-sm font-medium transition',
        isActive ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
      ].join(' ')
    }
    end={to === '/'}
    onClick={onClick}
    to={to}
  >
    {children}
  </NavLink>
);

const UserAvatar = ({ currentUser, userProfile }) => {
  if (userProfile?.photoURL) {
    return (
      <img
        alt="Profil"
        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
        src={userProfile.photoURL}
      />
    );
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-800">
      {getInitial(userProfile?.displayName || currentUser?.email)}
    </span>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      closeMenu();
      navigate('/', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="Ana navigasyon">
        <Link className="flex items-center gap-3 font-semibold text-slate-950" onClick={closeMenu} to="/">
          <span className="flex h-10 w-10 items-center justify-center rounded bg-red-700 text-lg font-bold text-white">
            YL
          </span>
          <span className="leading-tight">
            <span className="block">Yoresel</span>
            <span className="block text-sm font-medium text-slate-500">Lezzetler</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navigationItems.map((item) => (
            <NavbarLink key={item.to} to={item.to}>
              {item.label}
            </NavbarLink>
          ))}
          {userProfile?.role === 'admin' && <NavbarLink to="/admin">Admin</NavbarLink>}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {currentUser ? (
            <>
              <Link
                className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                to="/profile"
              >
                <UserAvatar currentUser={currentUser} userProfile={userProfile} />
                <span className="max-w-36 truncate">{userProfile?.displayName || currentUser.email}</span>
              </Link>
              <button
                className="rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                disabled={isLoggingOut}
                onClick={handleLogout}
                type="button"
              >
                {isLoggingOut ? 'Cikiliyor...' : 'Cikis'}
              </button>
            </>
          ) : (
            <>
              <Link className="rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100" to="/login">
                Giris
              </Link>
              <Link className="rounded bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800" to="/register">
                Kayit
              </Link>
            </>
          )}
        </div>

        <button
          aria-expanded={isMenuOpen}
          aria-label="Menuyu ac veya kapat"
          className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-slate-700 md:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          <span className="text-xl leading-none">{isMenuOpen ? 'x' : '='}</span>
        </button>
      </nav>

      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4">
            {navigationItems.map((item) => (
              <NavbarLink key={item.to} onClick={closeMenu} to={item.to}>
                {item.label}
              </NavbarLink>
            ))}
            {userProfile?.role === 'admin' && (
              <NavbarLink onClick={closeMenu} to="/admin">
                Admin
              </NavbarLink>
            )}

            <div className="mt-3 border-t border-slate-200 pt-3">
              {currentUser ? (
                <div className="space-y-3">
                  <Link
                    className="flex items-center gap-3 rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                    onClick={closeMenu}
                    to="/profile"
                  >
                    <UserAvatar currentUser={currentUser} userProfile={userProfile} />
                    <span className="truncate">{userProfile?.displayName || currentUser.email}</span>
                  </Link>
                  <button
                    className="w-full rounded border border-red-200 px-3 py-2 text-left text-sm font-medium text-red-700 disabled:opacity-60"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    type="button"
                  >
                    {isLoggingOut ? 'Cikiliyor...' : 'Cikis Yap'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    className="rounded border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700"
                    onClick={closeMenu}
                    to="/login"
                  >
                    Giris
                  </Link>
                  <Link
                    className="rounded bg-slate-950 px-3 py-2 text-center text-sm font-medium text-white"
                    onClick={closeMenu}
                    to="/register"
                  >
                    Kayit
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
