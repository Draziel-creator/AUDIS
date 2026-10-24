import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Filter, Plus, Flame, GraduationCap } from 'lucide-react';
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  serverTimestamp,
  handleFirestoreError,
  OperationType 
} from '../firebase/firebase';
import { ServiceItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ServiceCard from '../components/ServiceCard';
import { seedInitialServicesIfEmpty } from '../utils/seedData';

interface HomeScreenProps {
  searchQuery: string;
  onSelectService: (serviceId: string) => void;
  onOpenPublish: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: Flame },
  { id: 'Devoir', label: 'Devoirs & TFC' },
  { id: 'Saisie', label: 'Saisie' },
  { id: 'Impression', label: 'Impression' },
  { id: 'Téléphone', label: 'Téléphone' },
  { id: 'Machine', label: 'Machine & PC' },
  { id: 'Cours', label: 'Cours & Répétition' },
  { id: 'Design', label: 'Design' },
  { id: 'Traduction', label: 'Traduction' },
  { id: 'Produits', label: 'Produits' },
  { id: 'Logement', label: 'Logement' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  searchQuery,
  onSelectService,
  onOpenPublish
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<Set<string>>(new Set());
  const [favoritesDocMap, setFavoritesDocMap] = useState<Record<string, string>>({});

  // Seed data check on initial mount
  useEffect(() => {
    seedInitialServicesIfEmpty();
  }, []);

  // Real-time listener for Services
  useEffect(() => {
    setLoading(true);
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: ServiceItem[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as ServiceItem);
        });
        setServices(items);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'services');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time listener for Favorites of current user
  useEffect(() => {
    if (!currentUser) {
      setFavoriteServiceIds(new Set());
      setFavoritesDocMap({});
      return;
    }

    const favRef = collection(db, 'favorites');
    const q = query(favRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const idSet = new Set<string>();
        const docMap: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.serviceId) {
            idSet.add(data.serviceId);
            docMap[data.serviceId] = docSnap.id;
          }
        });
        setFavoriteServiceIds(idSet);
        setFavoritesDocMap(docMap);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'favorites');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Toggle favorite function
  const handleToggleFavorite = async (serviceId: string, currentStatus: boolean) => {
    if (!currentUser) return;

    try {
      if (currentStatus) {
        // Remove favorite
        const docId = favoritesDocMap[serviceId];
        if (docId) {
          await deleteDoc(doc(db, 'favorites', docId));
        } else {
          // Fallback query
          const q = query(
            collection(db, 'favorites'),
            where('userId', '==', currentUser.uid),
            where('serviceId', '==', serviceId)
          );
          const snap = await getDocs(q);
          snap.forEach(async (d) => await deleteDoc(d.ref));
        }
      } else {
        // Add favorite
        await addDoc(collection(db, 'favorites'), {
          userId: currentUser.uid,
          serviceId: serviceId,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'favorites');
    }
  };

  // Filter items based on category and search query
  const filteredServices = services.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      item.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === 'Devoir' && item.category?.toLowerCase().includes('devoir'));

    const queryLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !queryLower ||
      item.title?.toLowerCase().includes(queryLower) ||
      item.description?.toLowerCase().includes(queryLower) ||
      item.category?.toLowerCase().includes(queryLower) ||
      item.ownerName?.toLowerCase().includes(queryLower);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 w-full max-w-md mx-auto pb-28">
      {/* Title "Pour vous" bold like TikTok For You */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            <span>{t.forYou}</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          </h1>
          <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/60">
            Goma Campus
          </span>
        </div>

        {/* Live counter badge */}
        <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
          <GraduationCap size={13} className="text-blue-400" />
          <span>{filteredServices.length} offres</span>
        </div>
      </div>

      {/* Filter Chips Horizontal Carousel */}
      <div className="px-4 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        {CATEGORIES.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          const ChipIcon = chip.icon;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {ChipIcon && <ChipIcon size={12} className={isSelected ? 'text-white' : 'text-blue-400'} />}
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Search Indicator if searching */}
      {searchQuery && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-zinc-400">
          <span>Résultats pour &ldquo;<strong className="text-white">{searchQuery}</strong>&rdquo;</span>
          <span className="text-blue-400 font-semibold">{filteredServices.length} trouvés</span>
        </div>
      )}

      {/* Feed: 2x2 Grid (2 columns) */}
      <div className="px-3.5 pt-3">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 animate-pulse flex flex-col p-2.5"
              >
                <div className="aspect-[4/3] w-full rounded-xl bg-zinc-800/70" />
                <div className="mt-3 h-3 w-4/5 rounded bg-zinc-800/70" />
                <div className="mt-1.5 h-3 w-1/2 rounded bg-zinc-800/70" />
                <div className="mt-auto h-4 w-1/3 rounded bg-zinc-800/70" />
              </div>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isFavorite={favoriteServiceIds.has(service.id)}
                onToggleFavorite={handleToggleFavorite}
                onClick={() => onSelectService(service.id)}
              />
            ))}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
              <Filter size={24} />
            </div>
            <h3 className="text-sm font-bold text-zinc-200">
              Aucun résultat dans cette catégorie
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              Soyez le premier étudiant à proposer ce service ou changez de filtre.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer transition-all"
              >
                Voir tout
              </button>
              <button
                onClick={onOpenPublish}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Publier</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
