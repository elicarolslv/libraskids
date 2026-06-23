"""
coletar_dinamico.py — versão com instruções de variação + REPOUSO
-----------------------------------------------------------------
Guia o usuário a coletar amostras em condições variadas
para melhorar a precisão do DTW/LSTM.
Inclui classe REPOUSO para mão parada (nenhum sinal).
"""

import cv2
import numpy as np
import mediapipe as mp
import os

# ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────────
BASE_DIR           = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
PATH_DATASET       = os.path.join(BASE_DIR, 'Dados_Libras', 'dynamic')
SEQUENCE_LENGTH    = 30
SAMPLES_PER_LETTER = 750  # aumentado para 750

# 🆕 REPOUSO adicionado à lista de letras dinâmicas
DYNAMIC_LABELS = ['H', 'J', 'K', 'X', 'Y', 'Z', 'REPOUSO']
# ──────────────────────────────────────────────────────────────────────────────

# Instruções de variação — cicla entre elas durante a coleta
VARIACOES = [
    ("NORMAL",        (200, 200, 200), "Gesto normal, velocidade media"),
    ("RAPIDO",        (0,   200, 255), "Faca o gesto RAPIDO"),
    ("DEVAGAR",       (255, 200, 0),   "Faca o gesto BEM DEVAGAR"),
    ("MAO LONGE",     (0,   255, 150), "Afaste a mao da camera"),
    ("MAO PERTO",     (255, 100, 100), "Aproxime a mao da camera"),
    ("MAO ESQUERDA",  (200, 100, 255), "Desloque a mao para a ESQUERDA"),
    ("MAO DIREITA",   (100, 200, 255), "Desloque a mao para a DIREITA"),
    ("MAO ALTA",      (255, 180, 0),   "Levante a mao (posicao ALTA)"),
    ("MAO BAIXA",     (100, 255, 200), "Abaixe a mao (posicao BAIXA)"),
    ("ANGULO",        (255, 150, 200), "Incline levemente o pulso"),
]

# 🆕 Variações específicas para REPOUSO (mão parada em posições variadas)
VARIACOES_REPOUSO = [
    ("REPOUSO-NORMAL",    (200, 200, 200), "Mao parada e aberta - NAO MEXA"),
    ("REPOUSO-FECHADA",   (180, 180, 220), "Mao fechada parada - NAO MEXA"),
    ("REPOUSO-ALTA",      (255, 180, 0),   "Mao parada no alto - NAO MEXA"),
    ("REPOUSO-BAIXA",     (100, 255, 200), "Mao parada embaixo - NAO MEXA"),
    ("REPOUSO-ESQUERDA",  (200, 100, 255), "Mao parada a esquerda - NAO MEXA"),
    ("REPOUSO-DIREITA",   (100, 200, 255), "Mao parada a direita - NAO MEXA"),
    ("REPOUSO-LONGE",     (0,   255, 150), "Mao parada longe - NAO MEXA"),
    ("REPOUSO-PERTO",     (255, 100, 100), "Mao parada perto - NAO MEXA"),
    ("REPOUSO-LATERAL",   (150, 200, 180), "Mao na lateral do corpo - NAO MEXA"),
    ("REPOUSO-ABERTA",    (220, 220, 200), "Mao bem aberta e parada - NAO MEXA"),
]

os.makedirs(PATH_DATASET, exist_ok=True)
print(f"Salvando em: {os.path.abspath(PATH_DATASET)}\n")

# ─── DETECTA API DO MEDIAPIPE ─────────────────────────────────────────────────
USE_NEW_API = not hasattr(mp, 'solutions')

if USE_NEW_API:
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode
    import urllib.request, tempfile, pathlib

    MODEL_FILE = pathlib.Path(tempfile.gettempdir()) / 'hand_landmarker.task'
    if not MODEL_FILE.exists():
        print("Baixando modelo (~8MB)...")
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            MODEL_FILE)
        print("Modelo baixado.\n")

    _options    = HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(MODEL_FILE)),
        running_mode=RunningMode.IMAGE, num_hands=1,
        min_hand_detection_confidence=0.7,
        min_hand_presence_confidence=0.7,
        min_tracking_confidence=0.7,
    )
    _landmarker = HandLandmarker.create_from_options(_options)

    def get_landmarks(frame_rgb):
        h, w   = frame_rgb.shape[:2]
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        result = _landmarker.detect(mp_img)
        if not result.hand_landmarks:
            return None, None
        lm     = result.hand_landmarks[0]
        lmList = [[int(p.x*w), int(p.y*h), p.z*w] for p in lm]
        xs, ys = [p[0] for p in lmList], [p[1] for p in lmList]
        return lmList, [min(xs), min(ys), max(max(xs)-min(xs),1), max(max(ys)-min(ys),1)]

    def draw_landmarks(display, frame_rgb):
        h, w   = frame_rgb.shape[:2]
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        result = _landmarker.detect(mp_img)
        if result.hand_landmarks:
            for lm in result.hand_landmarks:
                for p in lm:
                    cv2.circle(display, (int(p.x*w), int(p.y*h)), 4, (0,255,0), -1)
        return display

    def close():
        _landmarker.close()

else:
    _mp_hands = mp.solutions.hands
    _mp_draw  = mp.solutions.drawing_utils
    _detector = _mp_hands.Hands(static_image_mode=False, max_num_hands=1,
                                 min_detection_confidence=0.7, min_tracking_confidence=0.7)

    def get_landmarks(frame_rgb):
        h, w   = frame_rgb.shape[:2]
        result = _detector.process(frame_rgb)
        if not result.multi_hand_landmarks:
            return None, None
        lm     = result.multi_hand_landmarks[0]
        lmList = [[int(p.x*w), int(p.y*h), p.z*w] for p in lm.landmark]
        xs, ys = [p[0] for p in lmList], [p[1] for p in lmList]
        return lmList, [min(xs), min(ys), max(max(xs)-min(xs),1), max(max(ys)-min(ys),1)]

    def draw_landmarks(display, frame_rgb):
        result = _detector.process(frame_rgb)
        if result.multi_hand_landmarks:
            for lm in result.multi_hand_landmarks:
                _mp_draw.draw_landmarks(display, lm, _mp_hands.HAND_CONNECTIONS)
        return display

    def close():
        _detector.close()


# ─── FUNÇÕES COMUNS ───────────────────────────────────────────────────────────

def normalize_frame(lmList, bbox):
    x, y, w, h = bbox
    z_coords = [p[2] for p in lmList]
    min_z    = min(z_coords)
    z_range  = max(max(z_coords) - min_z, 1e-9)
    points   = []
    for lx, ly, lz in lmList:
        points.append((lx - x) / w)
        points.append((ly - y) / h)
        points.append((lz - min_z) / z_range)
    return points


def draw_ui(display, letra, count, total, variacao_nome, variacao_cor, variacao_dica, recording, seq_len, mao_ok):
    h_img, w_img = display.shape[:2]

    # Fundo semitransparente no topo
    overlay = display.copy()
    cv2.rectangle(overlay, (0, 0), (w_img, 130), (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.6, display, 0.4, 0, display)

    # Letra atual - destaque para REPOUSO
    if letra == 'REPOUSO':
        cv2.putText(display, f"🖐️  REPOUSO (mao parada)", (15, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (100, 255, 200), 2)
    else:
        cv2.putText(display, f"Letra: {letra}", (15, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

    # Progresso
    prog_texto = f"{count}/{total} amostras"
    cv2.putText(display, prog_texto, (15, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (180, 180, 180), 1)

    # Barra de progresso
    barra_w = w_img - 30
    cv2.rectangle(display, (15, 80), (15 + barra_w, 90), (60, 60, 60), -1)
    preenchido = int(barra_w * count / total)
    cv2.rectangle(display, (15, 80), (15 + preenchido, 90), (80, 200, 120), -1)

    # Instrução de variação
    cv2.putText(display, f">> {variacao_nome}: {variacao_dica}", (15, 118),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, variacao_cor, 1)

    # Status de gravação
    if recording:
        status = f"GRAVANDO... {seq_len}/{SEQUENCE_LENGTH}"
        color  = (0, 80, 255)
        cv2.circle(display, (w_img - 30, 30), 12, (0, 0, 255), -1)
    else:
        status = "ESPACO = gravar  |  ESC = pular letra"
        color  = (0, 220, 100) if mao_ok else (0, 140, 255)
        if not mao_ok:
            status = "Sem mao detectada — posicione a mao"

    # Fundo do status embaixo
    overlay2 = display.copy()
    cv2.rectangle(overlay2, (0, h_img - 45), (w_img, h_img), (20, 20, 20), -1)
    cv2.addWeighted(overlay2, 0.6, display, 0.4, 0, display)
    cv2.putText(display, status, (15, h_img - 15),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    return display


def collect_sequence(letra, cap, count, total):
    sequence  = []
    recording = False

    # 🆕 Usa variações diferentes para REPOUSO
    if letra == 'REPOUSO':
        variacoes = VARIACOES_REPOUSO
    else:
        variacoes = VARIACOES

    variacao_idx  = count % len(variacoes)
    var_nome, var_cor, var_dica = variacoes[variacao_idx]

    if count % len(variacoes) == 0:
        print(f"\n  --- Nova rodada de variacoes ---")
    print(f"  [{count+1}/{total}] {var_nome}: {var_dica}")

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        frame     = cv2.flip(frame, 1)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        lmList, bbox = get_landmarks(frame_rgb)

        display = frame.copy()
        if lmList:
            display = draw_landmarks(display, frame_rgb)

        display = draw_ui(display, letra, count, total,
                          var_nome, var_cor, var_dica,
                          recording, len(sequence), lmList is not None)

        cv2.imshow("Coleta Dinamica - LibraKids", display)

        key = cv2.waitKey(1) & 0xFF

        if key == ord(' ') and not recording:
            if lmList:
                recording = True
                sequence  = []
            else:
                print("  Sem mao detectada.")

        if recording:
            if lmList:
                sequence.append(normalize_frame(lmList, bbox))
                if len(sequence) >= SEQUENCE_LENGTH:
                    return sequence
            else:
                print("  Mao perdida. Tente novamente.")
                recording = False
                sequence  = []

        if key == 27:
            return None


def save_sample(letra, sequence, count):
    letra_dir = os.path.join(PATH_DATASET, letra)
    os.makedirs(letra_dir, exist_ok=True)
    path = os.path.join(letra_dir, f"{letra}_{count:03d}.npy")
    np.save(path, np.array(sequence, dtype=np.float32))
    return path


# ─── LOOP PRINCIPAL ───────────────────────────────────────────────────────────
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Camera nao encontrada.")
    exit(1)

print("=" * 60)
print("  COLETA COM VARIACOES - LETRAS COM MOVIMENTO (LIBRAS)")
print("=" * 60)
print(f"  Letras: {DYNAMIC_LABELS}")
print(f"  Meta: {SAMPLES_PER_LETTER} amostras por letra")
print(f"  Variacoes: {len(VARIACOES)} tipos diferentes")
print(f"  🖐️  REPOUSO: mao parada, sem fazer sinal")
print("  ESC = pular letra\n")

for letra in DYNAMIC_LABELS:
    letra_dir = os.path.join(PATH_DATASET, letra)
    existing  = len([f for f in os.listdir(letra_dir) if f.endswith('.npy')]) \
                if os.path.exists(letra_dir) else 0
    count = existing

    if letra == 'REPOUSO':
        print(f"\n{'='*55}")
        print(f"  🖐️  REPOUSO  ({existing}/{SAMPLES_PER_LETTER} ja coletadas)")
        print(f"  ⚠️  IMPORTANTE: Mao PARADA, sem movimento!")
        print(f"{'='*55}")
    else:
        print(f"\n{'='*55}")
        print(f"  LETRA: {letra}  ({existing}/{SAMPLES_PER_LETTER} ja coletadas)")
        print(f"{'='*55}")

    if existing >= SAMPLES_PER_LETTER:
        print(f"  Completa, pulando...")
        continue

    while count < SAMPLES_PER_LETTER:
        seq = collect_sequence(letra, cap, count, SAMPLES_PER_LETTER)
        if seq is not None:
            path = save_sample(letra, seq, count + 1)
            count += 1
            print(f"  Salvo ({count}/{SAMPLES_PER_LETTER}): {os.path.basename(path)}")
        else:
            break

    print(f"\n  {letra}: {count} amostras coletadas.")

cap.release()
cv2.destroyAllWindows()
close()

print("\n" + "=" * 60)
print("  RESUMO FINAL")
print("=" * 60)
for letra in DYNAMIC_LABELS:
    letra_dir = os.path.join(PATH_DATASET, letra)
    qtd = len([f for f in os.listdir(letra_dir) if f.endswith('.npy')]) \
          if os.path.exists(letra_dir) else 0
    if qtd >= SAMPLES_PER_LETTER:
        status = "✅ COMPLETO"
    elif qtd > 0:
        status = f"⚠️  {qtd}/{SAMPLES_PER_LETTER}"
    else:
        status = "❌ Vazio"
    print(f"  {letra:<10} {status}")

print(f"\n  Execute treinar_dinamico.py em seguida.")
print("=" * 60)