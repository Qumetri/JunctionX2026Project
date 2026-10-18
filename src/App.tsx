import { useEffect, useSyncExternalStore } from 'react';
import { SiteLayout } from './components/SiteLayout';
import { ElderlyPage } from './pages/ElderlyPage';
import { HomePage } from './pages/HomePage';
import { MemberBenefitsPage } from './pages/MemberBenefitsPage';
import { MovingPage } from './pages/MovingPage';
import { MovingPlanPage } from './pages/MovingPlanPage';
import { PetCarePage } from './pages/PetCarePage';
import { RiskReportPage } from './pages/RiskReportPage';
import { TravelPage } from './pages/TravelPage';
import { routes, type Route } from './routes';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;

const pages: Record<Route, () => React.JSX.Element> = {
  home: HomePage,
  'risk-report': RiskReportPage,
  moving: MovingPage,
  'moving-plan': MovingPlanPage,
  travel: TravelPage,
  'pet-care': PetCarePage,
  seniors: ElderlyPage,
  'member-benefits': MemberBenefitsPage,
};

/** Any hash that isn't a page (like #services) is a section of the home page. */
function routeFor(hash: string): Route {
  const name = hash.slice(1);
  return (routes as readonly string[]).includes(name) ? (name as Route) : 'home';
}

function App() {
  const hash = useSyncExternalStore(subscribe, getHash);
  const route = routeFor(hash);
  const Page = pages[route];

  // Home sections only exist after the page swaps back, so scroll once they render.
  useEffect(() => {
    if (route !== 'home' || !hash || hash === '#top') {
      window.scrollTo({ top: 0 });
      return;
    }
    document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [route, hash]);

  return (
    <SiteLayout route={route}>
      <Page />
    </SiteLayout>
  );
}

export default App;
