// Temporary mocked data for home page - will be replaced with API calls

export interface AuctionData {
  id: string;
  title: string;
  image: string;
  currentPrice: number;
  bidCount: number;
  timeLeft: string;
  seller: {
    name: string;
    avatar: string;
    rating: number;
  };
  badges: ('hot' | 'live' | 'trending' | 'verified')[];
  status: 'ending_soon' | 'live' | 'ended';
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  image?: string;
  color: string;
}

export interface ReviewData {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  verified: boolean;
}

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
}

// Mock data
export const mockHeroSlides: HeroSlide[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=600&fit=crop&auto=format',
    title: 'Découvrez les Meilleures Enchères',
    subtitle: 'Des milliers d\'articles uniques vous attendent',
    cta: 'ENCHÉRIR',
    link: '/auctions',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop&auto=format',
    title: 'Vendez vos Objets Précieux',
    subtitle: 'Rejoignez notre communauté de vendeurs',
    cta: 'VENDRE',
    link: '/vendor/apply',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop&auto=format',
    title: 'Enchères en Direct',
    subtitle: 'Participez aux enchères en temps réel',
    cta: 'PARTICIPER',
    link: '/auctions?status=live',
  },
];

// Empty arrays - ready for new auctions
export const mockEndingSoonAuctions: AuctionData[] = [];

export const mockLiveAuctions: AuctionData[] = [];

export const mockCategories: CategoryData[] = [
  { id: '1', name: 'Auto', slug: 'auto', color: '#FF6B6B' },
  { id: '2', name: 'Téléphones', slug: 'telephones', color: '#4ECDC4' },
  { id: '3', name: 'Femmes', slug: 'femmes', color: '#45B7D1' },
  { id: '4', name: 'Vins', slug: 'vins', color: '#96CEB4' },
  { id: '5', name: 'Chaussures', slug: 'chaussures', color: '#FFEAA7' },
  { id: '6', name: 'Livres', slug: 'livres', color: '#DDA0DD' },
  { id: '7', name: 'Vêtements', slug: 'vetements', color: '#98D8C8' },
  { id: '8', name: 'Bébé', slug: 'bebe', color: '#F7DC6F' },
  { id: '9', name: 'Maison', slug: 'maison', color: '#BB8FCE' },
  { id: '10', name: 'Montres', slug: 'montres', color: '#85C1E9' },
  { id: '11', name: 'Sport', slug: 'sport', color: '#F8C471' },
  { id: '12', name: 'Art', slug: 'art', color: '#F1948A' },
];

export const mockReviews: ReviewData[] = [
  {
    id: '1',
    author: 'Sarah M.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format',
    rating: 5,
    date: '2024-01-15',
    content: 'Excellente expérience ! J\'ai trouvé exactement ce que je cherchais à un prix incroyable. Le processus d\'enchère est très fluide.',
    verified: true,
  },
  {
    id: '2',
    author: 'Ahmed K.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&auto=format',
    rating: 5,
    date: '2024-01-12',
    content: 'Service client exceptionnel et livraison rapide. Je recommande vivement Bidinsouk pour tous vos achats aux enchères.',
    verified: true,
  },
  {
    id: '3',
    author: 'Fatima L.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&auto=format',
    rating: 4,
    date: '2024-01-10',
    content: 'Très bonne plateforme avec de nombreux articles de qualité. L\'interface est intuitive et facile à utiliser.',
    verified: true,
  },
];

export const whyBidinsoukFeatures = [
  {
    icon: 'secure' as const,
    title: 'Achats sécurisés',
    description: 'Tous vos paiements sont protégés par notre système de sécurité avancé',
  },
  {
    icon: 'verified' as const,
    title: 'Vendeurs vérifiés',
    description: 'Chaque vendeur est vérifié pour garantir la qualité et l\'authenticité',
  },
  {
    icon: 'shipping' as const,
    title: 'Livraison rapide',
    description: 'Livraison express dans tout le Maroc avec suivi en temps réel',
  },
  {
    icon: 'support' as const,
    title: 'Service client',
    description: 'Support client disponible 24h/7j pour vous accompagner',
  },
];

// API-ready functions (will replace mock data)
export async function getHomepage() {
  // TODO: Replace with actual API calls
  return {
    heroSlides: mockHeroSlides,
    endingSoonAuctions: mockEndingSoonAuctions,
    liveAuctions: mockLiveAuctions,
    categories: mockCategories,
    reviews: mockReviews,
    features: whyBidinsoukFeatures,
  };
}

export async function getEndingSoonAuctions() {
  // TODO: Replace with /api/auctions?status=ending_soon
  return mockEndingSoonAuctions;
}

export async function getLiveAuctions() {
  // TODO: Replace with /api/auctions?status=live
  return mockLiveAuctions;
}

export async function getPopularCategories() {
  // TODO: Replace with /api/categories/popular
  return mockCategories;
}

export async function getVerifiedReviews() {
  // TODO: Replace with /api/reviews/verified
  return mockReviews;
}