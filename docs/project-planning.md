# Yöresel Lezzetler Web Sitesi Planlama Dokümanı

Bu doküman projenin ilk mimari rehberidir. Amaç, geliştirmeye başlamadan önce kullanıcı akışlarını, veri modelini, sistem mimarisini, sayfa yapısını, SEO hedeflerini ve sınıf/bileşen ilişkilerini netleştirmektir.

## Kullanılacak Araçlar ve Nedenleri

### React

React, arayüzü küçük ve tekrar kullanılabilir component'lere bölmemizi sağlar. Bu projede `TurkeyMap`, `FoodCard`, `RestaurantMap`, `ReviewForm`, `Navbar`, `Footer` gibi parçalar React component'i olarak geliştirilecek.

Kullanım mantığı:

- Sayfalar `src/pages` altında tutulur.
- Ortak parçalar `src/components` altında tutulur.
- Veriyi Firestore'dan almak için özel hook'lar kullanılır: `useFoods`, `useRestaurants`, `useReviews`.

### Tailwind CSS

Tailwind, CSS class'ları ile hızlı ve tutarlı tasarım yapmamızı sağlar. Örneğin `flex`, `grid`, `rounded`, `text-sm`, `bg-white`, `shadow` gibi class'lar doğrudan JSX içinde kullanılır.

Bu projede Tailwind:

- Harita üzeri tooltip tasarımlarında,
- Kart listelerinde,
- Giriş/kayıt formlarında,
- Admin panel tablolarında kullanılacak.

### react-simple-maps

Türkiye haritasını SVG tabanlı çizmek ve bölgeleri renklendirmek için kullanılacak. SVG harita üzerinde her şehir veya bölge tıklanabilir alan gibi davranabilir.

Bu projedeki görevi:

- Türkiye haritasını göstermek,
- 7 coğrafi bölgeyi farklı renklendirmek,
- Bölge seçilince zoom hissi vermek,
- Bölgeye ait şehirleri etkileşimli hale getirmek.

### Leaflet.js ve React Leaflet

Leaflet, gerçek harita üzerinde restoran konumlarını pin ile göstermek için kullanılacak. `react-simple-maps` Türkiye'nin seçim haritası için, Leaflet ise restoranların gerçek koordinatlı haritası için daha uygundur.

Bu projedeki görevi:

- Şehir detayında restoran pinlerini göstermek,
- Restoran puanı, yorum sayısı ve adres bilgisini popup içinde göstermek,
- Kullanıcıyı restoran detayına yönlendirmek.

### Firebase Auth

Kullanıcı kayıt ve giriş işlemlerini yönetir. E-posta/şifre ile kayıt, giriş, çıkış ve oturum takibi bu servis üzerinden yapılır.

Bu projedeki görevi:

- Kayıt olma,
- Giriş yapma,
- Kullanıcı oturumunu takip etme,
- Admin/kullanıcı rol ayrımını destekleme.

### Firebase Firestore

Firestore, verileri koleksiyon ve doküman mantığıyla saklayan NoSQL veritabanıdır. SQL'deki tablo yerine `regions`, `cities`, `foods`, `restaurants`, `reviews`, `users` gibi koleksiyonlar kullanılır.

Bu projedeki görevi:

- Bölgeleri, şehirleri, lezzetleri, restoranları ve yorumları saklamak,
- Ana sayfadaki en sevilen lezzetleri ve en yüksek puanlı restoranları listelemek,
- Admin panelinde verileri yönetmek.

### Firebase Cloud Functions

Cloud Functions, kullanıcıya doğrudan vermememiz gereken güvenli işlemleri backend tarafında çalıştırır.

Bu projedeki görevi:

- Kullanıcı rolü atamak,
- Admin yetkisini güvenli şekilde kontrol etmek,
- Puan ortalamalarını otomatik güncellemek,
- Yorum eklendiğinde restoran/lezzet istatistiklerini hesaplamak.

### Vercel

React frontend'i yayınlamak için kullanılacak hosting servisidir. Firebase backend servisleri ayrı çalışır, Vercel ise kullanıcıya görünen web sitesini yayınlar.

## Önerilen Proje Dosya Dizini

Mevcut dizin bu mimariye yakındır. Geliştirme ilerledikçe aşağıdaki yapı korunabilir.

```text
yoresel_lezzetler/
  public/
    maps/
      turkey-topojson.json
    images/
  src/
    components/
      food/
        FoodCard.jsx
        FoodTooltip.jsx
      home/
        HeroBanner.jsx
        RecentReviews.jsx
        TopFoods.jsx
        TopRestaurants.jsx
      map/
        TurkeyMap.jsx
        RegionLayer.jsx
        CityLayer.jsx
        RestaurantMap.jsx
      restaurant/
        RestaurantCard.jsx
        RestaurantPin.jsx
        ReviewCard.jsx
      UI/
        LoadingSpinner.jsx
        ReviewForm.jsx
        StarRating.jsx
      Navbar.jsx
      Footer.jsx
      ProtectedRoute.jsx
    context/
      AuthContext.jsx
    firebase/
      config.js
      auth.js
      firestore.js
    hooks/
      useRegions.js
      useFoods.js
      useRestaurants.js
      useReviews.js
    pages/
      HomePage.jsx
      RegionPage.jsx
      CityPage.jsx
      FoodDetailPage.jsx
      RestaurantPage.jsx
      LoginPage.jsx
      RegisterPage.jsx
      admin/
        AdminPage.jsx
        AdminUsers.jsx
        AdminFoods.jsx
        AdminRestaurants.jsx
        AdminReviews.jsx
    routes/
      AppRoutes.jsx
    App.jsx
    index.js
  functions/
    index.js
    package.json
  docs/
    project-planning.md
```


## 1. User Flows

### Ziyaretçi Ana Akışı

```mermaid
flowchart TD
  A["Kullanıcı ana sayfaya gelir"] --> B["Türkiye haritasını görür"]
  B --> C["7 bölgeden birini seçer"]
  C --> D["Seçilen bölge zoom efektiyle öne çıkar"]
  D --> E["Bölgedeki şehirler gösterilir"]
  E --> F["Şehir üstüne imleç getirir"]
  F --> G["Popüler lezzetler, puanlar ve yorum özetleri görünür"]
  E --> H["Şehre tıklar"]
  H --> I["Şehir detay sayfasına gider"]
  I --> J["En yüksek puanlı restoranlar Leaflet haritasında görünür"]
  J --> K["Restoran detayına gider"]
```

### Kayıt ve Giriş Akışı

```mermaid
flowchart TD
  A["Kullanıcı yorum yapmak ister"] --> B{"Oturum açık mı?"}
  B -- "Evet" --> C["Yorum ve puan formu açılır"]
  B -- "Hayır" --> D["Giriş sayfasına yönlendirilir"]
  D --> E{"Hesabı var mı?"}
  E -- "Evet" --> F["Giriş yapar"]
  E -- "Hayır" --> G["Kayıt olur"]
  G --> H["Firebase Auth kullanıcı oluşturur"]
  H --> I["Firestore users dokümanı oluşturulur"]
  F --> C
  I --> C
  C --> J["Yorum Firestore'a kaydedilir"]
  J --> K["Cloud Function puan ortalamasını günceller"]
```

### Şehir ve Restoran Keşif Akışı

```mermaid
flowchart TD
  A["Bölge sayfası"] --> B["Şehir listesi ve şehir tooltipleri"]
  B --> C["Şehir seçimi"]
  C --> D["CityPage açılır"]
  D --> E["Restoran listesi"]
  D --> F["Leaflet restoran haritası"]
  E --> G["Restoran kartı seçilir"]
  F --> G
  G --> H["RestaurantPage açılır"]
  H --> I["Adres, puan, yorumlar, öne çıkan lezzetler"]
  H --> J["Yorum yaz / puan ver"]
```

### Admin Akışı

```mermaid
flowchart TD
  A["Admin giriş yapar"] --> B["Firebase Auth oturumu açılır"]
  B --> C["Custom claim veya users.role kontrol edilir"]
  C --> D{"Rol admin mi?"}
  D -- "Hayır" --> E["Yetkisiz erişim ekranı"]
  D -- "Evet" --> F["Admin panel açılır"]
  F --> G["Kullanıcıları görüntüle"]
  F --> H["Lezzetleri yönet"]
  F --> I["Restoranları yönet"]
  F --> J["Yorumları denetle"]
  H --> K["Firestore foods koleksiyonu güncellenir"]
  I --> L["Firestore restaurants koleksiyonu güncellenir"]
  J --> M["Yorum onaylanır, gizlenir veya silinir"]
```

## 2. ERD ve System Architecture Diagrams

Firestore NoSQL olduğu için bu ERD fiziksel SQL şeması değildir. İlişkileri anlamak için mantıksal model olarak kullanılmalıdır.

### Firestore Mantıksal ERD

```mermaid
erDiagram
  USERS {
    string id PK
    string displayName
    string email
    string role
    timestamp createdAt
    string photoURL
  }

  REGIONS {
    string id PK
    string name
    string slug
    string color
    string description
  }

  CITIES {
    string id PK
    string regionId FK
    string name
    string slug
    number latitude
    number longitude
    string description
  }

  FOODS {
    string id PK
    string cityId FK
    string regionId FK
    string name
    string slug
    string description
    string imageUrl
    number averageRating
    number reviewCount
    boolean isFeatured
  }

  RESTAURANTS {
    string id PK
    string cityId FK
    string name
    string slug
    string address
    number latitude
    number longitude
    number averageRating
    number reviewCount
    boolean isFeatured
  }

  RESTAURANT_FOODS {
    string id PK
    string restaurantId FK
    string foodId FK
  }

  REVIEWS {
    string id PK
    string userId FK
    string targetType
    string targetId
    number rating
    string comment
    string status
    timestamp createdAt
  }

  REGIONS ||--o{ CITIES : contains
  CITIES ||--o{ FOODS : has
  CITIES ||--o{ RESTAURANTS : has
  RESTAURANTS ||--o{ RESTAURANT_FOODS : serves
  FOODS ||--o{ RESTAURANT_FOODS : served_at
  USERS ||--o{ REVIEWS : writes
```

### Firestore Koleksiyon Planı

```text
regions/{regionId}
  name, slug, color, description

cities/{cityId}
  regionId, name, slug, latitude, longitude, description

foods/{foodId}
  cityId, regionId, name, slug, description, imageUrl,
  averageRating, reviewCount, isFeatured

restaurants/{restaurantId}
  cityId, name, slug, address, latitude, longitude,
  averageRating, reviewCount, isFeatured

restaurantFoods/{restaurantFoodId}
  restaurantId, foodId

reviews/{reviewId}
  userId, targetType, targetId, rating, comment, status, createdAt

users/{userId}
  displayName, email, role, photoURL, createdAt
```

`targetType` değeri `food` veya `restaurant` olabilir. Böylece aynı `reviews` koleksiyonu hem lezzet hem restoran yorumlarını taşıyabilir.

### System Architecture Diagram

```mermaid
flowchart LR
  U["Kullanıcı Tarayıcısı"] --> V["Vercel Hosting"]
  V --> R["React App"]

  R --> A["Firebase Auth"]
  R --> F["Firestore Database"]
  R --> M1["react-simple-maps Türkiye Haritası"]
  R --> M2["Leaflet Restoran Haritası"]

  A --> C["Cloud Functions"]
  F --> C
  C --> F

  Admin["Admin Kullanıcı"] --> R
  R --> P["ProtectedRoute / Role Guard"]
  P --> AdminPanel["Admin Panel"]
  AdminPanel --> F
  AdminPanel --> C
```

### Review Ekleme Sequence Diagram

```mermaid
sequenceDiagram
  actor User as Kullanıcı
  participant React as React UI
  participant Auth as Firebase Auth
  participant Firestore as Firestore
  participant Func as Cloud Functions

  User->>React: Yorum ve puan gönderir
  React->>Auth: Oturum durumunu kontrol eder
  Auth-->>React: userId döner
  React->>Firestore: reviews koleksiyonuna kayıt ekler
  Firestore-->>Func: onCreate trigger çalışır
  Func->>Firestore: Hedef restoran/lezzet yorumlarını hesaplar
  Func->>Firestore: averageRating ve reviewCount günceller
  Firestore-->>React: Güncel veri okunur
  React-->>User: Yeni puan ve yorum gösterilir
```

### Admin Yetki Sequence Diagram

```mermaid
sequenceDiagram
  actor Admin as Admin
  participant React as React App
  participant Auth as Firebase Auth
  participant Firestore as Firestore
  participant Guard as ProtectedRoute

  Admin->>React: /admin adresine gider
  React->>Auth: Aktif kullanıcıyı ister
  Auth-->>React: Kullanıcı bilgisi döner
  React->>Firestore: users/{uid} rol bilgisini okur
  Firestore-->>React: role bilgisi döner
  React->>Guard: role === admin kontrolü
  Guard-->>Admin: Admin paneli veya yetkisiz ekranı
```

## 3. Sitemap

```mermaid
flowchart TD
  A["/"] --> B["/regions/:regionSlug"]
  B --> C["/cities/:citySlug"]
  C --> D["/restaurants/:restaurantSlug"]
  C --> E["/foods/:foodSlug"]
  A --> F["/login"]
  A --> G["/register"]
  A --> H["/top-foods"]
  A --> I["/top-restaurants"]
  A --> J["/reviews"]
  A --> K["/about"]
  A --> L["/contact"]
  A --> M["/admin"]
  M --> N["/admin/users"]
  M --> O["/admin/foods"]
  M --> P["/admin/restaurants"]
  M --> Q["/admin/reviews"]
```

### Sayfa Listesi

| Route | Sayfa | Amaç |
| --- | --- | --- |
| `/` | Ana Sayfa | Türkiye haritası, popüler lezzetler, en yüksek puanlı restoranlar, yorum önizlemeleri |
| `/regions/:regionSlug` | Bölge Sayfası | Seçilen bölgedeki şehirleri ve öne çıkan lezzetleri gösterir |
| `/cities/:citySlug` | Şehir Sayfası | Şehirdeki lezzetleri ve restoranları listeler |
| `/foods/:foodSlug` | Lezzet Detay | Lezzet açıklaması, puanlar, yorumlar, bu lezzeti sunan restoranlar |
| `/restaurants/:restaurantSlug` | Restoran Detay | Konum, puan, yorumlar, sunulan lezzetler |
| `/login` | Giriş | Firebase Auth ile giriş |
| `/register` | Kayıt | Firebase Auth ile hesap oluşturma |
| `/top-foods` | En Sevilen Lezzetler | SEO için liste sayfası |
| `/top-restaurants` | En Yüksek Puanlı Restoranlar | SEO ve keşif için liste sayfası |
| `/reviews` | Kullanıcı Yorumları | Son yorumlar ve sosyal kanıt |
| `/admin` | Admin Panel | Yönetim özeti |
| `/admin/users` | Kullanıcı Yönetimi | Kullanıcıları ve rolleri görüntüleme |
| `/admin/foods` | Lezzet Yönetimi | Lezzet ekleme/düzenleme |
| `/admin/restaurants` | Restoran Yönetimi | Restoran ekleme/düzenleme |
| `/admin/reviews` | Yorum Yönetimi | Yorum onayı, gizleme, silme |

## 4. SEO Keyword Mapping Plan

Bu plan canlı arama hacmi verisi içermez. Yayına yaklaşırken Google Keyword Planner, Google Trends ve Search Console ile doğrulama yapılmalıdır.

### Ana SEO Stratejisi

- Ana sayfa geniş anahtar kelimeleri hedefler.
- Bölge sayfaları bölgesel yemek aramalarını hedefler.
- Şehir sayfaları şehir + yöresel lezzet aramalarını hedefler.
- Lezzet detay sayfaları spesifik yemek aramalarını hedefler.
- Restoran sayfaları şehir + restoran + yemek niyetini hedefler.

### Keyword Mapping Tablosu

| Sayfa | Primary Keyword | Secondary Keywords | Search Intent | Önerilen Title |
| --- | --- | --- | --- | --- |
| `/` | yöresel lezzetler | Türkiye yöresel yemekleri, meşhur yemekler, en iyi restoranlar | Keşif | Türkiye'nin Yöresel Lezzetleri ve En İyi Restoranları |
| `/regions/karadeniz-bolgesi` | Karadeniz yöresel lezzetleri | Karadeniz yemekleri, Karadeniz restoranları | Bölgesel keşif | Karadeniz Bölgesi Yöresel Lezzetleri |
| `/regions/ege-bolgesi` | Ege yöresel lezzetleri | Ege yemekleri, Ege mutfağı | Bölgesel keşif | Ege Bölgesi Yöresel Lezzetleri |
| `/regions/marmara-bolgesi` | Marmara yöresel lezzetleri | Marmara yemekleri, Marmara restoranları | Bölgesel keşif | Marmara Bölgesi Yöresel Lezzetleri |
| `/regions/ic-anadolu-bolgesi` | İç Anadolu yöresel lezzetleri | İç Anadolu yemekleri, Ankara yöresel lezzetleri | Bölgesel keşif | İç Anadolu Bölgesi Yöresel Lezzetleri |
| `/regions/dogu-anadolu-bolgesi` | Doğu Anadolu yöresel lezzetleri | Doğu Anadolu yemekleri, Erzurum cağ kebabı | Bölgesel keşif | Doğu Anadolu Bölgesi Yöresel Lezzetleri |
| `/regions/guneydogu-anadolu-bolgesi` | Güneydoğu Anadolu yöresel lezzetleri | Gaziantep yemekleri, Şanlıurfa lezzetleri | Bölgesel keşif | Güneydoğu Anadolu Yöresel Lezzetleri |
| `/regions/akdeniz-bolgesi` | Akdeniz yöresel lezzetleri | Akdeniz yemekleri, Antalya restoranları | Bölgesel keşif | Akdeniz Bölgesi Yöresel Lezzetleri |
| `/cities/gaziantep` | Gaziantep yöresel lezzetleri | Gaziantep baklava, Antep kebabı, Gaziantep restoranları | Şehir keşfi | Gaziantep Yöresel Lezzetleri ve Restoranları |
| `/cities/erzurum` | Erzurum yöresel lezzetleri | cağ kebabı, Erzurum restoranları | Şehir keşfi | Erzurum Yöresel Lezzetleri ve Restoranları |
| `/foods/cag-kebabi` | cağ kebabı | cağ kebabı nerede yenir, Erzurum cağ kebabı | Yemek detayı | Cağ Kebabı Nerede Yenir? |
| `/restaurants/:restaurantSlug` | restoran adı | şehir restoran yorumları, restoran puanı | Yerel karar | Restoran Adı: Puan, Yorum ve Konum |
| `/top-foods` | Türkiye'nin en sevilen yemekleri | en popüler yöresel yemekler, meşhur Türk yemekleri | Liste/keşif | Türkiye'nin En Sevilen Yöresel Lezzetleri |
| `/top-restaurants` | en iyi yöresel restoranlar | en yüksek puanlı restoranlar, şehir restoranları | Liste/karar | Türkiye'nin En Yüksek Puanlı Yöresel Restoranları |

### SEO İçerik Kuralları

- Her şehir sayfasında en az 300-600 kelimelik özgün açıklama hedeflenmeli.
- Her lezzet sayfasında yemek açıklaması, şehir bağlantısı, restoran bağlantısı ve kullanıcı yorumları bulunmalı.
- Restoran sayfalarında `LocalBusiness` schema markup kullanılmalı.
- Lezzet sayfalarında `Article` veya uygun olduğunda `Recipe` schema markup düşünülebilir.
- Breadcrumb kullanılmalı: `Ana Sayfa > Bölge > Şehir > Lezzet`.
- URL'ler Türkçe karakter içermeden slug formatında olmalı: `icli-kofte`, `cag-kebabi`, `gaziantep`.

## 5. Class Diagramları

React projesinde klasik anlamda çok fazla class yazmayacağız. Modern React fonksiyon component'leri ve hook'lar ile geliştirilir. Yine de domain modelini ve component ilişkilerini class diagram gibi göstermek mimariyi anlamayı kolaylaştırır.

### Domain Model Class Diagram

```mermaid
classDiagram
  class User {
    +string id
    +string displayName
    +string email
    +string role
    +Date createdAt
    +canReview()
    +isAdmin()
  }

  class Region {
    +string id
    +string name
    +string slug
    +string color
    +getCities()
  }

  class City {
    +string id
    +string regionId
    +string name
    +string slug
    +number latitude
    +number longitude
    +getFoods()
    +getRestaurants()
  }

  class Food {
    +string id
    +string cityId
    +string regionId
    +string name
    +string slug
    +number averageRating
    +number reviewCount
    +getReviews()
  }

  class Restaurant {
    +string id
    +string cityId
    +string name
    +string slug
    +string address
    +number latitude
    +number longitude
    +number averageRating
    +number reviewCount
    +getReviews()
    +getFoods()
  }

  class Review {
    +string id
    +string userId
    +string targetType
    +string targetId
    +number rating
    +string comment
    +string status
    +Date createdAt
    +isApproved()
  }

  Region "1" --> "many" City
  City "1" --> "many" Food
  City "1" --> "many" Restaurant
  Restaurant "many" --> "many" Food
  User "1" --> "many" Review
  Review --> Food
  Review --> Restaurant
```

### React Component Diagram

```mermaid
classDiagram
  class App {
    +renders AppRoutes
    +wraps AuthProvider
  }

  class AuthContext {
    +currentUser
    +userRole
    +login()
    +register()
    +logout()
  }

  class HomePage {
    +renders TurkeyMap
    +renders TopFoods
    +renders TopRestaurants
    +renders RecentReviews
  }

  class TurkeyMap {
    +selectedRegion
    +onRegionSelect()
    +renders RegionLayer
    +renders CityLayer
  }

  class RegionPage {
    +regionSlug
    +renders CityLayer
    +renders FoodCard
  }

  class CityPage {
    +citySlug
    +renders RestaurantMap
    +renders RestaurantCard
    +renders FoodCard
  }

  class RestaurantPage {
    +restaurantSlug
    +renders RestaurantMap
    +renders ReviewCard
    +renders ReviewForm
  }

  class ProtectedRoute {
    +requiredRole
    +checks AuthContext
  }

  class AdminPage {
    +renders AdminUsers
    +renders AdminFoods
    +renders AdminRestaurants
    +renders AdminReviews
  }

  App --> AuthContext
  App --> HomePage
  HomePage --> TurkeyMap
  TurkeyMap --> RegionPage
  RegionPage --> CityPage
  CityPage --> RestaurantPage
  RestaurantPage --> ReviewForm
  App --> ProtectedRoute
  ProtectedRoute --> AdminPage
```

### Hook ve Servis İlişkileri

```mermaid
classDiagram
  class useRegions {
    +getRegions()
    +getRegionBySlug()
  }

  class useFoods {
    +getTopFoods()
    +getFoodsByCity()
    +getFoodBySlug()
  }

  class useRestaurants {
    +getTopRestaurants()
    +getRestaurantsByCity()
    +getRestaurantBySlug()
  }

  class useReviews {
    +getReviewsByTarget()
    +createReview()
  }

  class FirebaseAuthService {
    +login()
    +register()
    +logout()
    +listenAuthState()
  }

  class FirestoreService {
    +queryCollection()
    +getDocument()
    +createDocument()
    +updateDocument()
    +deleteDocument()
  }

  useRegions --> FirestoreService
  useFoods --> FirestoreService
  useRestaurants --> FirestoreService
  useReviews --> FirestoreService
  AuthContext --> FirebaseAuthService
```

## İlk Geliştirme Sırası

1. Firebase config, AuthContext ve route yapısı.
2. Firestore koleksiyon seed verileri: bölgeler, şehirler, örnek lezzetler.
3. Ana sayfa Türkiye haritası ve bölge seçimi.
4. Bölge/şehir sayfaları.
5. Restoran haritası ve restoran detayları.
6. Kayıt/giriş ve yorum formu.
7. Cloud Functions ile rol ve puan hesaplama.
8. Admin panel.
9. SEO başlıkları, meta açıklamaları, sitemap ve schema markup.

## Mini Quiz

1. `react-simple-maps` ile `Leaflet` arasındaki temel fark nedir?
2. Firestore'da neden klasik SQL tablosu yerine koleksiyon/doküman yapısı kullanıyoruz?
3. Kullanıcı yorumu eklendiğinde puan ortalamasını neden frontend'de değil Cloud Functions tarafında hesaplamak daha güvenlidir?

