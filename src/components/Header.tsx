import React, { useState, useEffect } from 'react';
import { Search, User, ShieldCheck, X } from 'lucide-react';
import { LogoAUDIS } from './LogoAUDIS';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onProfileClick: () => void;
  onLogoClick?: () => void;
}

const TYPEWRITER_PHRASES = [
  "Rechercher un service...",
  "Saisie TFC & Mémoire UNIGOM...",
  "Impression & Reliure Campus Lac...",
  "Dépannage PC & Flash Téléphone...",
  "Cours particuliers Math & Stats...",
  "Design Flyers & Affiches...",
  "Calculatrice Casio fx-991...",
  "Matériel & Chambres Goma..."
];

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onProfileClick,
  onLogoClick
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const { t } = useLanguage();

  // Typewriter effect state
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // If user has focused or typed, disable typewriter
    if (searchQuery) return;

    const fullPhrase = TYPEWRITER_PHRASES[currentPhraseIndex];
    const speed = isDeleting ? 30 : 70;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < fullPhrase.length) {
          setDisplayedText(fullPhrase.slice(0, displayedText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(fullPhrase.slice(0, displayedText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPhraseIndex, searchQuery]);

  const handleAvatarClick = () => {
    if (!currentUser) {
      openAuthModal("Connectez-vous pour accéder à votre profil étudiant");
    } else {
      onProfileClick();
    }
  };

  // Avatar source priority: Firestore photoURL -> Firebase Auth photoURL
  const avatarSrc = userProfile?.photoURL || currentUser?.photoURL;
  const isPremium = userProfile?.isPremium;

  return (
    <header 
      className="sticky top-0 z-40 w-full backdrop-blur-xl bg-zinc-950/85 border-b border-zinc-800/80 transition-all"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
    >
      <div className="max-w-md mx-auto px-3.5 pb-2.5 pt-1.5 flex items-center justify-between gap-2.5">
        
        {/* Left: LogoAUDIS 32px + Wordmark */}
        <button 
          onClick={onLogoClick} 
          className="flex items-center gap-1.5 shrink-0 group text-left cursor-pointer focus:outline-none"
          title="AUDIS Accueil"
        >
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 group-hover:scale-105 group-hover:border-blue-500/60 transition-all shadow-sm">
            <LogoAUDIS size={24} className="text-zinc-100 group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="hidden min-[380px]:flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-white leading-none">
              AUDIS
            </span>
            <span className="text-[9px] font-semibold text-blue-400 tracking-wider uppercase leading-tight">
              GOMA
            </span>
          </div>
        </button>

        {/* Center: Search Bar with Typewriter Placeholder */}
        <div className="relative flex-1 min-w-0">
          <div className="relative flex items-center w-full">
            <Search 
              size={15} 
              className="absolute left-3 text-zinc-400 pointer-events-none transition-colors group-focus-within:text-blue-400" 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={displayedText || t.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 border border-zinc-800 focus:border-blue-500/80 rounded-full text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all truncate"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-1 rounded-full text-zinc-400 hover:text-zinc-200 focus:outline-none"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Profile Avatar circle with real Firebase photoURL */}
        <button
          onClick={handleAvatarClick}
          className="relative shrink-0 p-0.5 rounded-full ring-2 ring-zinc-800 hover:ring-blue-500 transition-all cursor-pointer focus:outline-none"
          title={currentUser ? (currentUser.displayName || 'Profil') : 'Se connecter'}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={currentUser?.displayName || 'Avatar'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover bg-zinc-800"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-700">
              <User size={16} />
            </div>
          )}

          {/* Blue check badge for PRO users */}
          {isPremium && (
            <span 
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-zinc-950 flex items-center justify-center text-white shadow-sm"
              title="Membre Pro Vérifié"
            >
              <ShieldCheck size={9} strokeWidth={3} />
            </span>
          )}
        </button>

      </div>
    </header>
  );
};

export default Header;
