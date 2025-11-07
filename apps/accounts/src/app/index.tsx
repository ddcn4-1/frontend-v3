import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@shared/lib/auth';
import { AppRoutes } from './routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
