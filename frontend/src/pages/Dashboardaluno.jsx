import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://127.0.0.1:8000';
const XP_POR_NIVEL = 100;

const COR_MODULO = {
  alfabeto:   { fundo: '#B5EAD7', barra: '#52C986' },
  saudacoes:  { fundo: '#FFDDB3', barra: '#FF9248' },
  emocoes:    { fundo: '#C5C6F7', barra: '#5C5FE0' },
  cores:      { fundo: '#C7F2E0', barra: '#41C976' },
  animais:    { fundo: '#F9C6D8', barra: '#E04F80' },
  familia:    { fundo: '#BDEFEF', barra: '#2DB8B8' },
  frutas:     { fundo: '#FFF3CD', barra: '#FFC107' },
  numeros:    { fundo: '#D4E6F1', barra: '#3498DB' },
};

const AVATARES = [
  { id: 'avataaars',          nome: 'Cartoon',     estilo: 'avataaars' },
  { id: 'bottts',             nome: 'Robô',        estilo: 'bottts' },
  { id: 'fun-emoji',          nome: 'Emoji',       estilo: 'fun-emoji' },
  { id: 'lorelei',            nome: 'Neutro',      estilo: 'lorelei' },
  { id: 'pixel-art',          nome: 'Pixel',       estilo: 'pixel-art' },
  { id: 'thumbs',             nome: 'Polegar',     estilo: 'thumbs' },
  { id: 'identicon',          nome: 'Geométrico',  estilo: 'identicon' },
  { id: 'rings',              nome: 'Anéis',       estilo: 'rings' },
  { id: 'shapes',             nome: 'Formas',      estilo: 'shapes' },
  { id: 'croodles',           nome: 'Rabisco',     estilo: 'croodles' },
  { id: 'micah',              nome: 'Aquarela',    estilo: 'micah' },
  { id: 'miniavs',            nome: 'Mini',        estilo: 'miniavs' },
  { id: 'big-ears',           nome: 'Orelhudo',    estilo: 'big-ears' },
  { id: 'big-smile',          nome: 'Sorriso',     estilo: 'big-smile' },
  { id: 'open-peeps',         nome: 'Pessoas',     estilo: 'open-peeps' },
  { id: 'personas',           nome: 'Persona',     estilo: 'personas' },
  { id: 'adventurer',         nome: 'Aventureiro', estilo: 'adventurer' },
  { id: 'adventurer-neutral', nome: 'Explorador',  estilo: 'adventurer-neutral' },
  { id: 'notionists',         nome: 'Artista',     estilo: 'notionists' },
  { id: 'notionists-neutral', nome: 'Criativo',    estilo: 'notionists-neutral' },
];

const AVATAR_PADRAO = 'avataaars';

const MODULOS_BASE = [
  { modulo: 'alfabeto',  titulo: 'Alfabeto',  emoji: '🔤', total_sinais: 26, disponivel: true },
  { modulo: 'saudacoes', titulo: 'Saudações', emoji: '👋', total_sinais: 10, disponivel: true },
  { modulo: 'emocoes',   titulo: 'Emoções',   emoji: '😊', total_sinais: 6,  disponivel: true },
  { modulo: 'cores',     titulo: 'Cores',     emoji: '🌈', total_sinais: 0,  disponivel: false },
  { modulo: 'animais',   titulo: 'Animais',   emoji: '🐨', total_sinais: 0,  disponivel: false },
  { modulo: 'familia',   titulo: 'Família',   emoji: '👨‍👩‍👧‍👦', total_sinais: 0,  disponivel: false },
  { modulo: 'frutas',    titulo: 'Frutas',    emoji: '🍓', total_sinais: 0,  disponivel: false },
  { modulo: 'numeros',   titulo: 'Números',   emoji: '🔢', total_sinais: 0,  disponivel: false },
];

const DashboardAluno = () => {
  const navigate = useNavigate();

  const [dados, setDados]           = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]             = useState('');
  const [menuAberto, setMenuAberto] = useState(false);

  const [avatarEstilo, setAvatarEstilo] = useState(() =>
    localStorage.getItem('avatar_estilo') || AVATAR_PADRAO
  );
  const [avatarModalAberto, setAvatarModalAberto] = useState(false);

  useEffect(() => {
    const alunoId = sessionStorage.getItem('aluno_id');
    const token   = sessionStorage.getItem('aluno_token');
    if (!alunoId) { navigate('/entrar'); return; }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios.get(`${API}/aluno/${alunoId}/dashboard`, { headers })
      .then(res => { setDados(res.data); })
      .catch(() => setErro('Não foi possível carregar seus dados. Tente novamente.'))
      .finally(() => setCarregando(false));
  }, [navigate]);

  const sair = () => {
    sessionStorage.clear();
    navigate('/entrar');
  };

  const escolherAvatar = (estilo) => {
    setAvatarEstilo(estilo);
    localStorage.setItem('avatar_estilo', estilo);
    setAvatarModalAberto(false);
  };

  const navegarParaModulo = (modulo) => {
    sessionStorage.setItem('modulo_atual', modulo);
    navigate('/praticar');
  };

  const praticarAgora = () => {
    if (!modulos || modulos.length === 0) {
      sessionStorage.setItem('modulo_atual', 'alfabeto');
      navigate('/praticar');
      return;
    }
    const primeiroModulo = modulos.find((m, i) => {
      const anteriorConcluido = i === 0 || modulos[i - 1].progresso_pct >= 100;
      return m.disponivel && anteriorConcluido;
    });
    sessionStorage.setItem('modulo_atual', primeiroModulo?.modulo || 'alfabeto');
    navigate('/praticar');
  };

  if (carregando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F6F7DB', fontSize: 18, fontWeight: 800, color: '#FFA76C', fontFamily: 'Nunito, sans-serif' }}>
      👏 Carregando…
    </div>
  );

  if (erro) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F6F7DB', fontFamily: 'Nunito, sans-serif', gap: 16 }}>
      <p style={{ fontSize: 18, color: '#E53935', fontWeight: 800 }}>⚠️ {erro}</p>
      <button
        onClick={() => window.location.reload()}
        style={{ background: '#FFA76C', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Tentar novamente
      </button>
    </div>
  );

  const aluno      = dados?.aluno || {};
  const modulosAPI = dados?.modulos || [];

  const nivel          = dados?.nivel || 1;
  const xp_barra       = dados?.xp || 0;
  const xp_total_hist  = ((nivel - 1) * XP_POR_NIVEL) + xp_barra;
  const xpPercent      = Math.min(100, Math.round((xp_barra / XP_POR_NIVEL) * 100));

  const modulos = MODULOS_BASE.map(base => {
    const progressoAPI  = modulosAPI.find(m => m.modulo === base.modulo);
    const sinais_feitos = progressoAPI ? Math.min(progressoAPI.sinais_feitos || 0, base.total_sinais) : 0;
    const progresso_pct = Math.round((sinais_feitos / base.total_sinais) * 100);
    return { ...base, sinais_feitos, progresso_pct };
  });

  const total_sinais_feitos = modulos.reduce((acc, m) => acc + m.sinais_feitos, 0);

  const conquistasDoAluno = new Set(
    (dados?.conquistas || [])
      .filter(c => c.desbloqueada)
      .map(c => c.chave)
  );

  const conquistasExibir = [
    { chave: 'nivel_dinamico',    titulo: `Nível ${nivel}`,      emoji: '⭐', desbloqueada: true },
    { chave: 'primeiro_sinal',    titulo: 'Primeiro Sinal',      emoji: '🤟', desbloqueada: conquistasDoAluno.has('primeiro_sinal') || total_sinais_feitos >= 1 },
    { chave: 'primeira_licao',    titulo: 'Primeira Lição',      emoji: '🏆', desbloqueada: conquistasDoAluno.has('primeira_licao') },
    { chave: 'alfabeto_completo', titulo: 'Alfabeto 100%',       emoji: '🔤', desbloqueada: conquistasDoAluno.has('alfabeto_completo') },
    { chave: 'saudacoes_completo',titulo: 'Saudações 100%',      emoji: '👋', desbloqueada: conquistasDoAluno.has('saudacoes_completo') },
    { chave: 'emocoes_completo',  titulo: 'Emoções 100%',        emoji: '😊', desbloqueada: conquistasDoAluno.has('emocoes_completo') },
    { chave: 'cem_porcento',      titulo: '100% Sem pular',      emoji: '💯', desbloqueada: conquistasDoAluno.has('cem_porcento') },
    { chave: 'xp_100',            titulo: '100 XP',              emoji: '🥉', desbloqueada: conquistasDoAluno.has('xp_100') || xp_total_hist >= 100 },
    { chave: 'xp_250',            titulo: '250 XP',              emoji: '🥈', desbloqueada: conquistasDoAluno.has('xp_250') || xp_total_hist >= 250 },
    { chave: 'xp_500',            titulo: '500 XP',              emoji: '🥇', desbloqueada: conquistasDoAluno.has('xp_500') || xp_total_hist >= 500 },
    { chave: 'xp_1000',           titulo: '1000 XP',             emoji: '💎', desbloqueada: conquistasDoAluno.has('xp_1000') || xp_total_hist >= 1000 },
  ];

  if (!localStorage.getItem('avatar_estilo')) {
    localStorage.setItem('avatar_estilo', AVATAR_PADRAO);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; }
        body { font-family: 'Nunito', sans-serif; background: #F6F7DB; }

        .da-wrap { min-height: 100vh; background: #F6F7DB; display: flex; flex-direction: column; }

        .da-header { background: #fff; border-bottom: 1.5px solid #EEE; padding: 0 28px; height: 68px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .da-logo { display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: 900; color: #FFA76C; }
        .da-header-center { display: flex; align-items: center; gap: 14px; background: #F9F9F9; border: 1.5px solid #EEE; border-radius: 50px; padding: 8px 20px; }
        .da-nivel-badge { background: #FFA76C; color: #fff; padding: 4px 14px; border-radius: 20px; font-weight: 800; font-size: 14px; }
        .da-xp-track { width: 110px; height: 10px; background: #E8E8E8; border-radius: 5px; overflow: hidden; }
        .da-xp-fill { height: 100%; background: linear-gradient(90deg, #FFA76C, #FFD080); border-radius: 5px; transition: width 0.6s cubic-bezier(0.175,0.885,0.32,1.275); }
        .da-xp-label { font-size: 13px; font-weight: 700; color: #888; white-space: nowrap; }
        .da-avatar-btn { width: 44px; height: 44px; border-radius: 50%; border: 2.5px solid #FFA76C; overflow: hidden; cursor: pointer; background: none; padding: 0; transition: transform 0.2s; }
        .da-avatar-btn:hover { transform: scale(1.05); }
        .da-avatar-btn img { width: 100%; height: 100%; }

        .da-menu-overlay { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.15); backdrop-filter: blur(2px); }
        .da-menu { position: absolute; top: 56px; right: 20px; background: #fff; border-radius: 18px; box-shadow: 0 12px 40px rgba(0,0,0,0.12); padding: 10px 0; min-width: 200px; z-index: 50; }
        .da-menu-item { width: 100%; text-align: left; padding: 13px 20px; font-size: 15px; font-weight: 700; color: #444; cursor: pointer; background: none; border: none; font-family: inherit; transition: background 0.15s; display: flex; align-items: center; gap: 10px; }
        .da-menu-item:hover { background: #FFF9F4; }
        .da-menu-item.danger { color: #E53935; }
        .da-menu-item.danger:hover { background: #FFF3F3; }
        .da-menu-divider { height: 1px; background: #F0F0F0; margin: 4px 0; }

        .da-body { flex: 1; display: grid; grid-template-columns: 1fr 300px; gap: 24px; padding: 28px 28px 40px; max-width: 1200px; width: 100%; margin: 0 auto; }
        @media (max-width: 900px) { .da-body { grid-template-columns: 1fr; } }

        .da-left { display: flex; flex-direction: column; gap: 24px; }

        .da-greeting { background: #fff; border-radius: 24px; padding: 28px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: space-between; overflow: hidden; position: relative; }
        .da-greeting::after { content: '👏'; position: absolute; right: 28px; font-size: 90px; opacity: 0.07; pointer-events: none; }
        .da-greeting h2 { font-size: 26px; font-weight: 900; color: #1a1a1a; margin-bottom: 6px; }
        .da-greeting p { font-size: 15px; color: #888; font-weight: 600; }
        .da-greeting-xp { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; margin-left: 20px; }
        .da-greeting-xp-num { font-size: 36px; font-weight: 900; color: #FFA76C; line-height: 1; }
        .da-greeting-xp-label { font-size: 13px; color: #bbb; font-weight: 700; }

        .da-modulos-titulo { font-size: 20px; font-weight: 900; color: #1a1a1a; }
        .da-modulos-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1000px) { .da-modulos-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 700px) { .da-modulos-grid { grid-template-columns: repeat(2, 1fr); } }

        .da-modulo-card { border-radius: 22px; padding: 22px 20px 20px; position: relative; overflow: hidden; border: 2.5px solid transparent; transition: transform 0.22s, box-shadow 0.22s; }
        .da-modulo-card.disponivel { cursor: pointer; }
        .da-modulo-card.disponivel:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(0,0,0,0.12); }
        .da-modulo-card.concluido { cursor: pointer; }
        .da-modulo-card.concluido:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(0,0,0,0.12); }
        .da-modulo-card.bloqueado { cursor: not-allowed; background: #E8E8E8 !important; }

        .da-modulo-estado { position: absolute; top: 14px; right: 14px; font-size: 18px; }
        .da-modulo-emoji { font-size: 36px; margin-bottom: 10px; display: block; }
        .da-modulo-titulo { font-size: 17px; font-weight: 900; margin-bottom: 4px; }
        .da-modulo-desc { font-size: 13px; font-weight: 600; margin-bottom: 14px; line-height: 1.4; }
        .da-modulo-barra-track { height: 8px; background: rgba(0,0,0,0.08); border-radius: 4px; overflow: hidden; }
        .da-modulo-barra-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.175,0.885,0.32,1.275); }
        .da-modulo-progresso-label { font-size: 12px; font-weight: 800; margin-top: 6px; }

        .da-modulo-lock-overlay { position: absolute; inset: 0; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; pointer-events: none; }
        .da-modulo-lock-icon { font-size: 32px; opacity: 0.45; }
        .da-modulo-lock-texto { font-size: 11px; font-weight: 800; color: #999; text-align: center; padding: 0 12px; }

        .da-right { display: flex; flex-direction: column; gap: 20px; }
        .da-card { background: #fff; border-radius: 22px; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .da-card-titulo { font-size: 17px; font-weight: 900; color: #1a1a1a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

        .da-stat-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F5F5F5; font-size: 14px; font-weight: 700; }
        .da-stat-row:last-child { border-bottom: none; }
        .da-stat-key { color: #666; }
        .da-stat-val { color: #FFA76C; font-weight: 900; font-size: 15px; }

        .da-conquistas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .da-conquista { border-radius: 14px; padding: 12px 10px; text-align: center; font-size: 12px; font-weight: 800; line-height: 1.4; transition: transform 0.2s; }
        .da-conquista.ok { background: #FFF9F4; color: #FFA76C; border: 1.5px solid rgba(255,167,108,0.25); }
        .da-conquista.ok:hover { transform: scale(1.04); }
        .da-conquista.bloq { background: #F8F8F8; color: #CCC; border: 1.5px solid #EEE; }
        .da-conquista-emoji { font-size: 26px; display: block; margin-bottom: 5px; }

        .da-praticar-btn { width: 100%; padding: 18px; background: linear-gradient(135deg, #FFA76C, #FF8C42); color: #fff; border: none; border-radius: 16px; font-size: 18px; font-weight: 900; cursor: pointer; font-family: inherit; box-shadow: 0 6px 24px rgba(255,167,108,0.4); transition: all 0.22s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .da-praticar-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(255,167,108,0.5); }

        .da-modal-bg { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .da-modal { background: #fff; border-radius: 28px; padding: 36px 32px; max-width: 600px; width: 100%; box-shadow: 0 24px 64px rgba(0,0,0,0.15); max-height: 85vh; overflow-y: auto; animation: fadeIn 0.22s ease; }
        .da-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .da-modal-titulo { font-size: 22px; font-weight: 900; color: #1a1a1a; }
        .da-modal-close { background: #F0F0F0; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; font-family: inherit; transition: background 0.2s; }
        .da-modal-close:hover { background: #FFE0CC; }

        .da-avatar-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
        @media (max-width: 600px) { .da-avatar-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 400px) { .da-avatar-grid { grid-template-columns: repeat(3, 1fr); } }

        .da-avatar-option { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; padding: 12px 8px; border-radius: 16px; border: 2.5px solid transparent; transition: all 0.2s; background: #F9F9F9; }
        .da-avatar-option:hover { background: #FFF9F4; border-color: rgba(255,167,108,0.3); transform: translateY(-2px); }
        .da-avatar-option.selected { background: #FFF9F4; border-color: #FFA76C; box-shadow: 0 4px 12px rgba(255,167,108,0.2); }
        .da-avatar-option img { width: 52px; height: 52px; border-radius: 50%; }
        .da-avatar-option span { font-size: 11px; font-weight: 700; color: #666; }

        .da-footer { background: #fff; border-top: 1.5px solid #EEE; padding: 20px 28px; text-align: center; font-size: 13px; font-weight: 700; color: #999; flex-shrink: 0; }

        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

        @media (max-width: 600px) {
          .da-body { padding: 16px; gap: 16px; }
          .da-header { padding: 0 16px; }
          .da-greeting { flex-direction: column; align-items: flex-start; gap: 12px; }
          .da-greeting-xp { align-items: flex-start; }
          .da-header-center { gap: 10px; padding: 6px 14px; }
        }
      `}</style>

      <div className="da-wrap">
        <header className="da-header">
          <div className="da-logo">
            <span>👏</span> LibrasKids
          </div>
          <div className="da-header-center">
            <div className="da-nivel-badge">Nível {nivel}</div>
            <div className="da-xp-track">
              <div className="da-xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <span className="da-xp-label">{xp_barra}/{XP_POR_NIVEL} XP</span>
          </div>
          <div style={{ position: 'relative' }}>
            <button className="da-avatar-btn" onClick={() => setMenuAberto(o => !o)}>
              <img src={`https://api.dicebear.com/9.x/${avatarEstilo}/svg?seed=${aluno.apelido}`} alt="avatar" />
            </button>
            {menuAberto && (
              <>
                <div className="da-menu-overlay" onClick={() => setMenuAberto(false)} />
                <div className="da-menu">
                  <button className="da-menu-item">👤 {aluno.nome_completo}</button>
                  <div className="da-menu-divider" />
                  <button className="da-menu-item" onClick={() => { setMenuAberto(false); setAvatarModalAberto(true); }}>
                    🎨 Escolher Avatar
                  </button>
                  <div className="da-menu-divider" />
                  <button className="da-menu-item danger" onClick={sair}>🚪 Sair</button>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="da-body">
          <div className="da-left">
            <div className="da-greeting">
              <div>
                <h2>Olá, {aluno.apelido}! 👋</h2>
                <p>Que tal continuar praticando Libras?</p>
              </div>
              <div className="da-greeting-xp">
                <span className="da-greeting-xp-num">{xp_total_hist}</span>
                <span className="da-greeting-xp-label">XP total</span>
              </div>
            </div>

            <div className="da-modulos-titulo">📖 Módulos de Aprendizado</div>
            <div className="da-modulos-grid">
              {modulos.map((m, i) => {
                const cores = COR_MODULO[m.modulo] || { fundo: '#EEE', barra: '#999' };
                const anteriorConcluido = i === 0 || modulos[i - 1].progresso_pct >= 100;
                
                // Só está desbloqueado se o sistema marcou como disponível E o anterior foi concluído
                const desbloqueado = m.disponivel && anteriorConcluido;
                const concluido = m.progresso_pct >= 100;
                const estadoClass = !desbloqueado ? 'bloqueado' : concluido ? 'concluido' : 'disponivel';

                return (
                  <div
                    key={m.modulo}
                    className={`da-modulo-card ${estadoClass}`}
                    style={{
                      background: desbloqueado ? cores.fundo : undefined,
                      border: concluido && desbloqueado ? `2.5px solid ${cores.barra}` : '2.5px solid transparent',
                    }}
                    onClick={() => { if (desbloqueado) navegarParaModulo(m.modulo); }}
                    title={!desbloqueado ? (!m.disponivel ? 'Em breve!' : `Complete "${modulos[i - 1]?.titulo}" primeiro!`) : ''}
                  >
                    {desbloqueado && (
                      <span className="da-modulo-estado">{concluido ? '✅' : ''}</span>
                    )}
                    <span className="da-modulo-emoji" style={{ filter: desbloqueado ? 'none' : 'grayscale(1)', opacity: desbloqueado ? 1 : 0.3 }}>
                      {m.emoji}
                    </span>
                    <div className="da-modulo-titulo" style={{ color: desbloqueado ? '#1a1a1a' : '#bbb' }}>
                      {m.titulo}
                    </div>

                    <div className="da-modulo-desc" style={{ color: desbloqueado ? '#555' : '#bbb' }}>
                      {concluido ? 'Módulo concluído! 🎉' : desbloqueado ? 'Toque para praticar!' : ''}
                    </div>

                    <div className="da-modulo-barra-track">
                      <div className="da-modulo-barra-fill" style={{ width: desbloqueado ? `${m.progresso_pct}%` : '0%', background: desbloqueado ? cores.barra : '#CCC' }} />
                    </div>
                    <div className="da-modulo-progresso-label" style={{ color: desbloqueado ? '#666' : '#bbb' }}>
                      {desbloqueado ? `${m.sinais_feitos}/${m.total_sinais} sinais` : ''}
                    </div>

                    {!desbloqueado && (
                      <div className="da-modulo-lock-overlay">
                        {/* Se não estiver disponível, mostra Ampulheta. Se for falta de progresso, mostra Cadeado */}
                        <span className="da-modulo-lock-icon">{!m.disponivel ? '⏳' : '🔒'}</span>
                        <span className="da-modulo-lock-texto">
                          {!m.disponivel ? 'Disponível em breve' : `Complete "${modulos[i - 1]?.titulo}"`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="da-right">
            <button className="da-praticar-btn" onClick={praticarAgora}>
              🎮 Praticar agora!
            </button>
            <div className="da-card">
              <div className="da-card-titulo">📊 Estatísticas</div>
              {modulos.filter(m => m.disponivel).map((m, i) => {
                const anteriorConcluido = i === 0 || modulos[i - 1].progresso_pct >= 100;
                return (
                  <div className="da-stat-row" key={m.modulo}>
                    <span className="da-stat-key">{m.emoji} {m.titulo}</span>
                    <span className="da-stat-val">
                      {anteriorConcluido ? `${m.sinais_feitos}/${m.total_sinais}` : '🔒'}
                    </span>
                  </div>
                );
              })}
              <div className="da-stat-row">
                <span className="da-stat-key">Nível</span>
                <span className="da-stat-val">Nível {nivel}</span>
              </div>
              <div className="da-stat-row">
                <span className="da-stat-key">XP (barra)</span>
                <span className="da-stat-val">{xp_barra}/{XP_POR_NIVEL}</span>
              </div>
              <div className="da-stat-row">
                <span className="da-stat-key">XP Total</span>
                <span className="da-stat-val">{xp_total_hist} XP</span>
              </div>
            </div>
            <div className="da-card">
              <div className="da-card-titulo">⭐ Conquistas</div>
              <div className="da-conquistas-grid">
                {conquistasExibir.map(c => (
                  <div key={c.chave} className={`da-conquista ${c.desbloqueada ? 'ok' : 'bloq'}`}>
                    <span className="da-conquista-emoji">{c.emoji}</span>
                    {c.titulo}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="da-footer">
          LibrasKids © 2026 — Inclusão infantil através da tecnologia 👏
        </footer>
      </div>

      {avatarModalAberto && (
        <div className="da-modal-bg" onClick={() => setAvatarModalAberto(false)}>
          <div className="da-modal" onClick={e => e.stopPropagation()}>
            <div className="da-modal-header">
              <span className="da-modal-titulo">🎨 Escolha seu Avatar</span>
              <button className="da-modal-close" onClick={() => setAvatarModalAberto(false)}>✕</button>
            </div>
            <div className="da-avatar-grid">
              {AVATARES.map(av => (
                <div
                  key={av.id}
                  className={`da-avatar-option ${avatarEstilo === av.estilo ? 'selected' : ''}`}
                  onClick={() => escolherAvatar(av.estilo)}
                >
                  <img src={`https://api.dicebear.com/9.x/${av.estilo}/svg?seed=${aluno.apelido}`} alt={av.nome} />
                  <span>{av.nome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardAluno;