"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { TopDonor } from "@/types/database";

const defaultTopDonors: TopDonor[] = [
  {
    id: "td-1",
    name: "Vikram Mehta",
    amount: 50000,
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    caseTitle: "Pediatric Heart Surgery",
  },
  {
    id: "td-2",
    name: "Dr. Ananya Roy",
    amount: 35000,
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
    caseTitle: "Cancer Chemotherapy Support",
  },
  {
    id: "td-3",
    name: "Rajesh Singhania",
    amount: 25000,
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    caseTitle: "Orphan Education Care",
  },
  {
    id: "td-4",
    name: "Sanjay K. Verma",
    amount: 45000,
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    caseTitle: "Brain Trauma ICU Care",
  },
  {
    id: "td-5",
    name: "Pooja Agarwal",
    amount: 30000,
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    caseTitle: "Neonatal Incubator Relief",
  },
  {
    id: "td-6",
    name: "Harish Chandran",
    amount: 21000,
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    caseTitle: "Kidney Dialysis Support",
  },
  {
    id: "td-7",
    name: "Sunita Deshmukh",
    amount: 20000,
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    caseTitle: "Spinal Rehabilitation Aid",
  },
  {
    id: "td-8",
    name: "Mohammad Farhan",
    amount: 18500,
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop",
    caseTitle: "Urgent Bone Marrow Aid",
  },
  {
    id: "td-9",
    name: "Kavita Chawla",
    amount: 15000,
    photoUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&h=100&fit=crop",
    caseTitle: "Pediatric Eye Surgery",
  },
  {
    id: "td-10",
    name: "Amitabh Sengupta",
    amount: 40000,
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    caseTitle: "Accidental Trauma Relief",
  },
];

export interface SiteAnnouncement {
  enabled: boolean;
  message: string;
  type: "emergency" | "update" | "drive";
  linkText?: string;
  linkUrl?: string;
}

export interface DirectDonationOption {
  enabled: boolean;
  upiId: string;
  accountName: string;
  qrCodeUrl: string;
  title: string;
  subtitle: string;
}

export interface SiteSettings {
  heroBadgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  announcement: SiteAnnouncement;
  directDonation: DirectDonationOption;
  helplinePhone: string;
  whatsappHelpline: string;
  totalLivesImpacted: number;
  totalDirectTransferred: number;
}

const defaultSiteSettings: SiteSettings = {
  heroBadgeText: "100% Direct Donation · ₹0 Platform Fee",
  heroTitle: "Direct Help, Zero Commission.",
  heroSubtitle:
    "Connect directly with verified medical and emergency cases across India. Send donations straight to the patient or hospital bank account with complete transparency.",
  announcement: {
    enabled: true,
    message: "Urgent Medical Appeal: ICU & cardiac pediatric cases verified for direct hospital transfer.",
    type: "emergency",
    linkText: "View Cases",
    linkUrl: "/cases",
  },
  directDonation: {
    enabled: true,
    upiId: "akkyc5@ybl",
    accountName: "ANKIT KUMAR",
    qrCodeUrl: "/foundation-qr.jpg",
    title: "Direct Foundation Donation",
    subtitle: "Scan with PhonePe, Google Pay, or Paytm to support our zero-commission medical relief mission directly.",
  },
  helplinePhone: "+91 93769 98999",
  whatsappHelpline: "919376998999",
  totalLivesImpacted: 2450,
  totalDirectTransferred: 12850000,
};

interface SiteSettingsContextType {
  donors: TopDonor[];
  settings: SiteSettings;
  updateDonor: (id: string, updates: Partial<TopDonor>) => void;
  addDonor: (donor: Omit<TopDonor, "id">) => void;
  deleteDonor: (id: string) => void;
  resetDonors: () => void;
  updateSettings: (updates: Partial<SiteSettings>) => void;
  updateAnnouncement: (updates: Partial<SiteAnnouncement>) => void;
  updateDirectDonation: (updates: Partial<DirectDonationOption>) => void;
  resetSettings: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null);

const STORAGE_KEY_DONORS = "apni_madad_site_donors_v2";
const STORAGE_KEY_SETTINGS = "apni_madad_site_settings";

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [donors, setDonors] = useState<TopDonor[]>(defaultTopDonors);
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  // Load saved customizations from local storage
  useEffect(() => {
    try {
      const savedDonors = localStorage.getItem(STORAGE_KEY_DONORS);
      if (savedDonors) {
        const parsed = JSON.parse(savedDonors);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          setDonors(parsed);
        } else {
          setDonors(defaultTopDonors);
          localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(defaultTopDonors));
        }
      } else {
        localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(defaultTopDonors));
      }

      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed === "object") {
          setSettings((prev) => ({
            ...prev,
            ...parsed,
            announcement: {
              ...prev.announcement,
              ...(parsed.announcement || {}),
            },
            directDonation: {
              ...prev.directDonation,
              ...(parsed.directDonation || {}),
            },
          }));
        }
      }
    } catch (err) {
      console.warn("Could not load site customizations:", err);
    }
  }, []);

  // Save donors when modified
  const saveDonors = useCallback((newDonors: TopDonor[]) => {
    setDonors(newDonors);
    try {
      localStorage.setItem(STORAGE_KEY_DONORS, JSON.stringify(newDonors));
    } catch (err) {
      console.warn("Failed to persist donors:", err);
    }
  }, []);

  // Save settings when modified
  const saveSettings = useCallback((newSettings: SiteSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch (err) {
      console.warn("Failed to persist site settings:", err);
    }
  }, []);

  const updateDonor = useCallback(
    (id: string, updates: Partial<TopDonor>) => {
      const updated = donors.map((d) => (d.id === id ? { ...d, ...updates } : d));
      saveDonors(updated);
    },
    [donors, saveDonors]
  );

  const addDonor = useCallback(
    (donor: Omit<TopDonor, "id">) => {
      const newDonor: TopDonor = {
        ...donor,
        id: "donor-" + Date.now(),
      };
      const updated = [newDonor, ...donors];
      saveDonors(updated);
    },
    [donors, saveDonors]
  );

  const deleteDonor = useCallback(
    (id: string) => {
      const updated = donors.filter((d) => d.id !== id);
      saveDonors(updated);
    },
    [donors, saveDonors]
  );

  const resetDonors = useCallback(() => {
    saveDonors(defaultTopDonors);
  }, [saveDonors]);

  const updateSettings = useCallback(
    (updates: Partial<SiteSettings>) => {
      const updated = { ...settings, ...updates };
      saveSettings(updated);
    },
    [settings, saveSettings]
  );

  const updateAnnouncement = useCallback(
    (updates: Partial<SiteAnnouncement>) => {
      const updated: SiteSettings = {
        ...settings,
        announcement: {
          ...settings.announcement,
          ...updates,
        },
      };
      saveSettings(updated);
    },
    [settings, saveSettings]
  );

  const updateDirectDonation = useCallback(
    (updates: Partial<DirectDonationOption>) => {
      const updated: SiteSettings = {
        ...settings,
        directDonation: {
          ...settings.directDonation,
          ...updates,
        },
      };
      saveSettings(updated);
    },
    [settings, saveSettings]
  );

  const resetSettings = useCallback(() => {
    saveSettings(defaultSiteSettings);
  }, [saveSettings]);

  return (
    <SiteSettingsContext.Provider
      value={{
        donors,
        settings,
        updateDonor,
        addDonor,
        deleteDonor,
        resetDonors,
        updateSettings,
        updateAnnouncement,
        updateDirectDonation,
        resetSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
}
