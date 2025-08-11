import React, { useState } from 'react';

const MessageInput = ({ onSend }) => {
  const [receiverId, setReceiverId] = useState('');
  const [content, setContent] = useState('');
  const [nsfw, setNsfw] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!receiverId || !content) return;
    onSend(Number(receiverId), content, nsfw);
    setContent('');
    setReceiverId('');
    setNsfw(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '10px' }}>
      <input
        type="number"
        placeholder="ID primaoca"
        value={receiverId}
        onChange={(e) => setReceiverId(e.target.value)}
        required
      /> <br />
      <textarea
        placeholder="Poruka"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      /> <br />
      <label>
        <input
          type="checkbox"
          checked={nsfw}
          onChange={() => setNsfw(!nsfw)}
        /> NSFW
      </label><br />
      <button type="submit">Pošalji poruku</button>
    </form>
  );
};

export default MessageInput;
