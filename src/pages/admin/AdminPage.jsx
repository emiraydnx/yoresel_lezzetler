import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const adminSections = [
  {
    description: 'Yoresel lezzet kayitlarini ekle, duzenle ve sil.',
    path: '/admin/foods',
    title: 'Lezzetler',
  },
  {
    description: 'Restoran bilgilerini, konumlarini ve puan alanlarini yonet.',
    path: '/admin/restaurants',
    title: 'Restoranlar',
  },
  {
    description: 'Kullanici yorumlarini onayla, reddet, duzenle veya sil.',
    path: '/admin/reviews',
    title: 'Yorumlar',
  },
  {
    description: 'Kullanici profil dokumanlarini ve rollerini duzenle.',
    path: '/admin/users',
    title: 'Kullanicilar',
  },
];

const AdminPage = () => {
  const { userProfile } = useAuth();

  return (
    <section className="space-y-6">
      <div className="rounded border bg-white p-6">
        <p className="text-sm font-medium text-emerald-700">Admin panel</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Yonetim Alani</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Bu alan sadece role: admin olan kullanicilar icin acilir. Aktif kullanici:{' '}
          <span className="font-medium">{userProfile?.email || userProfile?.displayName || 'admin'}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {adminSections.map((section) => (
          <Link className="rounded border bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm" key={section.path} to={section.path}>
            <h2 className="font-semibold text-slate-950">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
            <span className="mt-4 inline-flex text-sm font-medium text-red-700">Yonet</span>
          </Link>
        ))}
      </div>

      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Not: Bu ekran client tarafindan Firestore dokumanlarini yonetir. Uretim seviyesinde yetki kontrolu icin Firestore
        Security Rules ve hassas admin islemleri icin Cloud Functions gereklidir.
      </div>
    </section>
  );
};

export default AdminPage;