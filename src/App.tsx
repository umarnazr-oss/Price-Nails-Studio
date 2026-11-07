import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Contact } from './pages/Contact';
import { Commitments } from './pages/Commitments';
import { Journal } from './pages/Journal';
import { Services } from './pages/Services';
import { NotFound } from './pages/NotFound';
import { Admin } from './pages/Admin';
import './App.css';

const getPathname = () => window.location.pathname.replace(/\/+$/, '') || '/';

function App() {
  const [pathname, setPathname] = useState(getPathname);
  const navigate = useCallback((to: string) => {
    const destination = to.replace(/\/+$/, '') || '/';
    if (getPathname() !== destination) window.history.pushState({}, '', destination);
    setPathname(destination);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  useEffect(() => {
    const handlePopState = () => setPathname(getPathname());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (pathname === '/admin') return <Admin />;

  let page;
  if (pathname === '/') page = <Home navigate={navigate} />;
  else if (pathname === '/uslugi') page = <Services navigate={navigate} />;
  else if (pathname === '/contact') page = <Contact navigate={navigate} />;
  else if (pathname === '/brand') page = <Commitments navigate={navigate} />;
  else if (pathname === '/gallery' || pathname === '/journal') page = <Journal navigate={navigate} />;
  else page = <NotFound navigate={navigate} />;

  return <><Header navigate={navigate} />{page}<Footer navigate={navigate} /></>;
}
export default App;
