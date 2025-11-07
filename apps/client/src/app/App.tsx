import { BrowserRouter } from 'react-router-dom';
import { ClientAuthProvider } from '@/features/client-auth';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <ClientAuthProvider>
        <AppRoutes />
      </ClientAuthProvider>
    </BrowserRouter>
  );
}

export default App;
