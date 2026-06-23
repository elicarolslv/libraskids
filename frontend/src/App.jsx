import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage         from './pages/LandingPage';
import Login               from './pages/Login';
import Register            from './pages/Register';
import DashboardProfessor  from './pages/DashboardProfessor';
import SelecaoAluno        from './pages/SelecaoAluno';
import AppAluno            from './AppAluno';
import DashboardAluno from './pages/DashboardAluno';

function AppRoutes() {
  const { professor, loading } = useAuth();

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFFDE7 0%, #F0FAF4 55%, #FFF3E0 100%)',
    }}>
      <p style={{ color: '#FFA76C', fontSize: 18, fontWeight: 800, fontFamily: 'Nunito, sans-serif' }}>
        👏 Carregando…
      </p>
    </div>
  );

  return (
    <Routes>
      {/* Página inicial — apresentação do site */}
      <Route path="/"                    element={<LandingPage />} />
      
      {/* Tela Principal aluno */}
      <Route path="/aluno/dashboard" element={<DashboardAluno />} />

      {/* Tela de acesso do aluno */}
      <Route path="/entrar"              element={<SelecaoAluno />} />

      {/* Prática com webcam + IA */}
      <Route path="/praticar"            element={<AppAluno />} />

      {/* Rotas do professor */}
      <Route path="/professor/login"     element={<Login />} />
      <Route path="/professor/register"  element={<Register />} />
      <Route
        path="/professor/dashboard"
        element={professor ? <DashboardProfessor /> : <Navigate to="/professor/login" replace />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;