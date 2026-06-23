from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime
import secrets
import string

db = SQLAlchemy()
bcrypt = Bcrypt()


def _gerar_codigo(tamanho=6):
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(tamanho))


# ─── PROFESSOR ────────────────────────────────────────────────────────────────

class Professor(db.Model):
    __tablename__ = 'professores'

    id         = db.Column(db.Integer, primary_key=True)
    nome       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(100), unique=True, nullable=False)
    senha_hash = db.Column(db.String(256), nullable=False)
    escola     = db.Column(db.String(150), nullable=True)

    turmas = db.relationship('Turma', backref='professor', lazy=True, cascade='all, delete-orphan')

    def set_senha(self, senha):
        self.senha_hash = bcrypt.generate_password_hash(senha).decode('utf-8')

    def check_senha(self, senha):
        return bcrypt.check_password_hash(self.senha_hash, senha)

    def to_dict(self):
        return {'id': self.id, 'nome': self.nome, 'email': self.email, 'escola': self.escola}


# ─── TURMA ────────────────────────────────────────────────────────────────────

class Turma(db.Model):
    __tablename__ = 'turmas'

    id           = db.Column(db.Integer, primary_key=True)
    nome         = db.Column(db.String(100), nullable=False)
    serie        = db.Column(db.String(50),  nullable=True)
    codigo_unico = db.Column(db.String(6),   unique=True, nullable=False)
    professor_id = db.Column(db.Integer, db.ForeignKey('professores.id'), nullable=False)

    alunos = db.relationship('Aluno', backref='turma', lazy=True, cascade='all, delete-orphan')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.codigo_unico:
            self.codigo_unico = self._gerar_codigo_unico()

    @staticmethod
    def _gerar_codigo_unico():
        codigo = _gerar_codigo()
        while Turma.query.filter_by(codigo_unico=codigo).first():
            codigo = _gerar_codigo()
        return codigo

    def to_dict(self):
        return {
            'id': self.id, 'nome': self.nome, 'serie': self.serie,
            'codigo_unico': self.codigo_unico, 'total_alunos': len(self.alunos),
        }


# ─── ALUNO ────────────────────────────────────────────────────────────────────

class Aluno(db.Model):
    __tablename__ = 'alunos'

    id             = db.Column(db.Integer, primary_key=True)
    nome_completo  = db.Column(db.String(150), nullable=False)
    apelido        = db.Column(db.String(60),  nullable=True)
    pin            = db.Column(db.String(4),   nullable=False)
    turma_id       = db.Column(db.Integer, db.ForeignKey('turmas.id'), nullable=False)
    tentativas_pin = db.Column(db.Integer, default=0)
    bloqueado      = db.Column(db.Boolean, default=False)

    xp_record    = db.relationship('AlunoXP',          backref='aluno', uselist=False, cascade='all, delete-orphan')
    progressos   = db.relationship('ProgressoModulo',   backref='aluno', lazy=True,    cascade='all, delete-orphan')
    conquistas   = db.relationship('AlunoConquista',    backref='aluno', lazy=True,    cascade='all, delete-orphan')

    def set_pin(self, pin_raw):
        self.pin = bcrypt.generate_password_hash(str(pin_raw)).decode('utf-8')

    def check_pin(self, pin_raw):
        return bcrypt.check_password_hash(self.pin, str(pin_raw))

    def to_dict(self):
        return {
            'id':            self.id,
            'nome_completo': self.nome_completo,
            'apelido':       self.apelido or self.nome_completo.split()[0],
            'turma_id':      self.turma_id,
            'bloqueado':     self.bloqueado,
        }


# ─── XP / NÍVEL DO ALUNO ──────────────────────────────────────────────────────

class AlunoXP(db.Model):
    __tablename__ = 'aluno_xp'

    aluno_id = db.Column(db.Integer, db.ForeignKey('alunos.id'), primary_key=True)
    xp       = db.Column(db.Integer, nullable=False, default=0)
    xp_total = db.Column(db.Integer, nullable=False, default=0)
    nivel    = db.Column(db.Integer, nullable=False, default=1)

    XP_POR_NIVEL = 100   # Atualizado para 100 XP por nível

    def adicionar_xp(self, quantidade):
        """Adiciona XP total. O banco de dados ajusta xp da barra e nivel via trigger."""
        self.xp_total += quantidade
        return True 

    def to_dict(self):
        return {
            'xp':              self.xp,
            'xp_total':        self.xp_total,
            'nivel':           self.nivel,
            'xp_proximo_nivel': self.XP_POR_NIVEL,
        }


# ─── PROGRESSO POR MÓDULO ─────────────────────────────────────────────────────

MODULOS_CONFIG = {
    'alfabeto':  {'titulo': 'Alfabeto',  'emoji': '🔤', 'total': 26, 'disponivel': True},
    'saudacoes': {'titulo': 'Saudações', 'emoji': '👋', 'total': 10, 'disponivel': True},  
    'emocoes':   {'titulo': 'Emoções',   'emoji': '😊', 'total': 6,  'disponivel': True},  
    'cores':     {'titulo': 'Cores',     'emoji': '🌈', 'total': 8,  'disponivel': True},
    'animais':   {'titulo': 'Animais',   'emoji': '🐨', 'total': 10, 'disponivel': True},
    'familia':   {'titulo': 'Família',   'emoji': '👨‍👩‍👧‍👦', 'total': 10, 'disponivel': True},
    'frutas':    {'titulo': 'Frutas',    'emoji': '🍓', 'total': 8,  'disponivel': True},
    'numeros':   {'titulo': 'Números',   'emoji': '🔢', 'total': 10, 'disponivel': True},
}

class ProgressoModulo(db.Model):
    __tablename__ = 'progresso_modulo'

    id             = db.Column(db.Integer, primary_key=True)
    aluno_id       = db.Column(db.Integer, db.ForeignKey('alunos.id'), nullable=False)
    modulo         = db.Column(db.String(30), nullable=False)
    sinais_feitos  = db.Column(db.Integer, nullable=False, default=0)
    total_sinais   = db.Column(db.Integer, nullable=False, default=26)
    atualizado_em  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('aluno_id', 'modulo', name='uq_aluno_modulo'),)

    def to_dict(self):
        config = MODULOS_CONFIG.get(self.modulo, {})
        progresso_pct = round((self.sinais_feitos / self.total_sinais) * 100) if self.total_sinais else 0
        return {
            'modulo':        self.modulo,
            'titulo':        config.get('titulo', self.modulo.capitalize()),
            'emoji':         config.get('emoji', '📚'),
            'sinais_feitos': self.sinais_feitos,
            'total_sinais':  self.total_sinais,
            'progresso_pct': progresso_pct,
            'disponivel':    config.get('disponivel', True),
        }


# ─── CONQUISTAS ───────────────────────────────────────────────────────────────

class Conquista(db.Model):
    __tablename__ = 'conquistas'

    id     = db.Column(db.Integer, primary_key=True)
    chave  = db.Column(db.String(40), unique=True, nullable=False)
    titulo = db.Column(db.String(80), nullable=False)
    emoji  = db.Column(db.String(10), nullable=False, default='🏆')

    def to_dict(self):
        return {'id': self.id, 'chave': self.chave, 'titulo': self.titulo, 'emoji': self.emoji}


class AlunoConquista(db.Model):
    __tablename__ = 'aluno_conquistas'

    id              = db.Column(db.Integer, primary_key=True)
    aluno_id        = db.Column(db.Integer, db.ForeignKey('alunos.id'),     nullable=False)
    conquista_id    = db.Column(db.Integer, db.ForeignKey('conquistas.id'), nullable=False)
    desbloqueada_em = db.Column(db.DateTime, default=datetime.utcnow)

    conquista = db.relationship('Conquista')

    __table_args__ = (db.UniqueConstraint('aluno_id', 'conquista_id', name='uq_aluno_conquista'),)