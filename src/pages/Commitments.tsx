import { ArrowRight, Check, Heart, Leaf, Recycle, Sparkles } from 'lucide-react';
import { RouteLink } from '../components/RouteLink';
import { useLanguage } from '../context/useLanguage';
type CommitmentsProps = { navigate: (to: string) => void };
const values = [
  { icon: Sparkles, titleKey: 'valueColor', textKey: 'valueColorDesc' },
  { icon: Heart, titleKey: 'valueRitual', textKey: 'valueRitualDesc' },
  { icon: Leaf, titleKey: 'valueThoughtful', textKey: 'valueThoughtfulDesc' },
  { icon: Recycle, titleKey: 'valueLess', textKey: 'valueLessDesc' },
];
export function Commitments({ navigate }: CommitmentsProps) {
  const { t } = useLanguage();
  return <main className="page-shell commitments-page"><p className="section-kicker">{t('brandEyebrow')}</p><h1 className="page-title">{t('brandTitle')}<br /><em>{t('brandAccent')}</em></h1><p className="commitments-lead">{t('brandLead')}</p><div className="commitments-grid">{values.map(({ icon: Icon, titleKey, textKey }, index) => <article className="commitment-card" key={titleKey}><span className="commitment-index">0{index + 1}</span><Icon size={22} strokeWidth={1.4} /><h2>{t(titleKey)}</h2><p>{t(textKey)}</p></article>)}</div><div className="commitment-note"><Check size={18} /><p>{t('compositionNote')}</p></div><RouteLink className="hero-link" to="/uslugi" navigate={navigate}>{t('viewServices')} <ArrowRight size={16} /></RouteLink></main>;
}
