import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [nome, setNome] = useState('');
  const [escola, setEscola] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Progresso: 5 campos agora (nome, escola, email, senha, confirmSenha)
  const progressoPct = Math.min(100, (
    (nome ? 20 : 0) +
    (escola ? 20 : 0) +
    (email ? 20 : 0) +
    (senha.length >= 6 ? 20 : 0) +
    (confirmSenha && confirmSenha === senha ? 20 : 0)
  ));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (senha !== confirmSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // Agora passa explicitamente a 'escola' como o 4º argumento
      await register(nome, email, senha, escola);
      
      setSuccess('Conta criada com sucesso! Redirecionando...');
      
      // Limpa o formulário
      setNome('');
      setEscola('');
      setEmail('');
      setSenha('');
      setConfirmSenha('');

      // Redireciona após 2 segundos
      setTimeout(() => {
        navigate('/professor/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body, #root {
          width: 100%;
          min-height: 100vh;
        }

        body {
          font-family: 'Nunito', 'Segoe UI', sans-serif;
        }

        .auth-page {
          width: 100vw;
          min-height: 100vh;
          background: linear-gradient(135deg, #FFFDE7 0%, #F0FAF4 55%, #FFF3E0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 40px 20px;
        }

        .auth-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          width: 100%;
          max-width: 500px;
          position: relative;
          z-index: 1;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .auth-logo span:first-child {
          font-size: 42px;
        }
        .auth-logo span:last-child {
          font-size: 36px;
          font-weight: 900;
          color: #FFA76C;
          letter-spacing: -1px;
        }

        .auth-card {
          background: white;
          border-radius: 32px;
          padding: 48px 52px;
          width: 100%;
          box-shadow: 0 16px 56px rgba(0,0,0,0.04);
        }

        .auth-card h2 {
          font-size: 28px;
          font-weight: 900;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .auth-subtitle {
          font-size: 15px;
          color: #999;
          font-weight: 600;
          margin-bottom: 32px;
        }

        .progress-bar {
          height: 5px;
          background: #F0F0F0;
          border-radius: 100px;
          margin-bottom: 32px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #FFA76C, #FFD580);
          border-radius: 100px;
          transition: width 0.4s ease;
        }

        .auth-field {
          margin-bottom: 18px;
        }

        .auth-field label {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #555;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .auth-field input {
          width: 100%;
          padding: 14px 18px;
          border-radius: 14px;
          border: 2.5px solid #E8E8E8;
          font-size: 16px;
          font-family: inherit;
          color: #333;
          outline: none;
          background: #FFFFFF;
          transition: border-color 0.2s;
          font-weight: 600;
        }

        .auth-field input:focus {
          border-color: #FFA76C;
        }

        .auth-field input::placeholder {
          color: #ccc;
          font-weight: 500;
        }

        .auth-field input.valid {
          border-color: #98D8A0;
        }

        .auth-btn {
          width: 100%;
          padding: 16px;
          background: #FFA76C;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          margin-top: 8px;
          transition: all 0.2s;
        }

        .auth-btn:hover:not(:disabled) {
          background: #ff9248;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255,167,108,0.45);
        }

        .auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-error {
          background: #FFF3F3;
          color: #D32F2F;
          border: 1.5px solid #FFCDD2;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auth-success {
          background: #F0FFF4;
          color: #2E7D32;
          border: 1.5px solid #A5D6A7;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auth-link {
          text-align: center;
          font-size: 14px;
          color: #999;
          font-weight: 600;
          margin-top: 20px;
        }

        .auth-link a {
          color: #FFA76C;
          text-decoration: none;
          font-weight: 800;
        }

        .auth-link a:hover {
          text-decoration: underline;
        }

        .terms {
          font-size: 12px;
          color: #bbb;
          text-align: center;
          font-weight: 600;
          margin-top: 16px;
          line-height: 1.6;
        }

        .auth-footer {
          font-size: 12px;
          color: #ccc;
          text-align: center;
          font-weight: 600;
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <span>👏</span>
            <span>LibrasKids</span>
          </div>

          <div className="auth-card">
            <h2>Crie sua conta</h2>
            <p className="auth-subtitle">Comece a ensinar Libras hoje mesmo!</p>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressoPct}%` }} />
            </div>

            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
            {success && <div className="auth-success"><span>✅</span> {success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label>Seu nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Prof. Maria Silva"
                  required
                  autoComplete="name"
                  autoFocus
                  className={nome ? 'valid' : ''}
                />
              </div>

              <div className="auth-field">
                <label>Escola</label>
                <input
                  type="text"
                  value={escola}
                  onChange={(e) => setEscola(e.target.value)}
                  placeholder="Ex: E.M. Santos Dumont"
                  required
                  autoComplete="organization"
                  className={escola ? 'valid' : ''}
                />
              </div>

              <div className="auth-field">
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className={email ? 'valid' : ''}
                />
              </div>

              <div className="auth-field">
                <label>Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  className={senha.length >= 6 ? 'valid' : ''}
                />
              </div>

              <div className="auth-field">
                <label>Confirmar senha</label>
                <input
                  type="password"
                  value={confirmSenha}
                  onChange={(e) => setConfirmSenha(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  autoComplete="new-password"
                  className={confirmSenha && confirmSenha === senha ? 'valid' : ''}
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? '⏳ Criando conta...' : 'Criar conta grátis →'}
              </button>
            </form>

            <p className="auth-link">
              Já tem conta? <Link to="/professor/login">Faça login</Link>
            </p>

            <p className="terms">
              Ao criar uma conta, você concorda com os<br />
              Termos de Uso e Política de Privacidade do LibrasKids.
            </p>
          </div>

          <p className="auth-footer">LibrasKids © 2026 — Aprendendo Libras com alegria 👏</p>
        </div>
      </div>
    </>
  );
};

export default Register;