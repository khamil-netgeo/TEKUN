import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const routeTitles: Record<string, { titleKey: string; subtitleKey?: string }> = {
  '/dashboard':              { titleKey: 'nav.dashboard' },
  '/module1/applications':   { titleKey: 'module1.applicationList', subtitleKey: 'module1.title' },
  '/module1/new':            { titleKey: 'module1.newApplication', subtitleKey: 'module1.title' },
  '/module2/dashboard':      { titleKey: 'module2.creditScore', subtitleKey: 'module2.title' },
  '/module2/scoring':        { titleKey: 'module2.approvalWorkflow', subtitleKey: 'module2.title' },
  '/module3/disbursement':   { titleKey: 'module3.disbursementList', subtitleKey: 'module3.title' },
  '/module3/authority':      { titleKey: 'module3.authorityMatrix', subtitleKey: 'module3.title' },
  '/module4/accounts':       { titleKey: 'module4.account360', subtitleKey: 'module4.title' },
  '/module4/payments':       { titleKey: 'module4.paymentChannels', subtitleKey: 'module4.title' },
  '/module5/npl':            { titleKey: 'module5.nplDashboard', subtitleKey: 'module5.title' },
  '/module5/dunning':        { titleKey: 'module5.dunning', subtitleKey: 'module5.title' },
  '/module6/dashboard':      { titleKey: 'module6.executiveDashboard', subtitleKey: 'module6.title' },
  '/module6/reports':        { titleKey: 'module6.reportBuilder', subtitleKey: 'module6.title' },
  '/admin':                  { titleKey: 'nav.admin' },
};

export function usePageTitle() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const route = routeTitles[pathname];
  if (!route) return { title: 'TEKUN SPPT', subtitle: undefined };

  return {
    title: t(route.titleKey),
    subtitle: route.subtitleKey ? t(route.subtitleKey) : undefined,
  };
}
