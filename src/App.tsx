/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AuthModal from './components/AuthModal';
import HomeScreen from './screens/HomeScreen';
import ServiceDetailScreen from './screens/ServiceDetailScreen';
import PublishScreen from './screens/PublishScreen';
import MessagesScreen from './screens/MessagesScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import { NavTab } from './types';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot 
} from './firebase/firebase';

const MainApp: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Real-time unread messages count for red badge on BottomNav
  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lastSenderId && data.lastSenderId !== currentUser.uid && data.unreadCount) {
          count += data.unreadCount;
        }
      });
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Navigate to service detail
  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
  };

  // Open direct chat from service detail
  const handleOpenChat = (chatId: string) => {
    setSelectedServiceId(null);
    setActiveChatId(chatId);
    setActiveTab('messages');
  };

  // When published, go to home or view the new service
  const handlePublished = (newServiceId: string) => {
    setSelectedServiceId(newServiceId);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Edge-to-edge Top Header (hidden on ServiceDetail to show full cover hero) */}
      {!selectedServiceId && (
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onProfileClick={() => {
            setSelectedServiceId(null);
            setActiveTab('profile');
          }}
          onLogoClick={() => {
            setSelectedServiceId(null);
            setSearchQuery('');
            setActiveTab('home');
          }}
        />
      )}

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col w-full relative">
        {selectedServiceId ? (
          <ServiceDetailScreen
            serviceId={selectedServiceId}
            onBack={() => setSelectedServiceId(null)}
            onSelectService={(id) => setSelectedServiceId(id)}
            onOpenChat={handleOpenChat}
          />
        ) : activeTab === 'home' ? (
          <HomeScreen
            searchQuery={searchQuery}
            onSelectService={handleSelectService}
            onOpenPublish={() => {
              if (!currentUser) {
                openAuthModal("Connectez-vous pour publier un service ou produit");
              } else {
                setActiveTab('publish');
              }
            }}
          />
        ) : activeTab === 'messages' ? (
          <MessagesScreen
            initialChatId={activeChatId}
            onCloseChat={() => setActiveChatId(null)}
          />
        ) : activeTab === 'publish' ? (
          <PublishScreen
            onBack={() => setActiveTab('home')}
            onPublished={handlePublished}
          />
        ) : activeTab === 'favorites' ? (
          <FavoritesScreen
            onSelectService={handleSelectService}
            onGoHome={() => setActiveTab('home')}
          />
        ) : activeTab === 'profile' ? (
          <ProfileScreen
            onGoToSettings={() => setActiveTab('settings')}
            onSelectService={handleSelectService}
            onOpenPublish={() => setActiveTab('publish')}
          />
        ) : activeTab === 'settings' ? (
          <SettingsScreen
            onOpenProfile={() => setActiveTab('profile')}
            onBack={() => setActiveTab('home')}
          />
        ) : null}
      </main>

      {/* Floating Glass Bottom Nav */}
      {!selectedServiceId && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedServiceId(null);
            if (tab !== 'messages') setActiveChatId(null);
            setActiveTab(tab);
          }}
          unreadCount={unreadCount}
        />
      )}

      {/* Global Auth Modal for Protected Routes / Actions */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
