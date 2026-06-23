"""
coletar_modulos.py
-------------------
Coleta sequências de landmarks para os módulos de Saudações e Emoções.
Inclui classe REPOUSO para melhorar precisão.

USO:
    python coletar_modulos.py --modulo saudacoes
    python coletar_modulos.py --modulo emocoes

CONTROLES:
    ESPAÇO  → Grava uma amostra (mantenha o sinal durante os 30 frames)
    ESC     → Pula para o próximo sinal
    Q       → Encerra a coleta
"""

import cv2
import numpy as np
import mediapipe as mp
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
            'REPOUSO',       # 🖐️ Mão parada (nenhum sinal)
        ],
        'amostras_meta': 150,
    },
    'emocoes': {
        'sinais': [
            'FELIZ',
            'TRISTE',
            'RAIVA',
            'MEDO',
            'SURPRESO',
            'CANSADO',
            'REPOUSO',       # 🖐️ Mão parada (nenhum sinal)
        ],
        'amostras_meta': 150,
    },
}

SEQUENCE_LENGTH = 30

# ─── CAMINHOS ─────────────────────────────────────────────────────────────────
BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')

# ─── VARIAÇÕES ────────────────────────────────────────────────────────────────
VARIACOES = [
    ("NORMAL",       (200, 200, 200), "Gesto normal, velocidade media"),
    ("RAPIDO",       (0,   200, 255), "Faca o gesto RAPIDO"),
    ("DEVAGAR",      (255, 200, 0),   "Faca o gesto BEM DEVAGAR"),
    ("MAO LONGE",    (0,   255, 150), "Afaste a mao da camera"),
    ("MAO PERTO",    (255, 100, 100), "Aproxime a mao da camera"),
    ("MAO ESQUERDA", (200, 100, 255), "Desloque a mao para a ESQUERDA"),
    ("MAO DIREITA",  (100, 200, 255), "Desloque a mao para a DIREITA"),
    ("MAO ALTA",     (255, 180, 0),   "Levante a mao (posicao ALTA)"),
    ("MAO BAIXA",    (100, 255, 200), "Abaixe a mao (posicao BAIXA)"),
    ("ANGULO",       (255, 150, 200), "Incline levemente o pulso"),
]

# Para REPOUSO, usamos variações diferentes (mão parada em posições variadas)
VARIACOES_REPOUSO = [
    ("REPOUSO-NORMAL",    (200, 200, 200), "Mao parada e aberta"),
    ("REPOUSO-FECHADA",   (180, 180, 220), "Mao fechada parada"),
    ("REPOUSO-ALTA",      (255, 180, 0),   "Mao parada no alto"),
    ("REPOUSO-BAIXA",     (100, 255, 200), "Mao parada embaixo"),
    ("REPOUSO-ESQUERDA",  (200, 100, 255), "Mao parada a esquerda"),
    ("REPOUSO-DIREITA",   (100, 200, 255), "Mao parada a direita"),
    ("REPOUSO-LONGE",     (0,   255, 150), "Mao parada longe"),
    ("REPOUSO-PERTO",     (255, 100, 100), "Mao parada perto"),
    ("REPOUSO-LATERAL",   (150, 200, 180), "Mao na lateral do corpo"),
    ("REPOUSO-ABERTA",    (220, 220, 200), "Mao bem aberta e parada"),
]

# ─── DETECÇÃO DE API DO MEDIAPIPE ─────────────────────────────────────────────
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
        running_mode=RunningMode.IMAGE,
        num_hands=1,
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
        return lmList, [min(xs), min(ys), max(max(xs)-min(xs), 1), max(max(ys)-min(ys), 1)]

    def draw_landmarks(display, frame_rgb):
        h, w   = frame_rgb.shape[:2]
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        result = _landmarker.detect(mp_img)
        if result.hand_landmarks:
            for lm in result.hand_landmarks:
                for p in lm:
                    cv2.circle(display, (int(p.x*w), int(p.y*h)), 4, (0, 255, 0), -1)
        return display

    def close():
        _landmarker.close()

else:
    _mp_hands = mp.solutions.hands
    _mp_draw  = mp.solutions.drawing_utils
    _detector = _mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.7,
    )

    def get_landmarks(frame_rgb):
        h, w   = frame_rgb.shape[:2]
        result = _detector.process(frame_rgb)
        if not result.multi_hand_landmarks:
            return None, None
        lm     = result.multi_hand_landmarks[0]
        lmList = [[int(p.x*w), int(p.y*h), p.z*w] for p in lm.landmark]
        xs, ys = [p[0] for p in lmList], [p[1] for p in lmList]
        return lmList, [min(xs), min(ys), max(max(xs)-min(xs), 1), max(max(ys)-min(ys), 1)]

    def draw_landmarks(display, frame_rgb):
        result = _detector.process(frame_rgb)
        if result.multi_hand_landmarks:
            for lm in result.multi_hand_landmarks:
                _mp_draw.draw_landmarks(display, lm, _mp_hands.HAND_CONNECTIONS)
        return display

    def close():
        _detector.close()


# ─── NORMALIZAÇÃO ─────────────────────────────────────────────────────────────
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


# ─── UI ───────────────────────────────────────────────────────────────────────
def draw_ui(display, sinal, count, total, var_nome, var_cor, var_dica, recording, seq_len, mao_ok, modulo):
    h_img, w_img = display.shape[:2]

    overlay = display.copy()
    cv2.rectangle(overlay, (0, 0), (w_img, 130), (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.6, display, 0.4, 0, display)

    # Destacar REPOUSO com cor diferente
    if sinal == 'REPOUSO':
        cv2.putText(display, f"[{modulo.upper()}] 🖐️  REPOUSO (mao parada)", (15, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (100, 255, 200), 2)
    else:
        cv2.putText(display, f"[{modulo.upper()}] Sinal: {sinal}", (15, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
    
    cv2.putText(display, f"{count}/{total} amostras", (15, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (180, 180, 180), 1)

    barra_w    = w_img - 30
    preenchido = int(barra_w * count / total)
    cv2.rectangle(display, (15, 80), (15 + barra_w, 90), (60, 60, 60), -1)
    cv2.rectangle(display, (15, 80), (15 + preenchido, 90), (80, 200, 120), -1)

    cv2.putText(display, f">> {var_nome}: {var_dica}", (15, 118),
                cv2.FONT_HERSHEY_SIMPLEX, 0.52, var_cor, 1)

    if recording:
        status = f"GRAVANDO... {seq_len}/{SEQUENCE_LENGTH} frames"
        color  = (0, 80, 255)
        cv2.circle(display, (w_img - 30, 30), 12, (0, 0, 255), -1)
    elif not mao_ok:
        status = "Sem mao detectada — posicione a mao"
        color  = (0, 140, 255)
    else:
        status = "ESPACO=gravar  ESC=proximo sinal  Q=sair"
        color  = (0, 220, 100)

    overlay2 = display.copy()
    cv2.rectangle(overlay2, (0, h_img - 45), (w_img, h_img), (20, 20, 20), -1)
    cv2.addWeighted(overlay2, 0.6, display, 0.4, 0, display)
    cv2.putText(display, status, (15, h_img - 15),
                cv2.FONT_HERSHEY_SIMPLEX, 0.58, color, 2)

    return display


# ─── COLETA DE UMA SEQUÊNCIA ─────────────────────────────────────────────────
def collect_sequence(sinal, cap, count, total, modulo_nome):
    sequence  = []
    recording = False

    # 🆕 Usa variações diferentes para REPOUSO
    if sinal == 'REPOUSO':
        variacoes = VARIACOES_REPOUSO
    else:
        variacoes = VARIACOES

    variacao_idx = count % len(variacoes)
    var_nome, var_cor, var_dica = variacoes[variacao_idx]

    if count % len(variacoes) == 0:
        print(f"\n   --- Nova rodada de variacoes ---")
    print(f"   [{count+1}/{total}] {var_nome}: {var_dica}")

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

        display = draw_ui(display, sinal, count, total,
                          var_nome, var_cor, var_dica,
                          recording, len(sequence), lmList is not None, modulo_nome)

        cv2.imshow(f"LibrasKids - Coleta [{modulo_nome}]", display)

        key = cv2.waitKey(1) & 0xFF

        if key == ord('q'):
            return None, True

        if key == 27:  # ESC
            return None, False

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
                    return sequence, False
            else:
                print("  Mao perdida. Tente novamente.")
                recording = False
                sequence  = []

    return None, False


# ─── SALVA AMOSTRA ────────────────────────────────────────────────────────────
def save_sample(modulo_nome, sinal, sequence, count):
    sinal_dir = os.path.join(BASE_DIR, 'Dados_Libras', modulo_nome, sinal)
    os.makedirs(sinal_dir, exist_ok=True)
    path = os.path.join(sinal_dir, f"{sinal}_{count:03d}.npy")
    np.save(path, np.array(sequence, dtype=np.float32))
    return path


# ─── LOOP PRINCIPAL ──────────────────────────────────────────────────────────
def coletar(modulo_nome):
    config        = MODULOS[modulo_nome]
    sinais        = config['sinais']
    amostras_meta = config['amostras_meta']

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Camera nao encontrada.")
        return

    api = "Nova (Tasks)" if USE_NEW_API else "Antiga (solutions)"
    print("=" * 60)
    print(f"  COLETA — MÓDULO: {modulo_nome.upper()}")
    print(f"  MediaPipe API:   {api}")
    print("=" * 60)
    print(f"  Sinais ({len(sinais)}): {', '.join(sinais)}")
    print(f"  Meta:   {amostras_meta} amostras por sinal")
    print(f"  Frames: {SEQUENCE_LENGTH} por amostra")
    print(f"  🖐️  REPOUSO: mao parada, sem fazer sinal")
    print("  ESPACO=gravar | ESC=pular sinal | Q=sair\n")

    encerrar = False

    for idx, sinal in enumerate(sinais):
        if encerrar:
            break

        sinal_dir = os.path.join(BASE_DIR, 'Dados_Libras', modulo_nome, sinal)
        existing  = len([f for f in os.listdir(sinal_dir) if f.endswith('.npy')]) \
                    if os.path.exists(sinal_dir) else 0
        count = existing

        if sinal == 'REPOUSO':
            print(f"\n{'='*55}")
            print(f"   🖐️  REPOUSO {idx+1}/{len(sinais)}  ({existing}/{amostras_meta} já coletadas)")
            print(f"   ⚠️  IMPORTANTE: Mao PARADA, sem movimento!")
            print(f"{'='*55}")
        else:
            print(f"\n{'='*55}")
            print(f"   SINAL {idx+1}/{len(sinais)}: {sinal}  ({existing}/{amostras_meta} já coletadas)")
            print(f"{'='*55}")

        if existing >= amostras_meta:
            print("  ✅ Completo, pulando...")
            continue

        while count < amostras_meta:
            seq, encerrar = collect_sequence(sinal, cap, count, amostras_meta, modulo_nome)

            if encerrar:
                break

            if seq is not None:
                path = save_sample(modulo_nome, sinal, seq, count + 1)
                count += 1
                print(f"  ✅ Salvo ({count}/{amostras_meta}): {os.path.basename(path)}")
            else:
                print(f"  ⏭️  Sinal '{sinal}' pulado com {count} amostras.")
                break

        print(f"\n  📊 {sinal}: {count} amostras coletadas.")

    cap.release()
    cv2.destroyAllWindows()
    close()

    print("\n" + "=" * 60)
    print(f"  📋 RESUMO FINAL — {modulo_nome.upper()}")
    print("=" * 60)
    
    total_coletado = 0
    total_meta = len(sinais) * amostras_meta
    
    for sinal in sinais:
        sinal_dir = os.path.join(BASE_DIR, 'Dados_Libras', modulo_nome, sinal)
        qtd = len([f for f in os.listdir(sinal_dir) if f.endswith('.npy')]) \
              if os.path.exists(sinal_dir) else 0
        total_coletado += qtd
        
        if qtd >= amostras_meta:
            status = "✅ COMPLETO"
        elif qtd > 0:
            status = f"⚠️  {qtd}/{amostras_meta}"
        else:
            status = "❌ Vazio"
            
        print(f"  {sinal:<15} {status}")
    
    print(f"\n  📈 Progresso total: {total_coletado}/{total_meta} amostras ({total_coletado/total_meta*100:.1f}%)")
    print(f"  🚀 Próximo passo: python treinar_modulos.py --modulo {modulo_nome}")
    print("=" * 60)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Coletor de landmarks para módulos LibrasKids (com REPOUSO)',
        epilog='Exemplo: python coletar_modulos.py --modulo saudacoes'
    )
    parser.add_argument('--modulo', 
                        choices=list(MODULOS.keys()), 
                        required=True,
                        help='Módulo a ser coletado: saudacoes | emocoes')
    args = parser.parse_args()
    coletar(args.modulo)