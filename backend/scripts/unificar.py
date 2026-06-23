import pandas as pd
import os

# Caminhos baseados na sua estrutura: backend/scripts/unificar.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAMINHO_DATASET = os.path.join(os.path.dirname(BASE_DIR), 'dataset')
ARQUIVO_FINAL = os.path.join(CAMINHO_DATASET, 'libras_data.csv')

print(f"--- INICIANDO UNIFICAÇÃO ---")

# Lista de letras que você coletou
labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'L', 'M', 
          'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Y']

dados_combinados = []

for letra in labels:
    arquivo_nome = f"{letra}.csv"
    caminho_completo = os.path.join(CAMINHO_DATASET, arquivo_nome)
    
    if os.path.exists(caminho_completo):
        # Lendo sem cabeçalho pois seus arquivos individuais são apenas números
        df = pd.read_csv(caminho_completo, header=None)
        # Adiciona a coluna da letra
        df['label'] = letra
        dados_combinados.append(df)
        print(f" Letra {letra}: OK ({len(df)} linhas)")

if dados_combinados:
    df_final = pd.concat(dados_combinados, ignore_index=True)
    # Salva com cabeçalho para o treinar.py identificar as colunas
    df_final.to_csv(ARQUIVO_FINAL, index=False)
    print(f"\n--- SUCESSO! ---")
    print(f"Arquivo mestre criado: {ARQUIVO_FINAL}")
else:
    print("\n--- ERRO: Nenhum arquivo .csv encontrado na pasta dataset! ---")