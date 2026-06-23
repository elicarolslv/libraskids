# 🤟 LibrasKids

<p align="center">
  <strong>Software educacional com IA para ensino de Libras para crianças</strong><br>
  <em>AI-powered educational software for teaching Brazilian Sign Language to children</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/MediaPipe-0097A7?style=for-the-badge&logo=google&logoColor=white" />
</p>

<p align="center">
  <a href="https://www.linkedin.com/posts/elisandra-carol-da-silva-02424922b_libraskids-inteligenciaartificial-machinelearning-ugcPost-7473782059153670144-f8TH/">
    <img src="https://img.shields.io/badge/LinkedIn-Vídeo_de_Demonstração-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
</p>

---

## 🇧🇷 Português

### 📌 Sobre o Projeto

O **LibrasKids** é um software educacional interativo que apoia o ensino da **Língua Brasileira de Sinais (Libras)** a crianças ouvintes por meio de uma abordagem lúdica e gamificada. O sistema integra uma interface web em **React** com um ecossistema de **Inteligência Artificial** no back-end responsável pelo reconhecimento de sinais em tempo real.

Como diferencial, o projeto reconhece **tanto sinais estáticos quanto sinais dinâmicos**, abrangendo letras do alfabeto manual, letras com movimento e palavras completas em Libras.

### 👥 Equipe

| Nome | Papel |
|---|---|
| **Elisandra Carol da Silva** | Desenvolvedora Full-Stack |
| **Maria Clara Soares Bertolo** | Desenvolvedora Full-Stack |

### 🖼️ Interface

#### Fluxo de Autenticação do Aluno
Login em etapas simplificadas para crianças pequenas — sem necessidade de digitar e-mail.

<table>
  <tr>
    <td align="center"><strong>Passo 1: Turma</strong></td>
    <td align="center"><strong>Passo 2: Nome</strong></td>
    <td align="center"><strong>Passo 3: PIN</strong></td>
  </tr>
  <tr>
    <td><img src="./docs/login-step-turma.png" width="260px" /></td>
    <td><img src="./docs/login-step-nome.png" width="340px" /></td>
    <td><img src="./docs/login-step-pin.png" width="260px" /></td>
  </tr>
</table>

#### Módulos e Reconhecimento em Tempo Real

<table>
  <tr>
    <td align="center"><strong>Painel de Trilhas</strong></td>
    <td align="center"><strong>Câmera + IA</strong></td>
  </tr>
  <tr>
    <td><img src="./docs/dashboard-aluno.png" width="380px" /></td>
    <td><img src="./docs/camera-recognition.png" width="380px" /></td>
  </tr>
</table>

### 💡 Arquitetura de IA

A IA foi estruturada em duas frentes:

**Sinais estáticos** — KNN.

**Sinais dinâmicos** — LSTM.

Os modelos treinados estão disponíveis em `backend/models/` e a versão exportada para o navegador está em `frontend/public/tfjs_model/`.

### 🛠️ Tecnologias

| Camada | Tecnologias |
|---|---|
| **Front-End** | React.js, Vite, TensorFlow.js, Context API, HTML5, CSS3 |
| **Back-End** | Python, Flask, SQLite, SQLAlchemy |
| **IA / Visão Computacional** | MediaPipe, OpenCV, TensorFlow/Keras, KNN |
| **Formatos de Modelo** | `.h5`, `.keras`, `.joblib`, `.npy`, TensorFlow.js |
| **Prototipação** | Figma, Git, GitHub |

### 🚀 Como Rodar Localmente

#### Pré-requisitos
- Python 3.9+
- Node.js 18+
- Git

#### Back-End

```bash
# Clone o repositório
git clone https://github.com/elicarolslv/libraskids.git
cd libraskids

# Crie e ative o ambiente virtual
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
python app.py
```

#### Front-End

```bash
# Em outro terminal, na raiz do projeto
cd frontend
npm install
npm run dev
```

Acesse em: `http://localhost:5173`

### 📁 Estrutura de Pastas

```
libraskids/
├── backend/
│   ├── models/                 # Modelos treinados (.h5, .keras, .joblib, .npy)
│   ├── scripts/                # Scripts de coleta, tratamento e treinamento
│   ├── instance/               # Banco de dados local (não versionado)
│   ├── app.py                  # Inicialização Flask
│   ├── config.py
│   └── models.py
│
├── frontend/
│   ├── public/tfjs_model/      # Modelo exportado para TensorFlow.js
│   └── src/
│       ├── assets/alfabeto/    # Imagens do alfabeto manual
│       ├── context/            # AuthContext
│       ├── pages/              # Telas do sistema
│       └── components/
│
├── docs/                       # Capturas de tela da interface
└── README.md
```

### 🔒 Privacidade e Segurança

Por questões de segurança, LGPD e prevenção a plágio, os seguintes arquivos foram omitidos do repositório público:

- `backend/instance/professores.db` — banco de dados com cadastros
- `dataset/` e `Dados_Libras/` — bases brutas de treinamento
- Pastas de vídeos e arquivos `.zip` — assets de mídia pesados

### 🎓 Contexto Acadêmico

- **Instituição:** FATEC Ourinhos
- **Curso:** Análise e Desenvolvimento de Sistemas (ADS)
- **Natureza:** Trabalho de Conclusão de Curso

---

## 🇺🇸 English

### 📌 About

**LibrasKids** is an interactive educational software designed to teach **Brazilian Sign Language (Libras)** to hearing children through a gamified, camera-based experience. It combines a **React** front-end with an **AI back-end** that performs real-time sign recognition.

A key differentiator: the system recognizes **both static and dynamic signs** — covering fixed handshapes, letters with movement, and full Libras words.

### 👥 Team

| Name | Role |
|---|---|
| **Elisandra Carol da Silva** | Full-Stack Developer |
| **Maria Clara Soares Bertolo** | Full-Stack Developer |

### 💡 AI Architecture

**Static signs** — spatial analysis of hand landmarks captured by MediaPipe at a single moment in time.

**Dynamic signs** — temporal sequence classification using **KNN (K-Nearest Neighbors)** across multiple frames, handling moving letters and full sign language words.

Trained models are available in `backend/models/`. The browser-ready export lives in `frontend/public/tfjs_model/`.

### 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Front-End** | React.js, Vite, TensorFlow.js, Context API |
| **Back-End** | Python, Flask, SQLite, SQLAlchemy |
| **AI / Computer Vision** | MediaPipe, OpenCV, TensorFlow/Keras, KNN |
| **Model Formats** | `.h5`, `.keras`, `.joblib`, `.npy`, TensorFlow.js |

### 🚀 Running Locally

#### Prerequisites
- Python 3.9+
- Node.js 18+

#### Back-End

```bash
git clone https://github.com/elicarolslv/libraskids.git
cd libraskids/backend

python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
python app.py
```

#### Front-End

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

### 🔒 Data & Privacy

Certain files were intentionally excluded from this public repository for security, LGPD compliance, and academic integrity:

- `backend/instance/professores.db` — teacher registration database
- `dataset/` and `Dados_Libras/` — raw training data
- Video folders and `.zip` files — heavy media assets

### 🎓 Academic Context

- **Institution:** FATEC Ourinhos
- **Program:** Systems Analysis and Development
- **Type:** Final Course Project (TCC)
