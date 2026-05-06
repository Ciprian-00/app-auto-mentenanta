import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vehicule from './pages/Vehicule';
import DetaliiVehicul from './pages/DetaliiVehicul';
import Scanner from './pages/Scanner';
import Notificari from './pages/Notificari';
import AdaugaVehiculModal from './components/AdaugaVehiculModel';

const FARA_NAV = ['/login', '/register'];

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [remindereUrgente, setRemindereUrgente] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const afiseazaNav = user && !FARA_NAV.includes(location.pathname);

  const handleVehiculAdaugat = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Functie stabila pentru update badge - folosita de Dashboard SI Notificari
  const handleRemindereUpdate = useCallback((count) => {
    setRemindereUrgente(count);
  }, []);

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        toastStyle={{
          background: '#13161f',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          fontSize: '14px',
        }}
      />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard
              refreshKey={refreshKey}
              onRemindereUpdate={handleRemindereUpdate}
            />
          </PrivateRoute>
        } />
        <Route path="/vehicule" element={
          <PrivateRoute>
            <Vehicule refreshKey={refreshKey} />
          </PrivateRoute>
        } />
        <Route path="/vehicule/:id" element={
          <PrivateRoute>
            <DetaliiVehicul />
          </PrivateRoute>
        } />
        <Route path="/scanner" element={
          <PrivateRoute>
            <Scanner />
          </PrivateRoute>
        } />
        <Route path="/notificari" element={
          <PrivateRoute>
            <Notificari onRemindereUpdate={handleRemindereUpdate} />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {afiseazaNav && (
        <BottomNav
          onAdaugaClick={() => setShowModal(true)}
          remindereUrgente={remindereUrgente}
        />
      )}

      {showModal && (
        <AdaugaVehiculModal
          onClose={() => setShowModal(false)}
          onSuccess={handleVehiculAdaugat}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;