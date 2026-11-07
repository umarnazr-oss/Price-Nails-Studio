import { ArrowRight, Brush, Hand, Heart, Palette, Sparkles } from 'lucide-react';
import { services } from '../data/services';
import { RouteLink } from '../components/RouteLink';
import { useLanguage } from '../context/useLanguage';
import { useSiteSettings } from '../context/SiteSettingsContext';
type ServicesProps = { navigate: (to: string) => void };
const icons = { shade: Palette, manicure: Hand, design: Brush, care: Heart };
export function Services({ navigate }: ServicesProps) {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  return <main className="page-shell services-page"><p className="section-kicker">{t('serviceEyebrow')}</p><h1 className="page-title">{t('servicesTitle')} <em>Price Nails Studio.</em></h1><p className="services-lead">{t('servicesLead')}</p><div className="services-grid">{services.map((service, index) => { const Icon = icons[service.icon]; const price = settings.servicePrices[service.id]?.trim(); return <article className="service-card" key={service.id}><span className="service-index">0{index + 1}</span><div className="service-icon"><Icon size={24} strokeWidth={1.4} /></div><p className="service-note">{t(service.noteKey)}</p><h2>{t(service.titleKey)}</h2>{price && <p className="service-price">{price}</p>}<p className="service-description">{t(service.descriptionKey)}</p><RouteLink to="/contact" navigate={navigate}>{t('askDetails')} <ArrowRight size={15} /></RouteLink></article>; })}</div><div className="services-booking"><Sparkles size={20} /><div><h2>{t('serviceCtaTitle')}</h2><p>{t('serviceCtaDesc')}</p></div><RouteLink className="button-dark-link" to="/contact" navigate={navigate}>{t('contactUs')} <ArrowRight size={15} /></RouteLink></div><p className="services-disclaimer">{t('serviceDisclaimer')}</p></main>;
}
