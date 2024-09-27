import React from 'react';
import '../styles/ChatBubble.scss';

const ChatBubble = () => {
  return (
    <div className="chat-thread">
      {/* Message 1 */}
      <div className="message">
        <div className="avatar"></div>
        <div className="message-content">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Welcome back!</p>
        </div>
      </div>

      {/* Message 2 */}
      <div className="message">
        <div className="avatar"></div>
        <div className="message-content">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>What can I help you with today?</p>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
