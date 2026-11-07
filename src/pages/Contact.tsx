import type { FormEvent } from 'react';
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { FacebookIcon } from '../components/FacebookIcon';
import { RouteLink } from '../components/RouteLink';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { getEmailHref, getMapHref, getPhoneHref, getWhatsAppHref } from '../data/contact';
import { services } from '../data/services';
import { useLanguage } from '../context/useLanguage';
import { useSiteSettings } from '../context/SiteSettingsContext';

type ContactProps = { navigate: (to: string) => void };
const now = new Date();
const minBookingDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

export function Contact({ navigate }: ContactProps) {
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

  const handleBookingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const selectedService = services.find((service) => service.id === formData.get('service'));
    const date = String(formData.get('date') ?? '');
    const time = String(formData.get('time') ?? '');
    const note = String(formData.get('note') ?? '').trim();

    if (!selectedService || !name || !date || !time) return;

    const message = [
      t('bookingMessageIntro'),
      `${t('bookingName')}: ${name}`,
      `${t('bookingService')}: ${t(selectedService.titleKey)}`,
      `${t('bookingDate')}: ${date}`,
      `${t('bookingTime')}: ${time}`,
      note ? `${t('bookingNote')}: ${note}` : '',
    ].filter(Boolean).join('\n');

    if (!whatsappHref) {
      window.alert('Добавьте номер WhatsApp в админ-панели, чтобы отправить заявку.');
      return;
    }
    const bookingUrl = new URL(whatsappHref);
    bookingUrl.searchParams.set('text', message);
    window.open(bookingUrl.toString(), '_blank', 'noopener,noreferrer');
  };

  return <main className="page-shell contact-page">
    <p className="section-kicker">{t('contactEyebrow')}</p>
    <h1 className="page-title">{t('contactTitle')}</h1>
    <p className="contact-lead">{t('contactLead')}</p>

    <div className="contact-grid">
      {emailHref && <a className="contact-card" href={emailHref} target="_blank" rel="noreferrer">
        <span><Mail size={19} /></span>
        <h2>{t('contactEmail')}</h2>
        <p>{emailAddress}</p>
        <small>{t('responseTime')}</small>
        <ArrowRight size={16} />
      </a>}
      {phoneHref && <div className="contact-card phone-contact-card">
        <span><Phone size={19} /></span>
        <h2>{t('phoneTitle')}</h2>
        <a className="phone-placeholder" href={phoneHref}>{phoneNumber}</a>
        <small>{t('phoneHelp')}</small>
      </div>}
      {whatsappHref && <a className="contact-card" href={whatsappHref} target="_blank" rel="noreferrer">
        <span><MessageCircle size={19} /></span>
        <h2>{t('whatsappTitle')}</h2>
        <p>{t('whatsappLead')}</p>
        <small>{phoneNumber}</small>
        <ArrowRight size={16} />
      </a>}
      {mapHref && <a className="contact-card" href={mapHref} target="_blank" rel="noreferrer">
        <span><MapPin size={19} /></span>
        <h2>{t('addressTitle')}</h2>
        <p>{studioAddress}</p>
        <small>{t('openMap')}</small>
        <ArrowRight size={16} />
      </a>}
    </div>

    <div className="contact-social-links" aria-label={t('footerHelp')}>
      {whatsappHref && <a className="contact-social-link" href={whatsappHref} target="_blank" rel="noreferrer"><WhatsAppIcon size={19} /><span>{t('whatsappTitle')}</span></a>}
      {instagramHref && <a className="contact-social-link" href={instagramHref} target="_blank" rel="noreferrer"><svg className="instagram-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.1" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.7" cy="6.5" r="1.05" /></svg><span>Instagram</span></a>}
      {facebookHref && <a className="contact-social-link" href={facebookHref} target="_blank" rel="noreferrer"><FacebookIcon /><span>Facebook</span></a>}
      {emailHref && <a className="contact-social-link" href={emailHref} target="_blank" rel="noreferrer"><Mail size={18} aria-hidden="true" /><span>{t('contactEmail')}</span></a>}
    </div>

    <section className="booking-panel" aria-labelledby="booking-title">
      <p className="section-kicker">{t('appointment')}</p>
      <h2 id="booking-title">{t('bookingFormTitle')}</h2>
      <p className="booking-lead">{t('bookingFormLead')}</p>
      <form className="booking-form" onSubmit={handleBookingSubmit}>
        <label className="booking-field" htmlFor="booking-name">
          {t('bookingName')}
          <input id="booking-name" name="name" type="text" autoComplete="name" required />
        </label>
        <label className="booking-field" htmlFor="booking-service">
          {t('bookingService')}
          <select id="booking-service" name="service" defaultValue="" required>
            <option value="" disabled>{t('bookingServicePlaceholder')}</option>
            {services.map((service) => <option value={service.id} key={service.id}>{t(service.titleKey)}</option>)}
          </select>
        </label>
        <label className="booking-field" htmlFor="booking-date">
          {t('bookingDate')}
          <input id="booking-date" name="date" type="date" min={minBookingDate} required />
        </label>
        <label className="booking-field" htmlFor="booking-time">
          {t('bookingTime')}
          <input id="booking-time" name="time" type="time" required />
        </label>
        <label className="booking-field booking-field-wide" htmlFor="booking-note">
          {t('bookingNote')}
          <textarea id="booking-note" name="note" rows={3} placeholder={t('bookingNotePlaceholder')} />
        </label>
        <button className="booking-submit" type="submit">{t('bookingSubmit')} <ArrowRight size={16} /></button>
      </form>
    </section>

    <div className="contact-bottom">
      <RouteLink className="hero-link" to="/uslugi" navigate={navigate}>{t('viewServices')} <ArrowRight size={16} /></RouteLink>
    </div>
  </main>;
}
