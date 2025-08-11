import React from 'react';

const MessageList = ({ messages }) => {
  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
      {messages.length === 0 && <p>Nema poruka</p>}
      {messages.map((msg) => (
        <div key={msg.id} style={{ marginBottom: '10px' }}>
          <b>{msg.senderUsername}</b> <i>({new Date(msg.createdAt).toLocaleString()})</i>:<br />
          {msg.nsfw ? <span style={{ color: 'red' }}>[NSFW]</span> : null}
          <span>{msg.content}</span>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
