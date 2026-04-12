import { Routes, Route, Outlet } from 'react-router';
import Home from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Contact } from './pages/Contact';
import Login from './pages/Login';
import { DeveloperDashboard } from './pages/developer/Dashboard';
import { AppConfig } from './pages/developer/AppConfig';
import { AppSettings } from './pages/developer/AppSettings';
import { Teams } from './pages/developer/Teams';
import { Settings } from './pages/developer/Settings';
import { DeveloperLayout } from './components/DeveloperLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
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

      <Route path="/login" element={<Login />} />

      <Route
        path="/developer"
        element={
          <ProtectedRoute>
            <DeveloperLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DeveloperDashboard />} />
        <Route path="applications/:id/config" element={<AppConfig />} />
        <Route path="applications/:id/settings" element={<AppSettings />} />
        <Route path="teams" element={<Teams />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
