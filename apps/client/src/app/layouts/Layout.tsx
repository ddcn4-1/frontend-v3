/**
 * Client app Layout component
 * Uses ClientHeader widget with integrated navigation
 */

import { Outlet } from 'react-router-dom';
import { Container } from '@packages/design-system';
import { ClientHeader } from '../../widgets/client-header';
import { appConfig } from '../config/config';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ClientHeader />

      <main className="flex-1 py-8">
        <Container>
          <Outlet />
        </Container>
      </main>

      <footer className="border-t bg-muted/40 py-6">
        <Container className="text-center text-sm text-muted-foreground">
          <p>티켓 예매 시스템</p>
          <p className="mt-1 text-xs">{appConfig.appUrl.replace('https://', '')}</p>
        </Container>
      </footer>
    </div>
  );
}
