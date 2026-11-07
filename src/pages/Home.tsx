import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { RouteLink } from '../components/RouteLink';
import { useLanguage } from '../context/useLanguage';
import { nailLooks, useNailLooks } from '../data/nailLooks';
import { PhotoZoom } from '../components/PhotoZoom';

type HomeProps = { navigate: (to: string) => void };

export function Home({ navigate }: HomeProps) {
  const { t } = useLanguage();
  const looks = useNailLooks();
  const heroPhoto = looks[0] ?? nailLooks[0];
  const titleFor = (look: typeof heroPhoto) => look.title || t(look.titleKey);
  const descriptionFor = (look: typeof heroPhoto) => look.description || t(look.textKey);
  return <main id="accueil">
    <section className="intro-hero" aria-labelledby="hero-title"><div className="hero-grain" aria-hidden="true" /><div className="hero-copy"><p className="eyebrow"><Sparkles size={14} /> {t('heroEyebrow')}</p><h1 id="hero-title">{t('heroTitleA')}<br /><em>{t('heroTitleB')}</em></h1><p className="hero-description">{t('heroDescription')}</p><RouteLink className="hero-link" to="/contact" navigate={navigate}>{t('heroCta')} <ArrowRight size={17} /></RouteLink><div className="hero-trust"><span><Check size={14} /> {t('proofOne')}</span><span><Check size={14} /> {t('proofTwo')}</span></div></div>
      <figure className="hero-art hero-photo"><PhotoZoom src={heroPhoto.image} alt={`${titleFor(heroPhoto)} — ${descriptionFor(heroPhoto)}`} priority /><figcaption className="hero-caption"><span>01 / 03</span><span>{t('heroCaption')}</span><ArrowRight size={15} /></figcaption></figure><div className="hero-side-note">{t('heroSide')}</div></section>
    <section className="home-gallery" aria-labelledby="home-gallery-title"><div className="home-gallery-heading"><div><p className="section-kicker">{t('homeGalleryEyebrow')}</p><h2 id="home-gallery-title">{t('homeGalleryTitle')} <em>{t('homeGalleryAccent')}</em></h2></div><p>{t('homeGalleryLead')}</p></div>
      <div className="nail-looks-grid">{looks.map((look) => <article className="nail-look-card" key={look.number}><div className="nail-look-image"><PhotoZoom src={look.image} alt={`${titleFor(look)} — ${descriptionFor(look)}`} /><span>{t(look.categoryKey)}</span></div><div className="nail-look-copy"><span className="nail-look-number">{look.number} / {t('palette')}</span><h3>{titleFor(look)}</h3><p>{descriptionFor(look)}</p></div></article>)}</div>
      <RouteLink className="gallery-view-all" to="/gallery" navigate={navigate}>{t('galleryAll')} <ArrowRight size={16} /></RouteLink>
    </section>
    <section className="values-section" id="engagements" aria-labelledby="values-title"><div className="values-visual"><div className="values-mark">PNS<span>.</span></div><p>{t('valueLess')}</p></div><div className="values-copy"><p className="section-kicker">{t('approach')}</p><h2 id="values-title">{t('valuesTitle')}<br /><em>{t('valuesAccent')}</em></h2><p>{t('valuesCopy')}</p><RouteLink className="hero-link" to="/uslugi" navigate={navigate}>{t('learnMore')} <ArrowRight size={17} /></RouteLink><div className="values-points"><span><Check size={15} /> {t('valueColor')}</span><span><Check size={15} /> {t('valueRitual')}</span><span><Check size={15} /> {t('valueThoughtful')}</span></div></div></section>
    <section className="quote-section"><p className="section-kicker">{t('proofReview')}</p><blockquote>{t('reviewQuote')}</blockquote><span>{t('reviewBy')}</span></section>
  </main>;
}
