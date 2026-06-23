"""
treinar_lstm.py
----------------
Treina um modelo LSTM para reconhecimento de letras dinamicas.
Substitui o DTW por um modelo de deep learning muito mais preciso.

Requer: pip install tensorflow
Salva:  backend/models/lstm_model.h5
        backend/models/lstm_labels.npy
"""

import numpy as np
import os
import joblib

# ─── CAMINHOS ─────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
DYNAMIC_DIR  = os.path.join(BASE_DIR, 'Dados_Libras', 'dynamic')
MODEL_DIR    = os.path.join(BASE_DIR, 'backend', 'models')
MODEL_PATH   = os.path.join(MODEL_DIR, 'lstm_model.h5')
LABELS_PATH  = os.path.join(MODEL_DIR, 'lstm_labels.npy')

DYNAMIC_LABELS = ['H', 'J', 'K', 'X', 'Y', 'Z']
# ──────────────────────────────────────────────────────────────────────────────

os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 55)
print("  TREINAMENTO LSTM - LETRAS DINAMICAS")
print("=" * 55)

# ─── 1. CARREGA OS DADOS ──────────────────────────────────────────────────────
print("\n  Carregando dados...")

X, y = [], []
sequence_length = None

for letra in DYNAMIC_LABELS:
    letra_dir = os.path.join(DYNAMIC_DIR, letra)
    if not os.path.isdir(letra_dir):
        print(f"  {letra}: pasta nao encontrada, pulando.")
        continue

    files = sorted([f for f in os.listdir(letra_dir) if f.endswith('.npy')])
    if not files:
        print(f"  {letra}: sem arquivos, pulando.")
        continue

    count = 0
    for fname in files:
        try:
            seq = np.load(os.path.join(letra_dir, fname)).astype(np.float32)
            if seq.ndim == 3:
                seq = seq.reshape(seq.shape[0], -1)
            if seq.ndim != 2 or seq.shape[1] < 3:
                continue

            # Detecta o tamanho de sequência automaticamente
            if sequence_length is None:
                sequence_length = seq.shape[0]
                print(f"  Sequencia detectada: {sequence_length} frames x {seq.shape[1]} features")

            # Padeia ou corta para o tamanho padrão
            if seq.shape[0] < sequence_length:
                pad = np.zeros((sequence_length - seq.shape[0], seq.shape[1]), dtype=np.float32)
                seq = np.vstack([seq, pad])
            elif seq.shape[0] > sequence_length:
                seq = seq[:sequence_length]

            X.append(seq)
            y.append(DYNAMIC_LABELS.index(letra))
            count += 1
        except Exception as e:
            print(f"    Erro em {fname}: {e}")

    print(f"  {letra}: {count} amostras carregadas")

if not X:
    print("\nERRO: Nenhum dado carregado.")
    exit(1)

X = np.array(X, dtype=np.float32)
y = np.array(y, dtype=np.int32)

print(f"\n  Total: {len(X)} amostras | Shape: {X.shape}")
print(f"  Classes: {DYNAMIC_LABELS}")

# ─── 2. PREPARA OS DADOS ──────────────────────────────────────────────────────
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelBinarizer

# One-hot encoding
lb = LabelBinarizer()
y_onehot = lb.fit_transform(y)

# Split treino/validação
X_train, X_val, y_train, y_val = train_test_split(
    X, y_onehot, test_size=0.2, random_state=42, stratify=y
)

print(f"\n  Treino: {len(X_train)} | Validação: {len(X_val)}")

# ─── 3. CONSTRÓI O MODELO LSTM ────────────────────────────────────────────────
print("\n  Construindo modelo LSTM...")

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam

n_features = X.shape[2]   # 63
n_classes  = len(DYNAMIC_LABELS)

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
    Dense(n_classes, activation='softmax')
])

model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ─── 4. TREINA ────────────────────────────────────────────────────────────────
print("\n  Treinando...")

callbacks = [
    EarlyStopping(patience=25, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(patience=7, factor=0.5, verbose=1)
]

history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=200,
    batch_size=16,
    callbacks=callbacks,
    verbose=1
)

# ─── 5. AVALIA ────────────────────────────────────────────────────────────────
loss, acc = model.evaluate(X_val, y_val, verbose=0)
print(f"\n  Acurácia na validação: {acc:.2%}")

# ─── 6. SALVA ─────────────────────────────────────────────────────────────────
model.save(MODEL_PATH)
np.save(LABELS_PATH, np.array(DYNAMIC_LABELS))

print(f"\n{'='*55}")
print(f"  Modelo salvo em: {MODEL_PATH}")
print(f"  Labels salvas em: {LABELS_PATH}")
print(f"  Acurácia final: {acc:.2%}")
print("  Reinicie o app.py para usar o novo modelo.")
print("=" * 55)