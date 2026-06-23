import pandas as pd
import joblib
import os
from sklearn.neighbors import KNeighborsClassifier

# Caminhos automáticos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(os.path.dirname(BASE_DIR), 'dataset', 'libras_data.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'knn_model.joblib')

if not os.path.exists(DATASET_PATH):
    print(f"❌ ERRO: Arquivo {DATASET_PATH} não encontrado. Rode o unificar.py primeiro.")
    exit()

print(f"Lendo dados de: {DATASET_PATH}")
df = pd.read_csv(DATASET_PATH)

# X = Coordenadas (todas as colunas menos a última)
# y = Letra (última coluna)
X = df.iloc[:, :-1].values
y = df.iloc[:, -1].values

# CONFIGURAÇÃO DE ALTA PRECISÃO:
# n_neighbors=3: Mais ágil para datasets densos
# weights='distance': Dá mais valor aos exemplos mais parecidos com a mão atual
model = KNeighborsClassifier(n_neighbors=3, weights='distance')

print("Treinando o modelo de IA...")
model.fit(X, y)

# Garante que a pasta models existe
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

joblib.dump(model, MODEL_PATH)
print(f"✅ Modelo otimizado salvo em: {MODEL_PATH}")