import { Link, useParams } from 'react-router-dom';
import { turkeyRegionsGeo } from '../data/turkeyRegionsGeo';

const RegionPage = () => {
  const { regionSlug } = useParams();
  const region = turkeyRegionsGeo.features.find((feature) => feature.properties.slug === regionSlug)?.properties;

  return (
    <section className="rounded border bg-white p-6">
      <p className="text-sm font-medium text-emerald-700">Bölge sayfası</p>
      <h1 className="mt-2 text-2xl font-bold">{region?.name || 'Bölge bulunamadı'}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Bu sayfa bir sonraki adımda seçilen bölgenin şehirlerini, popüler lezzetlerini ve şehir hover tooltiplerini gösterecek.
      </p>
      <Link className="mt-5 inline-flex rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/">
        Haritaya Dön
      </Link>
    </section>
  );
};

export default RegionPage;
