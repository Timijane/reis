import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface HomepageContent {
  logoUrl: string;
  brandName: string;
  brandSubtext: string;
  loginEyebrow: string;
  loginTitle: string;
  loginDescription: string;

  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;

  aboutEyebrow: string;
  aboutTitle: string;
  aboutText: string;

  featuredEyebrow: string;
  featuredTitle: string;
  featuredDescription: string;

  servicesEyebrow: string;
  servicesTitle: string;
  servicesDescription: string;

  processEyebrow: string;
  processTitle: string;

  galleryEyebrow: string;
  galleryTitle: string;

  testimonialEyebrow: string;
  testimonialTitle: string;

  finalCtaEyebrow: string;
  finalCtaTitle: string;
  finalCtaDescription: string;
  finalCtaButton: string;
}

export const defaultHomepageContent: HomepageContent = {
  logoUrl: "",
  brandName: "REIS EVENT",
  brandSubtext: "SERVICES",
  loginEyebrow: "ADMINISTRATION",
  loginTitle: "Welcome back.",
  loginDescription:
    "Sign in to manage your website and REIS Event Services operations.",

  heroEyebrow: "REIS EVENT SERVICES",
  heroTitle: "We style your event, You create memories!",
  heroDescription:
    "Elegant event styling, rentals and planning services designed to bring your celebration beautifully together.",
  heroPrimaryCta: "Explore Rentals",
  heroSecondaryCta: "Plan Your Event",

  aboutEyebrow: "ABOUT REIS",
  aboutTitle: "Thoughtful details. Beautiful occasions.",
  aboutText:
    "From intimate gatherings to memorable celebrations, REIS Event Services provides carefully selected event rentals and styling solutions that help create occasions worth remembering.",

  featuredEyebrow: "OUR RENTALS",
  featuredTitle: "Everything you need to style your occasion.",
  featuredDescription:
    "Discover our collection of event essentials, furniture, tableware, décor and styling pieces.",

  servicesEyebrow: "WHAT WE DO",
  servicesTitle: "More than rentals.",
  servicesDescription:
    "We help you bring the complete look and feel of your event together.",

  processEyebrow: "HOW IT WORKS",
  processTitle: "Simple planning. Beautiful results.",

  galleryEyebrow: "OUR WORK",
  galleryTitle: "Celebrations styled by REIS.",

  testimonialEyebrow: "KIND WORDS",
  testimonialTitle: "Loved by our clients.",

  finalCtaEyebrow: "LET'S CREATE SOMETHING BEAUTIFUL",
  finalCtaTitle: "Your event deserves thoughtful styling.",
  finalCtaDescription:
    "Tell us what you are planning and let us help you bring your vision together.",
  finalCtaButton: "Make an Enquiry",
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
