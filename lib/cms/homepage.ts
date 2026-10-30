import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
}

export interface HomepageImageItem {
  id: string;
  title: string;
  image: string;
  href: string;
  alt: string;
  visible: boolean;
}

export interface HomepagePalette {
  cream: string;
  paper: string;
  ink: string;
  muted: string;
  olive: string;
  footer: string;
}

export interface HomepageGradient {
  enabled: boolean;
  start: string;
  end: string;
  direction: string;
  target: "footer" | "cta";
  mode: "solid" | "gradient";
}

export type SocialPlatform =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin"
  | "pinterest"
  | "email"
  | "phone"
  | "custom";

export type SocialLinkStyle =
  | "text"
  | "logo"
  | "logo-text"
  | "solid"
  | "outline"
  | "icon";

export type SocialLinkPlacement = "landing" | "footer" | "both";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  visible: boolean;
  placement: SocialLinkPlacement;
  style: SocialLinkStyle;
}

export interface HomepageContent {
  logoUrl: string;
  heroImage: string;

  brandName: string;
  brandSubtext: string;
  announcement: string;

  navItems: NavItem[];

  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroPrimaryHref: string;
  heroSecondaryCta: string;
  heroSecondaryHref: string;
  heroNote: string;

  featuredEyebrow: string;
  featuredTitle: string;
  featuredDescription: string;
  rentalViewText: string;
  rentalsHref: string;
  rentalCards: HomepageImageItem[];

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
  servicesCtaHref: string;

  service1Title: string;
  service1Text: string;
  service2Title: string;
  service2Text: string;
  service3Title: string;
  service3Text: string;

  galleryEyebrow: string;
  galleryTitle: string;
  galleryDescription: string;
  galleryItems: HomepageImageItem[];

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
  aboutCtaHref: string;
  aboutImage: string;

  finalCtaEyebrow: string;
  finalCtaTitle: string;
  finalCtaDescription: string;
  finalCtaCall: string;
  finalCtaWhatsapp: string;
  socialLinks: SocialLink[];

  footerTagline: string;
  footerImage: string;
  phone1: string;
  phone2: string;
  email: string;
  copyrightName: string;
  footerCategory: string;
  footerYearPrefix: string;

  palette: HomepagePalette;
  homepageGradient: HomepageGradient;
}

const rentalDefaults: HomepageImageItem[] = [
  {
    id: "rental-1",
    title: "Marquee",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85",
    href: "#contact",
    alt: "Marquee and event setting",
    visible: true,
  },
  {
    id: "rental-2",
    title: "Foldable Chairs",
    image:
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85",
    href: "#contact",
    alt: "Event seating",
    visible: true,
  },
  {
    id: "rental-3",
    title: "Chiavari Chairs",
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85",
    href: "#contact",
    alt: "Elegant event chairs",
    visible: true,
  },
  {
    id: "rental-4",
    title: "Tables",
    image:
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85",
    href: "#contact",
    alt: "Event tables and seating",
    visible: true,
  },
  {
    id: "rental-5",
    title: "Arches & Florals",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
    href: "#contact",
    alt: "Floral event styling",
    visible: true,
  },
  {
    id: "rental-6",
    title: "Catering Hire",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85",
    href: "#contact",
    alt: "Catering and event essentials",
    visible: true,
  },
];

const galleryDefaults: HomepageImageItem[] = [
  {
    id: "gallery-1",
    title: "Celebration details",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
    href: "",
    alt: "Celebration setting",
    visible: true,
  },
  {
    id: "gallery-2",
    title: "Event styling",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85",
    href: "",
    alt: "Styled event venue",
    visible: true,
  },
  {
    id: "gallery-3",
    title: "Table styling",
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85",
    href: "",
    alt: "Elegant table setting",
    visible: true,
  },
  {
    id: "gallery-4",
    title: "Event seating",
    image:
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85",
    href: "",
    alt: "Event seating arrangement",
    visible: true,
  },
  {
    id: "gallery-5",
    title: "Catering details",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85",
    href: "",
    alt: "Catering details",
    visible: true,
  },
];

export const defaultHomepageContent: HomepageContent = {
  logoUrl: "",
  heroImage:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=90",

  brandName: "REIS EVENT",
  brandSubtext: "SERVICES",
  announcement:
    "Event rentals & styling across the UK ✦ We style your event, You create memories!",

  navItems: [
    { id: "home", label: "Home", href: "#home", visible: true },
    { id: "rentals", label: "Rentals", href: "#rentals", visible: true },
    { id: "services", label: "Services", href: "#services", visible: true },
    { id: "work", label: "Our Work", href: "#work", visible: true },
    { id: "about", label: "About", href: "#about", visible: true },
    { id: "contact", label: "Talk to us", href: "#contact", visible: true },
  ],

  heroEyebrow: "EVENT RENTALS · STYLING · DETAILS",
  heroTitle: "We style your event. You create memories.",
  heroDescription:
    "Beautifully considered rentals and event essentials for celebrations that deserve to feel unforgettable.",
  heroPrimaryCta: "Explore rentals",
  heroPrimaryHref: "/explore",
  heroSecondaryCta: "Talk to us",
  heroSecondaryHref: "#contact",
  heroNote: "CURATED FOR YOUR MOMENT",

  featuredEyebrow: "OUR RENTALS",
  featuredTitle: "Everything your event needs.",
  featuredDescription:
    "Explore a growing collection of event furniture, décor, catering essentials and finishing touches. Our catalogue will be fully managed from the REIS Event admin studio.",
  rentalViewText: "View collection ↗",
  rentalsHref: "/explore",
  rentalCards: rentalDefaults,

  rental1Name: rentalDefaults[0].title,
  rental1Image: rentalDefaults[0].image,
  rental2Name: rentalDefaults[1].title,
  rental2Image: rentalDefaults[1].image,
  rental3Name: rentalDefaults[2].title,
  rental3Image: rentalDefaults[2].image,
  rental4Name: rentalDefaults[3].title,
  rental4Image: rentalDefaults[3].image,
  rental5Name: rentalDefaults[4].title,
  rental5Image: rentalDefaults[4].image,
  rental6Name: rentalDefaults[5].title,
  rental6Image: rentalDefaults[5].image,

  servicesEyebrow: "THE REIS EVENT APPROACH",
  servicesTitle: "Beautiful details. Thoughtfully arranged.",
  servicesDescription:
    "Whether you are planning an intimate celebration or a larger event, we help you create an atmosphere your guests will remember.",
  servicesCta: "Start planning",
  servicesCtaHref: "#contact",

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
  galleryItems: galleryDefaults,
  gallery1Image: galleryDefaults[0].image,
  gallery2Image: galleryDefaults[1].image,
  gallery3Image: galleryDefaults[2].image,
  gallery4Image: galleryDefaults[3].image,
  gallery5Image: galleryDefaults[4].image,

  aboutEyebrow: "ABOUT REIS EVENT",
  aboutTitle: "Set the scene. Make it yours.",
  aboutText1:
    "REIS Event Services is built around one simple idea: event hire should feel as considered as the event itself.",
  aboutText2:
    "From furniture and table settings to florals, marquees and catering essentials, the collection will grow with the needs of the business.",
  aboutCta: "Discover more",
  aboutCtaHref: "#contact",
  aboutImage:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85",

  finalCtaEyebrow: "LET'S CREATE SOMETHING BEAUTIFUL",
  finalCtaTitle: "Ready to style your event?",
  finalCtaDescription:
    "Tell us what you are planning and let's make the details memorable.",
  finalCtaCall: "Call us",
  finalCtaWhatsapp: "WhatsApp",
  socialLinks: [
    {
      id: "whatsapp-main",
      platform: "whatsapp",
      label: "WhatsApp",
      url: "https://wa.me/447470532855",
      visible: true,
      placement: "both",
      style: "solid",
    },
    {
      id: "phone-main",
      platform: "phone",
      label: "Call us",
      url: "07470 532855",
      visible: true,
      placement: "both",
      style: "logo-text",
    },
    {
      id: "phone-secondary",
      platform: "phone",
      label: "Alternative phone",
      url: "07961 399636",
      visible: true,
      placement: "footer",
      style: "text",
    },
    {
      id: "email-main",
      platform: "email",
      label: "Email",
      url: "Mhiz services@gmail.com",
      visible: true,
      placement: "both",
      style: "text",
    },
  ],

  footerTagline: "We style your event, You create memories!",
  footerImage: "",
  phone1: "07470 532855",
  phone2: "07961 399636",
  email: "Mhiz services@gmail.com",
  copyrightName: "REIS Event Services",
  footerCategory: "Event rentals & styling",
  footerYearPrefix: "©",

  palette: {
    cream: "#f3f0ea",
    paper: "#faf9f6",
    ink: "#161614",
    muted: "#77756e",
    olive: "#68765b",
    footer: "#161614",
  },
  homepageGradient: {
    enabled: false,
    start: "#F7E7CE",
    end: "#C5A572",
    direction: "135deg",
    target: "footer",
    mode: "solid",
  },
};

const homepageRef = doc(db, "siteContent", "homepage");

function normaliseImageItems(
  value: unknown,
  fallback: HomepageImageItem[]
): HomepageImageItem[] {
  if (!Array.isArray(value)) return fallback;

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item, index) => ({
      id:
        typeof item.id === "string" && item.id
          ? item.id
          : `image-${index + 1}`,
      title: typeof item.title === "string" ? item.title : "",
      image: typeof item.image === "string" ? item.image : "",
      href: typeof item.href === "string" ? item.href : "",
      alt: typeof item.alt === "string" ? item.alt : "",
      visible: item.visible !== false,
    }));
}

function normaliseSocialLinks(
  value: unknown,
  fallback: SocialLink[]
): SocialLink[] {
  if (!Array.isArray(value)) return fallback;

  const platforms: SocialPlatform[] = [
    "whatsapp", "instagram", "facebook", "tiktok", "youtube",
    "x", "linkedin", "pinterest", "email", "phone", "custom",
  ];
  const styles: SocialLinkStyle[] = [
    "text", "logo", "logo-text", "solid", "outline", "icon",
  ];
  const placements: SocialLinkPlacement[] = [
    "landing", "footer", "both",
  ];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item, index) => ({
      id: typeof item.id === "string" && item.id
        ? item.id
        : `social-${index + 1}`,
      platform: platforms.includes(item.platform as SocialPlatform)
        ? item.platform as SocialPlatform
        : "custom",
      label: typeof item.label === "string" ? item.label : "",
      url: typeof item.url === "string" ? item.url : "",
      visible: item.visible !== false,
      placement: placements.includes(item.placement as SocialLinkPlacement)
        ? item.placement as SocialLinkPlacement
        : "both",
      style: styles.includes(item.style as SocialLinkStyle)
        ? item.style as SocialLinkStyle
        : "logo-text",
    }));
}

export async function getHomepageContent(): Promise<HomepageContent> {
  const snapshot = await getDoc(homepageRef);

  if (!snapshot.exists()) {
    return defaultHomepageContent;
  }

  const data = snapshot.data() as Partial<HomepageContent> &
    Record<string, unknown>;

  const legacyRentals: HomepageImageItem[] = [
    {
      ...rentalDefaults[0],
      title: typeof data.rental1Name === "string" ? data.rental1Name : rentalDefaults[0].title,
      image: typeof data.rental1Image === "string" ? data.rental1Image : rentalDefaults[0].image,
    },
    {
      ...rentalDefaults[1],
      title: typeof data.rental2Name === "string" ? data.rental2Name : rentalDefaults[1].title,
      image: typeof data.rental2Image === "string" ? data.rental2Image : rentalDefaults[1].image,
    },
    {
      ...rentalDefaults[2],
      title: typeof data.rental3Name === "string" ? data.rental3Name : rentalDefaults[2].title,
      image: typeof data.rental3Image === "string" ? data.rental3Image : rentalDefaults[2].image,
    },
    {
      ...rentalDefaults[3],
      title: typeof data.rental4Name === "string" ? data.rental4Name : rentalDefaults[3].title,
      image: typeof data.rental4Image === "string" ? data.rental4Image : rentalDefaults[3].image,
    },
    {
      ...rentalDefaults[4],
      title: typeof data.rental5Name === "string" ? data.rental5Name : rentalDefaults[4].title,
      image: typeof data.rental5Image === "string" ? data.rental5Image : rentalDefaults[4].image,
    },
    {
      ...rentalDefaults[5],
      title: typeof data.rental6Name === "string" ? data.rental6Name : rentalDefaults[5].title,
      image: typeof data.rental6Image === "string" ? data.rental6Image : rentalDefaults[5].image,
    },
  ];

  const legacyGallery = galleryDefaults.map((item, index) => {
    const key = `gallery${index + 1}Image` as keyof HomepageContent;
    const savedImage = data[key];

    return {
      ...item,
      image:
        typeof savedImage === "string" && savedImage
          ? savedImage
          : item.image,
    };
  });

  const savedPalette = data.palette as Partial<HomepagePalette> | undefined;

  return {
    ...defaultHomepageContent,
    ...data,

    navItems:
      Array.isArray(data.navItems) && data.navItems.length > 0
        ? data.navItems as NavItem[]
        : defaultHomepageContent.navItems,

    rentalCards: normaliseImageItems(data.rentalCards, legacyRentals),
    galleryItems: normaliseImageItems(data.galleryItems, legacyGallery),
    socialLinks: normaliseSocialLinks(data.socialLinks, defaultHomepageContent.socialLinks),

    palette: {
      ...defaultHomepageContent.palette,
      ...(savedPalette ?? {}),
    },
    homepageGradient: {
      ...defaultHomepageContent.homepageGradient,
      ...(data.homepageGradient &&
      typeof data.homepageGradient === "object"
        ? data.homepageGradient as Partial<HomepageGradient>
        : {}),
      mode: data.homepageGradient &&
        typeof data.homepageGradient === "object" &&
        (data.homepageGradient as unknown as Record<string, unknown>).mode === "gradient"
          ? "gradient"
          : "solid",
    },
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
