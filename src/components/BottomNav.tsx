import React from 'react';
import { Home, MessageSquare, Plus, Heart, Settings, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { NavTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreadCount = 0
}) => {
  const { currentUser, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const handleMagicClick = () => {
    if (!currentUser) {
      openAuthModal("Connectez-vous pour publier un service ou produit sur AUDIS");
    } else {
      setActiveTab('publish');
    }
  };

  const navItems = [
    { id: 'home' as NavTab, label: t.forYou || 'Accueil', icon: Home },
    { 
      id: 'messages' as NavTab, 
      label: 'Messages', 
      icon: MessageSquare, 
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null 
    },
    { id: 'publish' as NavTab, label: '+', isMagic: true },
    { id: 'favorites' as NavTab, label: 'Favoris', icon: Heart },
    { id: 'settings' as NavTab, label: 'Paramètres', icon: Settings },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <nav 
        className="pointer-events-auto w-full max-w-md h-[68px] rounded-[30px] bg-zinc-900/85 backdrop-blur-2xl border border-zinc-800/90 shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex items-center justify-between px-2.5 py-1.5 transition-all"
      >
        {navItems.map((item) => {
          if (item.isMagic) {
            return (
              <div key="magic-button" className="relative -top-4 flex flex-col items-center">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleMagicClick}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 p-[2px] shadow-[0_8px_25px_rgba(79,70,229,0.55)] cursor-pointer focus:outline-none"
                  aria-label="Publier un service"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white relative overflow-hidden">
                    <Plus size={28} strokeWidth={2.6} className="transition-transform group-hover:rotate-90 duration-300" />
                    <Sparkles size={11} className="absolute top-2 right-2 text-yellow-300 animate-pulse" />
                  </div>
                </motion.button>
                <span className="text-[10px] font-bold text-blue-400 mt-0.5 tracking-wide">
                  Publier
                </span>
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'favorites' && !currentUser) {
                  openAuthModal("Connectez-vous pour voir vos annonces favorites");
                  return;
                }
                if (item.id === 'messages' && !currentUser) {
                  openAuthModal("Connectez-vous pour accéder à vos messages");
                  return;
                }
                setActiveTab(item.id);
              }}
              className="relative flex-1 flex flex-col items-center justify-center py-1.5 cursor-pointer focus:outline-none transition-colors"
            >
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-blue-400' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                />

                {/* Red Unread Count Badge */}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 border-2 border-zinc-900 text-[10px] font-extrabold text-white flex items-center justify-center shadow-md animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive ? 'text-blue-400 font-semibold' : 'text-zinc-400'
                }`}
              >
                {item.label}
              </span>

              {/* Active pill dot indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-400"
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
