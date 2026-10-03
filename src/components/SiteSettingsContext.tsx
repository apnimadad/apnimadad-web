"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { TopDonor, topDonors as defaultTopDonors } from "@/lib/mock-data";

export interface SiteAnnouncement {
  enabled: boolean;
  message: string;
  type: "emergency" | "update" | "drive";
  linkText?: string;
  linkUrl?: string;
}

export interface SiteSettings {
  heroBadgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  announcement: SiteAnnouncement;
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
  helplinePhone: "+91 98765 43210",
  whatsappHelpline: "919876543210",
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
  resetSettings: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null);

const STORAGE_KEY_DONORS = "apni_madad_site_donors";
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDonors(parsed);
        }
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
