import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('http://127.0.0.1:8000/professor/me')
        .then(res => setProfessor(res.data)) // Aqui já vai puxar { id, nome, email, escola } do to_dict()
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, senha) => {
    const res = await axios.post('http://127.0.0.1:8000/auth/login', { email, senha });
    const { token } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    const userRes = await axios.get('http://127.0.0.1:8000/professor/me');
    setProfessor(userRes.data);
    return res.data;
  };

  // CORREÇÃO: Agora recebe e envia o parâmetro 'escola' no objeto da requisição
  const register = async (nome, email, senha, school) => {
    const res = await axios.post('http://127.0.0.1:8000/auth/register', { 
      nome, 
      email, 
      senha, 
      escola: school 
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setProfessor(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ professor, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};