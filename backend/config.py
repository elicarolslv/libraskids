import os

# ─── INSTRUÇÕES DE USO ────────────────────────────────────────────────────────
# Para MySQL (XAMPP/phpMyAdmin):
#   Defina a variável de ambiente DATABASE_URL ou edite DB_* abaixo.
#   Instale: pip install pymysql cryptography
#
# Para PostgreSQL (pgAdmin):
#   Troque DB_DRIVER para 'postgresql+psycopg2'
#   Instale: pip install psycopg2-binary
# ─────────────────────────────────────────────────────────────────────────────

# Configurações do banco — edite aqui ou use variáveis de ambiente
DB_DRIVER   = os.environ.get('DB_DRIVER',   'mysql+pymysql')   # ou 'postgresql+psycopg2'
DB_USER     = os.environ.get('DB_USER',     'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')                 # senha do XAMPP (geralmente vazia)
DB_HOST     = os.environ.get('DB_HOST',     'localhost')
DB_PORT     = os.environ.get('DB_PORT',     '3306')             # MySQL=3306 | PostgreSQL=5432
DB_NAME     = os.environ.get('DB_NAME',     'libraskids')

# Monta a URI automaticamente (ou sobrescreve com DATABASE_URL direto)
_default_uri = f"{DB_DRIVER}://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

class Config:
    SECRET_KEY              = os.environ.get('SECRET_KEY')    or 'chave-super-secreta-mude-em-producao'
    JWT_SECRET_KEY          = os.environ.get('JWT_SECRET_KEY') or 'jwt-chave-secreta'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')  or _default_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT expira em 8 horas
    from datetime import timedelta
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)