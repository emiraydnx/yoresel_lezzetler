export const featuredGourmetReviews = [
  {
    id: 'gurme-review-1',
    userId: 'gurme-aylin',
    userName: 'Aylin Karaca',
    userTitle: 'Ege mutfağı gezgini',
    userPhotoURL: '',
    followerCount: 12840,
    foodId: 'izmir-boyozu',
    foodName: 'Boyoz',
    restaurantId: 'alsancak-dostlar-firini',
    restaurantName: 'Alsancak Dostlar Fırını',
    districtName: 'Alsancak',
    cityName: 'İzmir',
    rating: 4.8,
    comment:
      'İyi bir boyozda katmanlar elde dağılmalı ama yağ tadı baskın olmamalı. İzmir sokak fırınlarında bu denge hâlâ çok güçlü.',
    replyCount: 18,
    replies: [
      {
        id: 'reply-1',
        userName: 'Mert Şahin',
        userPhotoURL: '',
        comment: 'Alsancak tarafında sabah erken saatte denemek gerçekten fark ettiriyor.',
      },
      {
        id: 'reply-2',
        userName: 'Derya Öz',
        userPhotoURL: '',
        comment: 'Yanında haşlanmış yumurta ve çayla tam İzmir klasiği.',
      },
    ],
  },
  {
    id: 'gurme-review-2',
    userId: 'gurme-cem',
    userName: 'Cem Altun',
    userTitle: 'Kebap ve ocakbaşı yazarı',
    userPhotoURL: '',
    followerCount: 21400,
    foodId: 'cag-kebabi',
    foodName: 'Cağ Kebabı',
    restaurantId: 'erzurum-koc-cag-kebap',
    restaurantName: 'Koç Cağ Kebap',
    districtName: 'Yakutiye',
    cityName: 'Erzurum',
    rating: 4.9,
    comment:
      'Cağ kebabında asıl fark etin terbiyesinde ve ateşe yakınlığında ortaya çıkıyor. Dışı hafif çıtır, içi sulu kaldığında lezzet zirveye çıkıyor.',
    replyCount: 31,
    replies: [
      {
        id: 'reply-3',
        userName: 'Seda Demir',
        userPhotoURL: '',
        comment: 'Erzurumda yanında lavaş ve soğanla servis edildiğinde çok daha iyi oluyor.',
      },
    ],
  },
  {
    id: 'gurme-review-3',
    userId: 'gurme-deniz',
    userName: 'Deniz Uslu',
    userTitle: 'Tatlı ve fırın lezzetleri editörü',
    userPhotoURL: '',
    followerCount: 17650,
    foodId: 'gaziantep-baklavasi',
    foodName: 'Gaziantep Baklavası',
    restaurantId: 'imam-cagdas-gaziantep',
    restaurantName: 'İmam Çağdaş',
    districtName: 'Şahinbey',
    cityName: 'Gaziantep',
    rating: 5,
    comment:
      'Baklavada iyi fıstık kokusu daha tabağa yaklaşmadan hissedilmeli. Şerbet dengesi doğruysa tatlı yormaz, ikinci dilimi istemek kaçınılmaz olur.',
    replyCount: 44,
    replies: [
      {
        id: 'reply-4',
        userName: 'Burak Kaya',
        userPhotoURL: '',
        comment: 'Fıstığın tazeliği bence de bütün deneyimi değiştiriyor.',
      },
      {
        id: 'reply-5',
        userName: 'Nisan Er',
        userPhotoURL: '',
        comment: 'Soğuk baklava değil, klasik baklavada bu dengeyi bulmak daha zor.',
      },
    ],
  },
];

export const getFeaturedGourmetReview = (reviewId) =>
  featuredGourmetReviews.find((review) => review.id === reviewId);

export const getFeaturedGourmetUser = (userId) =>
  featuredGourmetReviews.find((review) => review.userId === userId);
