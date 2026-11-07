import { useEffect, useState } from 'react';

export type NailLook = {
  number: string;
  titleKey: string;
  textKey: string;
  categoryKey: string;
  image: string;
  title?: string;
  description?: string;
};

export const nailLooks: NailLook[] = [
  {
    number: '01', titleKey: 'storyRed', textKey: 'storyRedDesc', categoryKey: 'storyColor',
    image: 'https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '02', titleKey: 'storyNude', textKey: 'storyNudeDesc', categoryKey: 'storyGuide',
    image: 'https://images.unsplash.com/photo-1688583417757-9060cba25399?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '03', titleKey: 'storyRitual', textKey: 'storyRitualDesc', categoryKey: 'storyCare',
    image: 'https://images.unsplash.com/photo-1572814601679-4ef8f7b5ebd1?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '04', titleKey: 'storyPedicure', textKey: 'storyPedicureDesc', categoryKey: 'storyPedicure',
    image: 'https://images.unsplash.com/photo-1778098221994-015e8abb4336?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '05', titleKey: 'storyRuby', textKey: 'storyRubyDesc', categoryKey: 'storyColor',
    image: 'https://images.unsplash.com/photo-1727199433272-70fdb94c8430?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '06', titleKey: 'storyPowder', textKey: 'storyPowderDesc', categoryKey: 'storyGuide',
    image: 'https://images.unsplash.com/photo-1610992015762-45dca7fa3a85?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '07', titleKey: 'storyPolish', textKey: 'storyPolishDesc', categoryKey: 'storyCare',
    image: 'https://images.unsplash.com/photo-1699669646912-1593955f4424?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '08', titleKey: 'storyJewel', textKey: 'storyJewelDesc', categoryKey: 'storyColor',
    image: 'https://images.unsplash.com/photo-1720086137894-b34effd031a6?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '09', titleKey: 'storyOrchid', textKey: 'storyOrchidDesc', categoryKey: 'storyColor',
    image: 'https://images.unsplash.com/photo-1737214475292-949c0bf920b0?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '10', titleKey: 'storyAtelier', textKey: 'storyAtelierDesc', categoryKey: 'storyCare',
    image: 'https://images.unsplash.com/photo-1676926606566-58f2e00b592b?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '11', titleKey: 'storyIvory', textKey: 'storyIvoryDesc', categoryKey: 'storyGuide',
    image: 'https://images.unsplash.com/photo-1633955726992-2b7c0d2d2a69?auto=format&fit=crop&w=1200&q=85',
  },
  {
    number: '12', titleKey: 'storyDelicate', textKey: 'storyDelicateDesc', categoryKey: 'storyGuide',
    image: 'https://images.unsplash.com/photo-1675453574976-fd2baeab95f3?auto=format&fit=crop&w=1200&q=85',
  },
];

type UploadedPhoto = { id: string; title: string; description: string; image: string; categoryKey?: string };

export function useNailLooks() {
  const [looks, setLooks] = useState(nailLooks);

  useEffect(() => {
    let active = true;
    fetch('/api/gallery', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<UploadedPhoto[]> : [])
      .then((uploads) => {
        if (!active || !Array.isArray(uploads)) return;
        const newLooks: NailLook[] = uploads.map((photo, index) => ({
          number: String(nailLooks.length + index + 1).padStart(2, '0'),
          titleKey: 'storyAtelier',
          textKey: 'storyAtelierDesc',
          categoryKey: photo.categoryKey || 'storyCare',
          image: photo.image,
          title: photo.title,
          description: photo.description,
        }));
        setLooks([...nailLooks, ...newLooks]);
      })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  return looks;
}
