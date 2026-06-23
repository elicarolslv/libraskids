import os
import joblib
import numpy as np
import secrets
import csv
import io
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from config import Config
from models import (
    db, bcrypt, Professor, Turma, Aluno,
    AlunoXP, ProgressoModulo, Conquista, AlunoConquista,
    MODULOS_CONFIG
)

app = Flask(__name__)
app.config.from_object(Config)

# Inicializa extensões
db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)

CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers="*", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])

# ─── Cria as tabelas e seed de conquistas ─────────────────────────────────────
with app.app_context():
    db.create_all()
    
    conquistas_seed = [
        ('primeiro_sinal', 'Primeiro Sinal', '🤟'),
        ('primeira_licao', 'Primeira Lição', '🏆'),
        ('cem_porcento', '100% Sem Pular', '💯'),
        ('alfabeto_completo', 'Alfabeto 100%', '🔤'),
        ('saudacoes_completo', 'Saudações 100%', '👋'),
        ('emocoes_completo', 'Emoções 100%', '😊'),
        ('xp_100', '100 XP', '🥉'),
        ('xp_250', '250 XP', '🥈'),
        ('xp_500', '500 XP', '🥇'),
        ('xp_1000', '1000 XP', '💎'),
    ]

    for chave, titulo, emoji in conquistas_seed:
        if not Conquista.query.filter_by(chave=chave).first():
            db.session.add(Conquista(chave=chave, titulo=titulo, emoji=emoji))
            
    db.session.commit()
    print("✅ Banco de dados e conquistas inicializados")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── KNN — letras estáticas ───────────────────────────────────────────────────
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'knn_model.joblib')
if os.path.exists(MODEL_PATH):
    knn_model = joblib.load(MODEL_PATH)
    print("✅ Modelo KNN carregado")
else:
    knn_model = None
    print("❌ knn_model.joblib não encontrado!")

# ─── CARREGAMENTO DE MÚLTIPLOS MODELOS LSTM ───────────────────────────────────
MODELOS_LSTM = {}

def carregar_modelo_lstm(modulo_nome):
    modelo_path = os.path.join(BASE_DIR, 'models', f'lstm_{modulo_nome}.h5')
    labels_path = os.path.join(BASE_DIR, 'models', f'lstm_{modulo_nome}_labels.npy')
    
    if not os.path.exists(modelo_path) or not os.path.exists(labels_path):
        print(f"⚠️  Modelo LSTM para '{modulo_nome}' não encontrado.")
        return False
    
    try:
        import tensorflow as tf
        from tensorflow.keras.layers import LSTM as KerasLSTM

        class LSTMCompat(KerasLSTM):
            def __init__(self, *args, **kwargs):
                kwargs.pop('time_major', None)
                super().__init__(*args, **kwargs)

        modelo = tf.keras.models.load_model(
            modelo_path, custom_objects={'LSTM': LSTMCompat}, compile=False
        )
        labels = np.load(labels_path, allow_pickle=True).tolist()
        
        MODELOS_LSTM[modulo_nome] = {
            'model': modelo,
            'labels': labels
        }
        print(f"✅ Modelo LSTM '{modulo_nome}' carregado: {len(labels)} sinais")
        return True
    except Exception as e:
        print(f"⚠️  Erro ao carregar LSTM '{modulo_nome}': {e}")
        return False

for modulo in ['saudacoes', 'emocoes']:
    carregar_modelo_lstm(modulo)

# Compatibilidade com modelo antigo
LSTM_PATH   = os.path.join(BASE_DIR, 'models', 'lstm_model.h5')
LABELS_PATH = os.path.join(BASE_DIR, 'models', 'lstm_labels.npy')
USE_LSTM_ALFABETO = False
lstm_labels_alfabeto = []

if os.path.exists(LSTM_PATH) and os.path.exists(LABELS_PATH):
    try:
        import tensorflow as tf
        from tensorflow.keras.layers import LSTM as KerasLSTM

        class LSTMCompat(KerasLSTM):
            def __init__(self, *args, **kwargs):
                kwargs.pop('time_major', None)
                super().__init__(*args, **kwargs)

        lstm_model_alfabeto = tf.keras.models.load_model(
            LSTM_PATH, custom_objects={'LSTM': LSTMCompat}, compile=False
        )
        lstm_labels_alfabeto = np.load(LABELS_PATH, allow_pickle=True).tolist()
        USE_LSTM_ALFABETO = True
        
        MODELOS_LSTM['alfabeto'] = {
            'model': lstm_model_alfabeto,
            'labels': lstm_labels_alfabeto
        }
        print(f"✅ Modelo LSTM 'alfabeto' carregado")
    except Exception as e:
        print(f"⚠️  LSTM alfabeto não carregado ({e})")

# ─── DTW — fallback ───────────────────────────────────────────────────────────
dynamic_templates = {}
if not MODELOS_LSTM.get('alfabeto'):
    TEMPLATES_PATH = os.path.join(BASE_DIR, 'models', 'dynamic_templates.joblib')
    if os.path.exists(TEMPLATES_PATH):
        from dtaidistance import dtw_ndim
        dynamic_templates = joblib.load(TEMPLATES_PATH)
        print(f"✅ Templates DTW carregados: {list(dynamic_templates.keys())}")
    else:
        print("⚠️  Nenhum modelo dinâmico disponível para alfabeto")


# ─── FUNÇÕES UTILITÁRIAS DE IA ────────────────────────────────────────────────
def normalize_single_frame(lmList, bbox):
    x, y, w, h = bbox
    z_coords = [m[2] for m in lmList]
    min_z    = min(z_coords)
    z_range  = (max(z_coords) - min_z) if (max(z_coords) - min_z) != 0 else 1
    points   = []
    for lx, ly, lz in lmList:
        points.append((lx - x) / w)
        points.append((ly - y) / h)
        points.append((lz - min_z) / z_range)
    return points

def normalize_sequence(frames):
    normalized = []
    for frame in frames:
        normalized.append(normalize_single_frame(frame['lmList'], frame['bbox']))
    return np.array(normalized, dtype=np.float32)

def predict_lstm_modulo(sequence, modulo_nome):
    modelo_info = MODELOS_LSTM.get(modulo_nome)
    if not modelo_info:
        return None, 0.0
    
    modelo = modelo_info['model']
    labels = modelo_info['labels']
    
    n_frames = modelo.input_shape[1]
    if sequence.shape[0] < n_frames:
        pad      = np.zeros((n_frames - sequence.shape[0], sequence.shape[1]), dtype=np.float32)
        sequence = np.vstack([sequence, pad])
    elif sequence.shape[0] > n_frames:
        sequence = sequence[:n_frames]
    
    inp   = sequence.reshape(1, n_frames, -1)
    probs = modelo.predict(inp, verbose=0)[0]
    idx   = int(np.argmax(probs))
    
    return labels[idx], float(probs[idx])

def predict_dtw(sequence):
    from dtaidistance import dtw_ndim
    best_letter   = None
    best_distance = float('inf')
    all_distances = {}
    seq = sequence.astype(np.float64)
    for letra, templates in dynamic_templates.items():
        dists = []
        for template in templates:
            try:
                d = dtw_ndim.distance(seq, template)
                dists.append(d)
            except Exception:
                continue
        if not dists: continue
        dists.sort()
        mean_dist = float(np.mean(dists[:5]))
        all_distances[letra] = mean_dist
        if mean_dist < best_distance:
            best_distance = mean_dist
            best_letter   = letra
    if best_letter and len(all_distances) > 1:
        inv   = {l: 1.0 / (d + 1e-9) for l, d in all_distances.items()}
        total = sum(inv.values())
        conf  = inv[best_letter] / total
    else:
        conf = 1.0 / (1.0 + best_distance)
    return best_letter, float(conf)


# ─── FUNÇÕES UTILITÁRIAS DE PROGRESSO E DB ────────────────────────────────────
def _garantir_xp(aluno_id):
    xp = AlunoXP.query.filter_by(aluno_id=aluno_id).first()
    if not xp:
        xp = AlunoXP(aluno_id=aluno_id)
        db.session.add(xp)
        db.session.flush()
    return xp

def _garantir_progresso(aluno_id, modulo):
    prog = ProgressoModulo.query.filter_by(aluno_id=aluno_id, modulo=modulo).first()
    if not prog:
        config = MODULOS_CONFIG.get(modulo, {})
        prog = ProgressoModulo(
            aluno_id=aluno_id,
            modulo=modulo,
            sinais_feitos=0,
            total_sinais=config.get('total', 26),
        )
        db.session.add(prog)
        db.session.flush()
    return prog


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO DE E-MAIL E ROTA DE RECUPERAÇÃO DE SENHA
# ═══════════════════════════════════════════════════════════════════════════════
EMAIL_REMETENTE = 'projetotglibras@gmail.com'
SENHA_REMETENTE = 'ufqecinynsirzkkc'

def enviar_email_recuperacao(destinatario, nova_senha):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_REMETENTE
        msg['To'] = destinatario
        msg['Subject'] = 'Recuperação de Senha - LibrasKids 👏'

        corpo = f"""Olá,

Você solicitou a recuperação de senha no sistema LibrasKids.

Sua nova senha temporária é: {nova_senha}

Por favor, faça o login utilizando esta senha temporária e, em seguida, acesse a aba "Meu Perfil" para criar uma nova senha definitiva de sua escolha.

Abraços,
Equipe LibrasKids"""
        
        msg.attach(MIMEText(corpo, 'plain', 'utf-8'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_REMETENTE, SENHA_REMETENTE)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False

@app.route('/auth/recuperar-senha', methods=['POST'])
def recuperar_senha():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'error': 'E-mail é obrigatório'}), 400

    professor = Professor.query.filter_by(email=email).first()
    
    if not professor:
        return jsonify({'message': 'Se o e-mail estiver cadastrado, as instruções foram enviadas!'}), 200

    nova_senha_temporaria = secrets.token_hex(3)
    professor.set_senha(nova_senha_temporaria)
    db.session.commit()

    sucesso_email = enviar_email_recuperacao(professor.email, nova_senha_temporaria)
    
    if sucesso_email:
        return jsonify({'message': 'Uma nova senha temporária foi enviada para o seu e-mail!'}), 200
    else:
        db.session.rollback()
        return jsonify({'error': 'Erro ao tentar enviar o e-mail. Verifique o servidor.'}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS — AUTENTICAÇÃO DO PROFESSOR E TURMAS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data   = request.json or {}
        nome   = data.get('nome', '').strip()
        email  = data.get('email', '').strip().lower()
        senha  = data.get('senha', '')
        escola = data.get('escola', '').strip()

        if not nome or not email or not senha:
            return jsonify({'error': 'Campos obrigatórios: nome, email, senha'}), 400
        if len(senha) < 6:
            return jsonify({'error': 'A senha deve ter pelo menos 6 caracteres'}), 400
        if Professor.query.filter_by(email=email).first():
            return jsonify({'error': 'E-mail já cadastrado'}), 409

        professor = Professor(nome=nome, email=email, escola=escola)
        professor.set_senha(senha)
        
        db.session.add(professor)
        db.session.commit()

        return jsonify({'message': 'Professor cadastrado com sucesso'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno no servidor: {str(e)}'}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    data  = request.json or {}
    email = data.get('email', '').strip().lower()
    senha = data.get('senha', '')

    professor = Professor.query.filter_by(email=email).first()
    if not professor or not professor.check_senha(senha):
        return jsonify({'error': 'Credenciais inválidas'}), 401

    token = create_access_token(identity=str(professor.id))
    return jsonify({'token': token, 'nome': professor.nome}), 200

@app.route('/professor/me', methods=['GET'])
@jwt_required()
def professor_me():
    current_id = int(get_jwt_identity())
    professor  = Professor.query.get(current_id)
    if not professor:
        return jsonify({'error': 'Professor não encontrado'}), 404
    return jsonify(professor.to_dict()), 200

@app.route('/professor/me', methods=['PUT'])
@jwt_required()
def update_professor_me():
    current_id = int(get_jwt_identity())
    professor = Professor.query.get(current_id)
    if not professor:
        return jsonify({'error': 'Professor não encontrado'}), 404

    data = request.json or {}
    
    if 'nome' in data and data['nome'].strip():
        professor.nome = data['nome'].strip()
        
    if 'escola' in data:
        professor.escola = data['escola'].strip()
        
    if 'email' in data and data['email'].strip():
        novo_email = data['email'].strip().lower()
        if novo_email != professor.email and Professor.query.filter_by(email=novo_email).first():
            return jsonify({'error': 'Este e-mail já está em uso por outra conta.'}), 409
        professor.email = novo_email
        
    nova_senha = data.get('nova_senha', '')
    if nova_senha:
        senha_atual = data.get('senha_atual', '')
        if not professor.check_senha(senha_atual):
            return jsonify({'error': 'Senha atual incorreta. A alteração foi negada.'}), 401
        if len(nova_senha) < 6:
            return jsonify({'error': 'A nova senha deve ter pelo menos 6 caracteres.'}), 400
        professor.set_senha(nova_senha)

    db.session.commit()
    return jsonify({'message': 'Perfil atualizado com sucesso!', 'professor': professor.to_dict()}), 200

@app.route('/turmas', methods=['GET'])
@jwt_required()
def listar_turmas():
    professor_id = int(get_jwt_identity())
    turmas = Turma.query.filter_by(professor_id=professor_id).all()
    return jsonify([t.to_dict() for t in turmas]), 200

@app.route('/turmas', methods=['POST'])
@jwt_required()
def criar_turma():
    professor_id = int(get_jwt_identity())
    data = request.json or {}
    nome  = data.get('nome', '').strip()
    serie = data.get('serie', '').strip()

    if not nome: return jsonify({'error': 'Nome da turma é obrigatório'}), 400

    turma = Turma(nome=nome, serie=serie, professor_id=professor_id)
    db.session.add(turma)
    db.session.commit()
    return jsonify(turma.to_dict()), 201

@app.route('/turmas/<int:turma_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def gerenciar_turma(turma_id):
    professor_id = int(get_jwt_identity())
    turma = Turma.query.filter_by(id=turma_id, professor_id=professor_id).first()
    if not turma: return jsonify({'error': 'Turma não encontrada'}), 404

    if request.method == 'DELETE':
        db.session.delete(turma)
        db.session.commit()
        return jsonify({'message': 'Turma excluída'}), 200

    data = request.json or {}
    if 'nome' in data: turma.nome = data['nome'].strip()
    if 'serie' in data: turma.serie = data['serie'].strip()
    db.session.commit()
    return jsonify(turma.to_dict()), 200

@app.route('/turmas/<int:turma_id>/alunos', methods=['GET'])
@jwt_required()
def listar_alunos(turma_id):
    professor_id = int(get_jwt_identity())
    turma = Turma.query.filter_by(id=turma_id, professor_id=professor_id).first()
    if not turma: return jsonify({'error': 'Turma não encontrada'}), 404
    return jsonify([a.to_dict() for a in turma.alunos]), 200

@app.route('/turmas/<int:turma_id>/alunos', methods=['POST'])
@jwt_required()
def adicionar_aluno(turma_id):
    professor_id = int(get_jwt_identity())
    turma = Turma.query.filter_by(id=turma_id, professor_id=professor_id).first()
    if not turma: return jsonify({'error': 'Turma não encontrada'}), 404

    data = request.json or {}
    nome_completo = data.get('nome_completo', '').strip()
    apelido       = data.get('apelido', '').strip()
    pin           = str(data.get('pin', ''))

    if not nome_completo: return jsonify({'error': 'Nome completo é obrigatório'}), 400
    if not pin.isdigit() or len(pin) != 4: return jsonify({'error': 'PIN deve ter exatamente 4 dígitos'}), 400

    aluno = Aluno(nome_completo=nome_completo, apelido=apelido or None, turma_id=turma_id)
    aluno.set_pin(pin)
    db.session.add(aluno)
    db.session.flush()
    
    db.session.add(AlunoXP(aluno_id=aluno.id))
    db.session.commit()
    
    return jsonify(aluno.to_dict()), 201

@app.route('/alunos/<int:aluno_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def gerenciar_aluno(aluno_id):
    professor_id = int(get_jwt_identity())
    aluno = Aluno.query.get(aluno_id)
    if not aluno or aluno.turma.professor_id != professor_id: 
        return jsonify({'error': 'Aluno não encontrado'}), 404

    if request.method == 'DELETE':
        db.session.delete(aluno)
        db.session.commit()
        return jsonify({'message': 'Aluno removido'}), 200

    data = request.json or {}
    if 'nome_completo' in data: aluno.nome_completo = data['nome_completo'].strip()
    if 'apelido' in data: aluno.apelido = data['apelido'].strip() or None
    if 'pin' in data:
        pin = str(data['pin'])
        if not pin.isdigit() or len(pin) != 4: 
            return jsonify({'error': 'PIN deve ter 4 dígitos'}), 400
        aluno.set_pin(pin)
        aluno.bloqueado = False
        aluno.tentativas_pin = 0
    db.session.commit()
    return jsonify(aluno.to_dict()), 200

# 🆕 ROTA PARA DESBLOQUEAR ALUNO
@app.route('/alunos/<int:aluno_id>/desbloquear', methods=['PATCH', 'POST', 'PUT'])
@jwt_required()
def desbloquear_aluno(aluno_id):
    """Desbloqueia um aluno bloqueado por excesso de tentativas de PIN."""
    professor_id = int(get_jwt_identity())
    aluno = Aluno.query.get(aluno_id)
    
    if not aluno or aluno.turma.professor_id != professor_id: 
        return jsonify({'error': 'Aluno não encontrado ou não pertence a você'}), 404

    aluno.bloqueado = False
    aluno.tentativas_pin = 0
    db.session.commit()
    
    return jsonify({
        'message': 'Aluno desbloqueado com sucesso!',
        'aluno_id': aluno.id,
        'bloqueado': aluno.bloqueado
    }), 200

@app.route('/turmas/<int:turma_id>/relatorio', methods=['GET'])
@jwt_required()
def relatorio_turma(turma_id):
    professor_id = int(get_jwt_identity())
    turma = Turma.query.filter_by(id=turma_id, professor_id=professor_id).first()
    
    if not turma: 
        return jsonify({'error': 'Turma não encontrada'}), 404

    total_modulos_ativos = sum(1 for m in MODULOS_CONFIG.values() if m.get('disponivel'))

    relatorio = {
        'total_alunos': len(turma.alunos),
        'modulos_concluidos_total': 0,
        'pontuacao_total': 0,
        'nivel_medio': 0,
        'total_modulos': total_modulos_ativos,
        'alunos': []
    }

    soma_niveis = 0

    for aluno in turma.alunos:
        xp_record = _garantir_xp(aluno.id)
        modulos_concluidos = 0
        for prog in aluno.progressos:
            if prog.sinais_feitos >= prog.total_sinais:
                modulos_concluidos += 1

        relatorio['alunos'].append({
            'id': aluno.id,
            'nome_completo': aluno.nome_completo,
            'apelido': aluno.apelido or aluno.nome_completo.split()[0],
            'modulos_concluidos': modulos_concluidos,
            'pontuacao': xp_record.xp_total,
            'nivel': xp_record.nivel
        })

        relatorio['modulos_concluidos_total'] += modulos_concluidos
        relatorio['pontuacao_total'] += xp_record.xp_total
        soma_niveis += xp_record.nivel

    if turma.alunos:
        relatorio['nivel_medio'] = round(soma_niveis / len(turma.alunos), 1)

    return jsonify(relatorio), 200

@app.route('/alunos/<int:aluno_id>/pin', methods=['PATCH'])
@jwt_required()
def redefinir_pin(aluno_id):
    professor_id = int(get_jwt_identity())
    aluno = Aluno.query.get(aluno_id)
    if not aluno or aluno.turma.professor_id != professor_id: 
        return jsonify({'error': 'Aluno não encontrado'}), 404

    data = request.json or {}
    novo_pin = str(data.get('pin', ''))
    if not novo_pin.isdigit() or len(novo_pin) != 4: 
        return jsonify({'error': 'O PIN deve ter exatamente 4 dígitos'}), 400

    aluno.set_pin(novo_pin)
    aluno.bloqueado = False
    aluno.tentativas_pin = 0
    db.session.commit()
    return jsonify({'message': 'PIN redefinido com sucesso!'}), 200

@app.route('/turmas/<int:turma_id>/exportar', methods=['GET'])
@jwt_required()
def exportar_relatorio(turma_id):
    professor_id = int(get_jwt_identity())
    turma = Turma.query.filter_by(id=turma_id, professor_id=professor_id).first()
    
    if not turma:
        return jsonify({'error': 'Turma não encontrada'}), 404

    si = io.StringIO()
    cw = csv.writer(si)
    
    cw.writerow(['Nome do Aluno', 'Apelido', 'Modulos Concluidos', 'XP Total', 'Nivel', 'Status'])

    for aluno in turma.alunos:
        xp_record = _garantir_xp(aluno.id)
        modulos_concluidos = sum(1 for prog in aluno.progressos if prog.sinais_feitos >= prog.total_sinais)
        status = 'Bloqueado' if aluno.bloqueado else 'Ativo'
        
        cw.writerow([
            aluno.nome_completo,
            aluno.apelido or '',
            modulos_concluidos,
            xp_record.xp_total,
            xp_record.nivel,
            status
        ])

    output = si.getvalue()
    
    return Response(
        output,
        mimetype='text/csv',
        headers={"Content-Disposition": f"attachment;filename=relatorio_turma_{turma.codigo_unico}.csv"}
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS — ACESSO DO ALUNO
# ═══════════════════════════════════════════════════════════════════════════════

@app.route('/turma/<codigo>/alunos', methods=['GET'])
def alunos_por_codigo(codigo):
    turma = Turma.query.filter_by(codigo_unico=codigo.upper()).first()
    if not turma: return jsonify({'error': 'Código de turma inválido'}), 404
    alunos = [
        {'id': a.id, 'apelido': a.apelido or a.nome_completo.split()[0]}
        for a in turma.alunos if not a.bloqueado
    ]
    return jsonify({'turma': turma.nome, 'alunos': alunos}), 200

@app.route('/aluno/login', methods=['POST'])
def aluno_login():
    data     = request.json or {}
    aluno_id = data.get('aluno_id')
    pin      = str(data.get('pin', ''))

    aluno = Aluno.query.get_or_404(aluno_id)
    if aluno.bloqueado: 
        return jsonify({'error': 'Acesso bloqueado. Chame o professor.'}), 403

    if not aluno.check_pin(pin):
        aluno.tentativas_pin += 1
        if aluno.tentativas_pin >= 3:
            aluno.bloqueado = True
            db.session.commit()
            return jsonify({'error': 'Bloqueado. Fale com o professor.'}), 403
        db.session.commit()
        return jsonify({'error': f'PIN incorreto. Tentativas restantes: {3 - aluno.tentativas_pin}'}), 401

    aluno.tentativas_pin = 0
    db.session.commit()

    token = create_access_token(identity=f'aluno_{aluno.id}')
    return jsonify({
        'token':         token,
        'aluno_id':      aluno.id,
        'nome_completo': aluno.nome_completo,
        'apelido':       aluno.apelido or aluno.nome_completo.split()[0],
    }), 200

@app.route('/aluno/<int:aluno_id>/progresso', methods=['GET'])
@jwt_required()
def get_progresso_aluno(aluno_id):
    aluno = Aluno.query.get_or_404(aluno_id)
    xp = _garantir_xp(aluno_id)
    modulo = request.args.get('modulo', 'alfabeto')
    prog = _garantir_progresso(aluno_id, modulo)
    db.session.commit()

    config_modulo = MODULOS_CONFIG.get(modulo, {})
    total_sinais = config_modulo.get('total', 26)

    return jsonify({
        'id':                aluno.id,
        'nome':              aluno.nome_completo,
        'apelido':           aluno.apelido or aluno.nome_completo.split()[0],
        'nivel':             xp.nivel,
        'xp':                xp.xp,
        'xp_total':          xp.xp_total,
        'xp_proximo_nivel':  AlunoXP.XP_POR_NIVEL if hasattr(AlunoXP, 'XP_POR_NIVEL') else 100,
        'sinais_aprendidos': prog.sinais_feitos,
        'total_sinais':      total_sinais,
        'modulo':            modulo,
    })

@app.route('/aluno/<int:aluno_id>/xp', methods=['POST'])
def adicionar_xp(aluno_id):
    Aluno.query.get_or_404(aluno_id)
    data = request.get_json() or {}
    qtd  = int(data.get('quantidade', 1))

    xp = _garantir_xp(aluno_id)
    xp.adicionar_xp(qtd)
    db.session.commit()

    db.session.refresh(xp)
    return jsonify({'xp': xp.xp, 'xp_total': xp.xp_total, 'nivel': xp.nivel})

@app.route('/aluno/<int:aluno_id>/conquista', methods=['POST'])
def adicionar_conquista(aluno_id):
    Aluno.query.get_or_404(aluno_id)
    data = request.get_json() or {}
    chave = data.get('chave')

    if not chave: return jsonify({'error': 'Chave da conquista não fornecida'}), 400

    conquista = Conquista.query.filter_by(chave=chave).first()
    if not conquista: return jsonify({'error': 'Conquista inexistente'}), 404

    ja_possui = AlunoConquista.query.filter_by(aluno_id=aluno_id, conquista_id=conquista.id).first()
    if not ja_possui:
        nova_conquista = AlunoConquista(aluno_id=aluno_id, conquista_id=conquista.id)
        db.session.add(nova_conquista)
        db.session.commit()
        return jsonify({'message': 'Conquista desbloqueada!'}), 201
    
    return jsonify({'message': 'Aluno já possui esta conquista'}), 200

@app.route('/aluno/<int:aluno_id>/progresso', methods=['POST'])
def salvar_progresso(aluno_id):
    Aluno.query.get_or_404(aluno_id)
    data   = request.get_json()
    modulo = data.get('modulo', 'alfabeto')
    feitos = int(data.get('sinais_feitos', 0))

    prog = _garantir_progresso(aluno_id, modulo)
    
    if feitos > prog.sinais_feitos:
        prog.sinais_feitos = feitos
    db.session.commit()

    return jsonify(prog.to_dict())

@app.route('/aluno/<int:aluno_id>/dashboard', methods=['GET'])
def aluno_dashboard(aluno_id):
    a = Aluno.query.get_or_404(aluno_id)
    xp = _garantir_xp(aluno_id)
    db.session.commit()

    modulos = []
    for chave, config in MODULOS_CONFIG.items():
        p = ProgressoModulo.query.filter_by(aluno_id=aluno_id, modulo=chave).first()
        feitos = p.sinais_feitos if p else 0
        total  = config['total']
        modulos.append({
            'modulo':        chave,
            'titulo':        config['titulo'],
            'emoji':         config['emoji'],
            'sinais_feitos': feitos,
            'total_sinais':  total,
            'progresso_pct': round((feitos / total) * 100) if total else 0,
            'disponivel':    config['disponivel'],
        })

    todas = Conquista.query.all()
    desbloq_ids = {ac.conquista_id for ac in AlunoConquista.query.filter_by(aluno_id=aluno_id)}
    conquistas = [{**c.to_dict(), 'desbloqueada': c.id in desbloq_ids} for c in todas]

    return jsonify({
        'aluno': { 'id': a.id, 'nome_completo': a.nome_completo, 'apelido': a.apelido or a.nome_completo.split()[0] },
        'xp': xp.xp, 
        'xp_total': xp.xp_total,
        'nivel': xp.nivel, 
        'xp_proximo': AlunoXP.XP_POR_NIVEL if hasattr(AlunoXP, 'XP_POR_NIVEL') else 100,
        'modulos': modulos,
        'conquistas': conquistas,
    })


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS — IA
# ═══════════════════════════════════════════════════════════════════════════════

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if knn_model is None:
            return jsonify({'error': 'Modelo KNN não carregado'}), 503
            
        data   = request.json
        lmList = data['lmList']
        bbox   = data['bbox']

        points       = normalize_single_frame(lmList, bbox)
        final_coords = np.array(points).reshape(1, -1)
        prediction   = knn_model.predict(final_coords)
        probs        = knn_model.predict_proba(final_coords)
        confianca    = float(np.max(probs))
        letra        = str(prediction[0])

        return jsonify({'letter': letra, 'confidence': confianca})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predict-sequence', methods=['POST'])
def predict_sequence():
    try:
        frames = request.json.get('frames', [])
        modulo = request.json.get('modulo', 'alfabeto')
        
        if len(frames) < 5: 
            return jsonify({'error': 'Sequência muito curta'}), 400

        sequence = normalize_sequence(frames)
        
        if modulo in MODELOS_LSTM:
            letra, confianca = predict_lstm_modulo(sequence, modulo)
            if letra == 'REPOUSO' and confianca > 0.60:
                return jsonify({
                    'letter': None,
                    'confidence': float(confianca),
                    'modulo': modulo,
                    'repouso': True
                })
            
        elif dynamic_templates:
            letra, confianca = predict_dtw(sequence)
        else:
            return jsonify({'error': f'Nenhum modelo disponível para o módulo {modulo}'}), 503

        return jsonify({
            'letter': letra, 
            'confidence': float(confianca),
            'modulo': modulo
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

@app.route('/status', methods=['GET'])
def status():
    modulos_disponiveis = list(MODELOS_LSTM.keys())
    return jsonify({
        'knn':             knn_model is not None,
        'lstm_modulos':    modulos_disponiveis,
        'dtw':             bool(dynamic_templates),
    })


if __name__ == '__main__':
    print("\n🚀 Servidor LibrasKids iniciado!")
    print(f"   Módulos LSTM: {list(MODELOS_LSTM.keys())}")
    print(f"   KNN: {'✅' if knn_model else '❌'}")
    print(f"   DTW: {'✅' if dynamic_templates else '❌'}")
    print("=" * 50)
    app.run(host='127.0.0.1', port=8000, debug=False)