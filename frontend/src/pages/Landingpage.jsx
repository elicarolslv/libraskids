import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: '📹',
      title: 'Reconhecimento de Sinais por IA',
      desc: 'Pratique o alfabeto manual em tempo real pela webcam. Nossa IA com MediaPipe identifica letras estáticas e dinâmicas (como J, K e Z) com alta precisão.',
    },
    {
      icon: '🎮',
      title: 'Gamificação Completa',
      desc: 'Acumule pontos XP, conquiste emblemas e suba de nível conforme aprende. O aprendizado vira uma aventura que as crianças não querem parar.',
    },
    {
      icon: '👨‍🏫',
      title: 'Gestão de Turmas',
      desc: 'Professores criam turmas, geram códigos de acesso, cadastram alunos e acompanham relatórios de desempenho individuais e coletivos.',
    },
    {
      icon: '📚',
      title: 'Módulos por Tema',
      desc: 'Conteúdo organizado em categorias: alfabeto, saudações, emoções e muito mais do básico ao avançado.',
    },
    {
      icon: '🌍',
      title: 'Inclusão desde a Infância',
      desc: 'Crianças ouvintes aprendem Libras como segunda língua, tornando-se agentes de inclusão para colegas surdos no ambiente escolar.',
    },
    {
      icon: '🔒',
      title: 'Acesso Simples e Seguro',
      desc: 'Alunos entram com nome, PIN e código da turma sem e-mail ou senha complexa. Pensado para o público infantil.',
    },
  ];

  const steps = [
    {
      num: '1',
      title: 'Professor cria a conta',
      desc: 'Cadastro gratuito em menos de 1 minuto, com nome, e-mail e senha.',
    },
    {
      num: '2',
      title: 'Cria turmas e alunos',
      desc: 'Gera um código único por turma e cadastra os alunos com nome e PIN.',
    },
    {
      num: '3',
      title: 'Alunos acessam e aprendem',
      desc: 'Com o código da turma e PIN, os alunos entram e começam a praticar Libras com atividades interativas e reconhecimento via webcam.',
    },
  ];

  const signs = [
    ['👋', 'Olá'],
    ['❤️', 'Amor'],
    ['🤟', 'Libras'],
    ['🔤', 'Alfabeto'],
    ['⭐', 'Bom dia'],
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; }
        body { font-family: 'Nunito', 'Segoe UI', sans-serif; }

        .landing-page {
          width: 100vw;
          min-height: 100vh;
          background: linear-gradient(160deg, #FFFDE7 0%, #F0FAF4 50%, #FFF3E0 100%);
          overflow-x: hidden;
        }

        /* NAV */
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 48px;
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,253,231,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,167,108,0.15);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 26px; font-weight: 900; color: #FFA76C; letter-spacing: -0.5px;
        }
        .nav-btns { display: flex; gap: 12px; align-items: center; }
        .btn-outline {
          padding: 10px 22px; border-radius: 12px;
          border: 2px solid #FFA76C; color: #FFA76C;
          font-weight: 700; font-size: 15px; cursor: pointer;
          background: transparent; font-family: inherit;
          transition: all 0.2s;
        }
        .btn-outline:hover { background: #FFA76C; color: white; }
        .btn-solid {
          padding: 10px 22px; border-radius: 12px;
          border: none; background: #FFA76C; color: white;
          font-weight: 800; font-size: 15px; cursor: pointer;
          font-family: inherit; transition: all 0.2s;
        }
        .btn-solid:hover { background: #ff9248; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,167,108,0.4); }

        /* HERO */
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 80px 24px 60px;
          position: relative;
          min-height: calc(100vh - 73px);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,167,108,0.12); color: #E67E22;
          border: 1px solid rgba(255,167,108,0.3);
          border-radius: 100px; padding: 8px 20px;
          font-size: 14px; font-weight: 700; margin-bottom: 28px;
        }
        .hero h1 {
          font-size: clamp(40px, 7vw, 72px);
          font-weight: 900; color: #1a1a1a; line-height: 1.1;
          max-width: 820px; margin-bottom: 22px;
          letter-spacing: -1.5px;
        }
        .hero h1 span { color: #FFA76C; }
        .hero p {
          font-size: clamp(16px, 2.5vw, 20px);
          color: #666; max-width: 600px; line-height: 1.7;
          margin-bottom: 44px; font-weight: 500;
        }
        .hero-btns { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin-bottom: 64px; }
        .btn-hero-primary {
          padding: 18px 40px; border-radius: 16px;
          background: #FFA76C; color: white; border: none;
          font-size: 18px; font-weight: 800; cursor: pointer;
          font-family: inherit; transition: all 0.25s;
          box-shadow: 0 8px 30px rgba(255,167,108,0.4);
        }
        .btn-hero-primary:hover { background: #ff9248; transform: translateY(-3px); box-shadow: 0 14px 40px rgba(255,167,108,0.5); }
        .btn-hero-secondary {
          padding: 18px 40px; border-radius: 16px;
          background: white; color: #333; border: 2px solid #e0e0e0;
          font-size: 18px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: all 0.25s;
        }
        .btn-hero-secondary:hover { border-color: #FFA76C; color: #FFA76C; transform: translateY(-3px); }

        /* FLOATING SIGNS */
        .signs-row {
          display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;
          margin-bottom: 24px;
        }
        .sign-pill {
          background: white; border-radius: 100px;
          padding: 14px 26px; font-size: 18px; font-weight: 800;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          display: flex; align-items: center; gap: 10px;
          color: #333;
          animation: float 3s ease-in-out infinite;
        }
        .sign-pill:nth-child(2) { animation-delay: 0.5s; }
        .sign-pill:nth-child(3) { animation-delay: 1s; }
        .sign-pill:nth-child(4) { animation-delay: 1.5s; }
        .sign-pill:nth-child(5) { animation-delay: 2s; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        /* AI HIGHLIGHT BANNER */
        .ai-banner {
          background: white;
          border: 2px solid rgba(255,167,108,0.25);
          border-radius: 20px;
          padding: 20px 32px;
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 680px;
          margin: 0 auto 48px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          text-align: left;
        }
        .ai-banner-icon { font-size: 36px; flex-shrink: 0; }
        .ai-banner-text strong { display: block; font-size: 15px; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
        .ai-banner-text span { font-size: 14px; color: #888; font-weight: 500; line-height: 1.5; }

        /* FEATURES */
        .features {
          padding: 80px 48px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .section-label {
          text-align: center; font-size: 13px; font-weight: 800;
          color: #FFA76C; letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 14px;
        }
        .section-title {
          text-align: center; font-size: clamp(28px, 4vw, 42px);
          font-weight: 900; color: #1a1a1a; margin-bottom: 56px;
          letter-spacing: -0.5px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        .feature-card {
          background: white; border-radius: 24px;
          padding: 32px 28px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          transition: all 0.25s; border: 2px solid transparent;
        }
        .feature-card:hover { transform: translateY(-6px); border-color: #FFA76C; box-shadow: 0 16px 40px rgba(255,167,108,0.2); }
        .feature-icon { font-size: 40px; margin-bottom: 16px; }
        .feature-title { font-size: 18px; font-weight: 800; color: #1a1a1a; margin-bottom: 10px; }
        .feature-desc { font-size: 15px; color: #777; line-height: 1.65; font-weight: 500; }

        /* INCLUSION SECTION */
        .inclusion-section {
          padding: 0 48px 80px;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        .inclusion-card {
          background: linear-gradient(135deg, #FFF9F0 0%, #F0FAF4 100%);
          border-radius: 28px;
          padding: 48px 40px;
          border: 2px solid rgba(255,167,108,0.15);
        }
        .inclusion-card p {
          font-size: 18px; color: #555; line-height: 1.8;
          font-weight: 500; max-width: 680px; margin: 0 auto;
        }
        .inclusion-card p strong { color: #FFA76C; }
        .inclusion-quote {
          margin-top: 28px;
          font-size: 15px; color: #999; font-style: italic;
          font-weight: 600;
        }

        /* HOW IT WORKS */
        .path-section {
          padding: 0 48px 80px;
          max-width: 900px; margin: 0 auto;
          text-align: center;
        }
        .path-steps {
          display: flex;
          gap: 0; align-items: flex-start;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 48px;
        }
        .path-step {
          display: flex; flex-direction: column; align-items: center;
          gap: 14px; flex: 1; min-width: 160px; max-width: 220px; padding: 0 10px;
        }
        .step-num {
          width: 56px; height: 56px; border-radius: 50%;
          background: #FFA76C; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 900;
        }
        .step-title { font-size: 16px; font-weight: 800; color: #1a1a1a; }
        .step-desc { font-size: 14px; color: #888; line-height: 1.6; font-weight: 500; }
        .path-arrow { font-size: 24px; color: #ddd; align-self: center; padding: 0 4px; }

        /* GAMIFICATION SECTION */
        .gamification-section {
          padding: 0 48px 80px;
          max-width: 900px; margin: 0 auto;
        }
        .gami-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 48px;
        }
        .gami-card {
          background: white; border-radius: 20px;
          padding: 28px 24px; text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .gami-icon { font-size: 42px; margin-bottom: 12px; }
        .gami-title { font-size: 16px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px; }
        .gami-desc { font-size: 14px; color: #999; font-weight: 500; line-height: 1.5; }

        /* INSTRUCTORS SECTION */
        .instructors-section {
          padding: 0 48px 80px;
          max-width: 1100px; 
          margin: 0 auto;
        }
        .instructors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }
        .instructor-card {
          background: white; border-radius: 24px;
          padding: 36px 32px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          text-align: left;
          border: 2px solid transparent;
          transition: all 0.25s;
        }
        .instructor-card:hover {
          border-color: #FFA76C; box-shadow: 0 16px 40px rgba(255,167,108,0.2);
        }
        .instructor-name { 
          font-size: 22px; font-weight: 900; color: #1a1a1a; margin-bottom: 6px; 
        }
        .instructor-role { 
          font-size: 13px; font-weight: 800; color: #FFA76C; margin-bottom: 24px; 
          text-transform: uppercase; letter-spacing: 1px; 
        }
        .instructor-resume { 
          list-style: none; padding: 0; margin: 0; 
        }
        .instructor-resume li { 
          font-size: 14px; color: #666; margin-bottom: 18px; line-height: 1.6; font-weight: 500; 
        }
        .instructor-resume li:last-child { margin-bottom: 0; }
        .instructor-resume li strong { color: #333; font-weight: 800; }
        .instructor-resume li em { 
          font-size: 13px; color: #888; display: block; margin-top: 4px; font-style: normal;
        }

        /* CTA SECTION */
        .cta-section {
          background: #FFA76C;
          margin: 0 48px 80px;
          border-radius: 32px;
          padding: 60px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-section::before {
          content: '👏';
          position: absolute;
          font-size: 200px;
          opacity: 0.08;
          right: -30px; top: -40px;
        }
        .cta-section h2 { font-size: clamp(26px, 4vw, 38px); font-weight: 900; color: white; margin-bottom: 14px; }
        .cta-section p { font-size: 17px; color: rgba(255,255,255,0.85); margin-bottom: 36px; font-weight: 500; max-width: 500px; margin-left: auto; margin-right: auto; }
        .btn-cta {
          padding: 18px 44px; border-radius: 16px;
          background: white; color: #FFA76C; border: none;
          font-size: 18px; font-weight: 800; cursor: pointer;
          font-family: inherit; transition: all 0.2s;
        }
        .btn-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }

        /* FOOTER */
        .footer {
          text-align: center; padding: 28px;
          font-size: 13px; color: #bbb; font-weight: 600;
          border-top: 1px solid rgba(0,0,0,0.05);
        }

        /* DECORATIVE BLOBS */
        .blob {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }

        @media (max-width: 600px) {
          .nav { padding: 16px 20px; }
          .features { padding: 60px 20px; }
          .cta-section { margin: 0 20px 60px; }
          .path-section { padding: 0 20px 60px; }
          .path-arrow { display: none; }
          .inclusion-section { padding: 0 20px 60px; }
          .gamification-section { padding: 0 20px 60px; }
          .instructors-section { padding: 0 20px 60px; }
          .ai-banner { flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className="landing-page">
        {/* Blobs decorativos */}
        <div className="blob" style={{ width: 400, height: 400, top: -150, left: -150, background: 'rgba(255,167,108,0.08)' }} />
        <div className="blob" style={{ width: 300, height: 300, bottom: 100, right: -100, background: 'rgba(135,206,235,0.1)' }} />

        {/* NAV */}
        <nav className="nav">
          <div className="nav-logo">
            <span>👏</span>
            LibrasKids
          </div>
          <div className="nav-btns">
            <button className="btn-outline" onClick={() => navigate('/professor/login')}>
              Entrar
            </button>
            <button className="btn-solid" onClick={() => navigate('/professor/register')}>
              Cadastrar-se
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">
            <span>🎓</span>
            Plataforma educacional gratuita para o ensino de Libras
          </div>
          <h1>
            Aprenda <span>Libras</span><br />com IA e diversão!
          </h1>
          <p>
           Uma plataforma de apoio pedagógico para auxiliar professores no ensino de Libras para crianças ouvintes, oferecendo reconhecimento de sinais em tempo real, gamificação e acompanhamento de progresso.
          </p>

          {/* Sinais flutuando */}
          <div className="signs-row">
            {signs.map(([emoji, word]) => (
              <div key={word} className="sign-pill">
                <span>{emoji}</span>
                <span>{word}</span>
              </div>
            ))}
          </div>

          {/* Destaque da IA */}
          <div className="ai-banner">
            <div className="ai-banner-icon">📷</div>
            <div className="ai-banner-text">
              <strong>Reconhecimento de sinais pela webcam</strong>
              <span>A câmera captura os movimentos das mãos em tempo real usando MediaPipe e IA. O aluno faz o sinal e recebe feedback imediato se está certo ou errado.</span>
            </div>
          </div>

          <div className="hero-btns">
            <button className="btn-hero-primary" onClick={() => navigate('/professor/register')}>
              Começar gratuitamente →
            </button>
            <button className="btn-hero-secondary" onClick={() => navigate('/entrar')}>
              Sou aluno 👦
            </button>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features">
          <p className="section-label">Por que LibrasKids?</p>
          <h2 className="section-title">Tudo que você precisa para ensinar Libras</h2>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* GAMIFICAÇÃO */}
        <section className="gamification-section">
          <p className="section-label">Sistema de recompensas</p>
          <h2 className="section-title">Aprender vira uma conquista</h2>
          <div className="gami-grid">
            <div className="gami-card">
              <div className="gami-icon">⚡</div>
              <div className="gami-title">Pontos XP</div>
              <div className="gami-desc">Cada sinal correto gera experiência. O progresso é visível e motivador.</div>
            </div>
            <div className="gami-card">
              <div className="gami-icon">🏅</div>
              <div className="gami-title">Emblemas</div>
              <div className="gami-desc">Conquistas desbloqueadas por marcos: primeiro sinal, 100% de acertos e mais.</div>
            </div>
            <div className="gami-card">
              <div className="gami-icon">📈</div>
              <div className="gami-title">Níveis</div>
              <div className="gami-desc">O aluno evolui de nível conforme acumula XP, mantendo o engajamento.</div>
            </div>
            <div className="gami-card">
              <div className="gami-icon">📊</div>
              <div className="gami-title">Relatórios</div>
              <div className="gami-desc">O professor vê o desempenho de cada aluno e da turma completa.</div>
            </div>
          </div>
        </section>

        {/* INCLUSÃO */}
        <section className="inclusion-section">
          <p className="section-label">Nossa missão</p>
          <h2 className="section-title">Inclusão que começa na infância</h2>
          <div className="inclusion-card">
            <p>
              Ao aprender Libras como <strong>segunda língua</strong>, crianças ouvintes se tornam <strong>agentes de inclusão</strong> no ambiente escolar criando pontes de comunicação com colegas surdos e construindo uma sociedade mais empática desde os primeiros anos de vida.
            </p>
            <div className="inclusion-quote">
              "A escola torna-se um espaço de transformação social, onde as diferenças deixam de ser barreiras e passam a ser elementos enriquecedores." — TG LibrasKids, 2026
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="path-section">
          <p className="section-label">Como funciona</p>
          <h2 className="section-title">Em 3 passos simples</h2>
          <div className="path-steps">
            {steps.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="path-step">
                  <div className="step-num">{step.num}</div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.desc}</div>
                </div>
                {i < steps.length - 1 && <div className="path-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* INSTRUCTORS SECTION */}
        <section className="instructors-section">
          <p className="section-label">Quem ensina</p>
          <h2 className="section-title">Nossos Modelos e Instrutores</h2>
          <div className="instructors-grid">
            
            {/* Card do Éverton */}
            <div className="instructor-card">
              <div className="instructor-name">Dr. Éverton Bernardes Wenceslau</div>
              <div className="instructor-role">Pesquisador e Especialista</div>
              <ul className="instructor-resume">
               
              </ul>
            </div>

            {/* Card do Renato */}
            <div className="instructor-card">
              <div className="instructor-name">Renato Coelho da Silva</div>
              <div className="instructor-role">Intérprete de Libras</div>
              <ul className="instructor-resume">
              
              </ul>
            </div>

          </div>
        </section>

        {/* CTA */}
        <div className="cta-section">
          <h2>Pronto para incluir?</h2>
          <p>Junte-se a professores que já estão ensinando Libras de forma lúdica, acessível e com tecnologia de ponta.</p>
          <button className="btn-cta" onClick={() => navigate('/professor/register')}>
            Criar conta grátis →
          </button>
        </div>

        {/* FOOTER */}
        <footer className="footer">
          LibrasKids © 2026 — Inclusão infantil através da tecnologia 👏
        </footer>
      </div>
    </>
  );
};

export default LandingPage;