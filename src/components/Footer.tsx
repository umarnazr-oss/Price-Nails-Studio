import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { RouteLink } from './RouteLink';
import { FacebookIcon } from './FacebookIcon';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getEmailHref, getMapHref, getPhoneHref, getWhatsAppHref } from '../data/contact';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useLanguage } from '../context/useLanguage';

type FooterProps = { navigate: (to: string) => void };

export function Footer({ navigate }: FooterProps) {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const emailAddress = settings.emailAddress;
  const emailHref = getEmailHref(emailAddress);
  const facebookHref = settings.facebookHref;
  const instagramHref = settings.instagramHref;
  const mapHref = getMapHref(settings.studioAddress);
  const phoneNumber = settings.phoneNumber;
  const phoneHref = getPhoneHref(phoneNumber);
  const whatsappHref = getWhatsAppHref(settings.whatsappNumber);
  const studioAddress = settings.studioAddress;

  return <footer className="store-footer">
    <div className="footer-main">
      <div className="footer-brand-block">
        <RouteLink className="wordmark footer-wordmark" to="/" navigate={navigate}>
          <span className="wordmark-main">PRICE NAILS</span><span className="wordmark-dot">STUDIO</span>
        </RouteLink>
        <p>{t('tagline')}<br />{t('footerMade')}</p>
        <div className="footer-social-links">
          {instagramHref && <a className="footer-social" href={instagramHref} aria-label="Instagram Price Nails Studio" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.1" /><circle cx="12" cy="12" r="4.1" /><circle className="instagram-dot" cx="17.7" cy="6.5" r="1.05" /></svg>
          </a>}
          {facebookHref && <a className="footer-social" href={facebookHref} aria-label="Facebook Price Nails Studio" target="_blank" rel="noreferrer"><FacebookIcon /></a>}
          {whatsappHref && <a className="footer-social whatsapp-social" href={whatsappHref} aria-label={t('whatsappTitle')} target="_blank" rel="noreferrer">
            <WhatsAppIcon />
          </a>}
          {emailHref && <a className="footer-social" href={emailHref} aria-label={`${t('contactEmail')} ${emailAddress}`} target="_blank" rel="noreferrer"><Mail size={17} /></a>}
        </div>
      </div>

      <div className="footer-column">
        <h3>{t('footerCustomers')}</h3>
        <RouteLink to="/uslugi" navigate={navigate}>{t('navServices')}</RouteLink>
        <RouteLink to="/gallery" navigate={navigate}>{t('navJournal')}</RouteLink>
        <RouteLink to="/brand" navigate={navigate}>{t('navAbout')}</RouteLink>
      </div>

      <div className="footer-column footer-contact-column">
        <h3>{t('footerHelp')}</h3>
        <RouteLink to="/contact" navigate={navigate}>{t('footerContact')}</RouteLink>
        {emailHref && <a href={emailHref} target="_blank" rel="noreferrer"><Mail size={13} /> {emailAddress}</a>}
        {phoneHref && <a href={phoneHref}><Phone size={13} /> {phoneNumber}</a>}
        {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={13} /> WhatsApp</a>}
        {mapHref && <a href={mapHref} target="_blank" rel="noreferrer"><MapPin size={13} /> {studioAddress}</a>}
      </div>

      <div className="footer-newsletter">
        <h3>{t('appointment')}</h3>
        <p>{t('contactLead')}</p>
        <RouteLink className="button-dark-link" to="/contact" navigate={navigate}>{t('contactUs')} <ArrowRight size={15} /></RouteLink>
      </div>
    </div>
    <div className="footer-bottom"><span>© 2026 PRICE NAILS STUDIO</span><span>{t('footerMade')}</span></div>
  </footer>;
}
