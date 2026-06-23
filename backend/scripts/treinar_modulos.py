"""
treinar_modulos.py
-------------------
Treina o modelo LSTM para Saudações e Emoções do LibrasKids.
Segue EXATAMENTE a mesma estrutura do treinar_lstm.py original:
  - Lê .npy de: Dados_Libras/<modulo>/<SINAL>/*.npy
  - Salva modelo em: backend/models/lstm_<modulo>.h5
  - Salva labels em: backend/models/lstm_<modulo>_labels.npy

USO:
    python treinar_modulos.py --modulo saudacoes
    python treinar_modulos.py --modulo emocoes
    python treinar_modulos.py --modulo saudacoes --epochs 200
"""

import numpy as np
import os
import argparse

# ─── CONFIGURAÇÃO DOS MÓDULOS ─────────────────────────────────────────────────
MODULOS = {
    'saudacoes': {
        'sinais': [
            'OI',            # 👋 Saudação universal
            'TCHAU',         # 👋 Despedida
            'BOM_DIA',       # 🌅 Cumprimento matinal
            'BOA_TARDE',     # ☀️ Cumprimento vespertino
            'BOA_NOITE',     # 🌙 Cumprimento noturno
            'OBRIGADO',      # 🙏 Gratidão
            'POR_FAVOR',     # 🥺 Pedido educado
            'TUDO_BEM',      # 🤝 Pergunta de bem-estar
            'DESCULPA',      # 😔 Desculpar-se
            'SEU_NOME',      # 🧒 Apresentação pessoal
        ],
    },
    'emocoes': {
        'sinais': ['FELIZ', 'TRISTE', 'RAIVA', 'MEDO', 'SURPRESO', 'CANSADO'],
    },
}

# ─── CAMINHOS (mesma lógica do treinar_lstm.py) ───────────────────────────────
BASE_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
MODEL_DIR  = os.path.join(BASE_DIR, 'backend', 'models')

os.makedirs(MODEL_DIR, exist_ok=True)


def treinar(modulo_nome, epochs):
    config = MODULOS[modulo_nome]
    sinais = config['sinais']

    MODEL_PATH  = os.path.join(MODEL_DIR, f'lstm_{modulo_nome}.h5')
    LABELS_PATH = os.path.join(MODEL_DIR, f'lstm_{modulo_nome}_labels.npy')
    DATA_DIR    = os.path.join(BASE_DIR, 'Dados_Libras', modulo_nome)

    print("=" * 55)
    print(f"  TREINAMENTO LSTM — {modulo_nome.upper()}")
    print("=" * 55)
    print(f"  Lendo dados de: {os.path.abspath(DATA_DIR)}")

    if not os.path.isdir(DATA_DIR):
        print(f"\n❌ Pasta não encontrada: {DATA_DIR}")
        print(f"  Execute primeiro: python coletar_modulos.py --modulo {modulo_nome}")
        return

    # ─── 1. CARREGA OS DADOS (idêntico ao treinar_lstm.py) ───────────────────
    print("\n  Carregando dados...")

    X, y = [], []
    sequence_length = None

    for idx, sinal in enumerate(sinais):
        sinal_dir = os.path.join(DATA_DIR, sinal)

        if not os.path.isdir(sinal_dir):
            print(f"  ⚠️  {sinal}: pasta não encontrada, pulando.")
            continue

        files = sorted([f for f in os.listdir(sinal_dir) if f.endswith('.npy')])
        if not files:
            print(f"  ⚠️  {sinal}: sem arquivos, pulando.")
            continue

        count = 0
        for fname in files:
            try:
                seq = np.load(os.path.join(sinal_dir, fname)).astype(np.float32)

                if seq.ndim == 3:
                    seq = seq.reshape(seq.shape[0], -1)
                if seq.ndim != 2 or seq.shape[1] < 3:
                    continue

                if sequence_length is None:
                    sequence_length = seq.shape[0]
                    print(f"  Sequência detectada: {sequence_length} frames x {seq.shape[1]} features")

                if seq.shape[0] < sequence_length:
                    pad = np.zeros((sequence_length - seq.shape[0], seq.shape[1]), dtype=np.float32)
                    seq = np.vstack([seq, pad])
                elif seq.shape[0] > sequence_length:
                    seq = seq[:sequence_length]

                X.append(seq)
                y.append(idx)
                count += 1
            except Exception as e:
                print(f"    Erro em {fname}: {e}")

        print(f"  {sinal:<15} {count} amostras carregadas")

    if not X:
        print("\n❌ Nenhum dado carregado. Execute o coletor primeiro.")
        return

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)

    print(f"\n  📊 Total: {len(X)} amostras | Shape: {X.shape}")
    print(f"  🏷️  Classes ({len(sinais)}): {', '.join(sinais)}")

    if len(X) < len(sinais) * 5:
        print(f"\n⚠️  Apenas {len(X)} amostras. Recomendado: mínimo {len(sinais) * 5}.")
        print("   Continue coletando mais dados para melhor resultado.")

    # ─── 2. PREPARA OS DADOS ─────────────────────────────────────────────────
    from sklearn.model_selection import train_test_split
    import tensorflow as tf

    y_onehot = tf.keras.utils.to_categorical(y, num_classes=len(sinais))

    X_train, X_val, y_train, y_val = train_test_split(
        X, y_onehot, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n  Treino: {len(X_train)} | Validação: {len(X_val)}")

    # ─── 3. MODELO LSTM (arquitetura idêntico ao treinar_lstm.py) ────────────
    print("\n  Construindo modelo LSTM...")

    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
    from tensorflow.keras.optimizers import Adam

    n_features = X.shape[2]
    n_classes  = len(sinais)

    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=(sequence_length, n_features)),
        Dropout(0.2),
        LSTM(128, return_sequences=True),
        Dropout(0.2),
        LSTM(64, return_sequences=False),
        Dropout(0.2),
        Dense(128, activation='relu'),
        BatchNormalization(),
        Dense(64, activation='relu'),
        Dense(n_classes, activation='softmax'),
    ])

    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )

    model.summary()

    # ─── 4. TREINA ───────────────────────────────────────────────────────────
    print("\n  Treinando...")

    callbacks = [
        EarlyStopping(patience=25, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(patience=7, factor=0.5, verbose=1),
    ]

    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=16,
        callbacks=callbacks,
        verbose=1,
    )

    # ─── 5. AVALIA ───────────────────────────────────────────────────────────
    loss, acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n  Acurácia na validação: {acc:.2%}")

    if acc < 0.80:
        print("  ⚠️  Acurácia abaixo de 80%. Colete mais amostras e retreine.")
    elif acc >= 0.95:
        print("  🎉 Excelente! Modelo pronto para uso.")

    # ─── 6. SALVA (mesmo padrão do treinar_lstm.py) ──────────────────────────
    model.save(MODEL_PATH)
    np.save(LABELS_PATH, np.array(sinais))

    print(f"\n{'='*55}")
    print(f"  ✅ Modelo salvo em:  {MODEL_PATH}")
    print(f"  ✅ Labels salvas em: {LABELS_PATH}")
    print(f"  📈 Acurácia final:   {acc:.2%}")
    print(f"  🚀 Reinicie o app.py para carregar o módulo '{modulo_nome}'.")
    print("=" * 55)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Treinador LSTM — Módulos LibrasKids')
    parser.add_argument('--modulo',  choices=list(MODULOS.keys()), required=True,
                        help='saudacoes | emocoes')
    parser.add_argument('--epochs',  type=int, default=200,
                        help='Épocas máximas (default: 200, igual ao treinar_lstm.py)')
    args = parser.parse_args()
    treinar(args.modulo, args.epochs)