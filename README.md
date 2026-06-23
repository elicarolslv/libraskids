# LibrasKids - Software Educacional com Inteligência Artificial para Ensino de Libras

<p align="center">
  </p>

## 📌 Sobre o Projeto
O **LibrasKids** é um software educacional interativo projetado para ensinar a Língua Brasileira de Sinais (Libras) para crianças ouvintes. O sistema combina uma interface web lúdica desenvolvida em React com um ecossistema de Inteligência Artificial no Back-End (Python/Flask) capaz de processar, treinar e unificar modelos de reconhecimento de gestos (estáticos e dinâmicos), utilizando algoritmos baseados em redes neurais (LSTM).

O projeto cobre todo o ciclo de engenharia de software: desde a concepção do design de interface no Figma, passando pela coleta de dados estruturados com MediaPipe/OpenCV, até a exportação do modelo treinado para execução em tempo real na Web via TensorFlow.js.

---

## 👥 Equipe Desenvolvedora
Este projeto foi desenvolvido em colaboração por:
* **Elisandra Carol da Silva** — Desenvolvedora Full-Stack
* **Maria Clara Soares Bertolo** — Desenvolvedora Full-Stack

---

## ⏱️ Contexto Acadêmico
* **Instituição:** FATEC Ourinhos  
* **Curso:** Análise e Desenvolvimento de Sistemas (ADS)  
* **Natureza:** Trabalho de Conclusão de Curso / Projeto Acadêmico  

---

## 🔒 Proteção de Dados e Propriedade Intelectual

Por questões de **segurança, direitos autorais, conformidade com a LGPD (Lei Geral de Proteção de Dados) e prevenção a plágio**, determinados arquivos do ecossistema original foram intencionalmente omitidos deste repositório público através do arquivo `.gitignore`. 

Os componentes isolados incluem:
1. **Banco de Dados Local (`backend/instance/professores.db`):** Ocultado para proteger informações confidenciais de cadastro.
2. **Datasets de Imagens e Amostras (`dataset/` e `Dados_Libras/`):** Bases brutas de mapeamento de sinais estáticos e dinâmicos (letras, saudações e emoções). A omissão impede a cópia indevida da base de dados proprietária desenvolvida pelo grupo.
3. **Assets Originais de Vídeo e Mídias (`.zip` e pastas de vídeos em `frontend/src/assets/`):** Arquivos gravados para treinamento e validação. Foram isolados para proteger os direitos de imagem e voz dos participantes envolvidos nas filmagens acadêmicas, além de evitar o armazenamento de arquivos binários pesados no histórico do Git.

> 💡 **Nota de Engenharia:** Embora os dados brutos de treino estejam protegidos localmente, os arquivos de inferência e os pesos otimizados para a Web estão totalmente disponíveis em `frontend/public/tfjs_model/`, permitindo a auditoria e o funcionamento da lógica de IA diretamente no Front-End.

---

## 🛠️ Tecnologias e Arquitetura

### Front-End (Web Dinâmica)
* **React.js & Vite:** Estrutura SPA ágil com gerenciamento de estados.
* **Context API:** Controle global de fluxos e sessões (Ex: `AuthContext.jsx`).
* **TensorFlow.js:** Execução local do modelo de visão computacional em formato JSON (`model.json`).

### Back-End (Engenharia de IA e Scripts)
* **Python & Flask:** API REST responsável por integrar os serviços corporativos e gerenciar dados.
* **Scripts de Machine Learning:** Rotinas customizadas para:
  * Coleta e unificação de matrizes de dados (`coletar.py`, `unificar.py`).
  * Treinamento especializado de redes neurais (`treinar_lstm.py`, `treinar_dinamico.py`).
  * Validação com modelos em formatos `.h5`, `.keras` e `.joblib`.

---

## 📁 Estrutura de Pastas Principais

```text
meu-projeto-libras/
├── backend/
│   ├── scripts/          # Lógica de engenharia, coleta e treino dos modelos de IA
│   ├── app.py            # Inicializador da API Flask
│   └── models.py         # Mapeamento e estruturas do banco de dados
├── frontend/
│   ├── public/tfjs_model/# Modelos e pesos convertidos para o navegador (TensorFlow.js)
│   └── src/
│       ├── context/      # Contextos e regras globais de autenticação
│       ├── pages/        # Telas do sistema (Dashboard Aluno, Professor, Login, etc.)
│       └── assets/       # Componentes estáticos de UI (Imagens das letras do alfabeto)
└── .gitignore            # Filtros de segurança e isolamento de dados pesados
