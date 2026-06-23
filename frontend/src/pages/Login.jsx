import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // Certifique-se de ter o axios importado

// Se a sua URL da API for diferente, ajuste aqui
const API_URL = 'http://127.0.0.1:8000'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState(''); // Novo estado para mensagem de sucesso
  const [loading, setLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false); // Alterna entre Login e Recuperar Senha

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, senha);
      navigate('/professor/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  // Nova função para lidar com a recuperação de senha
  const handleRecuperarSenha = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSucesso('');
    try {
      const response = await axios.post(`${API_URL}/auth/recuperar-senha`, { email });
      setSucesso(response.data.message || 'Instruções enviadas com sucesso!');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao tentar recuperar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; }
        body { font-family: 'Nunito', 'Segoe UI', sans-serif; }

        .auth-page {
          width: 100vw; min-height: 100vh;
          background: linear-gradient(135deg, #FFFDE7 0%, #F0FAF4 55%, #FFF3E0 100%);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }

        .auth-inner {
          display: flex; flex-direction: column; align-items: center;
          gap: 28px; padding: 40px 20px; width: 100%; max-width: 500px;
          position: relative; z-index: 1;
        }

        .auth-logo {
          display: flex; align-items: center; gap: 12px;
          cursor: pointer;
        }
        .auth-logo span:first-child { font-size: 42px; }
        .auth-logo span:last-child {
          font-size: 36px; font-weight: 900; color: #FFA76C; letter-spacing: -1px;
        }

        .auth-card {
          background: white; border-radius: 32px;
          padding: 48px 52px; width: 100%;
          box-shadow: 0 16px 56px rgba(0,0,0,0.09);
          transition: all 0.3s ease;
        }

        .auth-card h2 {
          font-size: 28px; font-weight: 900; color: #1a1a1a;
          margin-bottom: 8px;
        }
        .auth-subtitle {
          font-size: 15px; color: #999; font-weight: 600; margin-bottom: 32px; line-height: 1.4;
        }

        .auth-field { margin-bottom: 18px; }
        .auth-field label {
          display: block; font-size: 13px; font-weight: 800;
          color: #555; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .auth-field input {
          width: 100%; padding: 14px 18px; border-radius: 14px;
          border: 2.5px solid #E8E8E8; font-size: 16px;
          font-family: inherit; color: #333; outline: none;
          background: #FFFFFF; transition: border-color 0.2s; font-weight: 600;
        }
        .auth-field input:focus { border-color: #FFA76C; }
        .auth-field input::placeholder { color: #ccc; font-weight: 500; }

        .password-container { position: relative; display: flex; align-items: center; }
        .password-container input { padding-right: 45px; }
        .toggle-password-btn {
          position: absolute; right: 14px; background: transparent; border: none;
          font-size: 1.1rem; cursor: pointer; color: #999; display: flex;
          align-items: center; justify-content: center; padding: 0; transition: color 0.2s, transform 0.2s;
        }
        .toggle-password-btn:hover { color: #FFA76C; transform: scale(1.1); }

        .forgot-pwd-btn {
          background: none; border: none; color: #FFA76C; font-size: 13px;
          font-weight: 800; cursor: pointer; padding: 0; font-family: inherit;
          transition: color 0.2s; text-align: right; width: 100%; margin-top: -6px; margin-bottom: 18px;
        }
        .forgot-pwd-btn:hover { color: #ff9248; text-decoration: underline; }

        .auth-btn {
          width: 100%; padding: 16px; background: #FFA76C; color: white;
          border: none; border-radius: 14px; font-size: 17px; font-weight: 800;
          cursor: pointer; font-family: inherit; margin-top: 8px; transition: all 0.2s;
        }
        .auth-btn:hover:not(:disabled) {
          background: #ff9248; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,167,108,0.45);
        }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .auth-error {
          background: #FFF3F3; color: #D32F2F; border: 1.5px solid #FFCDD2;
          border-radius: 12px; padding: 12px 16px; font-size: 14px; font-weight: 700;
          margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
        }

        .auth-success {
          background: #F0FFF4; color: #2E7D32; border: 1.5px solid #C8E6C9;
          border-radius: 12px; padding: 12px 16px; font-size: 14px; font-weight: 700;
          margin-bottom: 20px; display: flex; align-items: center; gap: 8px; line-height: 1.4;
        }

        .auth-link { text-align: center; font-size: 14px; color: #999; font-weight: 600; margin-top: 20px; }
        .auth-link a { color: #FFA76C; text-decoration: none; font-weight: 800; }
        .auth-link a:hover { text-decoration: underline; }

        .auth-divider { text-align: center; font-size: 13px; color: #ccc; font-weight: 600; margin-top: 16px; }
        
        .auth-student-btn {
          background: none; border: none; color: #FFA76C; cursor: pointer;
          font-size: 14px; font-weight: 800; font-family: inherit; display: block;
          margin: 12px auto 0; transition: color 0.2s;
        }
        .auth-student-btn:hover { color: #ff9248; text-decoration: underline; }

        .auth-footer { font-size: 12px; color: #ccc; text-align: center; font-weight: 600; }

        @media (max-width: 520px) { .auth-card { padding: 36px 24px; } }
      `}</style>

      <div className="auth-page">
        {/* Blobs decorativos */}
        {[
          { w: 340, h: 340, top: -100, left: -100, color: 'rgba(255,167,108,0.10)' },
          { w: 220, h: 220, bottom: 30, right: -70, color: 'rgba(135,206,235,0.13)' },
          { w: 130, h: 130, top: '38%', right: 60, color: 'rgba(152,216,160,0.13)' },
          { w: 80, h: 80, top: '15%', left: '12%', color: 'rgba(247,220,111,0.18)' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%', width: b.w, height: b.h, pointerEvents: 'none',
            top: b.top, left: b.left, bottom: b.bottom, right: b.right, background: b.color,
          }} />
        ))}

        <div className="auth-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <span>👏</span>
            <span>LibrasKids</span>
          </div>

          <div className="auth-card">
            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
            {sucesso && <div className="auth-success"><span>✅</span> {sucesso}</div>}

            {/* SE ESTIVER NA TELA DE RECUPERAÇÃO */}
            {isRecovering ? (
              <>
                <h2>Recuperar Senha</h2>
                <p className="auth-subtitle">Digite seu e-mail de cadastro. Enviaremos uma nova senha temporária para você acessar.</p>

                <form onSubmit={handleRecuperarSenha}>
                  <div className="auth-field">
                    <label>E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="auth-btn" disabled={loading || !email}>
                    {loading ? 'Processando...' : 'Recuperar Senha'}
                  </button>
                </form>

                <div className="auth-divider">— ou —</div>
                <button 
                  className="auth-student-btn" 
                  onClick={() => { setIsRecovering(false); setError(''); setSucesso(''); }}
                >
                  ← Voltar para o Login
                </button>
              </>
            ) : (
              /* SE ESTIVER NA TELA DE LOGIN NORMAL */
              <>
                <h2>Bem-vindo de volta!</h2>
                <p className="auth-subtitle">Entre com sua conta de professor</p>

                <form onSubmit={handleSubmit}>
                  <div className="auth-field">
                    <label>E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <div className="auth-field" style={{ marginBottom: '8px' }}>
                    <label>Senha</label>
                    <div className="password-container">
                      <input
                        type={mostrarSenha ? "text" : "password"}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                      >
                        <i className={`fa-solid ${mostrarSenha ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  
                  {/* BOTÃO ESQUECI MINHA SENHA */}
                  <button type="button" className="forgot-pwd-btn" onClick={() => { setIsRecovering(true); setError(''); setSucesso(''); }}>
                    Esqueci minha senha
                  </button>

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? '🔐 Entrando...' : 'Entrar →'}
                  </button>
                </form>

                <p className="auth-link">
                  Não tem conta? <Link to="/professor/register">Cadastre-se grátis</Link>
                </p>

                <div className="auth-divider">— ou —</div>
                <button className="auth-student-btn" onClick={() => navigate('/entrar')}>
                  Sou aluno 👦
                </button>
              </>
            )}
          </div>

          <p className="auth-footer">LibrasKids © 2026 — Aprendendo Libras com alegria 👏</p>
        </div>
      </div>
    </>
  );
};

export default Login;