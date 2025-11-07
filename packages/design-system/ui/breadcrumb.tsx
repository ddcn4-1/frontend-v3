import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from './button';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const getAdminTabLabel = (tab: string | null): string | undefined => {
  switch (tab) {
    case 'overview':
      return 'Dashboard';
    case 'performances':
      return 'Performance Management';
    case 'bookings':
      return 'Booking Management';
    case 'users':
      return 'User Management';
    case 'traffic':
      return 'Traffic Control';
    default:
      return undefined;
  }
};

const getDashboardBreadcrumbs = (tab: string | null): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ label: 'Dashboard', path: '/dashboard' }];
  const suffix = tab === 'history' ? 'history' : 'performances';

  items.push({
    label: tab === 'history' ? 'My Bookings' : 'Performances',
    path: `/dashboard?tab=${suffix}`,
  });

  return items;
};

const getAdminBreadcrumbs = (tab: string | null): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ label: 'Admin Portal', path: '/admin' }];

  const tabLabel = getAdminTabLabel(tab);

  if (tab && tabLabel) {
    items.push({
      label: tabLabel,
      path: `/admin?tab=${tab}`,
    });
  }

  return items;
};

const getPerformanceBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ label: 'Performances', path: '/' }];
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length >= 2) {
    const performanceId = segments[1];
    const detailPath = `/performances/${performanceId}`;
    const isBooking = pathname.endsWith('/booking');

    items.push({
      label: 'Performance Details',
      path: isBooking ? detailPath : pathname,
    });

    if (isBooking) {
      items.push({ label: 'Seat Selection', path: pathname });
    }
  }

  return items;
};

const resolveBreadcrumbs = (location: Location): BreadcrumbItem[] => {
  const { pathname, search } = location;
  const tab = new URLSearchParams(search).get('tab');

  if (pathname === '/' || pathname === '/performances') {
    return [{ label: 'Performances', path: '/' }];
  }

  if (pathname === '/dashboard') {
    return getDashboardBreadcrumbs(tab);
  }

  if (pathname.startsWith('/admin')) {
    return getAdminBreadcrumbs(tab);
  }

  if (pathname.startsWith('/performances')) {
    return getPerformanceBreadcrumbs(pathname);
  }

  if (pathname === '/login') {
    return [{ label: 'Login', path: '/login' }];
  }

  return [];
};

export function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();

  const breadcrumbs = React.useMemo(() => resolveBreadcrumbs(location), [location]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-1 text-muted-foreground hover:text-foreground"
        onClick={() => navigate('/')}
      >
        <Home className="w-4 h-4" />
      </Button>

      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={`${crumb.path}-${index}`}>
          <ChevronRight className="w-4 h-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(crumb.path)}
            >
              {crumb.label}
            </Button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
