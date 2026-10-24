import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Users, 
  MapPin, 
  GraduationCap, 
  Edit3, 
  CheckCircle, 
  CreditCard, 
  Smartphone, 
  Trash2, 
  Plus, 
  Settings, 
  ExternalLink,
  X,
  Phone,
  Mail,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  handleFirestoreError,
  OperationType 
} from '../firebase/firebase';
import { ServiceItem } from '../types';

interface ProfileScreenProps {
  onGoToSettings: () => void;
  onSelectService: (serviceId: string) => void;
  onOpenPublish: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onGoToSettings,
  onSelectService,
  onOpenPublish
}) => {
  const { currentUser, userProfile, upgradeToPremium, openAuthModal, logOut } = useAuth();
  const { t } = useLanguage();

  const [myServices, setMyServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'mpesa' | 'airtel' | 'orange' | 'card'>('mpesa');
  const [momoNumber, setMomoNumber] = useState('');
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Load user's published listings
  useEffect(() => {
    if (!currentUser) {
      setMyServices([]);
      setLoadingServices(false);
      return;
    }

    setLoadingServices(true);
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, where('ownerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: ServiceItem[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as ServiceItem);
        });
        setMyServices(items);
        setLoadingServices(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'services');
        setLoadingServices(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleDeleteService = async (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer cette annonce ?")) return;

    try {
      await deleteDoc(doc(db, 'services', serviceId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `services/${serviceId}`);
    }
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    try {
      // Simulate real Mobile Money USSD prompt delay
      await new Promise((r) => setTimeout(r, 1200));
      await upgradeToPremium();
      setPaySuccess(true);
      setTimeout(() => {
        setIsPayModalOpen(false);
        setPaySuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto p-6 pt-16 text-center text-zinc-400">
        <h3 className="text-base font-bold text-white mb-2">{t.loginRequiredTitle}</h3>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-4">
          Connectez-vous avec votre compte Google pour voir votre profil étudiant et vos annonces.
        </p>
        <button
          onClick={() => openAuthModal("Connectez-vous pour voir votre profil")}
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          {t.googleSignIn}
        </button>
      </div>
    );
  }

  const isPro = userProfile?.isPremium;
  const avatarSrc = userProfile?.photoURL || currentUser.photoURL;

  return (
    <div className="flex-1 w-full max-w-md mx-auto pb-32">
      {/* Dynamic Profile Cover Banner */}
      <div 
        className={`relative w-full h-36 ${
          isPro 
            ? 'bg-gradient-to-r from-amber-500/30 via-indigo-900 to-blue-900 border-b border-amber-500/30' 
            : 'bg-gradient-to-r from-blue-900/40 via-zinc-900 to-indigo-950 border-b border-zinc-800'
        } overflow-hidden`}
      >
        {/* Subtle decorative mesh */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Quick Settings button on top right of cover */}
        <button
          onClick={onGoToSettings}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 transition-all cursor-pointer"
          title="Paramètres"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Main Profile Info Header */}
      <div className="px-4 -mt-14 relative z-10 space-y-4">
        <div className="flex items-end justify-between">
          {/* Avatar with real Google photo */}
          <div className="relative">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={currentUser.displayName || 'Profil'}
                referrerPolicy="no-referrer"
                className={`w-24 h-24 rounded-3xl object-cover ring-4 ${
                  isPro ? 'ring-amber-400 shadow-amber-500/20 shadow-xl' : 'ring-zinc-950'
                } bg-zinc-800 shadow-xl`}
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-zinc-800 ring-4 ring-zinc-950 flex items-center justify-center text-3xl font-bold text-zinc-300">
                {currentUser.displayName?.charAt(0) || 'E'}
              </div>
            )}

            {isPro && (
              <span 
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-500 border-3 border-zinc-950 text-white shadow-lg"
                title="Badge Vérifié AUDIS Pro"
              >
                <ShieldCheck size={16} strokeWidth={2.5} />
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isPro ? (
              <button
                onClick={() => setIsPayModalOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={14} className="fill-black" />
                <span>Devenir Pro</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                <Award size={14} className="text-amber-400" />
                <span>Membre PRO</span>
              </span>
            )}
          </div>
        </div>

        {/* Name, Badges & Campus */}
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {userProfile?.displayName || currentUser.displayName || 'Étudiant Goma'}
            </h1>
            {isPro && (
              <span title="Vendeur Certifié" className="text-blue-400">
                <ShieldCheck size={18} strokeWidth={2.6} />
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-400 mt-0.5">
            {currentUser.email}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-zinc-300">
            <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-[11px]">
              <MapPin size={11} className="text-purple-400" />
              <span>{userProfile?.campus || 'Campus du Lac (UNIGOM)'}</span>
            </span>

            <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-[11px]">
              <GraduationCap size={11} className="text-blue-400" />
              <span>{userProfile?.faculty || 'Sciences & Technologies'}</span>
            </span>
          </div>

          {userProfile?.bio && (
            <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
              {userProfile.bio}
            </p>
          )}
        </div>

        {/* Followers / Following Counters */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center">
          <div>
            <span className="text-base font-extrabold text-white">
              {myServices.length}
            </span>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
              Annonces
            </span>
          </div>
          <div className="border-x border-zinc-800">
            <span className="text-base font-extrabold text-white">
              {userProfile?.followers?.length || 0}
            </span>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
              Abonnés
            </span>
          </div>
          <div>
            <span className="text-base font-extrabold text-white">
              {userProfile?.following?.length || 0}
            </span>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
              Abonnements
            </span>
          </div>
        </div>

        {/* PRO SYSTEM BANNER: "Devenir Pro AUDIS - 10$ une seule fois" */}
        {!isPro ? (
          <div className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-purple-950 border border-blue-500/30 shadow-xl">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/40">
                  Offre Étudiante RDC
                </span>
                <span className="text-sm font-extrabold text-amber-400">
                  10$ une seule fois
                </span>
              </div>

              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Devenir Pro AUDIS</span>
                <ShieldCheck size={16} className="text-blue-400" />
              </h3>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Obtenez le badge vérifié bleu, positionnez vos annonces en tête des recherches et devenez un prestataire certifié sur tout le campus de Goma.
              </p>

              <button
                onClick={() => setIsPayModalOpen(true)}
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Zap size={15} />
                <span>Activer mon badge PRO (10$)</span>
              </button>
            </div>
          </div>
        ) : (
          /* PRO TRANSFORMED STATS DASHBOARD */
          <div className="p-4 rounded-3xl bg-gradient-to-br from-zinc-900 via-indigo-950/40 to-zinc-900 border border-amber-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Profil Vendeur Pro Certifié</h4>
                  <span className="text-[10px] text-zinc-400">Visibilité maximale sur les 4 campus</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Actif à vie
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-xs font-extrabold text-blue-400">+540</span>
                <span className="text-[9px] text-zinc-500 block">Vues profil</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-xs font-extrabold text-emerald-400">100%</span>
                <span className="text-[9px] text-zinc-500 block">Taux réponse</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-xs font-extrabold text-amber-400">5.0 ★</span>
                <span className="text-[9px] text-zinc-500 block">Confiance</span>
              </div>
            </div>
          </div>
        )}

        {/* Section: Mes Annonces Publiées */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Mes Annonces sur le campus ({myServices.length})
            </h3>
            <button
              onClick={onOpenPublish}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Plus size={13} />
              <span>Ajouter</span>
            </button>
          </div>

          {loadingServices ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-20 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : myServices.length > 0 ? (
            <div className="space-y-2.5">
              {myServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => onSelectService(service.id)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <img
                    src={service.imageUrl}
                    alt={service.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-zinc-800"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                      {service.category}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">
                      {service.title}
                    </h4>
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">
                      {new Intl.NumberFormat('fr-FR').format(service.price)} FC
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteService(service.id, e)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Supprimer cette annonce"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <p className="text-xs text-zinc-400 mb-3">
                Vous n&apos;avez pas encore publié de service ou produit.
              </p>
              <button
                onClick={onOpenPublish}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Publier ma première annonce</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE MONEY PAYMENT SIMULATION MODAL */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-[32px] sm:rounded-[32px] p-6 text-zinc-100 shadow-2xl space-y-4"
            >
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="text-center pt-2">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Devenir Pro AUDIS - 10$
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Paiement unique via Mobile Money RDC (Goma)
                </p>
              </div>

              {paySuccess ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle size={48} className="text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="text-base font-bold text-white">Félicitations !</h4>
                  <p className="text-xs text-zinc-300">
                    Votre compte est désormais certifié PRO AUDIS. Le badge bleu est activé.
                  </p>
                </div>
              ) : (
                <>
                  {/* Select Payment Method */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMethod('mpesa')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        payMethod === 'mpesa'
                          ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                      }`}
                    >
                      <span className="text-xs block font-bold text-rose-400">Vodacom</span>
                      <span className="text-[10px]">M-Pesa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('airtel')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        payMethod === 'airtel'
                          ? 'bg-red-500/20 border-red-500 text-white font-bold'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                      }`}
                    >
                      <span className="text-xs block font-bold text-red-400">Airtel</span>
                      <span className="text-[10px]">Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('orange')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        payMethod === 'orange'
                          ? 'bg-orange-500/20 border-orange-500 text-white font-bold'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                      }`}
                    >
                      <span className="text-xs block font-bold text-orange-400">Orange</span>
                      <span className="text-[10px]">Money</span>
                    </button>
                  </div>

                  {/* Phone input */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Numéro de compte Mobile Money (+243)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs text-zinc-400 font-semibold">
                        🇨🇩 +243
                      </span>
                      <input
                        type="tel"
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        placeholder="970 000 000"
                        className="w-full pl-18 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Une notification USSD sera envoyée sur votre téléphone pour confirmer 10$ (ou équivalent ~28 500 FC).
                    </span>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleSimulatePayment}
                    disabled={paying}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-xl shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} className="fill-black" />
                    <span>{paying ? 'Validation du paiement USSD...' : 'Confirmer le paiement (10$)'}</span>
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileScreen;
