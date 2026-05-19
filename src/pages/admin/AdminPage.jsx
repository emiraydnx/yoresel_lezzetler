import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const adminSections = [
  {
    description: 'Yöresel lezzet kayıtlarını ekle, düzenle ve sil.',
    path: '/admin/foods',
    title: 'Lezzetler',
  },
  {
    description: 'Restoran bilgilerini, konumlarini ve puan alanlarini yonet.',
    path: '/admin/restaurants',
    title: 'Restoranlar',
  },
  {
    description: 'Restoranların sunduğu yöresel lezzetleri eşleştir.',
    path: '/admin/restaurant-foods',
    title: 'Restoran-Lezzet İlişkileri',
  },
  {
    description: 'Kullanıcı yorumlarını onayla, reddet, düzenle veya sil.',
    path: '/admin/reviews',
    title: 'Yorumlar',
  },
  {
    description: 'Kullanıcı profil dokümanlarını ve rollerini düzenle.',
    path: '/admin/users',
    title: 'Kullanıcılar',
  },
];

const AdminPage = () => {
  const { userProfile } = useAuth();

  return (
    <section className="space-y-6">
      <div className="rounded border bg-white p-6">
        <p className="text-sm font-medium text-emerald-700">Admin panel</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Yönetim Alanı</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Bu alan sadece role: admin olan kullanıcılar için açılır. Aktif kullanıcı:{' '}
          <span className="font-medium">{userProfile?.email || userProfile?.displayName || 'admin'}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {adminSections.map((section) => (
          <Link className="rounded border bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm" key={section.path} to={section.path}>
            <h2 className="font-semibold text-slate-950">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
            <span className="mt-4 inline-flex text-sm font-medium text-red-700">Yönet</span>
          </Link>
        ))}
      </div>

      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Not: Bu ekran client tarafından Firestore dokümanlarını yönetir. Üretim seviyesinde yetki kontrolü için Firestore
        Security Rules ve hassas admin işlemleri için Cloud Functions gereklidir.
      </div>
    </section>
  );
};

export default AdminPage;
