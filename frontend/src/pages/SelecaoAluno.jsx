import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://127.0.0.1:8000';
const ETAPA = { CODIGO: 'codigo', NOME: 'nome', PIN: 'pin' };

const SelecaoAluno = () => {
  const navigate = useNavigate();

  const [etapa, setEtapa]       = useState(ETAPA.CODIGO);
  const [codigo, setCodigo]     = useState('');
  const [turma, setTurma]       = useState(null);
  const [alunoSel, setAlunoSel] = useState(null);
  const [pin, setPin]           = useState('');
  const [mostrarPin, setMostrarPin] = useState(false); // Estado do olhinho
  const [erro, setErro]         = useState('');
  const [loading, setLoading]   = useState(false);

  const buscarTurma = async () => {
    if (!codigo.trim()) { setErro('Digite o código da turma!'); return; }
    setLoading(true); setErro('');
    try {
      const res = await axios.get(`${API}/turma/${codigo.trim().toUpperCase()}/alunos`);
      setTurma(res.data);
      setEtapa(ETAPA.NOME);
    } catch (e) {
      setErro(e.response?.data?.error || 'Código inválido. Verifique com seu professor!');
    } finally {
      setLoading(false);
    }
  };

  const selecionarAluno = (aluno) => {
    setAlunoSel(aluno);
    setPin(''); setErro('');
    setEtapa(ETAPA.PIN);
  };

  const validarPin = async () => {
    if (!/^\d{4}$/.test(pin)) { setErro('Digite os 4 números do seu PIN!'); return; }
    setLoading(true); setErro('');
    try {
      const res = await axios.post(`${API}/aluno/login`, { aluno_id: alunoSel.id, pin });
      sessionStorage.setItem('aluno_token',   res.data.token);
      sessionStorage.setItem('aluno_id',      res.data.aluno_id);
      sessionStorage.setItem('aluno_nome',    res.data.nome_completo);
      sessionStorage.setItem('aluno_apelido', res.data.apelido);
      navigate('/aluno/dashboard')
    } catch (e) {
      setErro(e.response?.data?.error || 'PIN incorreto. Tente de novo!');
    } finally {
      setLoading(false);
    }
  };

  const cores = ['#FFB347', '#87CEEB', '#98D8A0', '#F4A7B9', '#C3A6E8', '#F7DC6F'];
  const etapaIdx = [ETAPA.CODIGO, ETAPA.NOME, ETAPA.PIN].indexOf(etapa);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; }
        body { font-family: 'Segoe UI', Arial, sans-serif; }

        .nome-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; padding: 18px 12px; border-radius: 18px;
          border: 2.5px solid; background: #FAFAFA;
          cursor: pointer; font-weight: 700; font-size: 14px;
          color: #333; transition: all 0.2s ease;
        }
        .nome-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
        .btn-principal {
          width: 100%; padding: 16px;
          background-color: #FFA76C; color: #fff;
          border: none; border-radius: 14px;
          font-size: 18px; font-weight: 800;
          cursor: pointer; transition: all 0.2s ease; margin-top: 4px;
        }
        .btn-principal:hover:not(:disabled) {
          background: #ff9248;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255,167,108,0.45);
        }
        .btn-principal:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-slide { animation: fadeSlide 0.35s ease forwards; }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-7px); }
          40%,80%  { transform: translateX(7px); }
        }
        .shake { animation: shake 0.4s ease; }

        input { background: #FFFFFF !important; } /* 👇 ADICIONADO: Força o fundo dos inputs para branco 👇 */
        input:focus { border-color: #FFA76C !important; outline: none; }

        /* Estilos do Wrapper do PIN com o olhinho */
        .pin-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }
        .pin-wrapper input {
          padding-right: 50px !important; /* Espaço para o ícone */
        }
        .toggle-pin-btn {
          position: absolute;
          right: 18px;
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .toggle-pin-btn:hover { color: #FFA76C; }
      `}</style>

      <div style={{
        width: '100vw', minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFDE7 0%, #F0FAF4 55%, #FFF3E0 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Bolhas decorativas */}
        {[
          { w: 340, h: 340, t: -100, l: -100, c: 'rgba(255,167,108,0.10)' },
          { w: 220, h: 220, b: 30,   r: -70,  c: 'rgba(135,206,235,0.13)' },
          { w: 130, h: 130, t: '38%',r: 60,   c: 'rgba(152,216,160,0.13)' },
          { w: 80,  h: 80,  t: '15%',l: '12%',c: 'rgba(247,220,111,0.18)' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            width: b.w, height: b.h,
            top: b.t, left: b.l, bottom: b.b, right: b.r,
            background: b.c, pointerEvents: 'none',
          }} />
        ))}

        {/* Conteúdo central */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 28, padding: '40px 20px', width: '100%', maxWidth: 580,
          position: 'relative', zIndex: 1,
        }}>

          {/* Logo */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              cursor: 'pointer' // Adicionado para indicar que é clicável
            }} 
            onClick={() => navigate('/')} // ✅ AQUI ESTÁ A MÁGICA
          >
            <span style={{ fontSize: 42 }}>👏</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#FFA76C', letterSpacing: -1 }}>
              LibrasKids
            </span>
          </div>

          {/* Card */}
          <div
            key={etapa}
            className="fade-slide"
            style={{
              backgroundColor: '#fff', borderRadius: 32,
              padding: '44px 52px', width: '100%',
              boxShadow: '0 16px 56px rgba(0,0,0,0.09)',
            }}
          >
            {/* Steps */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 36 }}>
              {[0, 1, 2].map(i => (
                <React.Fragment key={i}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    backgroundColor: i === etapaIdx ? '#FFA76C' : i < etapaIdx ? '#98D8A0' : '#E0E0E0',
                    transform: i === etapaIdx ? 'scale(1.35)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                  }} />
                  {i < 2 && (
                    <div style={{
                      width: 64, height: 3, borderRadius: 4,
                      backgroundColor: i < etapaIdx ? '#98D8A0' : '#E0E0E0',
                      transition: 'background 0.3s ease',
                    }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ── ETAPA 1: Código ── */}
            {etapa === ETAPA.CODIGO && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <span style={{ fontSize: 56 }}>🏫</span>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#222', textAlign: 'center', lineHeight: 1.3 }}>
                  Qual é o código<br />da sua turma?
                </h1>
                <p style={{ fontSize: 15, color: '#999', textAlign: 'center' }}>
                  Seu professor te deu esse código!
                </p>
                <input
                  style={{
                    width: '100%', padding: '16px 20px', borderRadius: 14,
                    border: '2.5px solid #E0E0E0', fontSize: 26, background: '#FFFFFF', // 👇 ADICIONADO: Fundo branco 👇
                    fontWeight: 800, textAlign: 'center', letterSpacing: 6, color: '#333',
                  }}
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="ABC123"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && buscarTurma()}
                  autoFocus
                />
                {erro && <div className="shake" style={s.erro}>⚠️ {erro}</div>}
                <button className="btn-principal" onClick={buscarTurma} disabled={loading}>
                  {loading ? '🔍 Buscando...' : 'Continuar →'}
                </button>
                <button
                  style={{ background: 'none', border: 'none', color: '#FFA76C', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                  onClick={() => navigate('/professor/login')}
                >
                  Sou professor
                </button>
              </div>
            )}

            {/* ── ETAPA 2: Nome ── */}
            {etapa === ETAPA.NOME && turma && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <span style={{ fontSize: 56 }}>👋</span>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#222', textAlign: 'center' }}>
                  Turma: {turma.turma}
                </h1>
                <p style={{ fontSize: 15, color: '#999' }}>Toque no seu nome!</p>

                {turma.alunos.length === 0 ? (
                  <p style={{ color: '#bbb', textAlign: 'center', lineHeight: 1.6 }}>
                    Nenhum aluno cadastrado ainda.<br />Peça ao seu professor!
                  </p>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 14, width: '100%',
                    maxHeight: 320, overflowY: 'auto', padding: 4,
                  }}>
                    {turma.alunos.map((a, idx) => (
                      <button
                        key={a.id}
                        className="nome-btn"
                        style={{ borderColor: cores[idx % cores.length] }}
                        onClick={() => selecionarAluno(a)}
                      >
                        <div style={{
                          width: 54, height: 54, borderRadius: '50%',
                          backgroundColor: cores[idx % cores.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 24, fontWeight: 900, color: '#fff',
                        }}>
                          {a.apelido?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span>{a.apelido}</span>
                      </button>
                    ))}
                  </div>
                )}

                {erro && <div className="shake" style={s.erro}>⚠️ {erro}</div>}
                <button
                  style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                  onClick={() => { setEtapa(ETAPA.CODIGO); setTurma(null); setCodigo(''); }}
                >
                  ← Voltar
                </button>
              </div>
            )}

            {/* ── ETAPA 3: PIN ── */}
            {etapa === ETAPA.PIN && alunoSel && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <span style={{ fontSize: 56 }}>🔑</span>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#222', textAlign: 'center' }}>
                  Olá, {alunoSel.apelido}! 👋
                </h1>
                <p style={{ fontSize: 15, color: '#999' }}>Digite seu PIN de 4 números</p>

                {/* Bolinhas do PIN */}
                <div style={{ display: 'flex', gap: 14, margin: '4px 0' }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      width: 22, height: 22, borderRadius: '50%',
                      backgroundColor: pin.length > i ? '#FFA76C' : '#E0E0E0',
                      transform: pin.length > i ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                    }} />
                  ))}
                </div>

                <div className="pin-wrapper">
                  <input
                    style={{
                      width: '100%', padding: '16px 20px', borderRadius: 14,
                      border: '2.5px solid #E0E0E0', fontSize: 32, background: '#FFFFFF', // 👇 ADICIONADO: Fundo branco 👇
                      fontWeight: 800, textAlign: 'center', letterSpacing: 14, color: '#333',
                    }}
                    type={mostrarPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && pin.length === 4 && validarPin()}
                  />
                  <button
                    type="button"
                    className="toggle-pin-btn"
                    onClick={() => setMostrarPin(!mostrarPin)}
                  >
                    <i className={`fa-solid ${mostrarPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>

                {erro && <div className="shake" style={s.erro}>⚠️ {erro}</div>}

                <button className="btn-principal" onClick={validarPin} disabled={loading || pin.length < 4}>
                  {loading ? '✅ Verificando...' : 'Entrar! 🚀'}
                </button>
                <button
                  style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                  onClick={() => { setEtapa(ETAPA.NOME); setPin(''); setErro(''); }}
                >
                  ← Voltar
                </button>
              </div>
            )}
          </div>

          {/* Rodapé */}
          <p style={{ fontSize: 12, color: '#ccc', textAlign: 'center' }}>
            LibrasKids © 2026 — Aprendendo Libras com alegria 👏
          </p>
        </div>
      </div>
    </>
  );
};

const s = {
  erro: {
    width: '100%', backgroundColor: '#FFF3F3', color: '#D32F2F',
    borderRadius: 10, padding: '12px 16px', fontSize: 14,
    fontWeight: 600, textAlign: 'center', border: '1.5px solid #FFCDD2',
  },
};

export default SelecaoAluno;