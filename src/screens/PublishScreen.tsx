import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Clock, 
  Tag, 
  Image as ImageIcon,
  MapPin,
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  db, 
  storage, 
  collection, 
  addDoc, 
  serverTimestamp, 
  ref, 
  uploadString, 
  getDownloadURL, 
  handleFirestoreError,
  OperationType 
} from '../firebase/firebase';

interface PublishScreenProps {
  onBack: () => void;
  onPublished: (newServiceId: string) => void;
}

const CATEGORIES = [
  'Devoir',
  'Saisie',
  'Impression',
  'Téléphone',
  'Machine',
  'Cours',
  'Design',
  'Traduction',
  'Produits',
  'Logement'
];

const CAMPUSES = [
  'Campus du Lac (UNIGOM)',
  'Campus Moïse (ULPGL)',
  'Campus ISTA Goma',
  'Campus ISC Goma',
  'Birere / Centre-Ville',
  'Kyeshero / Mabanga'
];

const PRESET_IMAGES: Record<string, string> = {
  'Devoir': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
  'Saisie': 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop&q=80',
  'Impression': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80',
  'Téléphone': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
  'Machine': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
  'Cours': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
  'Design': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80',
  'Traduction': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80',
  'Produits': 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80',
  'Logement': 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80',
};

export const PublishScreen: React.FC<PublishScreenProps> = ({ onBack, onPublished }) => {
  const { currentUser, userProfile } = useAuth();
  const { t } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Service' | 'Produit'>('Service');
  const [category, setCategory] = useState<string>('Saisie');
  const [price, setPrice] = useState<string>('10000');
  const [deadline, setDeadline] = useState('24h');
  const [campus, setCampus] = useState(CAMPUSES[0]);
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto set image fallback if none selected
  const activeImageUrl = imageDataUrl || PRESET_IMAGES[category] || PRESET_IMAGES['Saisie'];

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5 Mo");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!title.trim() || !description.trim()) {
      setError('Veuillez remplir le titre et la description');
      return;
    }

    const numericPrice = parseInt(price, 10);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Veuillez indiquer un prix valide en Francs Congolais');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = activeImageUrl;

      // Try uploading to Firebase Storage if custom image uploaded
      if (imageDataUrl.startsWith('data:image')) {
        try {
          const storageRefPath = `services/${currentUser.uid}_${Date.now()}/thumb.jpg`;
          const imageRef = ref(storage, storageRefPath);
          await uploadString(imageRef, imageDataUrl, 'data_url');
          finalImageUrl = await getDownloadURL(imageRef);
        } catch (storageErr) {
          console.warn('Storage upload fallback to data URL or preset:', storageErr);
          // If storage bucket write has restrictions, use dataUrl or preset safely
          finalImageUrl = imageDataUrl.length < 500000 ? imageDataUrl : (PRESET_IMAGES[category] || activeImageUrl);
        }
      }

      // Add to Firestore collection "services"
      const newServiceDoc = {
        ownerId: currentUser.uid,
        title: title.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        type: type,
        category: category,
        price: numericPrice,
        deadline: deadline.trim() || '24h',
        status: 'actif' as const,
        createdAt: serverTimestamp(),
        likes: 0,
        ownerName: userProfile?.displayName || currentUser.displayName || 'Étudiant Goma',
        ownerPhoto: userProfile?.photoURL || currentUser.photoURL || '',
        ownerIsPremium: userProfile?.isPremium || false,
        campus: campus
      };

      const docRef = await addDoc(collection(db, 'services'), newServiceDoc);
      onPublished(docRef.id);
    } catch (err: any) {
      console.error('Error publishing service:', err);
      handleFirestoreError(err, OperationType.CREATE, 'services');
      setError(err.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto pb-28 px-4 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-white tracking-tight">
          {t.publishTitle}
        </h2>
        <div className="w-8" />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle: Service vs Produit */}
        <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-xl grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setType('Service')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'Service'
                ? 'bg-blue-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Service Étudiant
          </button>
          <button
            type="button"
            onClick={() => setType('Produit')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'Produit'
                ? 'bg-blue-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Matériel / Produit
          </button>
        </div>

        {/* Titre */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            {t.titleLabel} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Frappe TFC & reliure express ou Ordinateur HP Core i5"
            maxLength={100}
            required
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            {t.categoryLabel} *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                  category === cat
                    ? 'bg-blue-500/15 border-blue-500 text-blue-400 font-semibold shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Image HD Upload & Live Preview */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Image HD de l&apos;annonce *
          </label>
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
            <img
              src={activeImageUrl}
              alt="Aperçu"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <label className="px-4 py-2 rounded-xl bg-white text-zinc-900 font-bold text-xs cursor-pointer flex items-center gap-2 shadow-lg">
                <Camera size={15} />
                <span>Changer l&apos;image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <label className="text-xs text-blue-400 hover:underline cursor-pointer flex items-center gap-1.5 font-medium">
              <Upload size={13} />
              <span>Téléverser depuis la galerie</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>
            <span className="text-[10px] text-zinc-500">HD auto-optimisée</span>
          </div>
        </div>

        {/* Prix FC & Délai */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Prix en Francs (FC) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="ex: 15000"
                min={500}
                step={500}
                required
                className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono font-bold"
              />
              <span className="absolute right-3 top-3 text-[10px] font-bold text-emerald-400">
                FC
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              ~{((parseInt(price) || 0) / 2850).toFixed(1)} $ USD
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Délai d&apos;exécution *
            </label>
            <input
              type="text"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="ex: 24h ou Immédiat"
              required
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Campus Location */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Lieu de rencontre / Campus
          </label>
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none transition-colors"
          >
            {CAMPUSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            {t.descLabel} *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détaillez votre offre (normes universitaires, logiciels utilisés, conditions de remise en main propre sur le campus)..."
            rows={4}
            required
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          <span>{loading ? t.publishing : t.publishBtn}</span>
        </button>
      </form>
    </div>
  );
};

export default PublishScreen;
