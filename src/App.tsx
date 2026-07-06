import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { authApi, eventsApi } from '@/services/api';
import { useUserStore } from '@/store/userStore';

/**
 * Consume the token from a phone-login link. The backend redirects to
 * /gallery#authToken=<jwt>; we store the token (so API calls are authenticated),
 * hydrate the user + their event, then strip it from the URL. This lands the
 * visitor in the couple's own gallery view with owner capabilities.
 */
function useAuthTokenFromHash() {
  useEffect(() => {
    const match = window.location.hash.match(/authToken=([^&]+)/);
    if (!match) return;

    const token = decodeURIComponent(match[1]);
    // Remove the token from the URL (don't leave it in the address bar/history).
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    const store = useUserStore.getState();
    store.setToken(token);
    authApi
      .getProfile()
      .then((res) => { if (res?.data) store.setUser(res.data); })
      .catch(() => {});
    eventsApi
      .getMyEvents()
      .then((res) => { if (res?.data && res.data.length > 0) store.setCurrentEvent(res.data[0]); })
      .catch(() => {});
  }, []);
}

function App() {
  useAuthTokenFromHash();
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white font-sans">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
