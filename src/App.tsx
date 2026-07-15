import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { ScrollRestoration } from './components/common/ScrollRestoration';
import { PixelPageViews } from './components/common/PixelPageViews';

function App() {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <PixelPageViews />
      <div className="min-h-screen bg-white font-sans">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
