import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Star, 
  MessageCircle, 
  Clock, 
  MapPin, 
  Tag, 
  CheckCircle,
  Copy,
  ExternalLink,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { 
  db, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc, 
  serverTimestamp,
  handleFirestoreError,
  OperationType 
} from '../firebase/firebase';
import { ServiceItem, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ServiceCard from '../components/ServiceCard';

interface ServiceDetailScreenProps {
  serviceId: string;
  onBack: () => void;
  onSelectService: (serviceId: string) => void;
  onOpenChat: (chatId: string) => void;
}

export const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({
  serviceId,
  onBack,
  onSelectService,
  onOpenChat
}) => {
  const { currentUser, userProfile, openAuthModal, toggleFollowUser } = useAuth();
  const { t } = useLanguage();

  const [service, setService] = useState<ServiceItem | null>(null);
  const [ownerData, setOwnerData] = useState<UserProfile | null>(null);
  const [otherServices, setOtherServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [contacting, setContacting] = useState(false);

  // Fetch service & owner profile
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const sDoc = await getDoc(doc(db, 'services', serviceId));
        if (sDoc.exists() && isMounted) {
          const sData = { id: sDoc.id, ...sDoc.data() } as ServiceItem;
          setService(sData);

          // Fetch owner details from users collection
          if (sData.ownerId) {
            try {
              const uDoc = await getDoc(doc(db, 'users', sData.ownerId));
              if (uDoc.exists() && isMounted) {
                const uData = uDoc.data() as UserProfile;
                setOwnerData(uData);
                if (currentUser && uData.followers?.includes(currentUser.uid)) {
                  setIsFollowing(true);
                }
              }
            } catch (err) {
              console.warn('Owner fetch note:', err);
            }

            // Query "Autres services de cet étudiant"
            try {
              const otherQ = query(
                collection(db, 'services'),
                where('ownerId', '==', sData.ownerId)
              );
              const otherSnap = await getDocs(otherQ);
              const others: ServiceItem[] = [];
              otherSnap.forEach((d) => {
                if (d.id !== serviceId) {
                  others.push({ id: d.id, ...d.data() } as ServiceItem);
                }
              });
              if (isMounted) setOtherServices(others);
            } catch (err) {
              console.warn('Other services query note:', err);
            }
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `services/${serviceId}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [serviceId, currentUser]);

  const handleFollowClick = async () => {
    if (!currentUser) {
      openAuthModal("Connectez-vous pour suivre cet étudiant");
      return;
    }
    if (!service) return;
    const newStatus = await toggleFollowUser(service.ownerId);
    setIsFollowing(newStatus);
    // Locally adjust follower count
    setOwnerData((prev) => {
      if (!prev) return null;
      const currentList = prev.followers || [];
      const updatedList = newStatus 
        ? [...currentList, currentUser.uid] 
        : currentList.filter(id => id !== currentUser.uid);
      return { ...prev, followers: updatedList };
    });
  };

  const handleContactClick = async () => {
    if (!currentUser) {
      openAuthModal("Connectez-vous pour discuter avec ce vendeur");
      return;
    }
    if (!service) return;

    if (currentUser.uid === service.ownerId) {
      alert("C'est votre propre annonce !");
      return;
    }

    setContacting(true);
    try {
      // Find or create chat
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
      const snap = await getDocs(q);

      let targetChatId = '';
      snap.forEach((d) => {
        const parts = d.data().participants as string[];
        if (parts.includes(service.ownerId)) {
          targetChatId = d.id;
        }
      });

      if (!targetChatId) {
        // Create new chat
        const initialText = `Bonjour, je suis intéressé par votre annonce : "${service.title}" (${service.price} FC)`;
        const newChat = await addDoc(chatsRef, {
          participants: [currentUser.uid, service.ownerId],
          lastMessage: initialText,
          lastSenderId: currentUser.uid,
          updatedAt: serverTimestamp(),
          unreadCount: 1
        });
        targetChatId = newChat.id;

        // Subcollection message
        await addDoc(collection(db, 'chats', targetChatId, 'messages'), {
          senderId: currentUser.uid,
          text: initialText,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      onOpenChat(targetChatId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'chats');
    } finally {
      setContacting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading || !service) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto p-4 pt-10 text-center text-zinc-400">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Chargement des détails de l&apos;annonce...</p>
      </div>
    );
  }

  const isPro = ownerData?.isPremium ?? service.ownerIsPremium;
  const followersCount = ownerData?.followers?.length || 0;
  const formattedPrice = new Intl.NumberFormat('fr-FR').format(service.price);

  return (
    <div className="flex-1 w-full max-w-md mx-auto pb-32">
      {/* Top Navigation Bar floating over image */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 max-w-md mx-auto px-4 py-2.5 flex items-center justify-between pointer-events-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 10px)' }}
      >
        <button
          onClick={onBack}
          className="pointer-events-auto p-2.5 rounded-full bg-zinc-950/70 backdrop-blur-md border border-white/10 text-white shadow-lg cursor-pointer hover:bg-zinc-900 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="p-2.5 rounded-full bg-zinc-950/70 backdrop-blur-md border border-white/10 text-white shadow-lg cursor-pointer hover:bg-zinc-900 transition-all"
            title="Copier le lien"
          >
            {copiedLink ? <CheckCircle size={18} className="text-emerald-400" /> : <Share2 size={18} />}
          </button>
        </div>
      </div>

      {/* Top Cover Blur & Hero HD Image */}
      <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden">
        {/* Blurred background extension */}
        <img
          src={service.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125"
        />
        {/* Main sharp image */}
        <img
          src={service.imageUrl}
          alt={service.title}
          className="relative z-10 w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />
      </div>

      <div className="px-4 -mt-6 relative z-30 space-y-4">
        {/* Seller Profile Card (Facebook / Marketplace Style) */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {ownerData?.photoURL || service.ownerPhoto ? (
                <img
                  src={ownerData?.photoURL || service.ownerPhoto}
                  alt={ownerData?.displayName || service.ownerName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-700 bg-zinc-800"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-800 text-sm font-bold text-zinc-300 flex items-center justify-center ring-2 ring-zinc-700">
                  {service.ownerName?.charAt(0) || 'E'}
                </div>
              )}
              {isPro && (
                <span 
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-zinc-900 flex items-center justify-center text-white shadow-sm"
                  title="Vendeur Pro Vérifié"
                >
                  <ShieldCheck size={9} strokeWidth={3} />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white truncate">
                  {ownerData?.displayName || service.ownerName}
                </span>
                {isPro && (
                  <span className="text-blue-400 shrink-0">
                    <ShieldCheck size={14} />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                  <Star size={11} fill="currentColor" />
                  4.9
                </span>
                <span>•</span>
                <span>{followersCount} {t.followers}</span>
              </div>
            </div>
          </div>

          {/* Button "Suivre" with real arrayUnion */}
          {currentUser?.uid !== service.ownerId && (
            <button
              onClick={handleFollowClick}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isFollowing
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck size={13} />
                  <span>{t.following}</span>
                </>
              ) : (
                <>
                  <UserPlus size={13} />
                  <span>{t.follow}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Service Details Card */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg space-y-3">
          <div className="flex items-start justify-between gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {service.category}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{service.status === 'actif' ? 'Disponible' : 'Terminé'}</span>
            </div>
          </div>

          <h1 className="text-lg font-bold text-white tracking-tight leading-snug">
            {service.title}
          </h1>

          {/* Price Bar */}
          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                Prix étudiant
              </span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono tracking-tight">
                {formattedPrice} FC
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-zinc-400">
                ~{(service.price / 2850).toFixed(1)} $ USD
              </span>
              <span className="text-[10px] text-zinc-500 block">
                Taux campus Goma
              </span>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-800/40 border border-zinc-800/60">
              <Clock size={14} className="text-blue-400 shrink-0" />
              <div>
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Délai</span>
                <span className="font-semibold text-zinc-200">{service.deadline || '24h'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-800/40 border border-zinc-800/60">
              <MapPin size={14} className="text-purple-400 shrink-0" />
              <div className="truncate">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Campus</span>
                <span className="font-semibold text-zinc-200 truncate">{service.campus || 'Campus Lac UNIGOM'}</span>
              </div>
            </div>
          </div>

          {/* Full Description */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Description de l&apos;offre
            </h3>
            <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">
              {service.description}
            </p>
          </div>
        </div>

        {/* Section "Autres services de [Nom]" */}
        {otherServices.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>{t.otherServices} {service.ownerName}</span>
              <span className="text-blue-400 font-normal">{otherServices.length}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {otherServices.map((other) => (
                <div
                  key={other.id}
                  onClick={() => onSelectService(other.id)}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
                >
                  <img
                    src={other.imageUrl}
                    alt={other.title}
                    className="w-full aspect-[4/3] rounded-lg object-cover mb-1.5"
                  />
                  <h4 className="text-[11px] font-semibold text-zinc-200 truncate">
                    {other.title}
                  </h4>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {new Intl.NumberFormat('fr-FR').format(other.price)} FC
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto p-4 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 flex items-center gap-3"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 14px)' }}
      >
        <button
          onClick={handleContactClick}
          disabled={contacting}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <MessageCircle size={18} />
          <span>{contacting ? 'Ouverture du chat...' : t.contact}</span>
        </button>
      </div>
    </div>
  );
};

export default ServiceDetailScreen;
