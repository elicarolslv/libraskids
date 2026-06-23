import cv2
import pandas as pd
import os
from cvzone.HandTrackingModule import HandDetector

# Caminho para a pasta que está FORA do backend
PATH_DATASET = '../../dataset' 

if not os.path.exists(PATH_DATASET):
    os.makedirs(PATH_DATASET)

labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'L', 'M', 
          'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Y']

cap = cv2.VideoCapture(0)
detector = HandDetector(maxHands=1)
all_data = []

for letra in labels:
    print(f"Prepare a letra: {letra}. Segure ESPAÇO para capturar.")
    count = 0
    while count < 100:
        success, img = cap.read()
        hands, img = detector.findHands(img)
        cv2.imshow("Coleta de Dados", img)
        
        if cv2.waitKey(1) & 0xFF == ord(' '):
            if hands:
                hand = hands[0]
                lmList = hand["lmList"]
                x, y, w, h = hand['bbox']
                
                # Mesma lógica de normalização dos seus arquivos originais
                points = []
                z_coords = [m[2] for m in lmList]
                min_z, max_z = min(z_coords), max(z_coords)
                
                for lx, ly, lz in lmList:
                    points.append((lx - x) / w)
                    points.append((ly - y) / h)
                    points.append((lz - min_z) / (max_z - min_z) if (max_z-min_z) != 0 else 0)
                
                all_data.append(points + [letra])
                count += 1
                print(f"{letra}: {count}/100", end='\r')

print("\nSalvando...")
pd.DataFrame(all_data).to_csv(f'{PATH_DATASET}/libras_data.csv', index=False)
cap.release()
cv2.destroyAllWindows()