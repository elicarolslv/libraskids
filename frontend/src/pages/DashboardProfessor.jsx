import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://127.0.0.1:8000';

// ─── Telas possíveis: 'turmas' | 'alunos' | 'relatorio' | 'perfil' ───
const DashboardProfessor = () => {
  const { professor, logout } = useAuth();
  const navigate = useNavigate();

  const [tela, setTela]               = useState('turmas'); 
  const [turmas, setTurmas]           = useState([]);
  const [turmaSel, setTurmaSel]       = useState(null);
  const [alunos, setAlunos]           = useState([]);
  const [relatorio, setRelatorio]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [modalTurma, setModalTurma]   = useState(false);
  const [modalAluno, setModalAluno]   = useState(false);
  const [modalPin, setModalPin]       = useState(false); 
  const [editandoTurma, setEditandoTurma] = useState(null);
  const [editandoAluno, setEditandoAluno] = useState(null);
  const [alunoPin, setAlunoPin]       = useState(null); 

  const [nomeTurma, setNomeTurma]     = useState('');
  const [serieTurma, setSerieTurma]   = useState('');
  const [nomeAluno, setNomeAluno]     = useState('');
  const [apelidoAluno, setApelidoAluno] = useState('');
  const [pinAluno, setPinAluno]       = useState('');
  const [novoPin, setNovoPin]         = useState('');
  
  // ─── Estados do Perfil ───
  const [perfilNome, setPerfilNome]     = useState('');
  const [perfilEmail, setPerfilEmail]   = useState('');
  const [perfilEscola, setPerfilEscola] = useState('');
  const [senhaAtual, setSenhaAtual]     = useState('');
  const [novaSenha, setNovaSenha]       = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [erro, setErro]               = useState('');
  const [sucesso, setSucesso]         = useState('');

  const carregarTurmas = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/turmas`);
      setTurmas(res.data);
    } catch {
      setErro('Erro ao carregar turmas.');
    }
  }, []);

  useEffect(() => {
    if (!professor) { navigate('/professor/login'); return; }
    carregarTurmas();
  }, [professor, navigate, carregarTurmas]);

  const carregarAlunos = useCallback(async (turmaId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/turmas/${turmaId}/alunos`);
      setAlunos(res.data);
    } catch {
      setErro('Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarRelatorio = useCallback(async (turmaId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/turmas/${turmaId}/relatorio`);
      setRelatorio(res.data);
    } catch {
      setErro('Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  }, []);

  const baixarRelatorioCSV = async () => {
    try {
      const res = await axios.get(`${API}/turmas/${turmaSel.id}/exportar`, {
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${turmaSel.codigo_unico}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      flash('Download iniciado com sucesso!');
    } catch (e) {
      flash('Erro ao exportar relatório.', 'erro');
    }
  };

  const abrirTurma = (turma) => {
    setTurmaSel(turma);
    setAlunos([]);
    setTela('alunos');
    carregarAlunos(turma.id);
    setSidebarOpen(false);
  };

  const abrirRelatorio = (turma) => {
    setTurmaSel(turma);
    setRelatorio(null);
    setTela('relatorio');
    carregarRelatorio(turma.id);
    setSidebarOpen(false);
  };

  const voltarParaTurmas = () => {
    setTurmaSel(null);
    setTela('turmas');
    setAlunos([]);
    setRelatorio(null);
  };

  // ✅ Abre a tela de perfil e carrega os dados atuais do professor
  const abrirPerfil = async () => {
    setTurmaSel(null);
    setTela('perfil');
    try {
      const res = await axios.get(`${API}/professor/me`);
      setPerfilNome(res.data.nome || '');
      setPerfilEmail(res.data.email || '');
      setPerfilEscola(res.data.escola || '');
    } catch (e) {
      flash('Erro ao carregar os dados do perfil.', 'erro');
    }
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  // ✅ Salva as atualizações do perfil
  const salvarPerfil = async (e) => {
    e.preventDefault();
    if (novaSenha && novaSenha !== confirmarSenha) {
      flash('As novas senhas não coincidem.', 'erro');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/professor/me`, {
        nome: perfilNome,
        email: perfilEmail,
        escola: perfilEscola,
        senha_atual: senhaAtual,
        nova_senha: novaSenha
      });
      flash('Perfil atualizado com sucesso!');
      setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
      // Atualiza a página levemente para que o nome no Sidebar mude
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      flash(e.response?.data?.error || 'Erro ao atualizar perfil.', 'erro');
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg, tipo = 'sucesso') => {
    if (tipo === 'sucesso') { setSucesso(msg); setTimeout(() => setSucesso(''), 3000); }
    else { setErro(msg); setTimeout(() => setErro(''), 4000); }
  };

  const abrirModalTurma = (turma = null) => {
    setEditandoTurma(turma);
    setNomeTurma(turma?.nome || '');
    setSerieTurma(turma?.serie || '');
    setModalTurma(true);
  };

  const salvarTurma = async () => {
    if (!nomeTurma.trim()) { flash('Informe o nome da turma.', 'erro'); return; }
    try {
      if (editandoTurma) {
        await axios.put(`${API}/turmas/${editandoTurma.id}`, { nome: nomeTurma, serie: serieTurma });
        flash('Turma atualizada!');
      } else {
        await axios.post(`${API}/turmas`, { nome: nomeTurma, serie: serieTurma });
        flash('Turma criada!');
      }
      setModalTurma(false);
      carregarTurmas();
    } catch (e) {
      flash(e.response?.data?.error || 'Erro ao salvar turma.', 'erro');
    }
  };

  const excluirTurma = async (turma) => {
    if (!window.confirm(`Excluir a turma "${turma.nome}"? Todos os alunos serão removidos.`)) return;
    try {
      await axios.delete(`${API}/turmas/${turma.id}`);
      if (turmaSel?.id === turma.id) voltarParaTurmas();
      flash('Turma excluída.');
      carregarTurmas();
    } catch (e) {
      flash(e.response?.data?.error || 'Erro ao excluir turma.', 'erro');
    }
  };

  const abrirModalAluno = (aluno = null) => {
    setEditandoAluno(aluno);
    setNomeAluno(aluno?.nome_completo || '');
    setApelidoAluno(aluno?.apelido || '');
    setPinAluno('');
    setModalAluno(true);
  };

  const salvarAluno = async () => {
    if (!nomeAluno.trim()) { flash('Informe o nome do aluno.', 'erro'); return; }
    if (!editandoAluno && !/^\d{4}$/.test(pinAluno)) {
      flash('PIN deve ter exatamente 4 dígitos.', 'erro'); return;
    }
    if (editandoAluno && pinAluno && !/^\d{4}$/.test(pinAluno)) {
      flash('PIN deve ter exatamente 4 dígitos.', 'erro'); return;
    }
    try {
      if (editandoAluno) {
        const payload = { nome_completo: nomeAluno, apelido: apelidoAluno };
        if (pinAluno) payload.pin = pinAluno;
        await axios.put(`${API}/alunos/${editandoAluno.id}`, payload);
        flash('Aluno atualizado!');
      } else {
        await axios.post(`${API}/turmas/${turmaSel.id}/alunos`, {
          nome_completo: nomeAluno, apelido: apelidoAluno, pin: pinAluno,
        });
        flash('Aluno adicionado!');
      }
      setModalAluno(false);
      carregarAlunos(turmaSel.id);
    } catch (e) {
      flash(e.response?.data?.error || 'Erro ao salvar aluno.', 'erro');
    }
  };

  const removerAluno = async (aluno) => {
    if (!window.confirm(`Remover "${aluno.nome_completo}"?`)) return;
    try {
      await axios.delete(`${API}/alunos/${aluno.id}`);
      flash('Aluno removido.');
      carregarAlunos(turmaSel.id);
    } catch (e) {
      flash(e.response?.data?.error || 'Erro ao remover aluno.', 'erro');
    }
  };

  const desbloquearAluno = async (aluno) => {
    try {
      await axios.post(`${API}/alunos/${aluno.id}/desbloquear`);
      flash(`${aluno.apelido} desbloqueado!`);
      carregarAlunos(turmaSel.id);
    } catch {
      flash('Erro ao desbloquear.', 'erro');
    }
  };

  const abrirModalPin = (aluno) => {
    setAlunoPin(aluno);
    setNovoPin('');
    setModalPin(true);
  };

  const salvarNovoPin = async () => {
    if (!/^\d{4}$/.test(novoPin)) {
      flash('O novo PIN deve ter exatamente 4 dígitos.', 'erro'); return;
    }
    try {
      await axios.patch(`${API}/alunos/${alunoPin.id}/pin`, { pin: novoPin });
      flash(`PIN de ${alunoPin.apelido || alunoPin.nome_completo} redefinido!`);
      setModalPin(false);
    } catch (e) {
      flash(e.response?.data?.error || 'Erro ao redefinir PIN.', 'erro');
    }
  };

  const inicialProfessor = professor?.nome?.[0]?.toUpperCase() || 'P';
  const cores = ['#FFB347', '#87CEEB', '#98D8A0', '#F4A7B9', '#C3A6E8', '#F7DC6F'];

  const nivelLabel = (nivel) => {
    const labels = { 1: 'Iniciante', 2: 'Básico', 3: 'Intermediário', 4: 'Avançado', 5: 'Expert' };
    return labels[nivel] || `Nível ${nivel}`;
  };
  const nivelCor = (nivel) => {
    const cores2 = { 1: '#87CEEB', 2: '#98D8A0', 3: '#FFB347', 4: '#F4A7B9', 5: '#C3A6E8' };
    return cores2[nivel] || '#ccc';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; }
        
        body { font-family: 'Nunito', 'Segoe UI', sans-serif; background-color: #F4F6F8 !important; color: #333 !important; }

        .dash-page { display: flex; min-height: 100vh; background: #F4F6F8 !important; }

        /* SIDEBAR */
        .sidebar {
          width: 240px; min-height: 100vh; background: #1C1C1E; display: flex; flex-direction: column;
          padding: 0; position: sticky; top: 0; flex-shrink: 0; transition: transform 0.3s ease;
        }
        .sidebar-top { padding: 28px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .sidebar-logo { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 900; color: #FFA76C; margin-bottom: 24px; }
        .sidebar-logo span:first-child { font-size: 28px; }
        .sidebar-prof { display: flex; align-items: center; gap: 12px; }
        .sidebar-avatar {
          width: 40px; height: 40px; border-radius: 50%; background: #FFA76C; color: white;
          display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; flex-shrink: 0;
        }
        .sidebar-prof-info { overflow: hidden; }
        .sidebar-prof-nome { font-size: 14px; font-weight: 800; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-prof-role { font-size: 12px; color: #888; font-weight: 600; }

        .sidebar-nav { flex: 1; padding: 20px 12px; display: flex; flex-direction: column; gap: 4px; }
        .sidebar-section-label {
          font-size: 10px; font-weight: 800; color: #555; text-transform: uppercase; letter-spacing: 1.5px;
          padding: 0 8px; margin: 12px 0 6px;
        }
        .sidebar-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px;
          font-size: 14px; font-weight: 700; color: #888; cursor: pointer; transition: all 0.2s; border: none;
          background: none; width: 100%; text-align: left; font-family: inherit;
        }
        .sidebar-item:hover { color: white; background: rgba(255,255,255,0.06); }
        .sidebar-item.active { color: white; background: rgba(255,167,108,0.2); }
        .sidebar-item .item-icon { font-size: 16px; }

        .sidebar-bottom { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .logout-btn {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px;
          font-size: 14px; font-weight: 700; color: #666; cursor: pointer; transition: all 0.2s; border: none;
          background: none; width: 100%; font-family: inherit;
        }
        .logout-btn:hover { color: #ff6b6b; background: rgba(255,107,107,0.1); }

        /* MAIN */
        .dash-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

        /* TOP BAR */
        .topbar {
          background: white !important; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #EAEAEA; position: sticky; top: 0; z-index: 50;
        }
        .topbar-title { font-size: 20px; font-weight: 900; color: #1a1a1a !important; }
        .topbar-subtitle { font-size: 13px; color: #999; font-weight: 600; }
        .topbar-right { display: flex; align-items: center; gap: 12px; }

        .btn-primary {
          padding: 10px 20px; background: #FFA76C; color: white; border: none; border-radius: 12px; font-size: 14px;
          font-weight: 800; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        .btn-primary:hover { background: #ff9248; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(255,167,108,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-secondary {
          padding: 10px 18px; background: #F4F4F4; color: #555; border: none; border-radius: 12px; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .btn-secondary:hover { background: #EAEAEA; }

        .btn-back {
          background: none; border: none; color: #FFA76C; cursor: pointer; font-weight: 800; font-size: 14px;
          font-family: inherit; display: flex; align-items: center; gap: 6px; padding: 8px 0;
        }
        .btn-back:hover { color: #ff9248; }

        .tela-tabs {
          display: flex; gap: 4px; background: #F4F4F4; border-radius: 12px; padding: 4px; margin-bottom: 24px; width: fit-content;
        }
        .tela-tab {
          padding: 8px 18px; border-radius: 10px; border: none; font-family: inherit; font-size: 14px; font-weight: 800;
          cursor: pointer; transition: all 0.2s; color: #999; background: none;
        }
        .tela-tab.active { background: white; color: #1a1a1a; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

        .dash-content { padding: 32px; flex: 1; overflow-y: auto; }

        /* PERFIL FORM */
        .perfil-card {
          background: white; border-radius: 24px; padding: 32px; max-width: 600px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .perfil-section {
          margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #F0F0F0;
        }
        .perfil-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .perfil-section h4 { font-size: 16px; font-weight: 900; color: #333; margin-bottom: 16px; }

        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .form-group label { font-size: 13px; font-weight: 800; color: #777; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-input {
          padding: 13px 16px; border-radius: 12px; border: 2px solid #E8E8E8; font-size: 15px;
          font-family: inherit; outline: none; background-color: #FFFFFF !important;
          color: #333333 !important; font-weight: 600; transition: border-color 0.2s;
        }
        .form-input:focus { border-color: #FFA76C !important; }

        /* OUTROS ESTILOS JÁ EXISTENTES */
        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: white !important; border-radius: 20px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        .stat-icon { font-size: 28px; margin-bottom: 12px; }
        .stat-value { font-size: 32px; font-weight: 900; color: #1a1a1a !important; }
        .stat-label { font-size: 13px; color: #999; font-weight: 700; margin-top: 4px; }

        .turmas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
        .turma-card {
          background: white !important; border-radius: 20px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 2px solid transparent; transition: all 0.25s; cursor: pointer;
        }
        .turma-card:hover { border-color: #FFA76C; transform: translateY(-4px); box-shadow: 0 12px 32px rgba(255,167,108,0.18); }
        .turma-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .turma-icon-wrap { width: 52px; height: 52px; border-radius: 16px; background: rgba(255,167,108,0.12); display: flex; align-items: center; justify-content: center; font-size: 26px; }
        .turma-card-actions { display: flex; gap: 6px; }

        .btn-icon { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #E8E8E8; background: white !important; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: #555 !important; }
        .btn-icon:hover { background: #F4F4F4 !important; }
        .btn-icon.danger { color: #E53935 !important; }
        .btn-icon.danger:hover { background: #FFF3F3 !important; border-color: #FFCDD2 !important; }

        .turma-nome { font-size: 17px; font-weight: 900; color: #1a1a1a !important; margin-bottom: 4px; }
        .turma-serie { font-size: 13px; color: #999; font-weight: 600; margin-bottom: 12px; }
        .turma-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid #F0F0F0; }
        .turma-codigo { background: rgba(255,167,108,0.12); color: #E67E22; padding: 5px 12px; border-radius: 8px; font-size: 13px; font-weight: 800; letter-spacing: 1px; }
        .turma-alunos { font-size: 13px; color: #999; font-weight: 700; }
        .turma-btns { display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #F0F0F0; }
        .btn-turma-acao { flex: 1; padding: 8px 0; border-radius: 10px; border: 1.5px solid #E8E8E8; background: white !important; font-family: inherit; font-size: 13px; font-weight: 800; cursor: pointer; color: #555 !important; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 5px; }
        .btn-turma-acao:hover { border-color: #FFA76C; color: #FFA76C !important; background: rgba(255,167,108,0.05) !important; }

        .empty-state { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .empty-icon { font-size: 64px; }
        .empty-title { font-size: 22px; font-weight: 900; color: #1a1a1a !important; }
        .empty-desc { font-size: 15px; color: #999; font-weight: 600; max-width: 340px; line-height: 1.6; }

        .alunos-table { background: white !important; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        .table-header { display: grid; grid-template-columns: 2fr 1fr 110px 150px; padding: 14px 24px; background: #FAFAFA; border-bottom: 1px solid #F0F0F0; font-size: 12px; font-weight: 800; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
        .table-row { display: grid; grid-template-columns: 2fr 1fr 110px 150px; padding: 16px 24px; align-items: center; border-bottom: 1px solid #F8F8F8; transition: background 0.15s; }
        .table-row:hover { background: #FAFAFA; }
        .aluno-nome { font-size: 15px; font-weight: 800; color: #1a1a1a !important; }
        .aluno-apelido { font-size: 14px; color: #777; font-weight: 600; }
        .tag { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 8px; font-size: 12px; font-weight: 800; }
        .tag-ok { background: #F0FFF4; color: #2E7D32; }
        .tag-bloq { background: #FFF3F3; color: #C62828; }
        .row-actions { display: flex; gap: 5px; flex-wrap: wrap; }

        .relatorio-header { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .rel-stat { background: white !important; border-radius: 18px; padding: 20px 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        .rel-stat-icon { font-size: 24px; margin-bottom: 10px; }
        .rel-stat-value { font-size: 28px; font-weight: 900; color: #1a1a1a !important; }
        .rel-stat-label { font-size: 12px; color: #999; font-weight: 700; margin-top: 3px; }

        .relatorio-table { background: white !important; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        .rel-table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; padding: 14px 24px; background: #FAFAFA; border-bottom: 1px solid #F0F0F0; font-size: 12px; font-weight: 800; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
        .rel-table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; padding: 16px 24px; align-items: center; border-bottom: 1px solid #F8F8F8; transition: background 0.15s; }
        .rel-table-row:hover { background: #FAFAFA; }
        .nivel-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; color: white; }
        .progress-mini { height: 6px; background: #F0F0F0; border-radius: 100px; overflow: hidden; min-width: 60px; }
        .progress-mini-fill { height: 100%; background: linear-gradient(90deg, #FFA76C, #FFD580); border-radius: 100px; }

        .alert { border-radius: 14px; padding: 14px 18px; font-size: 14px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .alert-success { background: #F0FFF4; color: #2E7D32; border: 1.5px solid #A5D6A7; }
        .alert-error { background: #FFF3F3; color: #C62828; border: 1.5px solid #FFCDD2; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white !important; border-radius: 28px; padding: 36px; width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 24px 80px rgba(0,0,0,0.18); }
        .modal h3 { font-size: 22px; font-weight: 900; color: #1a1a1a !important; }
        .modal-field { display: flex; flex-direction: column; gap: 8px; }
        .modal-label { font-size: 12px; font-weight: 800; color: #777; text-transform: uppercase; letter-spacing: 0.5px; }
        .modal-input { padding: 13px 16px; border-radius: 12px; border: 2px solid #E8E8E8; font-size: 15px; font-family: inherit; outline: none; background-color: #FFFFFF !important; color: #333333 !important; font-weight: 600; transition: border-color 0.2s; }
        .modal-input:focus { border-color: #FFA76C !important; }
        .modal-btns { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
        .modal-hint { font-size: 13px; color: #aaa; font-weight: 600; line-height: 1.5; }

        @media (max-width: 768px) {
          .sidebar { position: fixed; z-index: 200; transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .dash-content { padding: 20px 16px; }
          .topbar { padding: 14px 16px; }
          .table-header, .table-row { grid-template-columns: 2fr 1fr 100px; }
          .table-header > :last-child, .table-row > :last-child { display: none; }
          .rel-table-header, .rel-table-row { grid-template-columns: 2fr 1fr 1fr; }
          .rel-table-header > :nth-child(4), .rel-table-header > :nth-child(5),
          .rel-table-row > :nth-child(4), .rel-table-row > :nth-child(5) { display: none; }
        }
      `}</style>

      <div className="dash-page">
        {/* SIDEBAR */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-top">
            <div className="sidebar-logo">
              <span>👏</span>
              <span>LibrasKids</span>
            </div>
            <div className="sidebar-prof">
              <div className="sidebar-avatar">{inicialProfessor}</div>
              <div className="sidebar-prof-info">
                <div className="sidebar-prof-nome">{professor?.nome || 'Professor'}</div>
                <div className="sidebar-prof-role">
                  {professor?.escola ? professor.escola : 'Professor'}
                </div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Menu</div>
            <button
              className={`sidebar-item${tela === 'turmas' && !turmaSel ? ' active' : ''}`}
              onClick={voltarParaTurmas}
            >
              <span className="item-icon">🏫</span> Minhas Turmas
            </button>
            <button
              className={`sidebar-item${tela === 'perfil' ? ' active' : ''}`}
              onClick={abrirPerfil}
            >
              <span className="item-icon">⚙️</span> Meu Perfil
            </button>
          </nav>

          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={() => { logout(); navigate('/professor/login'); }}>
              <span>🚪</span> Sair da conta
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="dash-main">
          {/* TOP BAR */}
          <header className="topbar">
            <div>
              {tela === 'perfil' ? (
                <>
                  <div className="topbar-title">Configurações de Perfil</div>
                  <div className="topbar-subtitle">Altere suas informações e credenciais</div>
                </>
              ) : turmaSel ? (
                <>
                  <button className="btn-back" onClick={voltarParaTurmas}>← Voltar para turmas</button>
                  <div className="topbar-title">{turmaSel.nome}</div>
                  <div className="topbar-subtitle">Código: {turmaSel.codigo_unico} · {turmaSel.serie || 'Sem série'}</div>
                </>
              ) : (
                <>
                  <div className="topbar-title">Minhas Turmas</div>
                  <div className="topbar-subtitle">Gerencie suas turmas e alunos</div>
                </>
              )}
            </div>
            <div className="topbar-right">
              {turmaSel && tela === 'alunos' && (
                <button className="btn-primary" onClick={() => abrirModalAluno()}>+ Adicionar aluno</button>
              )}
              {!turmaSel && tela !== 'perfil' && (
                <button className="btn-primary" onClick={() => abrirModalTurma()}>+ Nova turma</button>
              )}
            </div>
          </header>

          {/* CONTENT */}
          <div className="dash-content">
            {sucesso && <div className="alert alert-success">✅ {sucesso}</div>}
            {erro    && <div className="alert alert-error">⚠️ {erro}</div>}

            {/* ── TELA: PERFIL ── */}
            {tela === 'perfil' && (
              <div className="perfil-card">
                <form onSubmit={salvarPerfil}>
                  <div className="perfil-section">
                    <h4>Informações Pessoais</h4>
                    <div className="form-group">
                      <label>Nome Completo</label>
                      <input 
                        className="form-input" value={perfilNome} 
                        onChange={e => setPerfilNome(e.target.value)} required 
                      />
                    </div>
                    <div className="form-group">
                      <label>E-mail de acesso</label>
                      <input 
                        className="form-input" type="email" value={perfilEmail} 
                        onChange={e => setPerfilEmail(e.target.value)} required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Escola / Instituição (Opcional)</label>
                      <input 
                        className="form-input" value={perfilEscola} 
                        onChange={e => setPerfilEscola(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="perfil-section">
                    <h4>Segurança e Senha</h4>
                    <p className="modal-hint" style={{ marginBottom: 12 }}>
                      Preencha os campos abaixo apenas se desejar <strong>alterar sua senha</strong>.
                    </p>
                    <div className="form-group">
                      <label>Nova Senha</label>
                      <input 
                        className="form-input" type="password" value={novaSenha} 
                        onChange={e => setNovaSenha(e.target.value)} 
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirmar Nova Senha</label>
                      <input 
                        className="form-input" type="password" value={confirmarSenha} 
                        onChange={e => setConfirmarSenha(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="perfil-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <p className="modal-hint" style={{ marginBottom: 12, color: '#C62828' }}>
                      Para salvar <strong>qualquer</strong> alteração acima, precisamos da sua senha atual:
                    </p>
                    <div className="form-group">
                      <label>Senha Atual *</label>
                      <input 
                        className="form-input" type="password" value={senhaAtual} 
                        onChange={e => setSenhaAtual(e.target.value)} required 
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              </div>
            )}


            {/* ── TELA: TURMAS ── */}
            {tela === 'turmas' && !turmaSel && (
              <>
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-icon">🏫</div>
                    <div className="stat-value">{turmas.length}</div>
                    <div className="stat-label">Turmas ativas</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">👦</div>
                    <div className="stat-value">{turmas.reduce((acc, t) => acc + (t.total_alunos || 0), 0)}</div>
                    <div className="stat-label">Total de alunos</div>
                  </div>
                </div>

                {turmas.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🏫</div>
                    <div className="empty-title">Nenhuma turma ainda</div>
                    <div className="empty-desc">Crie sua primeira turma e comece a cadastrar alunos para ensinar Libras!</div>
                    <button className="btn-primary" onClick={() => abrirModalTurma()}>+ Criar primeira turma</button>
                  </div>
                ) : (
                  <div className="turmas-grid">
                    {turmas.map((t) => (
                      <div key={t.id} className="turma-card" onClick={() => abrirTurma(t)}>
                        <div className="turma-card-top">
                          <div className="turma-icon-wrap">🏫</div>
                          <div className="turma-card-actions" onClick={e => e.stopPropagation()}>
                            <button className="btn-icon" title="Editar" onClick={() => abrirModalTurma(t)}>✏️</button>
                            <button className="btn-icon danger" title="Excluir" onClick={() => excluirTurma(t)}>🗑</button>
                          </div>
                        </div>
                        <div className="turma-nome">{t.nome}</div>
                        <div className="turma-serie">{t.serie || 'Sem série definida'}</div>
                        <div className="turma-footer">
                          <span className="turma-codigo">{t.codigo_unico}</span>
                          <span className="turma-alunos">{t.total_alunos || 0} aluno(s)</span>
                        </div>
                        <div className="turma-btns" onClick={e => e.stopPropagation()}>
                          <button className="btn-turma-acao" onClick={() => abrirTurma(t)}>👦 Alunos</button>
                          <button className="btn-turma-acao relatorio" onClick={() => abrirRelatorio(t)}>📊 Relatório</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── TELA: ALUNOS ou RELATÓRIO (com tabs) ── */}
            {turmaSel && (
              <>
                <div className="tela-tabs">
                  <button
                    className={`tela-tab${tela === 'alunos' ? ' active' : ''}`}
                    onClick={() => { setTela('alunos'); carregarAlunos(turmaSel.id); }}
                  >
                    👦 Alunos
                  </button>
                  <button
                    className={`tela-tab${tela === 'relatorio' ? ' active' : ''}`}
                    onClick={() => { setTela('relatorio'); carregarRelatorio(turmaSel.id); }}
                  >
                    📊 Relatório
                  </button>
                </div>

                {tela === 'alunos' && (
                  loading ? (
                    <div className="empty-state">
                      <div className="empty-icon">⏳</div>
                      <div className="empty-desc">Carregando alunos...</div>
                    </div>
                  ) : alunos.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">👦</div>
                      <div className="empty-title">Nenhum aluno ainda</div>
                      <div className="empty-desc">Adicione alunos a esta turma. Eles acessarão com o código <strong>{turmaSel.codigo_unico}</strong> e um PIN de 4 dígitos.</div>
                      <button className="btn-primary" onClick={() => abrirModalAluno()}>+ Adicionar primeiro aluno</button>
                    </div>
                  ) : (
                    <div className="alunos-table">
                      <div className="table-header">
                        <span>Nome</span>
                        <span>Apelido</span>
                        <span>Status</span>
                        <span>Ações</span>
                      </div>
                      {alunos.map((a, idx) => (
                        <div key={a.id} className="table-row">
                          <div><div className="aluno-nome">{a.nome_completo}</div></div>
                          <div>
                            <div className="aluno-apelido">
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: cores[idx % cores.length], color: 'white', fontWeight: 800, fontSize: 12, marginRight: 8 }}>
                                {a.apelido?.[0]?.toUpperCase() || '?'}
                              </span>
                              {a.apelido || '—'}
                            </div>
                          </div>
                          <div>{a.bloqueado ? <span className="tag tag-bloq">🔒 Bloqueado</span> : <span className="tag tag-ok">✅ Ativo</span>}</div>
                          <div className="row-actions">
                            <button className="btn-icon" title="Editar" onClick={() => abrirModalAluno(a)}>✏️</button>
                            <button className="btn-icon" title="Redefinir PIN" onClick={() => abrirModalPin(a)}>🔑</button>
                            {a.bloqueado && <button className="btn-icon" title="Desbloquear" onClick={() => desbloquearAluno(a)}>🔓</button>}
                            <button className="btn-icon danger" title="Remover" onClick={() => removerAluno(a)}>🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {tela === 'relatorio' && (
                  loading ? (
                    <div className="empty-state">
                      <div className="empty-icon">📊</div>
                      <div className="empty-desc">Carregando relatório...</div>
                    </div>
                  ) : !relatorio ? (
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <div className="empty-title">Sem dados ainda</div>
                      <div className="empty-desc">Quando os alunos completarem módulos, os dados aparecerão aqui.</div>
                    </div>
                  ) : (
                    <>
                      <div className="relatorio-header">
                        <div className="rel-stat"><div className="rel-stat-icon">👦</div><div className="rel-stat-value">{relatorio.total_alunos ?? 0}</div><div className="rel-stat-label">Alunos</div></div>
                        <div className="rel-stat"><div className="rel-stat-icon">📚</div><div className="rel-stat-value">{relatorio.modulos_concluidos_total ?? 0}</div><div className="rel-stat-label">Módulos concluídos</div></div>
                        <div className="rel-stat"><div className="rel-stat-icon">⭐</div><div className="rel-stat-value">{relatorio.pontuacao_total ?? 0}</div><div className="rel-stat-label">Pontuação total</div></div>
                        <div className="rel-stat"><div className="rel-stat-icon">🏆</div><div className="rel-stat-value">{relatorio.nivel_medio ?? '—'}</div><div className="rel-stat-label">Nível médio</div></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a' }}>Estatísticas dos Alunos</h3>
                        <button className="btn-secondary" onClick={baixarRelatorioCSV}>📥 Exportar CSV</button>
                      </div>

                      {relatorio.alunos && relatorio.alunos.length > 0 ? (
                        <div className="relatorio-table">
                          <div className="rel-table-header"><span>Aluno</span><span>Módulos</span><span>Pontuação</span><span>Nível</span><span>Progresso</span></div>
                          {relatorio.alunos.map((a, idx) => {
                            const progressoPct = relatorio.total_modulos ? Math.round((a.modulos_concluidos / relatorio.total_modulos) * 100) : 0;
                            return (
                              <div key={a.id} className="rel-table-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', background: cores[idx % cores.length], color: 'white', fontWeight: 900, fontSize: 13 }}>
                                    {(a.apelido || a.nome_completo)?.[0]?.toUpperCase() || '?'}
                                  </span>
                                  <div><div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a1a' }}>{a.apelido || a.nome_completo}</div><div style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>{a.nome_completo}</div></div>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a1a' }}>
                                  {a.modulos_concluidos ?? 0}
                                  {relatorio.total_modulos ? <span style={{ color: '#bbb', fontWeight: 600, fontSize: 13 }}>/{relatorio.total_modulos}</span> : null}
                                </div>
                                <div style={{ fontWeight: 900, fontSize: 16, color: '#FFA76C' }}>{a.pontuacao ?? 0}</div>
                                <div><span className="nivel-badge" style={{ background: nivelCor(a.nivel) }}>{nivelLabel(a.nivel)}</span></div>
                                <div>
                                  <div style={{ fontSize: 12, color: '#999', fontWeight: 700, marginBottom: 4 }}>{progressoPct}%</div>
                                  <div className="progress-mini"><div className="progress-mini-fill" style={{ width: `${progressoPct}%` }} /></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty-state" style={{ padding: '40px 20px' }}>
                          <div className="empty-icon">📭</div>
                          <div className="empty-desc">Nenhum aluno com atividade registrada.</div>
                        </div>
                      )}
                    </>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL TURMA */}
      {modalTurma && (
        <div className="overlay" onClick={() => setModalTurma(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editandoTurma ? '✏️ Editar Turma' : '🏫 Nova Turma'}</h3>
            <div className="modal-field"><label className="modal-label">Nome da turma *</label><input className="modal-input" value={nomeTurma} onChange={e => setNomeTurma(e.target.value)} placeholder="Ex: Turma 3A" autoFocus /></div>
            <div className="modal-field"><label className="modal-label">Série / Período</label><input className="modal-input" value={serieTurma} onChange={e => setSerieTurma(e.target.value)} placeholder="Ex: 3º ano EF" /></div>
            <div className="modal-btns"><button className="btn-secondary" onClick={() => setModalTurma(false)}>Cancelar</button><button className="btn-primary" onClick={salvarTurma}>Salvar</button></div>
          </div>
        </div>
      )}

      {/* MODAL ALUNO */}
      {modalAluno && (
        <div className="overlay" onClick={() => setModalAluno(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editandoAluno ? '✏️ Editar Aluno' : '👦 Adicionar Aluno'}</h3>
            <div className="modal-field"><label className="modal-label">Nome completo *</label><input className="modal-input" value={nomeAluno} onChange={e => setNomeAluno(e.target.value)} placeholder="Ex: João da Silva" autoFocus /></div>
            <div className="modal-field"><label className="modal-label">Apelido (como aparece para o aluno)</label><input className="modal-input" value={apelidoAluno} onChange={e => setApelidoAluno(e.target.value)} placeholder="Ex: João" /></div>
            <div className="modal-field"><label className="modal-label">PIN de 4 dígitos {editandoAluno ? '(vazio = não alterar)' : '*'}</label><input className="modal-input" type="password" inputMode="numeric" maxLength={4} value={pinAluno} onChange={e => setPinAluno(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" /></div>
            <div className="modal-btns"><button className="btn-secondary" onClick={() => setModalAluno(false)}>Cancelar</button><button className="btn-primary" onClick={salvarAluno}>Salvar</button></div>
          </div>
        </div>
      )}

      {/* MODAL REDEFINIR PIN */}
      {modalPin && alunoPin && (
        <div className="overlay" onClick={() => setModalPin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🔑 Redefinir PIN</h3>
            <p className="modal-hint">Definindo novo PIN para <strong>{alunoPin.apelido || alunoPin.nome_completo}</strong>.<br />O aluno usará o novo PIN no próximo acesso.</p>
            <div className="modal-field"><label className="modal-label">Novo PIN (4 dígitos) *</label><input className="modal-input" type="password" inputMode="numeric" maxLength={4} value={novoPin} onChange={e => setNovoPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" autoFocus /></div>
            <div className="modal-btns"><button className="btn-secondary" onClick={() => setModalPin(false)}>Cancelar</button><button className="btn-primary" onClick={salvarNovoPin}>Redefinir PIN</button></div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardProfessor;