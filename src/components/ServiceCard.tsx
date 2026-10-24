import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { ServiceItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from '../firebase/firebase';

interface ServiceCardProps {
  service: ServiceItem;
  isFavorite: boolean;
  onToggleFavorite?: (serviceId: string, currentStatus: boolean) => void;
  onClick: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isFavorite,
  onToggleFavorite,
  onClick
}) => {
  const { currentUser, openAuthModal } = useAuth();

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      openAuthModal("Connectez-vous pour ajouter ce service à vos favoris");
      return;
    }
    if (onToggleFavorite) {
      onToggleFavorite(service.id, isFavorite);
    }
  };

  // Format Congolese Francs (e.g. 5000 -> 5 000 FC)
  const formattedPrice = new Intl.NumberFormat('fr-FR').format(service.price);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 overflow-hidden cursor-pointer shadow-md transition-all duration-200"
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-800">
        <img
          src={service.imageUrl || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80'}
          alt={service.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            // Fallback image if broken link
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/30 pointer-events-none" />

        {/* Top-Right Heart Bookmark Button */}
        <motion.button
          whileTap={{ scale: 1.4 }}
          onClick={handleHeartClick}
          className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-zinc-950/60 backdrop-blur-md border border-white/10 text-white hover:bg-zinc-900/80 transition-all cursor-pointer focus:outline-none"
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <motion.div
            animate={{ scale: isFavorite ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Heart
              size={16}
              className={`transition-colors duration-200 ${
                isFavorite 
                  ? 'fill-rose-500 text-rose-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' 
                  : 'text-white/90 hover:text-white'
              }`}
            />
          </motion.div>
        </motion.button>

        {/* Top-Left Category Tag */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-zinc-900/85 backdrop-blur-md text-zinc-200 border border-white/10 shadow-sm">
            {service.category}
          </span>
        </div>

        {/* Status Badge at bottom left of image */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white border border-white/10">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              service.status === 'actif'
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-zinc-400'
            }`}
          />
          <span className="text-[10px]">
            {service.status === 'actif' ? 'En cours' : 'Terminé'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-2.5 pt-2">
        {/* Title */}
        <h4 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
          {service.title}
        </h4>

        {/* Owner Info & Verified badge */}
        <div className="flex items-center gap-1.5 mt-2">
          {service.ownerPhoto ? (
            <img
              src={service.ownerPhoto}
              alt={service.ownerName}
              referrerPolicy="no-referrer"
              className="w-4 h-4 rounded-full object-cover bg-zinc-800"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-zinc-800 text-[8px] flex items-center justify-center text-zinc-300 font-bold">
              {service.ownerName?.charAt(0) || 'E'}
            </div>
          )}
          <span className="text-[11px] text-zinc-400 truncate max-w-[90px]">
            {service.ownerName}
          </span>
          {service.ownerIsPremium && (
            <span title="Étudiant Pro Vérifié" className="text-blue-400 shrink-0">
              <ShieldCheck size={12} strokeWidth={2.6} />
            </span>
          )}
        </div>

        {/* Price & Turnaround at the bottom */}
        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-400 tracking-tight">
              {formattedPrice} FC
            </span>
            <span className="text-[9px] text-zinc-500 font-medium">
              ~{(service.price / 2850).toFixed(1)}$
            </span>
          </div>

          {service.deadline && (
            <span className="text-[10px] text-zinc-400 flex items-center gap-1 bg-zinc-800/60 px-1.5 py-0.5 rounded-md">
              <Clock size={10} className="text-zinc-500" />
              {service.deadline}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
