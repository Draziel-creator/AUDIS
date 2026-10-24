import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Send, 
  CheckCheck, 
  ShieldCheck, 
  MessageSquare, 
  Sparkles, 
  User, 
  Search,
  PhoneCall,
  Clock
} from 'lucide-react';
import { 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  handleFirestoreError,
  OperationType 
} from '../firebase/firebase';
import { ChatItem, MessageItem, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface MessagesScreenProps {
  initialChatId?: string | null;
  onCloseChat?: () => void;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  initialChatId = null,
  onCloseChat
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
  const [activeChatOtherUser, setActiveChatOtherUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initialChatId prop
  useEffect(() => {
    if (initialChatId) {
      setActiveChatId(initialChatId);
    }
  }, [initialChatId]);

  // Subscribe to Chats collection for current user
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setLoadingChats(false);
      return;
    }

    setLoadingChats(true);
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const loadedChats: ChatItem[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const participants = data.participants as string[];
          const otherUid = participants.find((id) => id !== currentUser.uid);

          let otherUser: UserProfile | undefined = undefined;
          if (otherUid) {
            try {
              const uSnap = await getDoc(doc(db, 'users', otherUid));
              if (uSnap.exists()) {
                otherUser = uSnap.data() as UserProfile;
              }
            } catch (err) {
              console.warn('Other user fetch note:', err);
            }
          }

          loadedChats.push({
            id: docSnap.id,
            participants,
            lastMessage: data.lastMessage || 'Nouvelle discussion',
            lastSenderId: data.lastSenderId,
            updatedAt: data.updatedAt,
            unreadCount: data.unreadCount || 0,
            otherUser: otherUser || {
              uid: otherUid || '',
              displayName: 'Étudiant Goma',
              email: '',
              isPremium: false,
              followers: [],
              following: []
            }
          });
        }

        // Sort descending by updatedAt
        loadedChats.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
          return timeB - timeA;
        });

        setChats(loadedChats);
        setLoadingChats(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'chats');
        setLoadingChats(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch active chat details and other user
  useEffect(() => {
    if (!activeChatId || !currentUser) {
      setActiveChatOtherUser(null);
      return;
    }

    const currentChat = chats.find(c => c.id === activeChatId);
    if (currentChat?.otherUser) {
      setActiveChatOtherUser(currentChat.otherUser);
    } else {
      // Fetch directly from doc
      getDoc(doc(db, 'chats', activeChatId)).then(async (snap) => {
        if (snap.exists()) {
          const parts = snap.data().participants as string[];
          const otherUid = parts.find(p => p !== currentUser.uid);
          if (otherUid) {
            const uDoc = await getDoc(doc(db, 'users', otherUid));
            if (uDoc.exists()) {
              setActiveChatOtherUser(uDoc.data() as UserProfile);
            }
          }
        }
      });
    }

    // Subscribe to messages subcollection
    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: MessageItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          msgs.push({
            id: d.id,
            chatId: activeChatId,
            senderId: data.senderId,
            text: data.text,
            read: data.read ?? false,
            createdAt: data.createdAt
          });

          // Mark message as read if sent by other person and unread
          if (data.senderId !== currentUser.uid && !data.read) {
            updateDoc(d.ref, { read: true }).catch(() => {});
          }
        });
        setMessages(msgs);
        scrollToBottom();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `chats/${activeChatId}/messages`);
      }
    );

    return () => unsubscribe();
  }, [activeChatId, currentUser, chats]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeChatId || !currentUser) return;

    setInputText('');
    try {
      // Add message to subcollection
      const messagesRef = collection(db, 'chats', activeChatId, 'messages');
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        text: text,
        read: false,
        createdAt: serverTimestamp()
      });

      // Update chat document lastMessage
      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: text,
        lastSenderId: currentUser.uid,
        updatedAt: serverTimestamp()
      });

      scrollToBottom();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${activeChatId}/messages`);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto p-6 pt-16 text-center text-zinc-400">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shadow-xl">
          <MessageSquare size={28} />
        </div>
        <h3 className="text-base font-bold text-white">{t.loginRequiredTitle}</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
          {t.loginRequiredDesc}
        </p>
        <button
          onClick={() => openAuthModal("Connectez-vous pour accéder à vos discussions")}
          className="mt-5 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
        >
          {t.googleSignIn}
        </button>
      </div>
    );
  }

  // ACTIVE CHAT VIEW (MESSENGER STYLE)
  if (activeChatId) {
    return (
      <div className="flex flex-col h-full w-full max-w-md mx-auto bg-zinc-950">
        {/* Chat Header */}
        <div 
          className="sticky top-0 z-30 px-3.5 py-2.5 bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-800 flex items-center justify-between"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 10px)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                setActiveChatId(null);
                if (onCloseChat) onCloseChat();
              }}
              className="p-2 -ml-1 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="relative shrink-0">
              {activeChatOtherUser?.photoURL ? (
                <img
                  src={activeChatOtherUser.photoURL}
                  alt={activeChatOtherUser.displayName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover bg-zinc-800"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center border border-zinc-700">
                  {activeChatOtherUser?.displayName?.charAt(0) || 'E'}
                </div>
              )}
              {/* Green online dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate">
                  {activeChatOtherUser?.displayName || 'Étudiant Goma'}
                </span>
                {activeChatOtherUser?.isPremium && (
                  <ShieldCheck size={13} className="text-blue-400 shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En ligne sur le campus
              </span>
            </div>
          </div>

          {activeChatOtherUser?.phone && (
            <a
              href={`tel:${activeChatOtherUser.phone}`}
              className="p-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:text-emerald-400 transition-colors"
              title="Appeler"
            >
              <PhoneCall size={16} />
            </a>
          )}
        </div>

        {/* Quick Suggestion Chips for Students */}
        <div className="px-3 py-1.5 bg-zinc-900/40 border-b border-zinc-800/60 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <button
            onClick={() => handleSendMessage(t.quickReply1)}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
          >
            {t.quickReply1}
          </button>
          <button
            onClick={() => handleSendMessage(t.quickReply2)}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
          >
            {t.quickReply2}
          </button>
          <button
            onClick={() => handleSendMessage(t.quickReply3)}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
          >
            {t.quickReply3}
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              <Sparkles size={24} className="mx-auto mb-2 text-blue-400 opacity-60" />
              <p>Démarrez la conversation avec cet étudiant</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-zinc-800 text-zinc-100 rounded-bl-xs border border-zinc-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[9px] text-zinc-500 font-medium">
                      {msg.createdAt?.toDate 
                        ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : 'À l\'instant'}
                    </span>
                    {isMe && (
                      <CheckCheck
                        size={11}
                        className={msg.read ? 'text-blue-400' : 'text-zinc-500'}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar fixed at bottom */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto p-3 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.typeMessage}
              className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-full text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-blue-600/30"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // INBOX LIST VIEW
  return (
    <div className="flex-1 w-full max-w-md mx-auto pb-28 px-4 pt-3">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span>{t.messagesTitle}</span>
          {chats.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {chats.length}
            </span>
          )}
        </h2>
      </div>

      {loadingChats ? (
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-zinc-800 rounded" />
                <div className="h-3 w-3/4 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : chats.length > 0 ? (
        <div className="space-y-2">
          {chats.map((chat) => {
            const hasUnread = chat.lastSenderId !== currentUser.uid && chat.unreadCount && chat.unreadCount > 0;
            return (
              <motion.div
                key={chat.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveChatId(chat.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                  hasUnread
                    ? 'bg-zinc-900/90 border-blue-500/40 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="relative shrink-0">
                  {chat.otherUser?.photoURL ? (
                    <img
                      src={chat.otherUser.photoURL}
                      alt={chat.otherUser.displayName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover bg-zinc-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 text-sm font-bold text-zinc-300 flex items-center justify-center border border-zinc-700">
                      {chat.otherUser?.displayName?.charAt(0) || 'E'}
                    </div>
                  )}
                  {chat.otherUser?.isPremium && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-zinc-900 flex items-center justify-center text-white">
                      <ShieldCheck size={9} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-white truncate">
                      {chat.otherUser?.displayName || 'Étudiant Goma'}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {chat.updatedAt?.toDate
                        ? chat.updatedAt.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : ''}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 truncate leading-relaxed">
                    {chat.lastSenderId === currentUser.uid && 'Vous : '}
                    {chat.lastMessage}
                  </p>
                </div>

                {hasUnread && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <MessageSquare size={24} />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">{t.noChats}</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            {t.noChatsDesc}
          </p>
        </div>
      )}
    </div>
  );
};

export default MessagesScreen;
