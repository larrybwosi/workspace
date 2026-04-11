import { Routes, Route } from 'react-router';
import Home from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Contact } from './pages/Contact';
import { DeveloperDashboard } from './pages/developer/Dashboard';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/developer" element={<DeveloperDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
