import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowRight, Check, ChevronDown, MapPin, Menu, X } from 'lucide-react';
import { RouteLink } from './RouteLink';
import { getMapHref } from '../data/contact';
import { useSiteSettings } from '../context/SiteSettingsContext';
import type { Language } from '../context/language-context';
import { useLanguage } from '../context/useLanguage';

type HeaderProps = { navigate: (to: string) => void };

export const Header = ({ navigate }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageSwitcherRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageTriggerRef = useRef<HTMLButtonElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const { settings } = useSiteSettings();
  const mapHref = getMapHref(settings.studioAddress);
  const closeMenu = () => setMenuOpen(false);
  const languageOptions: { code: Language; label: string }[] = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
  ];

  useEffect(() => {
    if (!languageMenuOpen) return;

    languageMenuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!languageSwitcherRef.current?.contains(event.target as Node)) setLanguageMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [languageMenuOpen]);

  const handleLanguageMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setLanguageMenuOpen(false);
      languageTriggerRef.current?.focus();
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const options = [...(languageMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])];
    const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[nextIndex]?.focus();
  };
  const links = [
    { label: t('navHome'), href: '/' },
    { label: t('navServices'), href: '/uslugi' },
    { label: t('navAbout'), href: '/brand' },
    { label: t('navJournal'), href: '/gallery' },
    { label: t('footerContact'), href: '/contact' },
  ];

  return <>
    <div className="announcement-bar"><span>{t('shippingBanner')}</span><a className="announcement-location" href={mapHref} target="_blank" rel="noreferrer"><MapPin size={12} aria-hidden="true" />{settings.studioCity}</a><span className="announcement-divider" aria-hidden="true">✳</span><span className="announcement-tagline">{t('tagline')}</span></div>
    <header className="site-header">
      <div className="header-inner">
        <button className="icon-button mobile-menu-trigger" type="button" aria-label={menuOpen ? 'Close menu / Fermer le menu / Закрыть меню' : 'Open menu / Ouvrir le menu / Открыть меню'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        <RouteLink className="wordmark header-wordmark" to="/" navigate={navigate} onClick={closeMenu} aria-label="Price Nails Studio — nail studio"><span className="wordmark-main">PRICE NAILS</span><span className="wordmark-dot">STUDIO</span></RouteLink>
        <nav className="desktop-nav" aria-label={t('navHome')}>{links.map((link) => <RouteLink key={link.href} to={link.href} navigate={navigate}>{link.label}</RouteLink>)}</nav>
        <div className="header-actions">
          <div className="language-switcher" ref={languageSwitcherRef}>
            <button ref={languageTriggerRef} className="language-switcher-trigger" type="button" aria-label="Langue / Language / Язык" aria-haspopup="menu" aria-expanded={languageMenuOpen} onClick={() => setLanguageMenuOpen(!languageMenuOpen)}>
              {language.toUpperCase()} <ChevronDown size={13} aria-hidden="true" />
            </button>
            {languageMenuOpen && <div ref={languageMenuRef} className="language-options" id="language-options" role="menu" aria-label="Langue / Language / Язык" onKeyDown={handleLanguageMenuKeyDown}>
              {languageOptions.map((option) => <button key={option.code} type="button" role="menuitemradio" aria-checked={language === option.code} className="language-option" onClick={() => { setLanguage(option.code); setLanguageMenuOpen(false); languageTriggerRef.current?.focus(); }}>
                <span className="language-option-code">{option.code.toUpperCase()}</span><span>{option.label}</span>{language === option.code && <Check size={15} aria-hidden="true" />}
              </button>)}
            </div>}
          </div>
          <RouteLink className="header-cta" to="/contact" navigate={navigate}>{t('appointment')} <ArrowRight size={15} /></RouteLink>
        </div>
      </div>
      {menuOpen && <nav className="mobile-nav" aria-label={t('navHome')}>{links.map((link, index) => <RouteLink key={link.href} to={link.href} navigate={navigate} onClick={closeMenu}><span className="mobile-nav-index">0{index + 1}</span>{link.label}<ArrowRight size={16} /></RouteLink>)}<RouteLink className="mobile-nav-cta" to="/contact" navigate={navigate} onClick={closeMenu}>{t('appointment')}</RouteLink></nav>}
    </header>
  </>;
};
