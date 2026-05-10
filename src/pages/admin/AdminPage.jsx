import { useAuth } from '../../context/AuthContext';

const AdminPage = () => {
  const { userProfile } = useAuth();

  return (
    <section className="rounded border bg-white p-6">
      <p className="text-sm font-medium text-emerald-700">Admin panel</p>
      <h1 className="mt-2 text-2xl font-bold">Yönetim Alanı</h1>
      <p className="mt-3 text-slate-600">
        Bu sayfa sadece `role: admin` olan kullanıcılar için açılır. Aktif kullanıcı:{' '}
        <span className="font-medium">{userProfile?.email}</span>
      </p>
    </section>
  );
};

export default AdminPage;
