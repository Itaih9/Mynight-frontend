import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white font-sans">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
