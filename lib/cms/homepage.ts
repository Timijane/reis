import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface HomepageContent {
  logoUrl: string;
  heroImage: string;

  brandName: string;
  brandSubtext: string;
  announcement: string;

  navHome: string;
  navRentals: string;
  navServices: string;
  navWork: string;
  navAbout: string;
  navCta: string;

  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroNote: string;

  featuredEyebrow: string;
  featuredTitle: string;
  featuredDescription: string;
  rentalViewText: string;

  rental1Name: string;
  rental1Image: string;
  rental2Name: string;
  rental2Image: string;
  rental3Name: string;
  rental3Image: string;
  rental4Name: string;
  rental4Image: string;
  rental5Name: string;
  rental5Image: string;
  rental6Name: string;
  rental6Image: string;

  servicesEyebrow: string;
  servicesTitle: string;
  servicesDescription: string;
  servicesCta: string;

  service1Title: string;
  service1Text: string;
  service2Title: string;
  service2Text: string;
  service3Title: string;
  service3Text: string;

  galleryEyebrow: string;
  galleryTitle: string;
  galleryDescription: string;
  gallery1Image: string;
  gallery2Image: string;
  gallery3Image: string;
  gallery4Image: string;
  gallery5Image: string;

  aboutEyebrow: string;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  aboutCta: string;
  aboutImage: string;

  finalCtaEyebrow: string;
  finalCtaTitle: string;
  finalCtaDescription: string;
  finalCtaCall: string;
  finalCtaWhatsapp: string;

  footerTagline: string;
  phone1: string;
  phone2: string;
  email: string;
  copyrightName: string;
  footerCategory: string;
  footerYearPrefix: string;
}

export const defaultHomepageContent: HomepageContent = {
  logoUrl: "",
  heroImage:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=90",

  brandName: "REIS EVENT",
  brandSubtext: "SERVICES",
  announcement:
    "Event rentals & styling across the UK ✦ We style your event, You create memories!",

  navHome: "Home",
  navRentals: "Rentals",
  navServices: "Services",
  navWork: "Our Work",
  navAbout: "About",
  navCta: "Talk to us",

  heroEyebrow: "EVENT RENTALS · STYLING · DETAILS",
  heroTitle: "We style your event. You create memories.",
  heroDescription:
    "Beautifully considered rentals and event essentials for celebrations that deserve to feel unforgettable.",
  heroPrimaryCta: "Explore rentals",
  heroSecondaryCta: "Talk to us",
  heroNote: "CURATED FOR YOUR MOMENT",

  featuredEyebrow: "OUR RENTALS",
  featuredTitle: "Everything your event needs.",
  featuredDescription:
    "Explore a growing collection of event furniture, décor, catering essentials and finishing touches. Our catalogue will be fully managed from the REIS Event admin studio.",
  rentalViewText: "View collection ↗",

  rental1Name: "Marquee",
  rental1Image:
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85",
  rental2Name: "Foldable Chairs",
  rental2Image:
    "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85",
  rental3Name: "Chiavari Chairs",
  rental3Image:
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85",
  rental4Name: "Tables",
  rental4Image:
    "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85",
  rental5Name: "Arches & Florals",
  rental5Image:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
  rental6Name: "Catering Hire",
  rental6Image:
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85",

  servicesEyebrow: "THE REIS EVENT APPROACH",
  servicesTitle: "Beautiful details. Thoughtfully arranged.",
  servicesDescription:
    "Whether you are planning an intimate celebration or a larger event, we help you create an atmosphere your guests will remember.",
  servicesCta: "Start planning",

  service1Title: "Event Rentals",
  service1Text:
    "Thoughtfully selected pieces for weddings, celebrations and memorable gatherings.",
  service2Title: "Event Styling",
  service2Text:
    "Bring your vision together with coordinated furniture, décor, florals and finishing details.",
  service3Title: "Event Essentials",
  service3Text:
    "From cooking equipment and tableware to marquees and covers, hire what your occasion needs.",

  galleryEyebrow: "OUR WORK",
  galleryTitle: "Moments, beautifully set.",
  galleryDescription:
    "A place for the owner to showcase real events, styled tablescapes, furniture and décor.",
  gallery1Image:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
  gallery2Image:
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85",
  gallery3Image:
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85",
  gallery4Image:
    "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85",
  gallery5Image:
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85",

  aboutEyebrow: "ABOUT REIS EVENT",
  aboutTitle: "Set the scene. Make it yours.",
  aboutText1:
    "REIS Event Services is built around one simple idea: event hire should feel as considered as the event itself.",
  aboutText2:
    "From furniture and table settings to florals, marquees and catering essentials, the collection will grow with the needs of the business.",
  aboutCta: "Discover more",
  aboutImage:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85",

  finalCtaEyebrow: "LET'S CREATE SOMETHING BEAUTIFUL",
  finalCtaTitle: "Ready to style your event?",
  finalCtaDescription:
    "Tell us what you are planning and let's make the details memorable.",
  finalCtaCall: "Call us",
  finalCtaWhatsapp: "WhatsApp",

  footerTagline: "We style your event, You create memories!",
  phone1: "07470 532855",
  phone2: "07961 399636",
  email: "Mhiz services@gmail.com",
  copyrightName: "REIS Event Services",
  footerCategory: "Event rentals & styling",
  footerYearPrefix: "©",
};

const homepageRef = doc(db, "siteContent", "homepage");

export async function getHomepageContent(): Promise<HomepageContent> {
  const snapshot = await getDoc(homepageRef);

  if (!snapshot.exists()) {
    return defaultHomepageContent;
  }

  return {
    ...defaultHomepageContent,
    ...(snapshot.data() as Partial<HomepageContent>),
  };
}

export async function saveHomepageContent(
  content: HomepageContent
): Promise<void> {
  await setDoc(
    homepageRef,
    {
      ...content,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
