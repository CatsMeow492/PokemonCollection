import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import '../styles/ChatBubble.scss';
import { queryOpenAI } from '../utils/openAiUtils';

const ChatBubble = ({ onSendMessage, collectionData }) => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'ai', content: 'Welcome back!' },
    { type: 'ai', content: 'What can I help you with today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userInput.trim()) {
      // Add user message to the chat
      setMessages(prevMessages => [...prevMessages, { type: 'user', content: userInput }]);
      
      // Call the onSendMessage prop (if needed for parent component)
      onSendMessage(userInput);

      // Clear the input field
      setUserInput('');

      // Show loading message
      setIsLoading(true);
      setMessages(prevMessages => [...prevMessages, { type: 'ai', content: 'loading' }]);

      try {
        // Prepare the prompt with collection data
        const collectionSummary = `
          Total Cost: $${collectionData.totalCost.toFixed(2)}
          Market Price: $${collectionData.marketPrice.toFixed(2)}
          Total Profit: $${collectionData.totalProfit.toFixed(2)}
          Average Card Price: $${collectionData.averageCardPrice.toFixed(2)}
          Top 5 Expensive Cards: ${collectionData.top5ExpensiveCards.map(card => `${card.name} - $${card.marketPrice.toFixed(2)}`).join(', ')}
          Top 5 Profitable Cards: ${collectionData.top5ProfitableCards.map(card => `${card.name} - $${card.marketPrice.toFixed(2)}`).join(', ')}
        `;

        const prompt = `
          User Message: ${userInput}
          Collection Summary: ${collectionSummary}
        `;

        // Query OpenAI
        const aiResponse = await queryOpenAI(prompt);
        
        // Replace loading message with AI response
        setMessages(prevMessages => prevMessages.map((msg, index) => 
          index === prevMessages.length - 1 ? { type: 'ai', content: aiResponse } : msg
        ));

      } catch (error) {
        console.error('Error querying OpenAI:', error);
        setMessages(prevMessages => prevMessages.map((msg, index) => 
          index === prevMessages.length - 1 ? { type: 'ai', content: 'Sorry, I encountered an error. Please try again.' } : msg
        ));
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderMessageContent = (message) => {
    if (message.content === 'loading') {
      return (
        <div className="loading-indicator">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      );
    }
    return <ReactMarkdown>{message.content}</ReactMarkdown>;
  };

  return (
    <div className="chat-bubble">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-content">
              {renderMessageContent(message)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
};

export default ChatBubble;
