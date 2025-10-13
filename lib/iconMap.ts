import {
  Car,
  Smartphone,
  Shirt,
  Wine,
  Footprints,
  BookOpen,
  Baby,
  Home,
  Watch,
  Dumbbell,
  Palette,
  ShieldCheck,
  BadgeCheck,
  Truck,
  Headphones,
  Flame,
  Radio,
  TrendingUp,
  Clock3,
  Star,
  Globe,
  UserRound,
  LogIn,
  Heart,
  Bell,
  MessageCircle,
  ShoppingCart,
  Search,
  MoreHorizontal,
} from 'lucide-react';

// Category to icon mapping
export const categoryIcons = {
  'Auto': Car,
  'Téléphones': Smartphone,
  'Femmes': Shirt,
  'Vins': Wine,
  'Chaussures': Footprints,
  'Livres': BookOpen,
  'Vêtements': Shirt,
  'Bébé': Baby,
  'Maison': Home,
  'Montres': Watch,
  'Sport': Dumbbell,
  'Art': Palette,
} as const;

// Feature icons
export const featureIcons = {
  'secure': ShieldCheck,
  'verified': BadgeCheck,
  'shipping': Truck,
  'support': Headphones,
} as const;

// Badge icons
export const badgeIcons = {
  'hot': Flame,
  'live': Radio,
  'trending': TrendingUp,
  'verified': BadgeCheck,
} as const;

// UI icons
export const uiIcons = {
  'clock': Clock3,
  'star': Star,
  'globe': Globe,
  'user': UserRound,
  'login': LogIn,
  'heart': Heart,
  'bell': Bell,
  'message': MessageCircle,
  'cart': ShoppingCart,
  'search': Search,
  'more': MoreHorizontal,
} as const;

export type CategoryKey = keyof typeof categoryIcons;
export type FeatureKey = keyof typeof featureIcons;
export type BadgeKey = keyof typeof badgeIcons;
export type UIKey = keyof typeof uiIcons;