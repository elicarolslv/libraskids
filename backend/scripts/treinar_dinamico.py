"""
treinar_dinamico.py
--------------------
Le sequencias de: Dados_Libras/dynamic/<LETRA>/*.npy
Salva modelo em:  backend/models/dynamic_templates.joblib
"""

import numpy as np
import joblib
import os

# ─── CAMINHOS FIXOS ───────────────────────────────────────────────────────────
BASE_DIR     = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
DYNAMIC_DIR  = os.path.join(BASE_DIR, 'Dados_Libras', 'dynamic')
MODEL_DIR    = os.path.join(BASE_DIR, 'backend', 'models')
OUTPUT_PATH  = os.path.join(MODEL_DIR, 'dynamic_templates.joblib')

DYNAMIC_LABELS           = ['H', 'J', 'K', 'X', 'Y', 'Z']
MAX_TEMPLATES_PER_LETTER = 80
# ──────────────────────────────────────────────────────────────────────────────

os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 55)
print("  TREINAMENTO DTW - LETRAS DINAMICAS")
print("=" * 55)
print(f"  Lendo dados de: {os.path.abspath(DYNAMIC_DIR)}")

if not os.path.isdir(DYNAMIC_DIR):
    print(f"\nERRO: Pasta nao encontrada.")
    print(f"  Caminho esperado: {os.path.abspath(DYNAMIC_DIR)}")
    print("  Execute coletar_dinamico.py primeiro.")
    exit(1)

templates = {}
total     = 0

for letra in DYNAMIC_LABELS:
    letra_dir = os.path.join(DYNAMIC_DIR, letra)

    if not os.path.isdir(letra_dir):
        print(f"\n  {letra}: pasta nao encontrada, pulando.")
        continue

    files = [f for f in os.listdir(letra_dir) if f.endswith('.npy')]
    if not files:
        print(f"\n  {letra}: nenhum arquivo .npy encontrado, pulando.")
        continue

    print(f"\n  {letra}: {len(files)} arquivo(s) encontrado(s)")

    sequences = []
    for fname in sorted(files):
        try:
            seq = np.load(os.path.join(letra_dir, fname)).astype(np.float64)
            if seq.ndim == 3:
                seq = seq.reshape(seq.shape[0], -1)
            if seq.ndim == 2 and seq.shape[1] >= 3:
                sequences.append(seq)
        except Exception as e:
            print(f"    Erro em {fname}: {e}")

    if not sequences:
        print(f"  {letra}: nenhuma sequencia valida.")
        continue

    if len(sequences) > MAX_TEMPLATES_PER_LETTER:
        indices  = np.linspace(0, len(sequences)-1, MAX_TEMPLATES_PER_LETTER, dtype=int)
        selected = [sequences[i] for i in indices]
    else:
        selected = sequences

    templates[letra] = selected
    total += len(selected)
    print(f"  {letra}: {len(selected)} templates selecionados")

if not templates:
    print("\nNenhum template criado. Execute coletar_dinamico.py primeiro.")
    exit(1)

joblib.dump(templates, OUTPUT_PATH)

print(f"\n{'='*55}")
print(f"  Salvo em: {os.path.abspath(OUTPUT_PATH)}")
print(f"  Total: {total} templates | Letras: {list(templates.keys())}")
print("  Reinicie o app.py para carregar os novos templates.")
print("=" * 55)