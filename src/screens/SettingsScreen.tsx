import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Shield, 
  Palette, 
  Globe, 
  Bell, 
  MessageSquare, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Check, 
  Lock, 
  FileText, 
  AlertTriangle, 
  CreditCard, 
  Smartphone, 
  Eye, 
  Volume2, 
  CheckCircle2, 
  Upload, 
  Sparkles,
  Info,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeType, LanguageType } from '../types';

interface SettingsScreenProps {
  onBack?: () => void;
  onOpenProfile: () => void;
}

const GOMA_CAMPUS_RULES = [
  "1. Intégrité Académique : L'aide aux devoirs doit être un tutorat d'apprentissage. Toute fraude académique flagrante est sanctionnée.",
  "2. Vérification Étudiante : Tout prestataire doit être inscrit dans une institution universitaire reconnue (UNIGOM, ULPGL, ISTA, ISC, etc.).",
  "3. Devises Autorisées : Les prix sont affichés en Francs Congolais (FC) avec estimation indicative en Dollars Américains (USD).",
  "4. Lieux de Rencontre Sécurisés : Les transactions physiques doivent s'effectuer de jour dans les espaces publics des campus (Bibliothèque, Cour d'honneur, Portail UNIGOM).",
  "5. Respect des Délais : Pour la saisie, l'impression ou le dépannage de machine, le délai convenu doit être scrupuleusement respecté.",
  "6. Qualité des Travaux : Les documents de TFC/Mémoire doivent respecter les normes de pagination et la charte graphique exigée par la faculté.",
  "7. Confidentialité des Fichiers : Interdiction formelle de diffuser ou revendre les travaux académiques, clés USB ou fichiers personnels d'un autre étudiant.",
  "8. Matériel Informatique : Lors du dépannage de PC ou flash téléphone, interdiction de modifier les données personnelles sans consentement explicite.",
  "9. Produits Sains & Autorisés : Vente d'articles licites uniquement (fournitures, calculatrices, ordinateurs, livres). Armes, drogues et substances illicites formellement bannies.",
  "10. Transparence sur l'État du Matériel : Pour les produits d'occasion, tous les défauts éventuels (batterie usée, rayures) doivent être signalés.",
  "11. Lutte Anti-Escroquerie : Aucun paiement d'avance total n'est exigé sans garantie préalable ou sans remise en main propre.",
  "12. Politesse & Respect Mutuel : La messagerie AUDIS doit rester cordiale. Les insultes, le harcèlement ou les menaces entraînent l'exclusion immédiate.",
  "13. Gestion des Litiges : En cas de désaccord, les parties sollicitent la médiation de l'équipe de support AUDIS.",
  "14. Authentification Mobile Money : Les paiements PRO et services via M-Pesa / Airtel Money doivent utiliser les numéros enregistrés.",
  "15. Protection des Données Personnelles : Ne divulguez jamais vos mots de passe ou codes PIN de carte bancaire/mobile money.",
  "16. Interdiction des Doubles Profils : Chaque étudiant ne peut posséder qu'un seul compte actif lié à son identité réelle.",
  "17. Signalement Citoyen : Tout utilisateur a le devoir de signaler les annonces suspectes ou abusives.",
  "18. Responsabilité du Vendeur : Le prestataire assume l'entière garantie du service rendu pendant au moins 48 heures après livraison.",
  "19. Disponibilité Réelle : Mettez vos annonces en statut 'Terminé' dès que le stock est épuisé ou que votre planning est complet.",
  "20. Solidarité Universitaire : L'esprit d'entraide et de progrès pour l'écosystème étudiant de Goma demeure le fondement premier d'AUDIS."
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenProfile }) => {
  const { currentUser, userProfile, logOut, updateProfileInfo } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  // Edit Profile form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [campus, setCampus] = useState(userProfile?.campus || 'Campus du Lac (UNIGOM)');
  const [faculty, setFaculty] = useState(userProfile?.faculty || 'Sciences & Technologies');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Rules accordion toggle
  const [showRules, setShowRules] = useState(false);

  // Notification toggles
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfileInfo({
        displayName,
        campus,
        faculty,
        bio
      });
      setProfileSavedToast(true);
      setTimeout(() => {
        setProfileSavedToast(false);
        setIsEditingProfile(false);
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const THEMES: { id: ThemeType; label: string; color: string; bg: string }[] = [
    { id: 'dark', label: 'Sombre', color: '#38bdf8', bg: '#09090b' },
    { id: 'light', label: 'Clair', color: '#2563eb', bg: '#f8fafc' },
    { id: 'blue', label: 'Bleu Nuit', color: '#38bdf8', bg: '#030712' },
    { id: 'crimson', label: 'Rouge Rubis', color: '#f43f5e', bg: '#140507' },
    { id: 'violet', label: 'Violet Astral', color: '#a855f7', bg: '#0c0517' },
  ];

  const LANGUAGES: { id: LanguageType; label: string; sub: string }[] = [
    { id: 'fr', label: 'Français', sub: 'Langue officielle campus' },
    { id: 'sw', label: 'Kiswahili', sub: 'Lugha ya Goma na Kivu' },
    { id: 'ln', label: 'Lingála', sub: 'Lolemo ya mboka' },
    { id: 'en', label: 'English', sub: 'International language' },
    { id: 'es', label: 'Español', sub: 'Idioma' },
  ];

  return (
    <div className="flex-1 w-full max-w-md mx-auto pb-32 px-4 pt-3 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span>{t.settingsTitle}</span>
          <span className="text-[10px] text-zinc-500 font-normal">v2.4.0</span>
        </h2>
      </div>

      {/* Profile Summary Card */}
      {currentUser && (
        <div 
          onClick={onOpenProfile}
          className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            {userProfile?.photoURL || currentUser.photoURL ? (
              <img
                src={userProfile?.photoURL || currentUser.photoURL || ''}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover bg-zinc-800"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center">
                {currentUser.displayName?.charAt(0) || 'E'}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                {userProfile?.displayName || currentUser.displayName || 'Étudiant Goma'}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">
                {currentUser.email}
              </p>
              <span className="text-[10px] text-blue-400 font-medium">
                Voir le profil & statistiques
              </span>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
        </div>
      )}

      {/* SECTION: Compte */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-1">
          {t.account} & Campus
        </h4>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800/80 overflow-hidden">
          {/* Modifier Profil Button */}
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <User size={16} />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">
                  Modifier mes informations
                </span>
                <span className="text-[10px] text-zinc-500">
                  Nom, campus, faculté, bio
                </span>
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-zinc-500 transition-transform ${isEditingProfile ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Inline Edit Profile Drawer */}
          {isEditingProfile && (
            <form onSubmit={handleSaveProfile} className="p-4 bg-zinc-950/60 space-y-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Campus actuel</label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
                >
                  <option value="Campus du Lac (UNIGOM)">Campus du Lac (UNIGOM)</option>
                  <option value="Campus Moïse (ULPGL)">Campus Moïse (ULPGL)</option>
                  <option value="Campus ISTA Goma">Campus ISTA Goma</option>
                  <option value="Campus ISC Goma">Campus ISC Goma</option>
                  <option value="Birere / Centre-Ville">Birere / Centre-Ville</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Faculté / Promotion</label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="ex: Sciences Informatiques L3"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Bio étudiante</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  {savingProfile ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>

              {profileSavedToast && (
                <p className="text-center text-[11px] text-emerald-400 font-semibold pt-1">
                  Profil mis à jour avec succès !
                </p>
              )}
            </form>
          )}

          {/* Carte Étudiant Vérifiée */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Shield size={16} />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">
                  Carte d&apos;étudiant Goma
                </span>
                <span className="text-[10px] text-zinc-500">
                  {userProfile?.isPremium ? 'Vérifiée & Certifiée' : 'Statut Standard'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: Apparence (Thème) */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-1">
          {t.theme}
        </h4>

        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Palette size={16} className="text-purple-400" />
            <span className="text-xs font-semibold text-white">Palette de l&apos;application</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((th) => {
              const isSelected = theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`p-2 rounded-xl flex flex-col items-center gap-1.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-zinc-800 shadow-md ring-1 ring-blue-500'
                      : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-white/20 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: th.bg }}
                  >
                    {isSelected && <Check size={11} className="text-blue-400" />}
                  </div>
                  <span className="text-[9px] font-medium text-zinc-300 truncate w-full text-center">
                    {th.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION: Langue */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-1">
          {t.language}
        </h4>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800/80 overflow-hidden">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected ? 'bg-blue-500/10' : 'hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs uppercase">
                    {lang.id}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">
                      {lang.label}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {lang.sub}
                    </span>
                  </div>
                </div>

                {isSelected && <Check size={16} className="text-blue-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION: Notifications */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-1">
          Notifications & Sons
        </h4>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800/80">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-amber-400" />
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">
                  Messages & Nouveaux chats
                </span>
                <span className="text-[10px] text-zinc-500">
                  Notification instantanée quand un étudiant vous écrit
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifMessages}
              onChange={(e) => setNotifMessages(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 size={16} className="text-teal-400" />
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">
                  Sons et effets sonores
                </span>
                <span className="text-[10px] text-zinc-500">
                  Son d&apos;envoi de message et clic favori
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* SECTION: Règles d'utilisation (20 Detailed Campus Rules) */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-1">
          Sécurité & Charte Campus Goma
        </h4>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">
                  20 Règles de Conduite AUDIS Goma
                </span>
                <span className="text-[10px] text-zinc-500">
                  Intégrité académique, remises en main propre, devises FC
                </span>
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-zinc-500 transition-transform ${showRules ? 'rotate-180' : ''}`}
            />
          </button>

          {showRules && (
            <div className="p-4 bg-zinc-950/70 space-y-2.5 max-h-96 overflow-y-auto no-scrollbar border-t border-zinc-800 text-xs text-zinc-300 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] mb-3 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>
                  Ces règles ont été établies pour garantir la sécurité et la réputation des étudiants de l&apos;Université de Goma (UNIGOM), ULPGL, ISTA et ISC.
                </span>
              </div>

              {GOMA_CAMPUS_RULES.map((rule, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                  <p className="text-[11px] text-zinc-300">{rule}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION: Déconnexion */}
      {currentUser && (
        <div className="pt-2">
          <button
            onClick={() => logOut()}
            className="w-full p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span>{t.logout}</span>
          </button>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center pt-4 text-[10px] text-zinc-600">
        <p>AUDIS • Plateforme étudiante certifiée Goma (RDC)</p>
        <p className="mt-0.5">UNIGOM • ULPGL • ISTA • ISC</p>
      </div>
    </div>
  );
};

export default SettingsScreen;
