import { ArrowRight } from 'lucide-react';
import { RouteLink } from '../components/RouteLink';
import { useLanguage } from '../context/useLanguage';
import { useNailLooks } from '../data/nailLooks';
import { PhotoZoom } from '../components/PhotoZoom';
type JournalProps = { navigate: (to: string) => void };

export function Journal({ navigate }: JournalProps) {
  const { t } = useLanguage();
  const nailLooks = useNailLooks();
  const titleFor = (item: typeof nailLooks[number]) => item.title || t(item.titleKey);
  const descriptionFor = (item: typeof nailLooks[number]) => item.description || t(item.textKey);
  return <main className="page-shell journal-page"><p className="section-kicker">{t('journalEyebrow')}</p><h1 className="page-title">{t('journalTitle')}</h1><p className="journal-lead">{t('journalLead')}</p>
    <div className="journal-grid">{nailLooks.map((item) => <article className="journal-card" key={item.number}>
      <div className={`journal-art journal-art-${item.number}`}><PhotoZoom src={item.image} alt={`${titleFor(item)} — ${descriptionFor(item)}`} /><span>{t(item.categoryKey)}</span></div>
      <div className="journal-card-copy"><span className="journal-number">{item.number} / {t('palette')}</span><h2>{titleFor(item)}</h2><p>{descriptionFor(item)}</p><RouteLink className="journal-shop-link" to="/contact" navigate={navigate}>{t('readStory')} <ArrowRight size={14} /></RouteLink></div>
    </article>)}</div>
    <RouteLink className="hero-link" to="/contact" navigate={navigate}>{t('appointment')} <ArrowRight size={16} /></RouteLink>
  </main>;
}
