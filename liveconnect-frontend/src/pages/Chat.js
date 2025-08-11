import React, { useEffect, useState } from 'react';
import { getMessages, sendMessage } from '../services/api';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  const fetchMessages = async () => {
    try {
      const data = await getMessages();
      if (data.success === false) {
        setError(data.message || 'Greška pri učitavanju poruka');
      } else {
        setMessages(data);
      }
    } catch {
      setError('Greška pri učitavanju poruka');
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async (receiverId, content, nsfw) => {
    setError('');
    try {
      const res = await sendMessage(receiverId, content, nsfw);
      if (res.success) {
        fetchMessages();
      } else {
        setError(res.message || 'Greška pri slanju poruke');
      }
    } catch {
      setError('Greška pri slanju poruke');
    }
  };

  return (
    <div>
      <h2>LiveConnect Chat</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <MessageList messages={messages} />
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
};

export default Chat;
