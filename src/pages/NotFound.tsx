import { ArrowLeft } from 'lucide-react';
import { RouteLink } from '../components/RouteLink';
import { useLanguage } from '../context/useLanguage';
type NotFoundProps = { navigate: (to: string) => void };
export function NotFound({ navigate }: NotFoundProps) { const { t } = useLanguage(); return <main className="page-shell not-found-page"><p className="section-kicker">{t('notFoundEyebrow')}</p><h1 className="page-title">{t('notFoundTitle')}</h1><p>{t('notFoundDesc')}</p><RouteLink className="back-to-shop" to="/" navigate={navigate}><ArrowLeft size={15} /> {t('homeButton')}</RouteLink></main>; }
