export type Lang = "da" | "en";

export const translations = {
  da: {
    // Navbar
    shop:          "SHOP",
    sell:          "SÆLG",
    plusSell:      "+ SÆLG",
    favorites:     "FAVORITTER",
    favShort:      "FAV.",
    messages:      "BESKEDER",
    dashboard:     "DASHBOARD",
    profile:       "PROFIL",
    searchPlaceholder: "SØG: brand, model, farve...",

    // Hero
    heroCta:       "UDFORSK UDVALG",
    heroSell:      "OPRET ANNONCE",
    heroSub:       "Danmarks marketplace for streetwear. Hypede drops, arkiv-gems og grails — handlet peer-to-peer.",

    // Section headers
    newDrops:      "NYE DROPS",
    newDropsSub:   "Nyeste listings fra verificerede sælgere.",
    catalog:       "UDVALG",
    catalogSub:    "Hele kataloget. Filtreret som du vil.",
    viewAll:       "SE ALLE",
    browseAll:     "BROWSE ALT",

    // Item page actions
    buyNow:        "KØB NU",
    makeOffer:     "GIV BUD",
    sendMessage:   "SKRIV BESKED",
    messaging:     "VENTER...",
    save:          "GEM",
    saved:         "GEMT",
    sendOffer:     "SEND BUD",

    // Item page labels
    size:          "Størrelse",
    condition:     "Stand",
    category:      "Kategori",
    description:   "BESKRIVELSE",
    verifiedTitle: "Verificeret af Nord Studios",
    verifiedDesc:  "Autentificitet bekræftet. Penge frigives efter levering.",
    paymentNote:   "Sikker betaling via Stripe · Pengene frigives ved levering · Returfrist 3 dage",

    // Seller
    seller:        "SÆLGER",
    writeSeller:   "SKRIV TIL SÆLGER",
    viewProfile:   "SE PROFIL →",
    memberSince:   "Siden",

    // Misc
    views:         "visninger",
  },
  en: {
    // Navbar
    shop:          "SHOP",
    sell:          "SELL",
    plusSell:      "+ SELL",
    favorites:     "FAVORITES",
    favShort:      "FAV.",
    messages:      "MESSAGES",
    dashboard:     "DASHBOARD",
    profile:       "PROFILE",
    searchPlaceholder: "SEARCH: brand, model, colour...",

    // Hero
    heroCta:       "EXPLORE SELECTION",
    heroSell:      "CREATE LISTING",
    heroSub:       "Denmark's marketplace for streetwear. Hyped drops, archive gems and grails — traded peer-to-peer.",

    // Section headers
    newDrops:      "NEW DROPS",
    newDropsSub:   "Latest listings from verified sellers.",
    catalog:       "SELECTION",
    catalogSub:    "The full catalogue. Filtered your way.",
    viewAll:       "VIEW ALL",
    browseAll:     "BROWSE ALL",

    // Item page actions
    buyNow:        "BUY NOW",
    makeOffer:     "MAKE OFFER",
    sendMessage:   "MESSAGE SELLER",
    messaging:     "LOADING...",
    save:          "SAVE",
    saved:         "SAVED",
    sendOffer:     "SEND OFFER",

    // Item page labels
    size:          "Size",
    condition:     "Condition",
    category:      "Category",
    description:   "DESCRIPTION",
    verifiedTitle: "Verified by Nord Studios",
    verifiedDesc:  "Authenticity confirmed. Funds released upon delivery.",
    paymentNote:   "Secure payment via Stripe · Funds released on delivery · 3-day return policy",

    // Seller
    seller:        "SELLER",
    writeSeller:   "MESSAGE SELLER",
    viewProfile:   "VIEW PROFILE →",
    memberSince:   "Since",

    // Misc
    views:         "views",
  },
} as const;

export type TranslationKey = keyof typeof translations.da;
