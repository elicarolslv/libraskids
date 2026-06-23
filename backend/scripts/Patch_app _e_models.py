"""
═══════════════════════════════════════════════════════════════════
PATCH — app.py e models.py
Suporte aos módulos Saudações e Emoções no LibrasKids
═══════════════════════════════════════════════════════════════════

INSTRUÇÕES:
  1. Em models.py  → substitua MODULOS_CONFIG pelo bloco da SEÇÃO A
  2. Em app.py     → substitua o bloco de carregamento LSTM e os
                     endpoints /predict-sequence e /status
                     pelos blocos das SEÇÕES B e C

Nada mais precisa ser alterado.
═══════════════════════════════════════════════════════════════════
"""


# ═══════════════════════════════════════════════════════════════════
# SEÇÃO A — models.py: substitua MODULOS_CONFIG
# ═══════════════════════════════════════════════════════════════════

MODULOS_CONFIG = {
    'alfabeto': {
        'titulo':     'Alfabeto',
        'emoji':      '🔤',
        'total':      26,
        'disponivel': True,
    },
    'saudacoes': {
        'titulo':     'Saudações',
        'emoji':      '👋',
        'total':      8,
        'disponivel': True,   # Mude para False enquanto não treinar
    },
    'emocoes': {
        'titulo':     'Emoções',
        'emoji':      '😊',
        'total':      6,
        'disponivel': True,   # Mude para False enquanto não treinar
    },
}

# ─── Nomes amigáveis exibidos no frontend ─────────────────────────
# (usados pelo React para mostrar o label correto depois da predição)
LABELS_DISPLAY = {
    'saudacoes': {
        'OLA':         'Olá',
        'TCHAU':       'Tchau',
        'OBRIGADO':    'Obrigado',
        'POR_FAVOR':   'Por favor',
        'COM_LICENCA': 'Com licença',
        'DESCULPA':    'Desculpa',
        'BOM_DIA':     'Bom dia',
        'BOA_TARDE':   'Boa tarde',
    },
    'emocoes': {
        'FELIZ':    'Feliz',
        'TRISTE':   'Triste',
        'RAIVA':    'Com raiva',
        'MEDO':     'Com medo',
        'SURPRESO': 'Surpreso',
        'CANSADO':  'Cansado',
    },
}


# ═══════════════════════════════════════════════════════════════════
# SEÇÃO B — app.py: substitua o bloco de carregamento LSTM
#
# Encontre no app.py o bloco que começa com:
#   "# ─── LSTM — letras dinâmicas"
# e substitua-o por este:
# ═══════════════════════════════════════════════════════════════════

"""
# ─── LSTM — carregador genérico por módulo ───────────────────────
lstm_modelos = {}   # { 'alfabeto': {'model': ..., 'labels': [...]}, ... }

def _carregar_lstm(nome, arquivo_h5, arquivo_labels):
    if not (os.path.exists(arquivo_h5) and os.path.exists(arquivo_labels)):
        print(f"⚠️  LSTM '{nome}' não encontrado — pulando")
        return
    try:
        import tensorflow as tf
        from tensorflow.keras.layers import LSTM as KerasLSTM

        class LSTMCompat(KerasLSTM):
            def __init__(self, *args, **kwargs):
                kwargs.pop('time_major', None)
                super().__init__(*args, **kwargs)

        model  = tf.keras.models.load_model(
            arquivo_h5, custom_objects={'LSTM': LSTMCompat}, compile=False
        )
        labels = np.load(arquivo_labels, allow_pickle=True).tolist()
        lstm_modelos[nome] = {'model': model, 'labels': labels}
        print(f"✅ LSTM '{nome}' carregado: {labels}")
    except Exception as e:
        print(f"⚠️  Falha ao carregar LSTM '{nome}': {e}")

# Carrega todos os modelos disponíveis
_lstm_para_carregar = [
    ('alfabeto',   'lstm_model.h5',               'lstm_labels.npy'),
    ('saudacoes',  'lstm_saudacoes.h5',            'lstm_saudacoes_labels.npy'),
    ('emocoes',    'lstm_emocoes.h5',              'lstm_emocoes_labels.npy'),
]
for _nome, _h5, _lbl in _lstm_para_carregar:
    _carregar_lstm(
        _nome,
        os.path.join(BASE_DIR, 'models', _h5),
        os.path.join(BASE_DIR, 'models', _lbl),
    )

USE_LSTM = bool(lstm_modelos)
"""


# ═══════════════════════════════════════════════════════════════════
# SEÇÃO C — app.py: substitua as funções predict_lstm e os
#           endpoints /predict-sequence e /status
# ═══════════════════════════════════════════════════════════════════

"""
def predict_lstm_modulo(sequence, modulo):
    \"\"\"Roda inferência no modelo LSTM do módulo solicitado.\"\"\"
    alvo = modulo if modulo in lstm_modelos else 'alfabeto'
    if alvo not in lstm_modelos:
        raise ValueError(f"Nenhum modelo LSTM disponível para '{modulo}'")

    model  = lstm_modelos[alvo]['model']
    labels = lstm_modelos[alvo]['labels']

    n_frames = model.input_shape[1]
    if sequence.shape[0] < n_frames:
        pad      = np.zeros((n_frames - sequence.shape[0], sequence.shape[1]), dtype=np.float32)
        sequence = np.vstack([sequence, pad])
    elif sequence.shape[0] > n_frames:
        sequence = sequence[:n_frames]

    probs = model.predict(sequence.reshape(1, n_frames, -1), verbose=0)[0]
    idx   = int(np.argmax(probs))
    return labels[idx], float(probs[idx])


@app.route('/predict-sequence', methods=['POST'])
def predict_sequence():
    \"\"\"
    Predição dinâmica via LSTM.
    Aceita o campo 'modulo' no body para rotear ao modelo correto.

    Body:
        { "frames": [...], "modulo": "saudacoes" }
        { "frames": [...], "modulo": "emocoes"   }
        { "frames": [...], "modulo": "alfabeto"  }   ← padrão atual
    \"\"\"
    try:
        body   = request.json or {}
        frames = body.get('frames', [])
        modulo = body.get('modulo', 'alfabeto')

        if len(frames) < 5:
            return jsonify({'error': 'Sequência muito curta (mínimo 5 frames)'}), 400

        sequence = normalize_sequence(frames)

        if modulo in lstm_modelos or 'alfabeto' in lstm_modelos:
            letra, confianca = predict_lstm_modulo(sequence, modulo)
        elif dynamic_templates:
            letra, confianca = predict_dtw(sequence)
        else:
            return jsonify({'error': f"Nenhum modelo disponível para '{modulo}'"}), 503

        # Converte label interno (ex: 'OLA') para nome amigável (ex: 'Olá')
        from models import LABELS_DISPLAY
        label_amigavel = LABELS_DISPLAY.get(modulo, {}).get(letra, letra)

        return jsonify({
            'letter':    letra,           # label interno ('OLA', 'TCHAU'…)
            'label':     label_amigavel,  # label para exibir ('Olá', 'Tchau'…)
            'confidence': float(confianca),
            'modulo':    modulo,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400


@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        'knn':           os.path.exists(MODEL_PATH),
        'lstm_modelos':  list(lstm_modelos.keys()),
        'dtw':           bool(dynamic_templates),
    })
"""