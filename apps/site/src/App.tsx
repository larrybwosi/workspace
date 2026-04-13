import { Routes, Route, Outlet } from 'react-router';
import Home from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Contact } from './pages/Contact';
import Login from './pages/Login';
import { DeveloperDashboard } from './pages/developer/Dashboard';
import { AppConfig } from './pages/developer/AppConfig';
import { ProtectedRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import { Footer } from './components/Footer';

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Header />
      <main className="grow">
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

        <Route
          path="/developers"
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<DeveloperDashboard />} />
          <Route path="applications/:id/config" element={<AppConfig />} />
        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
