import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultSiteSettings, type SiteSettings } from '../data/contact';

type SiteSettingsContextValue = {
  settings: SiteSettings;
  setSettings: (settings: SiteSettings) => void;
  loading: boolean;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

function mergeSettings(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  return {
    ...defaultSiteSettings,
    ...value,
    servicePrices: { ...defaultSiteSettings.servicePrices, ...(value?.servicePrices ?? {}) },
  };
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/settings', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Settings unavailable');
        return response.json() as Promise<Partial<SiteSettings>>;
      })
      .then((value) => { if (active) setSettings(mergeSettings(value)); })
      .catch(() => { /* Keep the built-in settings if the API is unavailable. */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({ settings, setSettings, loading }), [settings, loading]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error('useSiteSettings must be used inside SiteSettingsProvider');
  return context;
}
