import { Link } from 'react-router-dom';

const footerSections = [
  {
    title: 'Kesfet',
    links: [
      { label: 'Ana Sayfa', to: '/' },
      { label: 'Populer Lezzetler', to: '/top-foods' },
      { label: 'En Iyi Restoranlar', to: '/top-restaurants' },
      { label: 'Gurme Yorumlari', to: '/reviews' },
    ],
  },
  {
    title: 'Hesap',
    links: [
      { label: 'Giris Yap', to: '/login' },
      { label: 'Kayit Ol', to: '/register' },
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
            <span className="flex h-10 w-10 items-center justify-center rounded bg-red-700 text-lg font-bold text-white">
              YL
            </span>
            <span>Yoresel Lezzetler</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            Turkiye'nin sehirlerine, bolgelerine, yemeklerine ve restoranlarina gore yerel tatlari
            kesfetmek icin hazirlanan rehber platformu.
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
          <p>© {year} Yoresel Lezzetler. Tum haklari saklidir.</p>
          <p>Lezzet, restoran ve yorum kesfi icin gelistirildi.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
