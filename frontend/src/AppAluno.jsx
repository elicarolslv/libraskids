import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MODULOS = {
  alfabeto: {
    sinais: [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'REPOUSO',
    ],
    dinamicas: new Set([
        'H', 'J', 'K', 'X', 'Y', 'Z',
        'REPOUSO',
    ]),
    threshold: 0.80,
    acertosNecessarios: (letra) => ['H', 'J', 'K', 'X', 'Y', 'Z'].includes(letra) ? 2 : 10,
    pastaVideos: 'alfabeto_videos',
    extensao: 'MP4',
  },
  saudacoes: {
    sinais: [
      'OI', 'TCHAU', 'BOM_DIA', 'BOA_TARDE', 'BOA_NOITE',
      'OBRIGADO', 'POR_FAVOR', 'TUDO_BEM', 'DESCULPA', 'SEU_NOME',
      'REPOUSO',
    ],
    dinamicas: new Set([
      'OI', 'TCHAU', 'BOM_DIA', 'BOA_TARDE', 'BOA_NOITE',
      'OBRIGADO', 'POR_FAVOR', 'TUDO_BEM', 'DESCULPA', 'SEU_NOME',
      'REPOUSO',
    ]),
    threshold: 0.60,
    acertosNecessarios: () => 1,
    pastaVideos: 'saudacoes_videos',
    extensao: 'MP4',
  },
  emocoes: {
    sinais: [
      'FELIZ', 'TRISTE', 'RAIVA', 'MEDO', 'SURPRESO', 'CANSADO',
      'REPOUSO',
    ],
    dinamicas: new Set([
      'FELIZ', 'TRISTE', 'RAIVA', 'MEDO', 'SURPRESO', 'CANSADO',
      'REPOUSO',
    ]),
    threshold: 0.60,
    acertosNecessarios: () => 2,
    pastaVideos: 'emocoes_videos',
    extensao: 'MP4',
  },
};

const XP_POR_NIVEL = 100;
const API_URL = 'http://127.0.0.1:8000';

function AppAluno() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const moduloAtual = sessionStorage.getItem('modulo_atual') || 'alfabeto';
  const config = MODULOS[moduloAtual] || MODULOS.alfabeto;

  // Módulos de emoções e saudações usam painel de referência expandido
  const isModuloExpandido = moduloAtual === 'emocoes' || moduloAtual === 'saudacoes';

  const SINAIS_PRATICA = config.sinais.filter(s => s !== 'REPOUSO');
  const SINAIS = SINAIS_PRATICA;
  const SINAIS_DINAMICOS = config.dinamicas;

  const [indice, setIndice]                 = useState(0);
  const [feedback, setFeedback]             = useState('Aguardando Resposta...');
  const [xp, setXp]                         = useState(0);
  const [nivel, setNivel]                   = useState(1);
  const [xpTotal, setXpTotal]               = useState(0);
  const [travado, setTravado]               = useState(false);
  const [progressoLocal, setProgressoLocal] = useState(0);
  const [cameraAtiva, setCameraAtiva]       = useState(false);
  const [menuAberto, setMenuAberto]         = useState(false);

  const [modalVitoria, setModalVitoria]     = useState(false);
  const [xpSessao, setXpSessao]             = useState(0);
  const [pulos, setPulos]                   = useState(0);
  const [conquistasSessao, setConquistasSessao] = useState([]);
  const conquistasAntesRef = useRef(new Set());

  const alunoId      = sessionStorage.getItem('aluno_id');
  const token        = sessionStorage.getItem('aluno_token');
  const apelido      = sessionStorage.getItem('aluno_apelido') || 'Estudante';
  const avatarEstilo = localStorage.getItem('avatar_estilo') || 'avataaars';

  const cameraInstancia      = useRef(null);
  const acertosSeguidos      = useRef(0);
  const indiceRef            = useRef(0);
  const travadoRef           = useRef(false);
  const frameBufferRef       = useRef([]);
  const ultimoEnvioRef       = useRef(0);
  const repousoCountRef      = useRef(0);
  const processarAcertoRef   = useRef(null);
  const moduloAtualRef       = useRef(moduloAtual);
  const SINAISRef            = useRef(SINAIS);
  const SINAIS_DINAMICOSRef  = useRef(SINAIS_DINAMICOS);

  const xpRef         = useRef(0);
  const nivelRef      = useRef(1);
  const xpTotalRef    = useRef(0);
  const xpSessaoRef   = useRef(0);
  const pulosRef      = useRef(0);
  const sinaisFeitos  = useRef(0); 

  useEffect(() => {
    if (!alunoId || !token) { navigate('/entrar'); return; }
    const buscarProgresso = async () => {
      try {
        const res = await axios.get(`${API_URL}/aluno/${alunoId}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dados = res.data;

        const xpBarra = dados.xp || 0;
        const nivelAtual = dados.nivel || 1;
        const xpTotalHistorico = ((nivelAtual - 1) * XP_POR_NIVEL) + xpBarra;

        setXp(xpBarra);
        setNivel(nivelAtual);
        setXpTotal(xpTotalHistorico);
        xpRef.current    = xpBarra;
        nivelRef.current = nivelAtual;
        xpTotalRef.current = xpTotalHistorico;

       if (dados.conquistas) {
          dados.conquistas.forEach(c => {
            if (c.desbloqueada) {
              conquistasAntesRef.current.add(c.chave);
            }
          });
        }

        const modulos = dados.modulos || [];
        const moduloProgresso = modulos.find(m => m.modulo === moduloAtual);
        if (moduloProgresso) {
          const sinaisJaFeitos = moduloProgresso.sinais_feitos || 0;
          setIndice(sinaisJaFeitos % SINAIS.length);
        } else {
          setIndice(0);
        }
      } catch (err) {
        console.error('Erro ao carregar progresso:', err);
      }
    };
    buscarProgresso();
  }, [alunoId, token, navigate, SINAIS.length, moduloAtual]);

  useEffect(() => {
    indiceRef.current  = indice;
    travadoRef.current = travado;
  }, [indice, travado]);

  const verificarConquistas = useCallback((novoXpTotal, novoNivel, sinaisConcluidosTotal, semPulos) => {
    const novasConquistas = [];

    const checar = (chave, condicao, titulo = 'Conquista', emoji = '🏆') => {
      if (condicao && !conquistasAntesRef.current.has(chave)) {
        novasConquistas.push({ chave, titulo, emoji });
        conquistasAntesRef.current.add(chave);
      }
    };

    checar('primeiro_sinal', sinaisConcluidosTotal >= 1, 'Primeiro Sinal', '🤟');
    checar('xp_100', novoXpTotal >= 100, '100 XP', '🥉');
    checar('xp_250', novoXpTotal >= 250, '250 XP', '🥈');
    checar('xp_500', novoXpTotal >= 500, '500 XP', '🥇');
    checar('xp_1000', novoXpTotal >= 1000, '1000 XP', '💎');

    if (indiceRef.current === SINAIS.length - 1) {
      checar('primeira_licao', true, 'Primeira Lição', '🏆');
      
      if (semPulos) {
        checar('cem_porcento', true, '100% Sem Pular', '💯');
        if (moduloAtual === 'alfabeto') checar('alfabeto_completo', true, 'Alfabeto 100%', '🔤');
        if (moduloAtual === 'saudacoes') checar('saudacoes_completo', true, 'Saudações 100%', '👋');
        if (moduloAtual === 'emocoes') checar('emocoes_completo', true, 'Emoções 100%', '😊');
      }
    }

    if (novasConquistas.length > 0) {
      setConquistasSessao(prev => {
        const existentes = new Set(prev.map(c => c.chave));
        const filtradas = novasConquistas.filter(c => !existentes.has(c.chave));
        return [...prev, ...filtradas];
      });

      novasConquistas.forEach(c => {
        axios.post(`${API_URL}/aluno/${alunoId}/conquista`, { chave: c.chave }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error('Erro ao salvar conquista:', err));
      });
    }
  }, [alunoId, token, moduloAtual, SINAIS.length]);

  const processarVitoria = useCallback(async (confianca) => {
    const xpGanho = confianca >= 0.95 ? 5 : 3;

    const novoXpTotal = xpTotalRef.current + xpGanho;
    xpTotalRef.current = novoXpTotal;
    setXpTotal(novoXpTotal);

    let novoXpBarra = xpRef.current + xpGanho;
    let novoNivel   = nivelRef.current;
    while (novoXpBarra >= XP_POR_NIVEL) {
      novoXpBarra -= XP_POR_NIVEL;
      novoNivel   += 1;
    }
    xpRef.current    = novoXpBarra;
    nivelRef.current = novoNivel;
    setXp(novoXpBarra);
    setNivel(novoNivel);

    const novoXpSessao = xpSessaoRef.current + xpGanho;
    xpSessaoRef.current = novoXpSessao;
    setXpSessao(novoXpSessao);

    sinaisFeitos.current += 1;

    verificarConquistas(novoXpTotal, novoNivel, sinaisFeitos.current, pulosRef.current === 0);

    try {
      const configApi = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/aluno/${alunoId}/xp`, { quantidade: xpGanho }, configApi);
      const novosSinaisFeitos = indiceRef.current + 1;
      await axios.post(`${API_URL}/aluno/${alunoId}/progresso`, {
        modulo: moduloAtual,
        sinais_feitos: novosSinaisFeitos,
      }, configApi);
    } catch (err) {
      console.error('Erro ao salvar no banco:', err);
    }
  }, [alunoId, token, moduloAtual, verificarConquistas]);

  const processarAcerto = useCallback((sinalIdentificado, confianca) => {
    if (travadoRef.current) return;
    if (sinalIdentificado === 'REPOUSO') return;

    const sinalAlvo            = SINAIS[indiceRef.current];
    const ehDinamica           = SINAIS_DINAMICOS.has(sinalAlvo);
    const threshold            = config.threshold;
    const acertosNecessarios = typeof config.acertosNecessarios === 'function'
      ? config.acertosNecessarios(sinalAlvo)
      : (ehDinamica ? 2 : 10);

    if (sinalIdentificado === sinalAlvo && confianca > threshold) {
      acertosSeguidos.current += 1;
      setProgressoLocal(acertosSeguidos.current);

      if (acertosSeguidos.current >= acertosNecessarios) {
        travadoRef.current = true;
        setTravado(true);
        processarVitoria(confianca);
        setFeedback(confianca >= 0.95 ? 'Perfeito! ✨' : 'Correto! 🎉');
        acertosSeguidos.current = 0;
        setProgressoLocal(0);

        setTimeout(() => {
          if (indiceRef.current === SINAIS.length - 1) {
            setModalVitoria(true);
            if (cameraInstancia.current) { cameraInstancia.current.stop(); }
            setCameraAtiva(false);
          } else {
            setIndice((prev) => prev + 1);
            setFeedback('Aguardando Resposta...');
            setTravado(false);
            travadoRef.current = false;
            frameBufferRef.current = [];
            ultimoEnvioRef.current = 0;
            repousoCountRef.current = 0;
          }
        }, 2000);
      } else {
        setFeedback(`✅ ${sinalAlvo}! +${acertosNecessarios - acertosSeguidos.current} para avançar`);
      }
    } else {
      if (!ehDinamica || confianca > 0.40) {
        acertosSeguidos.current = 0;
        setProgressoLocal(0);
      }
      setFeedback(sinalIdentificado ? `Fazendo: ${sinalIdentificado}` : 'Aguardando Resposta...');
    }
  }, [SINAIS, SINAIS_DINAMICOS, config, processarVitoria]);

  useEffect(() => {
    processarAcertoRef.current  = processarAcerto;
    moduloAtualRef.current      = moduloAtual;
    SINAISRef.current           = SINAIS;
    SINAIS_DINAMICOSRef.current = SINAIS_DINAMICOS;
  }, [processarAcerto, moduloAtual, SINAIS, SINAIS_DINAMICOS]);

  const ligarCamera    = () => { setCameraAtiva(true); setFeedback('Iniciando...'); };
  const desligarCamera = () => {
    if (cameraInstancia.current) { cameraInstancia.current.stop(); cameraInstancia.current = null; }
    setCameraAtiva(false);
    setFeedback('Câmera desligada');
  };
  const toggleCamera = () => { if (cameraAtiva) desligarCamera(); else ligarCamera(); };

  useEffect(() => {
    if (!cameraAtiva) return;
    const HandsLib  = window.Hands;
    const CameraLib = window.Camera;
    if (!HandsLib || !CameraLib) {
      setFeedback('Erro ao carregar câmera');
      setCameraAtiva(false);
      return;
    }

    let isMounted = true;

    const hands = new HandsLib({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

    hands.onResults((results) => {
      if (!isMounted || travadoRef.current) return;
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const handLandmarks = results.multiHandLandmarks[0];
        const xList  = handLandmarks.map(p => p.x);
        const yList  = handLandmarks.map(p => p.y);
        const minX   = Math.min(...xList);
        const minY   = Math.min(...yList);
        const maxX   = Math.max(...xList);
        const maxY   = Math.max(...yList);
        const bbox   = [minX, minY, maxX - minX, maxY - minY];
        const lmList = handLandmarks.map(p => [p.x, p.y, p.z]);
        const sinalAtual = SINAISRef.current[indiceRef.current];
        const ehDinamica = SINAIS_DINAMICOSRef.current.has(sinalAtual);

        if (ehDinamica) {
          frameBufferRef.current.push({ lmList, bbox });
          if (frameBufferRef.current.length > 35)
            frameBufferRef.current = frameBufferRef.current.slice(-35);
          const agora = Date.now();
          if (frameBufferRef.current.length >= 30 && (agora - ultimoEnvioRef.current) > 1000) {
            ultimoEnvioRef.current = agora;
            const frames = frameBufferRef.current.slice(-30);
            axios.post(`${API_URL}/predict-sequence`, { frames, modulo: moduloAtualRef.current }, { timeout: 5000 })
              .then(res => {
                if (!isMounted) return;
                const { letter: sinalIdentificado, confidence: confianca, repouso } = res.data;
                if (repouso || sinalIdentificado === 'REPOUSO') {
                  repousoCountRef.current += 1;
                  if (repousoCountRef.current >= 3 && isMounted) setFeedback('🖐️ Mão em repouso');
                  return;
                }
                repousoCountRef.current = 0;
                if (sinalIdentificado && confianca && processarAcertoRef.current)
                  processarAcertoRef.current(sinalIdentificado, confianca);
              })
              .catch(err => console.error('Erro API:', err.message));
          }
        } else {
          axios.post(`${API_URL}/predict`, { lmList, bbox }, { timeout: 3000 })
            .then(res => {
              if (!isMounted) return;
              const { letter: sinalIdentificado, confidence: confianca } = res.data;
              if (sinalIdentificado && confianca && processarAcertoRef.current)
                processarAcertoRef.current(sinalIdentificado, confianca);
            })
            .catch(err => console.error('Erro API estática:', err.message));
        }
      } else {
        acertosSeguidos.current = 0;
        if (isMounted) { setProgressoLocal(0); setFeedback('Posicione a mão'); }
        frameBufferRef.current = [];
        repousoCountRef.current = 0;
      }
    });

    if (videoRef.current) {
      cameraInstancia.current = new CameraLib(videoRef.current, {
        onFrame: async () => { if (isMounted) await hands.send({ image: videoRef.current }); },
        width: 640, height: 480,
      });
      cameraInstancia.current.start();
      axios.get(`${API_URL}/status`, { timeout: 2000 })
        .then(() => { if (isMounted) setFeedback('Câmera ligada! Faça o sinal 👋'); })
        .catch(() => { if (isMounted) setFeedback('API offline - verifique o servidor'); });
    }

    return () => {
      isMounted = false;
      if (cameraInstancia.current) { cameraInstancia.current.stop(); cameraInstancia.current = null; }
      if (hands) hands.close();
    };
  }, [cameraAtiva]);

  const sinalAlvo  = SINAIS[indice];
  const ehDinamica = SINAIS_DINAMICOS.has(sinalAlvo);
  const acertosNecessariosAtual = typeof config.acertosNecessarios === 'function'
    ? config.acertosNecessarios(sinalAlvo)
    : (ehDinamica ? 2 : 10);
  const progressoPercentual = (progressoLocal / acertosNecessariosAtual) * 100;

  const nomeModulo = {
    alfabeto:  'Alfabeto',
    saudacoes: 'Saudações',
    emocoes:   'Emoções',
  }[moduloAtual] || 'Módulo';

  const feedbackStyle = (() => {
    const baseStyle = { ...styles.feedbackBox };
    if (feedback.includes('✅') || feedback.includes('Correto') || feedback.includes('Perfeito'))
      return { ...baseStyle, border: '2px solid #4CAF50', background: '#F0FFF4', color: '#2E7D32' };
    if (feedback.includes('Fazendo'))
      return { ...baseStyle, border: '2px solid #FFA76C', background: '#FFF8F3', color: '#E65100' };
    if (feedback.includes('repouso'))
      return { ...baseStyle, border: '2px solid #90A4AE', background: '#ECEFF1', color: '#546E7A' };
    return baseStyle;
  })();

  const videoSrc = sinalAlvo !== 'REPOUSO'
    ? `/src/assets/${config.pastaVideos}/${sinalAlvo}.${config.extensao}`
    : null;

  const handleProximoModulo = () => {
    const modulosDisponiveis = ['alfabeto', 'saudacoes', 'emocoes'];
    const idx = modulosDisponiveis.indexOf(moduloAtual);
    if (idx < modulosDisponiveis.length - 1) {
      sessionStorage.setItem('modulo_atual', modulosDisponiveis[idx + 1]);
      window.location.reload();
    } else {
      navigate('/aluno/dashboard');
    }
  };

  const xpPercent = Math.min(100, Math.round((xp / XP_POR_NIVEL) * 100));

  // Estilos dinâmicos do painel de referência para módulos expandidos
  const referencePanelStyle = isModuloExpandido
    ? { ...styles.referencePanel, ...styles.referencePanelExpandido }
    : styles.referencePanel;

  const videoWrapperStyle = isModuloExpandido
    ? { ...styles.videoWrapper, ...styles.videoWrapperExpandido }
    : styles.videoWrapper;

  const mediaRefStyle = isModuloExpandido
    ? { ...styles.mediaRef, ...styles.mediaRefExpandido, opacity: travado ? 0.4 : 1 }
    : { ...styles.mediaRef, opacity: travado ? 0.4 : 1 };

  return (
    <div style={styles.body}>
      {modalVitoria && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <span style={styles.modalHeaderTitle}>Módulo Concluído!</span>
              <button style={styles.modalCloseBtn} onClick={() => navigate('/aluno/dashboard')}>✕</button>
            </div>
            <h2 style={styles.modalTitle}>Parabéns, {apelido}! 🎉</h2>
            <div style={styles.modalGraphics}>🌟 🌟 🌟</div>
            <h3 style={styles.modalClass}>
              {pulos === 0 ? '🏆 Perfeito — nenhum sinal pulado!' : `Módulo: ${nomeModulo}`}
            </h3>

            <div style={styles.modalStatsBox}>
              <div style={styles.modalStatsTitle}>Resumo da Sessão</div>
              <div style={styles.statRow}>
                <span>Sinais concluídos:</span>
                <span>{SINAIS.length - pulos} / {SINAIS.length}</span>
              </div>
              <div style={styles.statRow}>
                <span>XP ganho:</span>
                <span>+{xpSessao} XP</span>
              </div>
              <div style={styles.statRow}>
                <span>Pulos usados:</span>
                <span>{pulos}</span>
              </div>
              <div style={styles.statRow}>
                <span>Nível atual:</span>
                <span>Nível {nivel}</span>
              </div>
            </div>

            {conquistasSessao.length > 0 ? (
              <div style={styles.conquistasBox}>
                <div style={styles.conquistasTitle}>🏅 Conquistas desbloqueadas!</div>
                <div style={styles.conquistasGrid}>
                  {conquistasSessao.map(c => (
                    <div key={c.chave} style={styles.conquistaItem}>
                      <span style={styles.conquistaEmoji}>{c.emoji}</span>
                      <span style={styles.conquistaNome}>{c.titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.conquistasBox}>
                <div style={styles.conquistasTitle}>Continue praticando para desbloquear conquistas!</div>
              </div>
            )}

            <div style={styles.modalButtonsArea}>
              <button
                style={styles.modalBtnSecondary}
                onClick={() => {
                  setModalVitoria(false);
                  setIndice(0);
                  setTravado(false);
                  travadoRef.current = false;
                  setPulos(0);
                  pulosRef.current = 0;
                  setXpSessao(0);
                  xpSessaoRef.current = 0;
                  setConquistasSessao([]);
                }}
              >
                Jogar novamente
              </button>
              <button style={styles.modalBtnSecondary} onClick={() => navigate('/aluno/dashboard')}>Dashboard</button>
              <button style={styles.modalBtnPrimary} onClick={handleProximoModulo}>Próximo Módulo</button>
            </div>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoEmoji}>👏</span> LibrasKids
        </div>
        <div style={styles.headerGamification}>
          <div style={styles.nivelBadge}>Nível {nivel}</div>
          <div style={styles.xpInfo}>
            <div style={styles.xpTrack}>
              <div style={{ ...styles.xpFill, width: `${xpPercent}%` }}></div>
            </div>
            <span style={styles.xpLabel}>{xp}/{XP_POR_NIVEL} xp</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.avatar}>
            <img src={`https://api.dicebear.com/9.x/${avatarEstilo}/svg?seed=${apelido}`} alt="avatar" />
          </div>
          <div style={{ position: 'relative' }}>
            <button style={styles.btnMenu} onClick={() => setMenuAberto(v => !v)}>☰</button>
            {menuAberto && (
              <div style={styles.dropdown}>
                <button style={styles.dropdownItem} onClick={() => {
                  if (cameraInstancia.current) cameraInstancia.current.stop();
                  sessionStorage.clear();
                  navigate('/entrar');
                }}>🚪 Sair</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={styles.subHeader}>
        <div style={styles.progressoAlfabeto}>
          {nomeModulo} • Sinal {indice + 1} de {SINAIS.length}
          {ehDinamica && <span style={styles.dinamicaBadge}>movimento</span>}
        </div>
        <div style={feedbackStyle}>
          <span style={styles.feedbackText}>{feedback}</span>
        </div>
        <button style={styles.btnVoltar} onClick={() => {
          if (cameraInstancia.current) cameraInstancia.current.stop();
          navigate('/aluno/dashboard');
        }}>⬅️ Voltar</button>
      </div>

      <main style={isModuloExpandido ? styles.mainExpandido : styles.main}>
        <div style={referencePanelStyle}>
          <p style={styles.imiteLabel}>Imite o sinal:</p>
          {videoSrc ? (
            <div style={videoWrapperStyle}>
              <video
                key={`${moduloAtual}-${sinalAlvo}`}
                src={videoSrc}
                style={mediaRefStyle}
                autoPlay muted playsInline
                onError={(e) => e.target.src = `/src/assets/${config.pastaVideos}/${sinalAlvo}.${config.extensao.toLowerCase()}`}
              />
              <div style={isModuloExpandido ? styles.letraOverlayExpandido : styles.letraOverlay}>{sinalAlvo}</div>
              <button
                style={styles.btnReplay}
                title="Repetir vídeo"
                onClick={(e) => {
                  const video = e.currentTarget.closest('div').querySelector('video');
                  if (video) { video.currentTime = 0; video.play(); }
                }}
              >↺</button>
            </div>
          ) : (
            <div style={styles.repousoPlaceholder}>🖐️<br />REPOUSO</div>
          )}
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.cameraSquare}>
            <div style={styles.cameraArea}>
              {!cameraAtiva ? (
                <div style={styles.cameraPlaceholder}>
                  <span style={styles.cameraIconOff}>🎥</span>
                  <p style={styles.cameraTextOff}>Ligue sua câmera</p>
                </div>
              ) : (
                <div style={styles.videoContainer}>
                  <video ref={videoRef} style={styles.videoFeed} />
                  <div style={styles.progressContainer}>
                    <div style={{ ...styles.progressBar, width: `${progressoPercentual}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <button
          style={{
            ...styles.btnCamera,
            background: cameraAtiva ? 'linear-gradient(135deg, #FF5252, #D32F2F)' : 'linear-gradient(135deg, #FFA76C, #FF7043)',
          }}
          onClick={toggleCamera}
        >
          <span style={styles.btnCameraIcon}>{cameraAtiva ? '🚫' : '🎥'}</span>
          <span style={styles.btnCameraLabel}>{cameraAtiva ? 'Desligar' : 'Ligar câmera'}</span>
        </button>

        <div style={styles.navButtons}>
          <button
            style={styles.btnNav}
            onClick={() => {
              acertosSeguidos.current = 0;
              setProgressoLocal(0);
              frameBufferRef.current = [];
              ultimoEnvioRef.current = 0;
              repousoCountRef.current = 0;
              setIndice((prev) => (prev === 0 ? SINAIS.length - 1 : prev - 1));
              setFeedback('Aguardando Resposta...');
            }}
          >
            <span style={styles.navArrow}>◀</span> Voltar
          </button>
          <button
            style={{ ...styles.btnNav, ...styles.btnNavPrimary }}
            onClick={() => {
              acertosSeguidos.current = 0;
              setProgressoLocal(0);
              frameBufferRef.current = [];
              ultimoEnvioRef.current = 0;
              repousoCountRef.current = 0;
              setPulos(prev => { const novo = prev + 1; pulosRef.current = novo; return novo; });

              if (indice === SINAIS.length - 1) {
                setModalVitoria(true);
                if (cameraInstancia.current) { cameraInstancia.current.stop(); }
                setCameraAtiva(false);
              } else {
                setIndice((prev) => prev + 1);
                setFeedback('Aguardando Resposta...');
              }
            }}
          >
            Pular <span style={styles.navArrow}>▶</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  // MODAL DE VITÓRIA
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, overflowY: 'auto', padding: '20px', boxSizing: 'border-box' },
  modalBox: { background: '#F0F4F8', width: '520px', maxWidth: '100%', borderRadius: '12px', boxShadow: '0 12px 36px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px', border: '2px solid #FFF', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  modalHeaderTitle: { fontSize: '1rem', color: '#555', fontWeight: '700' },
  modalCloseBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#555' },
  modalTitle: { textAlign: 'center', fontSize: '1.4rem', fontWeight: '900', color: '#222', margin: '10px 0' },
  modalGraphics: { textAlign: 'center', fontSize: '3rem', margin: '10px 0', letterSpacing: '8px' },
  modalClass: { textAlign: 'center', fontSize: '1.1rem', fontWeight: '800', color: '#333', margin: '5px 0 16px 0' },
  modalStatsBox: { background: '#FFFFFF', border: '1px solid #D9E2EC', borderRadius: '8px', padding: '16px', position: 'relative', marginBottom: '12px' },
  modalStatsTitle: { position: 'absolute', top: '-10px', left: '16px', background: '#F0F4F8', padding: '0 8px', fontSize: '0.85rem', color: '#627D98', fontWeight: '700' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#334E68', padding: '4px 0', borderBottom: '1px dashed #E4E7EB' },
  conquistasBox: { background: '#FFFBF0', border: '1px solid #FFD080', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
  conquistasTitle: { fontSize: '0.9rem', fontWeight: '800', color: '#B7791F', marginBottom: '12px' },
  conquistasGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  conquistaItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#FFF9ED', border: '1.5px solid #FFD080', borderRadius: '10px', padding: '10px 14px', gap: '4px', minWidth: '80px' },
  conquistaEmoji: { fontSize: '1.8rem' },
  conquistaNome: { fontSize: '0.72rem', fontWeight: '800', color: '#92400E', textAlign: 'center' },
  modalButtonsArea: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' },
  modalBtnSecondary: { background: '#FFF', border: '1px solid #BCCCDC', color: '#334E68', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' },
  modalBtnPrimary: { background: 'linear-gradient(135deg, #FFA76C, #FF8A50)', border: 'none', color: '#FFF', padding: '8px 20px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' },
  
  // ESTILOS ORIGINAIS
  body: { height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#F6F7DB', overflow: 'hidden', margin: 0, padding: 0, fontFamily: 'Nunito, sans-serif' },
  header: { height: '60px', background: '#FFFFFF', borderBottom: '1px solid #e8e8e8', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', fontWeight: '900', color: '#2C2C2C' },
  logoEmoji: { fontSize: '1.7rem' },
  headerGamification: { display: 'flex', alignItems: 'center', gap: '12px' },
  nivelBadge: { background: '#FFA76C', color: 'white', padding: '5px 16px', borderRadius: '20px', fontWeight: '800', fontSize: '0.95rem' },
  xpInfo: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' },
  xpTrack: { width: '90px', height: '8px', background: '#E0E0E0', borderRadius: '5px', overflow: 'hidden' },
  xpFill: { height: '100%', background: 'linear-gradient(90deg, #FFA76C, #FFD080)', transition: 'width 0.4s ease' },
  xpLabel: { fontSize: '0.78rem', fontWeight: '700', color: '#888' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #FFA76C' },
  btnMenu: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888', padding: '4px 8px' },
  subHeader: { height: '50px', background: '#FAFAD8', borderBottom: '1px solid #EBEBC8', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0 },
  progressoAlfabeto: { fontWeight: '700', color: '#888', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' },
  dinamicaBadge: { background: '#FFF3E0', color: '#FF8C42', border: '1.5px solid #FFD080', borderRadius: '20px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: '700' },
  btnVoltar: { background: '#FFFFFF', color: '#666', border: '1.5px solid #CCC', padding: '6px 14px', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' },

  // MAIN ORIGINAL (alfabeto)
  main: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', padding: '24px 32px', overflow: 'hidden', minHeight: 0 },

  // MAIN EXPANDIDO (emocoes / saudacoes) — menos gap, mais espaço para o painel de referência
  mainExpandido: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '16px 24px', overflow: 'hidden', minHeight: 0 },

  // PAINEL DE REFERÊNCIA ORIGINAL (alfabeto)
  referencePanel: { width: '320px', height: '100%', maxHeight: '480px', borderRadius: '24px', background: '#FFFFFF', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', padding: '16px', overflow: 'hidden', minHeight: 0 },

  // PAINEL DE REFERÊNCIA EXPANDIDO (emocoes / saudacoes)
  referencePanelExpandido: { width: '550px', aspectRatio: '1021 / 718', maxWidth: '72%', maxHeight: '100%', flexShrink: 0 },

  imiteLabel: { margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#AAAAAA', letterSpacing: '0.5px', flexShrink: 0 },

  // VIDEO WRAPPER ORIGINAL (com fundo preto)
  videoWrapper: { position: 'relative', width: '100%', flex: 1, borderRadius: '14px', overflow: 'hidden', background: '#000', minHeight: 0 },

  // VIDEO WRAPPER EXPANDIDO — sem fundo preto, fundo transparente/neutro
  videoWrapperExpandido: { background: 'transparent', flex: 1 },

  // MEDIA REF ORIGINAL
  mediaRef: { width: '100%', height: '100%', display: 'block', objectFit: 'cover' },

  // MEDIA REF EXPANDIDO — cover preenche sem barras pretas
  mediaRefExpandido: { objectFit: 'cover', borderRadius: '12px' },

  letraOverlay: { position: 'absolute', top: '10px', left: '12px', fontSize: '2.4rem', fontWeight: '900', color: '#FFA76C', background: 'rgba(255,255,255,0.88)', borderRadius: '10px', padding: '2px 12px', lineHeight: 1.3 },
  letraOverlayExpandido: { position: 'absolute', top: '10px', left: '12px', fontSize: '2.8rem', fontWeight: '900', color: '#FFA76C', background: 'rgba(255,255,255,0.88)', borderRadius: '10px', padding: '4px 16px', lineHeight: 1.3 },
  btnReplay: { position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFA76C', fontWeight: '900', lineHeight: 1 },
  repousoPlaceholder: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '1.5rem', fontWeight: '800', textAlign: 'center', lineHeight: 1.6 },
  rightPanel: { display: 'flex', height: '100%', maxHeight: '480px', aspectRatio: '4 / 3' },
  cameraSquare: { width: '100%', height: '100%', background: '#FFFFFF', padding: '16px', borderRadius: '24px', boxSizing: 'border-box', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' },
  cameraArea: { flex: 1, background: 'transparent', borderRadius: '14px', overflow: 'hidden', position: 'relative' },
  videoContainer: { position: 'relative', width: '100%', height: '100%' },
  videoFeed: { width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' },
  cameraPlaceholder: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#8899AA', gap: '12px' },
  cameraIconOff: { fontSize: '3rem', opacity: 0.4 },
  cameraTextOff: { fontSize: '1.1rem', fontWeight: '700', opacity: 0.5, margin: 0 },
  progressContainer: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)' },
  progressBar: { height: '100%', background: '#4CAF50', transition: 'width 0.1s linear' },
  feedbackBox: { background: '#FFFFFF', border: '2px solid #E0E0E0', borderRadius: '12px', padding: '5px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', flex: 1, transition: 'all 0.25s ease', boxSizing: 'border-box' },
  feedbackText: { fontSize: '0.95rem', fontWeight: '800', color: '#555', textAlign: 'center', whiteSpace: 'nowrap' },
  dropdown: { position: 'absolute', top: '44px', right: 0, background: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '160px', zIndex: 100, overflow: 'hidden' },
  dropdownItem: { width: '100%', background: 'none', border: 'none', padding: '12px 20px', textAlign: 'left', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', color: '#E53935', display: 'flex', alignItems: 'center', gap: '8px' },
  footer: { height: '64px', background: '#FFFFFF', borderTop: '1px solid #EEE', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexShrink: 0 },
  btnCamera: { display: 'flex', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '999px', padding: '0 20px', height: '42px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: '0.9rem', color: '#fff', boxShadow: '0 4px 14px rgba(255,120,60,0.35)', flexShrink: 0 },
  btnCameraIcon: { fontSize: '1.2rem' },
  btnCameraLabel: { letterSpacing: '0.3px' },
  navButtons: { display: 'flex', gap: '10px', alignItems: 'center' },
  btnNav: { display: 'flex', alignItems: 'center', gap: '6px', background: '#F0F0F0', color: '#444', border: '2px solid #DCDCDC', padding: '0 22px', height: '42px', borderRadius: '999px', fontSize: '0.92rem', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' },
  btnNavPrimary: { background: 'linear-gradient(135deg, #FFA76C, #FF8A50)', color: '#fff', border: '2px solid transparent', boxShadow: '0 4px 12px rgba(255,140,80,0.35)' },
  navArrow: { fontSize: '0.75rem' },
};

export default AppAluno;