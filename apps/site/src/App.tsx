import { Routes, Route, Outlet } from 'react-router';
import Home from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Contact } from './pages/Contact';
import { DeveloperDashboard } from './pages/developer/Dashboard';
import { AppConfig } from './pages/developer/AppConfig';
import { AppSettings } from './pages/developer/AppSettings';
import { DeveloperLayout } from './components/DeveloperLayout';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/developer" element={<DeveloperLayout />}>
        <Route index element={<DeveloperDashboard />} />
        <Route path="applications/:id/config" element={<AppConfig />} />
        <Route path="applications/:id/settings" element={<AppSettings />} />
      </Route>
    </Routes>
  );
}

export default App;
