export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isPremium: boolean;
  followers: string[];
  following: string[];
  bio?: string;
  phone?: string;
  campus?: string; // e.g. "Campus du Lac (UNIGOM)", "Campus Moïse (ULPGL)", "Campus ISTA", etc.
  faculty?: string; // e.g. "Sciences Informatiques", "Droit", "Médecine", "Économie", "Polytechnique"
  cardUrl?: string; // Student ID card photo
  createdAt?: any;
}

export interface ServiceItem {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'Service' | 'Produit';
  category: string;
  price: number; // in Congolese Francs (FC)
  status: 'actif' | 'terminé';
  deadline?: string;
  likes: number;
  ownerName: string;
  ownerPhoto?: string;
  ownerIsPremium?: boolean;
  campus?: string;
  createdAt?: any;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  serviceId: string;
  createdAt: any;
}

export interface ChatItem {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastSenderId?: string;
  updatedAt?: any;
  unreadCount?: number;
  otherUser?: UserProfile;
}

export interface MessageItem {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  read: boolean;
  createdAt: any;
}

export type ThemeType = 'dark' | 'light' | 'blue' | 'crimson' | 'violet';
export type LanguageType = 'fr' | 'en' | 'sw' | 'ln' | 'es';

export type NavTab = 'home' | 'messages' | 'publish' | 'favorites' | 'settings' | 'profile';
