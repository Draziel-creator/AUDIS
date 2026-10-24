import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Compass, AlertCircle } from 'lucide-react';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  deleteDoc,
  handleFirestoreError,
  OperationType 
} from '../firebase/firebase';
import { ServiceItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ServiceCard from '../components/ServiceCard';

interface FavoritesScreenProps {
  onSelectService: (serviceId: string) => void;
  onGoHome: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onSelectService,
  onGoHome
}) => {
  const { currentUser, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const [favoritedServices, setFavoritedServices] = useState<ServiceItem[]>([]);
  const [favoriteDocIds, setFavoriteDocIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setFavoritedServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const favRef = collection(db, 'favorites');
    const q = query(favRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const docMap: Record<string, string> = {};
        const serviceIds: string[] = [];

        snapshot.forEach((d) => {
          const data = d.data();
          if (data.serviceId) {
            serviceIds.push(data.serviceId);
            docMap[data.serviceId] = d.id;
          }
        });

        setFavoriteDocIds(docMap);

        // Fetch the corresponding service documents
        const items: ServiceItem[] = [];
        for (const sId of serviceIds) {
          try {
            const sSnap = await getDoc(doc(db, 'services', sId));
            if (sSnap.exists()) {
              items.push({ id: sSnap.id, ...sSnap.data() } as ServiceItem);
            }
          } catch (err) {
            console.warn('Favorite service fetch note:', err);
          }
        }

        setFavoritedServices(items);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'favorites');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleToggleFavorite = async (serviceId: string) => {
    const docId = favoriteDocIds[serviceId];
    if (docId) {
      try {
        await deleteDoc(doc(db, 'favorites', docId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `favorites/${docId}`);
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto p-6 pt-16 text-center text-zinc-400">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 shadow-xl">
          <Heart size={28} className="fill-rose-500" />
        </div>
        <h3 className="text-base font-bold text-white">{t.loginRequiredTitle}</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
          Connectez-vous pour retrouver toutes vos offres et services sauvegardés.
        </p>
        <button
          onClick={() => openAuthModal("Connectez-vous pour retrouver vos favoris")}
          className="mt-5 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
        >
          {t.googleSignIn}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-md mx-auto pb-28 px-4 pt-3">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            <Heart size={18} className="text-rose-500 fill-rose-500" />
            <span>{t.favoritesTitle}</span>
          </h2>
          {favoritedServices.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              {favoritedServices.length}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-60 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : favoritedServices.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {favoritedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isFavorite={true}
              onToggleFavorite={() => handleToggleFavorite(service.id)}
              onClick={() => onSelectService(service.id)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 px-4 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
            <Heart size={26} className="text-zinc-600" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">
            {t.favoritesEmpty}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            {t.favoritesEmptyDesc}
          </p>
          <button
            onClick={onGoHome}
            className="mt-5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 cursor-pointer transition-all inline-flex items-center gap-2"
          >
            <Compass size={14} />
            <span>{t.exploreBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FavoritesScreen;
