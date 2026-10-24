import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Phone, Lock, User, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LogoAUDIS from './LogoAUDIS';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalReason, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithPhoneMock 
  } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'google' | 'email' | 'phone'>('google');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Fenêtre de connexion fermée');
      } else {
        setError(err.message || 'Erreur lors de la connexion Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Veuillez entrer votre nom complet');
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!phone.trim()) throw new Error('Entrez votre numéro (+243...)');
      const cleanPhone = phone.startsWith('+243') ? phone : `+243${phone.replace(/^0/, '')}`;
      await signInWithPhoneMock(cleanPhone, name.trim() || 'Étudiant Goma');
    } catch (err: any) {
      setError(err.message || 'Numéro invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-[32px] sm:rounded-[32px] p-6 text-zinc-100 shadow-2xl overflow-hidden"
        >
          {/* Header gradient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-blue-500/15 blur-3xl rounded-full pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Logo & Headline */}
          <div className="text-center pt-2 pb-4">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center shadow-lg">
                <LogoAUDIS size={30} color="#38bdf8" />
              </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              AUDIS Goma
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Étudiants
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              {authModalReason || t.loginRequiredDesc}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MAIN BIG GOOGLE BUTTON */}
          <div className="space-y-3 mb-5">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-zinc-50 active:scale-[0.98] text-zinc-800 font-semibold text-sm rounded-2xl shadow-lg shadow-white/5 transition-all border border-zinc-200 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Connexion en cours...' : t.googleSignIn}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-900 px-3 text-[11px] uppercase tracking-wider text-zinc-500 shrink-0">
              Ou options campus
            </span>
            <div className="border-t border-zinc-800 w-full" />
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => { setMode('email'); setError(null); }}
              className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'email' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mail size={14} />
              <span>Email & Mot de passe</span>
            </button>
            <button
              onClick={() => { setMode('phone'); setError(null); }}
              className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'phone' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Phone size={14} />
              <span>Numéro (+243)</span>
            </button>
          </div>

          {/* EMAIL FORM */}
          {mode === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {isRegister && (
                <div>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Nom complet (ex: Patrick Baraka)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-3.5 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="Adresse email étudiant"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3.5 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="Mot de passe (6 caractères min.)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Traitement...' : isRegister ? "S'inscrire sur AUDIS" : 'Se connecter'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-blue-400 hover:underline"
                >
                  {isRegister ? 'Déjà un compte ? Se connecter' : 'Nouveau sur le campus ? Créer un compte'}
                </button>
              </div>
            </form>
          )}

          {/* PHONE FORM */}
          {mode === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-3">
              <div>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Votre Nom & Prénom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-zinc-400">
                    🇨🇩 +243
                  </span>
                  <input
                    type="tel"
                    placeholder="970 000 000 (Airtel, Vodacom, Orange)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-18 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 pl-1">
                  Connectez-vous directement avec votre numéro M-Pesa ou Airtel Money.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Accéder avec mon numéro'}
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60 text-center">
            <span className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Réseau certifié étudiants UNIGOM • ULPGL • ISTA • Goma
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
