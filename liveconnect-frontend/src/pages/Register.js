import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Provera da li su polja popunjena
    if (!username.trim() || !password.trim()) {
      setError('Sva polja su obavezna');
      return;
    }

    try {
      // Poziv funkcije iz api.js koja šalje POST zahtev backendu
      const response = await registerUser(username, password);

      if (response.success) {
        alert('Uspešno registrovan!');
        navigate('/login'); // Preusmeravanje na login stranu
      } else {
        setError(response.message || 'Greška pri registraciji');
      }
    } catch (err) {
      console.error(err);
      setError('Greška pri registraciji, pokušajte ponovo.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', paddingTop: 50 }}>
      <h2>Registracija</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Korisničko ime"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: 10, marginBottom: 10, fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="Šifra"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: 10, marginBottom: 10, fontSize: 16 }}
        />
        <button type="submit" style={{ padding: 10, width: '100%', fontSize: 16 }}>
          Registruj se
        </button>
      </form>
      {error && (
        <p style={{ color: 'red', marginTop: 15 }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Register;
