const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { doc, getFirestore, serverTimestamp, writeBatch, GeoPoint } = require('firebase/firestore');


const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env.local');

const loadEnvFile = () => {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

loadEnvFile();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const missingConfigKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfigKeys.length > 0) {
  throw new Error(`Missing Firebase config values: ${missingConfigKeys.join(', ')}`);
}

const cities = [
  { id: 'adana', regionId: 'akdeniz_bolgesi', name: 'Adana', GeoPoint: [37.0000, 35.3213], description: 'Adana, kebabı ve güçlü sokak lezzetleriyle Akdeniz mutfağının en bilinen şehirlerinden biridir.' },
  { id: 'adiyaman', regionId: 'guneydogu_anadolu_bolgesi', name: 'Adıyaman', GeoPoint: [37.7648, 38.2786], description: 'Adıyaman, Güneydoğu Anadolu mutfağının etli yemekleri ve yöresel tatlarıyla öne çıkar.' },
  { id: 'afyonkarahisar', regionId: 'ege_bolgesi', name: 'Afyonkarahisar', GeoPoint: [38.7569, 30.5387], description: 'Afyonkarahisar, kaymağı, sucuğu ve zengin hamur işi kültürüyle tanınır.' },
  { id: 'agri', regionId: 'dogu_anadolu_bolgesi', name: 'Ağrı', GeoPoint: [39.7191, 43.0503], description: 'Ağrı, Doğu Anadolu mutfağının doyurucu et ve tahıl yemekleriyle bilinir.' },
  { id: 'amasya', regionId: 'karadeniz_bolgesi', name: 'Amasya', GeoPoint: [40.6533, 35.8331], description: 'Amasya, elması ve yöresel hamur işleriyle Karadeniz mutfağında özel bir yere sahiptir.' },
  { id: 'ankara', regionId: 'ic_anadolu_bolgesi', name: 'Ankara', GeoPoint: [39.9334, 32.8597], description: 'Ankara, İç Anadolu mutfağının sade, doyurucu ve geleneksel yemeklerini taşır.' },
  { id: 'antalya', regionId: 'akdeniz_bolgesi', name: 'Antalya', GeoPoint: [36.8969, 30.7133], description: 'Antalya, Akdeniz otları, turunçgiller ve deniz ürünleriyle zengin bir mutfak sunar.' },
  { id: 'artvin', regionId: 'karadeniz_bolgesi', name: 'Artvin', GeoPoint: [41.1828, 41.8183], description: 'Artvin, Karadeniz ve Kafkas etkilerini bir araya getiren yöresel lezzetleriyle bilinir.' },
  { id: 'aydin', regionId: 'ege_bolgesi', name: 'Aydın', GeoPoint: [37.8560, 27.8416], description: 'Aydın, inciri, zeytinyağlıları ve Ege mutfağının hafif lezzetleriyle öne çıkar.' },
  { id: 'balikesir', regionId: 'marmara_bolgesi', name: 'Balıkesir', GeoPoint: [39.6484, 27.8826], description: 'Balıkesir, höşmerimi, zeytinyağı ve et yemekleriyle Marmara mutfağında önemli bir yere sahiptir.' },
  { id: 'bilecik', regionId: 'marmara_bolgesi', name: 'Bilecik', GeoPoint: [40.1506, 29.9833], description: 'Bilecik, Marmara ve İç Anadolu etkilerini taşıyan sade yöresel yemekleriyle tanınır.' },
  { id: 'bingol', regionId: 'dogu_anadolu_bolgesi', name: 'Bingöl', GeoPoint: [38.8855, 40.4966], description: 'Bingöl, et, yoğurt ve tahıl ağırlıklı yöresel yemekleriyle Doğu Anadolu mutfağını yansıtır.' },
  { id: 'bitlis', regionId: 'dogu_anadolu_bolgesi', name: 'Bitlis', GeoPoint: [38.3938, 42.1232], description: 'Bitlis, büryan kebabı ve geleneksel et yemekleriyle bilinir.' },
  { id: 'bolu', regionId: 'karadeniz_bolgesi', name: 'Bolu', GeoPoint: [40.7395, 31.6116], description: 'Bolu, aşçıları ve Mengen mutfağıyla Türkiye gastronomisinde güçlü bir yere sahiptir.' },
  { id: 'burdur', regionId: 'akdeniz_bolgesi', name: 'Burdur', GeoPoint: [37.7203, 30.2908], description: 'Burdur, şiş köftesi ve ceviz ezmesiyle Akdeniz iç mutfağının temsilcilerindendir.' },
  { id: 'bursa', regionId: 'marmara_bolgesi', name: 'Bursa', GeoPoint: [40.1885, 29.0610], description: 'Bursa, İskender kebabı, pideli köftesi ve kestane şekeriyle tanınır.' },
  { id: 'canakkale', regionId: 'marmara_bolgesi', name: 'Çanakkale', GeoPoint: [40.1553, 26.4142], description: 'Çanakkale, deniz ürünleri, peynir helvası ve zeytinyağlılarıyla bilinir.' },
  { id: 'cankiri', regionId: 'ic_anadolu_bolgesi', name: 'Çankırı', GeoPoint: [40.6013, 33.6134], description: 'Çankırı, yaren kültürü ve geleneksel İç Anadolu yemekleriyle öne çıkar.' },
  { id: 'corum', regionId: 'karadeniz_bolgesi', name: 'Çorum', GeoPoint: [40.5506, 34.9556], description: 'Çorum, leblebisi ve geleneksel hamur işleriyle tanınır.' },
  { id: 'denizli', regionId: 'ege_bolgesi', name: 'Denizli', GeoPoint: [37.7765, 29.0864], description: 'Denizli, kebabı ve Ege iç bölge mutfağının güçlü yemekleriyle bilinir.' },
  { id: 'diyarbakir', regionId: 'guneydogu_anadolu_bolgesi', name: 'Diyarbakır', GeoPoint: [37.9144, 40.2306], description: 'Diyarbakır, kaburga dolması ve zengin et yemekleriyle Güneydoğu mutfağını temsil eder.' },
  { id: 'edirne', regionId: 'marmara_bolgesi', name: 'Edirne', GeoPoint: [41.6771, 26.5557], description: 'Edirne, tava ciğeri ve Osmanlı mutfağı mirasıyla öne çıkar.' },
  { id: 'elazig', regionId: 'dogu_anadolu_bolgesi', name: 'Elazığ', GeoPoint: [38.6748, 39.2225], description: 'Elazığ, Harput mutfağı ve yöresel köfteleriyle bilinir.' },
  { id: 'erzincan', regionId: 'dogu_anadolu_bolgesi', name: 'Erzincan', GeoPoint: [39.7500, 39.5000], description: 'Erzincan, tulum peyniri ve geleneksel Doğu Anadolu yemekleriyle tanınır.' },
  { id: 'erzurum', regionId: 'dogu_anadolu_bolgesi', name: 'Erzurum', GeoPoint: [39.9000, 41.2700], description: 'Erzurum, cağ kebabı, kadayıf dolması ve kış mutfağıyla bilinir.' },
  { id: 'eskisehir', regionId: 'ic_anadolu_bolgesi', name: 'Eskişehir', GeoPoint: [39.7767, 30.5206], description: 'Eskişehir, çibörek ve met helvasıyla tanınır.' },
  { id: 'gaziantep', regionId: 'guneydogu_anadolu_bolgesi', name: 'Gaziantep', GeoPoint: [37.0662, 37.3833], description: 'Gaziantep, baklavası, kebapları ve UNESCO tescilli mutfak kültürüyle öne çıkar.' },
  { id: 'giresun', regionId: 'karadeniz_bolgesi', name: 'Giresun', GeoPoint: [40.9128, 38.3895], description: 'Giresun, fındığı, karalahana yemekleri ve Karadeniz mutfağıyla bilinir.' },
  { id: 'gumushane', regionId: 'karadeniz_bolgesi', name: 'Gümüşhane', GeoPoint: [40.4603, 39.4814], description: 'Gümüşhane, pestil, köme ve geleneksel Karadeniz iç bölge lezzetleriyle tanınır.' },
  { id: 'hakkari', regionId: 'dogu_anadolu_bolgesi', name: 'Hakkari', GeoPoint: [37.5744, 43.7408], description: 'Hakkari, dağlık coğrafyasının etkisini taşıyan yöresel yemekleriyle bilinir.' },
  { id: 'hatay', regionId: 'akdeniz_bolgesi', name: 'Hatay', GeoPoint: [36.2021, 36.1600], description: 'Hatay, künefesi, mezeleri ve çok kültürlü mutfak mirasıyla öne çıkar.' },
  { id: 'isparta', regionId: 'akdeniz_bolgesi', name: 'Isparta', GeoPoint: [37.7648, 30.5566], description: 'Isparta, gül ürünleri, kabune pilavı ve yöresel tatlarıyla tanınır.' },
  { id: 'mersin', regionId: 'akdeniz_bolgesi', name: 'Mersin', GeoPoint: [36.8121, 34.6415], description: 'Mersin, tantunisi, cezeryesi ve Akdeniz sokak lezzetleriyle bilinir.' },
  { id: 'istanbul', regionId: 'marmara_bolgesi', name: 'İstanbul', GeoPoint: [41.0082, 28.9784], description: 'İstanbul, tarih boyunca farklı mutfak kültürlerini bir araya getiren geniş bir gastronomi merkezidir.' },
  { id: 'izmir', regionId: 'ege_bolgesi', name: 'İzmir', GeoPoint: [38.4237, 27.1428], description: 'İzmir, boyozu, kumrusu, zeytinyağlıları ve Ege otlarıyla tanınır.' },
  { id: 'kars', regionId: 'dogu_anadolu_bolgesi', name: 'Kars', GeoPoint: [40.6013, 43.0975], description: 'Kars, gravyeri, kaz eti ve Doğu Anadolu mutfağıyla öne çıkar.' },
  { id: 'kastamonu', regionId: 'karadeniz_bolgesi', name: 'Kastamonu', GeoPoint: [41.3887, 33.7827], description: 'Kastamonu, pastırması, çekme helvası ve etli ekmeğiyle bilinir.' },
  { id: 'kayseri', regionId: 'ic_anadolu_bolgesi', name: 'Kayseri', GeoPoint: [38.7205, 35.4826], description: 'Kayseri, mantısı, pastırması ve sucuğuyla İç Anadolu mutfağının güçlü şehirlerindendir.' },
  { id: 'kirklareli', regionId: 'marmara_bolgesi', name: 'Kırklareli', GeoPoint: [41.7351, 27.2252], description: 'Kırklareli, Trakya mutfağı, et ürünleri ve peynirleriyle bilinir.' },
  { id: 'kirsehir', regionId: 'ic_anadolu_bolgesi', name: 'Kırşehir', GeoPoint: [39.1425, 34.1709], description: 'Kırşehir, tandır ve geleneksel İç Anadolu yemekleriyle tanınır.' },
  { id: 'kocaeli', regionId: 'marmara_bolgesi', name: 'Kocaeli', GeoPoint: [40.8533, 29.8815], description: 'Kocaeli, pişmaniyesi ve Marmara mutfağındaki çeşitliliğiyle bilinir.' },
  { id: 'konya', regionId: 'ic_anadolu_bolgesi', name: 'Konya', GeoPoint: [37.8746, 32.4932], description: 'Konya, etli ekmeği, fırın kebabı ve Mevlevi mutfağıyla öne çıkar.' },
  { id: 'kutahya', regionId: 'ege_bolgesi', name: 'Kütahya', GeoPoint: [39.4167, 29.9833], description: 'Kütahya, cimcik aşı ve hamur işi ağırlıklı yöresel yemekleriyle bilinir.' },
  { id: 'malatya', regionId: 'dogu_anadolu_bolgesi', name: 'Malatya', GeoPoint: [38.3552, 38.3095], description: 'Malatya, kayısısı ve yöresel köfteleriyle tanınır.' },
  { id: 'manisa', regionId: 'ege_bolgesi', name: 'Manisa', GeoPoint: [38.6191, 27.4289], description: 'Manisa, mesir macunu, kebabı ve Ege iç bölge lezzetleriyle öne çıkar.' },
  { id: 'kahramanmaras', regionId: 'akdeniz_bolgesi', name: 'Kahramanmaraş', GeoPoint: [37.5753, 36.9228], description: 'Kahramanmaraş, dondurması, tarhanası ve güçlü et yemekleriyle bilinir.' },
  { id: 'mardin', regionId: 'guneydogu_anadolu_bolgesi', name: 'Mardin', GeoPoint: [37.3212, 40.7245], description: 'Mardin, baharatlı yemekleri, kaburga dolması ve Süryani mutfağı etkileriyle tanınır.' },
  { id: 'mugla', regionId: 'ege_bolgesi', name: 'Muğla', GeoPoint: [37.2153, 28.3636], description: 'Muğla, Ege otları, deniz ürünleri ve zeytinyağlılarıyla bilinir.' },
  { id: 'mus', regionId: 'dogu_anadolu_bolgesi', name: 'Muş', GeoPoint: [38.9462, 41.7539], description: 'Muş, geleneksel et ve tahıl yemekleriyle Doğu Anadolu mutfağını yansıtır.' },
  { id: 'nevsehir', regionId: 'ic_anadolu_bolgesi', name: 'Nevşehir', GeoPoint: [38.6244, 34.7144], description: 'Nevşehir, testi kebabı ve Kapadokya mutfağıyla tanınır.' },
  { id: 'nigde', regionId: 'ic_anadolu_bolgesi', name: 'Niğde', GeoPoint: [37.9667, 34.6833], description: 'Niğde, gazozu, elması ve İç Anadolu yemekleriyle bilinir.' },
  { id: 'ordu', regionId: 'karadeniz_bolgesi', name: 'Ordu', GeoPoint: [40.9862, 37.8797], description: 'Ordu, fındığı, pancar çorbası ve Karadeniz yemekleriyle tanınır.' },
  { id: 'rize', regionId: 'karadeniz_bolgesi', name: 'Rize', GeoPoint: [41.0201, 40.5234], description: 'Rize, çayı, muhlaması ve hamsili yemekleriyle Karadeniz mutfağının güçlü şehirlerindendir.' },
  { id: 'sakarya', regionId: 'marmara_bolgesi', name: 'Sakarya', GeoPoint: [40.7569, 30.3781], description: 'Sakarya, ıslama köftesi ve Marmara_Karadeniz geçiş mutfağıyla bilinir.' },
  { id: 'samsun', regionId: 'karadeniz_bolgesi', name: 'Samsun', GeoPoint: [41.2867, 36.33,], description: 'Samsun, pidesi ve Karadeniz kıyı mutfağıyla öne çıkar.' },
  { id: 'siirt', regionId: 'guneydogu_anadolu_bolgesi', name: 'Siirt', GeoPoint: [37.9333, 41.95,], description: 'Siirt, büryan kebabı, perde pilavı ve fıstığıyla tanınır.' },
  { id: 'sinop', regionId: 'karadeniz_bolgesi', name: 'Sinop', GeoPoint: [42.0264, 35.1551], description: 'Sinop, mantısı ve Karadeniz deniz ürünleriyle bilinir.' },
  { id: 'sivas', regionId: 'ic_anadolu_bolgesi', name: 'Sivas', GeoPoint: [39.7477, 37.0179], description: 'Sivas, köftesi ve geleneksel İç Anadolu yemekleriyle tanınır.' },
  { id: 'tekirdag', regionId: 'marmara_bolgesi', name: 'Tekirdağ', GeoPoint: [40.9780, 27.5110], description: 'Tekirdağ, köftesi ve Trakya mutfağıyla öne çıkar.' },
  { id: 'tokat', regionId: 'karadeniz_bolgesi', name: 'Tokat', GeoPoint: [40.3167, 36.55,], description: 'Tokat, kebabı, yaprağı ve zengin yöresel yemekleriyle bilinir.' },
  { id: 'trabzon', regionId: 'karadeniz_bolgesi', name: 'Trabzon', GeoPoint: [41.0027, 39.7168], description: 'Trabzon, hamsisi, kuymak ve Akçaabat köftesiyle Karadeniz mutfağında öne çıkar.' },
  { id: 'tunceli', regionId: 'dogu_anadolu_bolgesi', name: 'Tunceli', GeoPoint: [39.1062, 39.5483], description: 'Tunceli, dağ otları, tahıl yemekleri ve geleneksel Doğu Anadolu lezzetleriyle bilinir.' },
  { id: 'sanliurfa', regionId: 'guneydogu_anadolu_bolgesi', name: 'Şanlıurfa', GeoPoint: [37.1674, 38.7955], description: 'Şanlıurfa, çiğ köftesi, kebapları ve isotuyla Güneydoğu mutfağının önemli merkezidir.' },
  { id: 'usak', regionId: 'ege_bolgesi', name: 'Uşak', GeoPoint: [38.6823, 29.4082], description: 'Uşak, tarhanası ve geleneksel Ege iç bölge yemekleriyle tanınır.' },
  { id: 'van', regionId: 'dogu_anadolu_bolgesi', name: 'Van', GeoPoint: [38.5012, 43.3729], description: 'Van, kahvaltısı, otlu peyniri ve Doğu Anadolu mutfağıyla bilinir.' },
  { id: 'yozgat', regionId: 'ic_anadolu_bolgesi', name: 'Yozgat', GeoPoint: [39.8181, 34.8147], description: 'Yozgat, testi kebabı ve İç Anadolu yemekleriyle tanınır.' },
  { id: 'zonguldak', regionId: 'karadeniz_bolgesi', name: 'Zonguldak', GeoPoint: [41.4564, 31.7987], description: 'Zonguldak, kömür kenti kültürüyle şekillenen Karadeniz yemekleriyle bilinir.' },
  { id: 'aksaray', regionId: 'ic_anadolu_bolgesi', name: 'Aksaray', GeoPoint: [38.3687, 34.0370], description: 'Aksaray, tahinli pidesi ve İç Anadolu mutfağıyla öne çıkar.' },
  { id: 'bayburt', regionId: 'karadeniz_bolgesi', name: 'Bayburt', GeoPoint: [40.2552, 40.2249], description: 'Bayburt, lor dolması ve geleneksel Karadeniz iç bölge lezzetleriyle tanınır.' },
  { id: 'karaman', regionId: 'ic_anadolu_bolgesi', name: 'Karaman', GeoPoint: [37.1759, 33.2287], description: 'Karaman, tahıl yemekleri ve İç Anadolu mutfağıyla bilinir.' },
  { id: 'kirikkale', regionId: 'ic_anadolu_bolgesi', name: 'Kırıkkale', GeoPoint: [39.8468, 33.5153], description: 'Kırıkkale, İç Anadolu mutfağının sade ve doyurucu yemekleriyle tanınır.' },
  { id: 'batman', regionId: 'guneydogu_anadolu_bolgesi', name: 'Batman', GeoPoint: [37.8812, 41.1351], description: 'Batman, etli yemekleri ve Güneydoğu Anadolu mutfağıyla bilinir.' },
  { id: 'sirnak', regionId: 'guneydogu_anadolu_bolgesi', name: 'Şırnak', GeoPoint: [37.4187, 42.4918], description: 'Şırnak, geleneksel et ve tahıl yemekleriyle Güneydoğu mutfağını yansıtır.' },
  { id: 'bartin', regionId: 'karadeniz_bolgesi', name: 'Bartın', GeoPoint: [41.5811, 32.4610], description: 'Bartın, pumpum çorbası ve Karadeniz kıyı mutfağıyla bilinir.' },
  { id: 'ardahan', regionId: 'dogu_anadolu_bolgesi', name: 'Ardahan', GeoPoint: [41.1105, 42.7022], description: 'Ardahan, kaşarı, balı ve yüksek yayla mutfağıyla tanınır.' },
  { id: 'igdir', regionId: 'dogu_anadolu_bolgesi', name: 'Iğdır', GeoPoint: [39.9167, 44.0333], description: 'Iğdır, Doğu Anadolu ve Kafkas mutfak etkilerini taşıyan lezzetleriyle bilinir.' },
  { id: 'yalova', regionId: 'marmara_bolgesi', name: 'Yalova', GeoPoint: [40.6500, 29.2667], description: 'Yalova, Marmara mutfağının kıyı ve göçmen etkilerini taşıyan lezzetleriyle bilinir.' },
  { id: 'karabuk', regionId: 'karadeniz_bolgesi', name: 'Karabük', GeoPoint: [41.2061, 32.6204], description: 'Karabük, Safranbolu lokumu ve Karadeniz iç bölge mutfağıyla tanınır.' },
  { id: 'kilis', regionId: 'guneydogu_anadolu_bolgesi', name: 'Kilis', GeoPoint: [36.7184, 37.1212], description: 'Kilis, tava yemekleri, baharatları ve Güneydoğu mutfağıyla öne çıkar.' },
  { id: 'osmaniye', regionId: 'akdeniz_bolgesi', name: 'Osmaniye', GeoPoint: [37.0742, 36.2478], description: 'Osmaniye, yer fıstığı ve Akdeniz_Güneydoğu geçiş mutfağıyla bilinir.' },
  { id: 'duzce', regionId: 'karadeniz_bolgesi', name: 'Düzce', GeoPoint: [40.8438, 31.1565], description: 'Düzce, Karadeniz ve Kafkas etkilerini taşıyan yöresel yemekleriyle tanınır.' },
];

const foods = [
  { id: 'adana_kebabi', cityId: 'adana', name: 'Adana Kebabı', description: 'Zırhla çekilen kıyma, acı biber ve baharatlarla hazırlanan Adana mutfağının simge lezzeti.' },
  { id: 'adiyaman_cig_koftesi', cityId: 'adiyaman', name: 'Adıyaman Çiğ Köftesi', description: 'İsot, bulgur ve baharatlarla yoğrulan geleneksel Güneydoğu lezzeti.' },
  { id: 'afyon_kaymagi', cityId: 'afyonkarahisar', name: 'Afyon Kaymağı', description: 'Manda sütünden yapılan, Afyonkarahisar ile özdeşleşmiş yoğun ve kremamsı lezzet.' },
  { id: 'abdigor_koftesi', cityId: 'agri', name: 'Abdigör Köftesi', description: 'Dövülmüş etle hazırlanan, Ağrı mutfağının özel ve geleneksel köftesi.' },
  { id: 'amasya_coregi', cityId: 'amasya', name: 'Amasya Çöreği', description: 'Cevizli ve baharatlı iç harcıyla hazırlanan Amasya yöresine ait çörek.' },
  { id: 'ankara_tava', cityId: 'ankara', name: 'Ankara Tava', description: 'Et, arpa şehriye ve baharatlarla hazırlanan İç Anadolu mutfağının doyurucu yemeği.' },
  { id: 'antalya_piyazi', cityId: 'antalya', name: 'Antalya Piyazı', description: 'Tahinli sosla hazırlanan, Antalya mutfağının en bilinen yöresel mezelerinden biri.' },
  { id: 'hamsili_ekmek', cityId: 'artvin', name: 'Hamsili Ekmek', description: 'Mısır unu, hamsi ve yeşilliklerle hazırlanan Karadeniz mutfağı lezzeti.' },
  { id: 'incir_tatlisi', cityId: 'aydin', name: 'İncir Tatlısı', description: 'Aydın inciriyle hazırlanan hafif ve aromatik yöresel tatlı.' },
  { id: 'hosmerim', cityId: 'balikesir', name: 'Höşmerim', description: 'Peynir, irmik ve şekerle hazırlanan Balıkesir tatlısı.' },
  { id: 'bilecik_bozuyuk_helvasi', cityId: 'bilecik', name: 'Bozüyük Helvası', description: 'Bilecik yöresinde bilinen geleneksel helva çeşidi.' },
  { id: 'bingol_sorina_pel', cityId: 'bingol', name: 'Sorina Pel', description: 'Yufka, yoğurt ve tereyağıyla hazırlanan Bingöl mutfağına ait yöresel yemek.' },
  { id: 'bitlis_buryan_kebabi', cityId: 'bitlis', name: 'Büryan Kebabı', description: 'Kuyu tandırında pişirilen, Bitlis mutfağının en ünlü et yemeği.' },
  { id: 'mengen_pilavi', cityId: 'bolu', name: 'Mengen Pilavı', description: 'Et, mantar ve baharatlarla zenginleşen Bolu_Mengen mutfağı lezzeti.' },
  { id: 'burdur_sis', cityId: 'burdur', name: 'Burdur Şiş', description: 'Az baharatlı kıymadan hazırlanan, Burdur ile özdeşleşmiş şiş köfte.' },
  { id: 'iskender_kebap', cityId: 'bursa', name: 'İskender Kebap', description: 'Döner eti, pide, tereyağı ve yoğurtla servis edilen Bursa klasiği.' },
  { id: 'peynir_helvasi', cityId: 'canakkale', name: 'Peynir Helvası', description: 'Taze peynirle yapılan, Çanakkale ve çevresinde sevilen tatlı.' },
  { id: 'cankiri_yaren_guveci', cityId: 'cankiri', name: 'Yaren Güveci', description: 'Et ve sebzelerle hazırlanan Çankırı mutfağının geleneksel güveç yemeği.' },
  { id: 'corum_leblebisi', cityId: 'corum', name: 'Çorum Leblebisi', description: 'Çorum ile özdeşleşmiş, kavrulmuş nohuttan yapılan meşhur atıştırmalık.' },
  { id: 'denizli_kebabi', cityId: 'denizli', name: 'Denizli Kebabı', description: 'Kuzu etiyle hazırlanan, tandırda pişirilen Denizli yöresel kebabı.' },
  { id: 'kaburga_dolmasi', cityId: 'diyarbakir', name: 'Kaburga Dolması', description: 'İç pilavla doldurulan kaburganın uzun süre pişirilmesiyle hazırlanan özel yemek.' },
  { id: 'edirne_tava_cigeri', cityId: 'edirne', name: 'Edirne Tava Ciğeri', description: 'İnce doğranmış ciğerin kızartılmasıyla hazırlanan Edirne mutfağı klasiği.' },
  { id: 'harput_koftesi', cityId: 'elazig', name: 'Harput Köftesi', description: 'Bulgur ve kıymayla hazırlanan, Elazığ_Harput mutfağının yöresel köftesi.' },
  { id: 'erzincan_tulum_peyniri', cityId: 'erzincan', name: 'Erzincan Tulum Peyniri', description: 'Koyun sütünden yapılan, keskin aromalı Erzincan peyniri.' },
  { id: 'cag_kebabi', cityId: 'erzurum', name: 'Cağ Kebabı', description: 'Yatay şişte pişirilen kuzu etiyle hazırlanan Erzurum mutfağının simgesi.' },
  { id: 'ciborek', cityId: 'eskisehir', name: 'Çibörek', description: 'Kıymalı iç harçla doldurulup kızartılan Eskişehir mutfağı lezzeti.' },
  { id: 'gaziantep_baklavasi', cityId: 'gaziantep', name: 'Gaziantep Baklavası', description: 'Antep fıstığı ve ince yufkayla hazırlanan dünyaca bilinen tatlı.' },
  { id: 'karalahana_corbasi', cityId: 'giresun', name: 'Karalahana Çorbası', description: 'Karalahana, mısır ve fasulyeyle hazırlanan geleneksel Karadeniz çorbası.' },
  { id: 'pestil_kome', cityId: 'gumushane', name: 'Pestil Köme', description: 'Dut pekmezi ve cevizle hazırlanan Gümüşhane yöresel tatlısı.' },
  { id: 'hakkari_doleme', cityId: 'hakkari', name: 'Döleme', description: 'Hakkari yöresinde yapılan geleneksel etli ve tahıllı yemek.' },
  { id: 'hatay_kunefesi', cityId: 'hatay', name: 'Hatay Künefesi', description: 'Kadayıf, peynir ve şerbetle hazırlanan Hatay mutfağının en bilinen tatlısı.' },
  { id: 'kabune_pilavi', cityId: 'isparta', name: 'Kabune Pilavı', description: 'Et, nohut ve pirinçle hazırlanan Isparta yöresel pilavı.' },
  { id: 'mersin_tantuni', cityId: 'mersin', name: 'Tantuni', description: 'Sacda pişirilen etin lavaş içinde servis edildiği Mersin sokak lezzeti.' },
  { id: 'sultanahmet_koftesi', cityId: 'istanbul', name: 'Sultanahmet Köftesi', description: 'İstanbul ile özdeşleşen, baharat dengesiyle bilinen klasik köfte.' },
  { id: 'izmir_boyozu', cityId: 'izmir', name: 'Boyoz', description: 'İzmir kahvaltılarının simgesi olan katmerli hamur işi.' },
  { id: 'kars_kazi', cityId: 'kars', name: 'Kars Kazı', description: 'Kış aylarında hazırlanan, Kars mutfağının geleneksel et yemeği.' },
  { id: 'kastamonu_pastirmasi', cityId: 'kastamonu', name: 'Kastamonu Pastırması', description: 'Kurutulmuş ve baharatlanmış etten yapılan Kastamonu lezzeti.' },
  { id: 'kayseri_mantisi', cityId: 'kayseri', name: 'Kayseri Mantısı', description: 'Küçük hamur parçalarına kıyma konularak hazırlanan Kayseri klasiği.' },
  { id: 'kirklareli_hardaliye', cityId: 'kirklareli', name: 'Hardaliye', description: 'Üzüm ve hardal tohumu ile yapılan geleneksel Trakya içeceği.' },
  { id: 'kirsehir_tandir', cityId: 'kirsehir', name: 'Kırşehir Tandırı', description: 'Tandırda ağır ağır pişirilen etle hazırlanan yöresel yemek.' },
  { id: 'kocaeli_pismaniyesi', cityId: 'kocaeli', name: 'Pişmaniye', description: 'Tel tel ayrılan şekerli dokusuyla Kocaeli ile özdeşleşmiş tatlı.' },
  { id: 'konya_etli_ekmek', cityId: 'konya', name: 'Etli Ekmek', description: 'İnce hamur üzerinde kıymalı harçla hazırlanan Konya lezzeti.' },
  { id: 'kutahya_cimcik', cityId: 'kutahya', name: 'Cimcik Aşı', description: 'Küçük hamur parçaları ve yoğurtla hazırlanan Kütahya yemeği.' },
  { id: 'malatya_kayisisi', cityId: 'malatya', name: 'Malatya Kayısısı', description: 'Malatya ile özdeşleşmiş, taze ve kuru tüketilen meyve.' },
  { id: 'manisa_kebabi', cityId: 'manisa', name: 'Manisa Kebabı', description: 'Köfte, pide, yoğurt ve sosla servis edilen Manisa yöresel yemeği.' },
  { id: 'maras_dondurmasi', cityId: 'kahramanmaras', name: 'Maraş Dondurması', description: 'Salep ve keçi sütüyle yapılan elastik yapılı Kahramanmaraş tatlısı.' },
  { id: 'mardin_ikbebet', cityId: 'mardin', name: 'İkbebet', description: 'İçli köfteye benzeyen, Mardin mutfağına özgü baharatlı yöresel yemek.' },
  { id: 'mugla_keskegi', cityId: 'mugla', name: 'Keşkek', description: 'Buğday ve etle hazırlanan, Muğla düğün mutfağında da yer alan yemek.' },
  { id: 'mus_hezel_dolmasi', cityId: 'mus', name: 'Hez Dolması', description: 'Muş yöresinde hazırlanan geleneksel dolma çeşidi.' },
  { id: 'testi_kebabi', cityId: 'nevsehir', name: 'Testi Kebabı', description: 'Toprak testi içinde pişirilen Kapadokya mutfağı lezzeti.' },
  { id: 'nigde_gazozu', cityId: 'nigde', name: 'Niğde Gazozu', description: 'Niğde ile özdeşleşmiş geleneksel gazoz.' },
  { id: 'ordu_pancar_corbasi', cityId: 'ordu', name: 'Pancar Çorbası', description: 'Karalahana ve mısırla hazırlanan Ordu yöresel çorbası.' },
  { id: 'rize_muhlamasi', cityId: 'rize', name: 'Muhlama', description: 'Mısır unu, tereyağı ve peynirle hazırlanan Karadeniz lezzeti.' },
  { id: 'islama_kofte', cityId: 'sakarya', name: 'Islama Köfte', description: 'Kemik suyu ile ıslatılmış ekmek üzerinde servis edilen Sakarya köftesi.' },
  { id: 'samsun_pidesi', cityId: 'samsun', name: 'Samsun Pidesi', description: 'Kapalı ya da açık hazırlanan, Samsun ile özdeşleşmiş pide çeşidi.' },
  { id: 'siirt_perde_pilavi', cityId: 'siirt', name: 'Perde Pilavı', description: 'Hamur kaplaması içinde tavuklu ve bademli pilavla hazırlanan Siirt yemeği.' },
  { id: 'sinop_mantisi', cityId: 'sinop', name: 'Sinop Mantısı', description: 'Ceviz ve yoğurtla servis edilen Sinop yöresel mantısı.' },
  { id: 'sivas_koftesi', cityId: 'sivas', name: 'Sivas Köftesi', description: 'Az malzemeli, et tadını öne çıkaran Sivas yöresel köftesi.' },
  { id: 'tekirdag_koftesi', cityId: 'tekirdag', name: 'Tekirdağ Köftesi', description: 'Özel baharat karışımıyla hazırlanan Trakya mutfağı köftesi.' },
  { id: 'tokat_kebabi', cityId: 'tokat', name: 'Tokat Kebabı', description: 'Et ve sebzelerin özel ocakta pişirilmesiyle hazırlanan yöresel kebap.' },
  { id: 'akcabat_koftesi', cityId: 'trabzon', name: 'Akçaabat Köftesi', description: 'Trabzon Akçaabat ile özdeşleşmiş sade ve lezzetli köfte.' },
  { id: 'tunceli_sirekurt', cityId: 'tunceli', name: 'Şirekurt', description: 'Tunceli yöresine ait geleneksel tatlı ve hamur işi lezzeti.' },
  { id: 'urfa_kebabi', cityId: 'sanliurfa', name: 'Urfa Kebabı', description: 'Acısı dengeli kıyma kebabı, Şanlıurfa mutfağının simge yemeklerinden biridir.' },
  { id: 'usak_tarhanasi', cityId: 'usak', name: 'Uşak Tarhanası', description: 'Yoğurt, un ve sebzelerle hazırlanan geleneksel Uşak çorbalığı.' },
  { id: 'van_kahvaltisi', cityId: 'van', name: 'Van Kahvaltısı', description: 'Otlu peynir, bal, kaymak ve yöresel ürünlerle zenginleşen kahvaltı kültürü.' },
  { id: 'yozgat_testi_kebabi', cityId: 'yozgat', name: 'Yozgat Testi Kebabı', description: 'Toprak testi içinde ağır ağır pişen et yemeği.' },
  { id: 'zonguldak_mancar', cityId: 'zonguldak', name: 'Mancar Yemeği', description: 'Karadeniz otlarıyla hazırlanan Zonguldak yöresel yemeği.' },
  { id: 'aksaray_tahinli_pide', cityId: 'aksaray', name: 'Tahinli Pide', description: 'Tahinli iç harçla hazırlanan Aksaray yöresel hamur işi.' },
  { id: 'bayburt_lor_dolmasi', cityId: 'bayburt', name: 'Lor Dolması', description: 'Pazı yaprağı ve lorla hazırlanan Bayburt mutfağı lezzeti.' },
  { id: 'karaman_callama', cityId: 'karaman', name: 'Çullama', description: 'Karaman yöresinde yapılan geleneksel tavuklu ve hamurlu yemek.' },
  { id: 'kirikkale_sizgit', cityId: 'kirikkale', name: 'Sızgıt', description: 'Etin kavrulup saklanmasıyla hazırlanan İç Anadolu lezzeti.' },
  { id: 'batman_icli_kofte', cityId: 'batman', name: 'İçli Köfte', description: 'Bulgur kabuğu ve baharatlı iç harçla hazırlanan Güneydoğu lezzeti.' },
  { id: 'sirnak_serbidev', cityId: 'sirnak', name: 'Serbidev', description: 'Şırnak yöresine ait geleneksel hamur işi lezzeti.' },
  { id: 'bartin_pumpum_corbasi', cityId: 'bartin', name: 'Pumpum Çorbası', description: 'Mısır unu ve yöresel malzemelerle hazırlanan Bartın çorbası.' },
  { id: 'ardahan_kasari', cityId: 'ardahan', name: 'Ardahan Kaşarı', description: 'Yayla sütlerinden yapılan, Ardahan ile özdeşleşmiş peynir.' },
  { id: 'igdir_bozbas', cityId: 'igdir', name: 'Bozbaş', description: 'Et ve nohutla hazırlanan, Iğdır mutfağında bilinen geleneksel yemek.' },
  { id: 'yalova_sutlusu', cityId: 'yalova', name: 'Yalova Sütlüsü', description: 'Sütlü yapısıyla hafif bir Yalova tatlısı.' },
  { id: 'safranbolu_lokumu', cityId: 'karabuk', name: 'Safranbolu Lokumu', description: 'Karabük Safranbolu ile özdeşleşmiş geleneksel lokum.' },
  { id: 'kilis_tava', cityId: 'kilis', name: 'Kilis Tava', description: 'Kıymalı harcın tepside sebzelerle pişirilmesiyle hazırlanan yöresel yemek.' },
  { id: 'osmaniye_fistigi', cityId: 'osmaniye', name: 'Osmaniye Yer Fıstığı', description: 'Osmaniye ile özdeşleşmiş, atıştırmalık ve tatlılarda kullanılan ürün.' },
  { id: 'duzce_mamursa', cityId: 'duzce', name: 'Mamursa', description: 'Mısır unu ve peynirle hazırlanan Düzce yöresel lezzeti.' },
].map((food) => {
  const city = cities.find((item) => item.id === food.cityId);

  return {
    ...food,
    regionId: city.regionId,
    slug: food.id,
    imageUrl: '',
    averageRating: 0,
    reviewCount: 0,
    isFeatured: true,
  };
});

const addSlugToCities = (cityList) =>
  cityList.map(({ GeoPoint: coordinates, ...city }) => {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error(`${city.id} city must have GeoPoint: [latitude, longitude].`);
    }

    return {
      ...city,
      slug: city.id,
      geoPoint: new GeoPoint(coordinates[0], coordinates[1]),
    };
  });

const chunkArray = (items, chunkSize) => {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
};

const seedCollection = async ({ db, collectionName, items, dryRun }) => {
  if (dryRun) {
    console.log(`[dry-run] ${collectionName}: ${items.length} document will be written.`);
    return;
  }

  const chunks = chunkArray(items, 450);

  for (const chunk of chunks) {
    const batch = writeBatch(db);

    chunk.forEach(({ id, ...data }) => {
      batch.set(
        doc(db, collectionName, id),
        {
          ...data,
          seededAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  console.log(`${collectionName}: ${items.length} document written.`);
};

const signInIfConfigured = async (auth) => {
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;

  if (!email || !password) {
    console.log('SEED_USER_EMAIL and SEED_USER_PASSWORD are not set. Continuing without Auth sign-in.');
    return;
  }

  await signInWithEmailAndPassword(auth, email, password);
  console.log(`Signed in as ${email}.`);
};

const main = async () => {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('-dry-run');
  const seedCities = args.has('--cities') || args.has('--all') || (!args.has('--foods') && !args.has('--cities'));
  const seedFoods = args.has('--foods') || args.has('--all') || (!args.has('--foods') && !args.has('--cities'));

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInIfConfigured(auth);

  if (seedCities) {
    await seedCollection({
      db,
      collectionName: 'cities',
      items: addSlugToCities(cities),
      dryRun,
    });
  }

  if (seedFoods) {
    await seedCollection({
      db,
      collectionName: 'foods',
      items: foods,
      dryRun,
    });
  }

  console.log('Seed completed.');
};

main().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
});
