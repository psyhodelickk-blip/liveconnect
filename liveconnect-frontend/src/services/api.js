const API_URL = 'http://localhost:4000/api';

// Registracija korisnika
export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Greška pri registraciji');
  }
  return response.json();
}

// Login korisnika
export async function loginUser(credentials) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Greška pri prijavi');
  }
  return response.json();
}

// Dobavljanje poruka između korisnika
export async function getMessages(conversationWithUserId) {
  const response = await fetch(`${API_URL}/messages/${conversationWithUserId}`, {
    method: 'GET',
  });
  if (!response.ok) {
    throw new Error('Greška pri učitavanju poruka');
  }
  return response.json();
}

// Slanje poruke
export async function sendMessage(messageData) {
  const response = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Greška pri slanju poruke');
  }
  return response.json();
}
