import React, { useState } from 'react';
import { loginUser } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await loginUser(username, password);
      if (response.token) {
        localStorage.setItem('token', response.token);
        navigate('/chat');
      } else {
        setError(response.message || 'Greška pri prijavi');
      }
    } catch {
      setError('Greška pri prijavi');
    }
  };

  return (
    <div>
      <h2>Prijava</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Korisničko ime"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Šifra"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">Prijavi se</button>
      </form>
      <p>
        Nemaš nalog? <Link to="/register">Registruj se</Link>
      </p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Login;
