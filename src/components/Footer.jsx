import { Link } from 'react-router-dom';

const footerSections = [
  {
    title: 'Keşfet',
    links: [
      { label: 'Ana Sayfa', to: '/' },
      { label: 'Popüler Lezzetler', to: '/top-foods' },
      { label: 'En İyi Restoranlar', to: '/top-restaurants' },
      { label: 'Gurme Yorumları', to: '/reviews' },
    ],
  },
  {
    title: 'Hesap',
    links: [
      { label: 'Giriş Yap', to: '/login' },
      { label: 'Kayıt Ol', to: '/register' },
      { label: 'Profil', to: '/profile' },
    ],
  },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link className="inline-flex items-center gap-3 font-semibold text-slate-950" to="/">
            <img
              alt="Yöresel Lezzetler"
              className="h-10 w-10 object-contain"
              src="/logo2.png"
            />
            <span>CULINARA</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            Türkiye'nin şehirlerine, bölgelerine, yemeklerine ve restoranlarına göre yerel tatları
            keşfetmek için hazırlanan rehber platformu.
          </p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-950">{section.title}</h2>
            <ul className="mt-4 space-y-3">
              {section.links.map((link) => (
                <li key={link.to}>
                  <Link className="text-sm text-slate-600 hover:text-red-800" to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Yöresel Lezzetler. Tüm hakları saklıdır.</p>
          <p>Lezzet, restoran ve yorum keşfi için geliştirildi.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
