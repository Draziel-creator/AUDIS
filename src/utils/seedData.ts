import { db, collection, addDoc, serverTimestamp, getDocs } from '../firebase/firebase';
import { ServiceItem } from '../types';

export const INITIAL_GOMA_SERVICES = [
  {
    title: "Saisie rapide & Mise en page TFC / Mémoire UNIGOM",
    description: "Frappe ultra rapide de vos travaux académiques selon les normes APA et canevas officiel de l'Université de Goma. Correction orthographique incluse.",
    imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop&q=80",
    type: "Service",
    category: "Saisie",
    price: 15000,
    status: "actif",
    deadline: "24h - 48h",
    ownerId: "seed_student_alain",
    ownerName: "Alain Kasereka",
    ownerPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: true,
    campus: "Campus du Lac (UNIGOM)"
  },
  {
    title: "Impression recto-verso & Reliure Spirale Campus Lac",
    description: "Impression numérique haute qualité, papier 80g blanc, couverture plastique transparente et spirale solide. Disponible directement au portail UNIGOM.",
    imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80",
    type: "Service",
    category: "Impression",
    price: 5000,
    status: "actif",
    deadline: "Immédiat",
    ownerId: "seed_student_sarah",
    ownerName: "Sarah Neema",
    ownerPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: true,
    campus: "Campus du Lac (UNIGOM)"
  },
  {
    title: "Aide à la rédaction & correction Devoirs Programmation Web",
    description: "Support pour travaux pratiques en HTML, CSS, JavaScript, Python et bases de données SQL. Explications pas à pas pour la défense.",
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80",
    type: "Service",
    category: "Devoir",
    price: 25000,
    status: "actif",
    deadline: "24h",
    ownerId: "seed_student_david",
    ownerName: "David Muhindo",
    ownerPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: false,
    campus: "Campus Moïse (ULPGL)"
  },
  {
    title: "Dépannage PC Portable, Changement Pâte Thermique & Formatage",
    description: "Installation propre de Windows 10/11, pack Office complet activé, antivirus, nettoyage poussière ventilateur pour ordinateurs lents.",
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80",
    type: "Service",
    category: "Machine",
    price: 18000,
    status: "actif",
    deadline: "3 heures",
    ownerId: "seed_student_prince",
    ownerName: "Prince Bahati",
    ownerPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: true,
    campus: "Birere / UNIGOM"
  },
  {
    title: "Flash Téléphone Android & Déblocage Réseau Express",
    description: "Résolution bugs de démarrage (bootloop), mise à jour système, désimlockage réseau et sauvegarde complète de vos fichiers étudiants.",
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80",
    type: "Service",
    category: "Téléphone",
    price: 10000,
    status: "actif",
    deadline: "1 heure",
    ownerId: "seed_student_eric",
    ownerName: "Éric Paluku",
    ownerPhoto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: false,
    campus: "Centre-Ville Goma"
  },
  {
    title: "Cours de Répétition Mathématiques & Statistiques L1/L2",
    description: "Séances intensives en groupe ou solo : calcul différentiel, probabilités, statistiques descriptives et inférentielles pour réussir vos examens.",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80",
    type: "Service",
    category: "Cours",
    price: 12000,
    status: "actif",
    deadline: "Chaque samedi",
    ownerId: "seed_student_clarisse",
    ownerName: "Clarisse Kavira",
    ownerPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: true,
    campus: "Campus du Lac (UNIGOM)"
  },
  {
    title: "Conception Graphique : Flyers, Logos de Promotion & Kakemono",
    description: "Designs percutants sur Illustrator/Photoshop/Canva pour les activités des cercles d'étudiants, soutenances de TFC, et projets d'entrepreneuriat.",
    imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80",
    type: "Service",
    category: "Design",
    price: 20000,
    status: "actif",
    deadline: "24h",
    ownerId: "seed_student_samuel",
    ownerName: "Samuel Amani",
    ownerPhoto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: false,
    campus: "Campus ISTA Goma"
  },
  {
    title: "Traduction Académique Anglais - Français pour Résumé TFC",
    description: "Traduction fidèle du synopsis et abstract de votre mémoire par un étudiant bilingue certifié. Terminologie scientifique rigoureuse.",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80",
    type: "Service",
    category: "Traduction",
    price: 8000,
    status: "actif",
    deadline: "12h",
    ownerId: "seed_student_gloria",
    ownerName: "Gloria Zawadi",
    ownerPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: true,
    campus: "Campus ULPGL"
  },
  {
    title: "Calculatrice Scientifique Casio FX-991EX ClassWiz Authentique",
    description: "Idéale pour étudiants en Polytechnique, Économie et Sciences. État impeccable, piles neuves fournies, test possible sur place.",
    imageUrl: "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e485?w=800&auto=format&fit=crop&q=80",
    type: "Produit",
    category: "Produits",
    price: 45000,
    status: "actif",
    deadline: "Disponible de suite",
    ownerId: "seed_student_jean",
    ownerName: "Jean-Paul Murhula",
    ownerPhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: false,
    campus: "Campus du Lac (UNIGOM)"
  },
  {
    title: "Chambre Étudiante Meublée à Louer proche UNIGOM",
    description: "Chambre sécurisée avec eau courante, électricité permanente, table d'étude et lit. À 5 minutes à pied du Campus du Lac.",
    imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80",
    type: "Produit",
    category: "Logement",
    price: 80000,
    status: "actif",
    deadline: "Libre fin du mois",
    ownerId: "seed_student_alain",
    ownerName: "Alain Kasereka",
    ownerPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    ownerIsPremium: true,
    campus: "Kyeshero / Lac"
  }
];

export async function seedInitialServicesIfEmpty() {
  try {
    const snap = await getDocs(collection(db, 'services'));
    if (snap.empty) {
      console.log('Seeding initial Goma university student listings...');
      for (const item of INITIAL_GOMA_SERVICES) {
        await addDoc(collection(db, 'services'), {
          ...item,
          likes: Math.floor(Math.random() * 25) + 3,
          createdAt: serverTimestamp()
        });
      }
      console.log('Seeded successfully!');
    }
  } catch (err) {
    console.warn('Auto-seed check note:', err);
  }
}
