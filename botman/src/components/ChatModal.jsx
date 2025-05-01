import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { botApi } from '../services';
import './ChatModal.css';

function ChatModal({ bot, onClose }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [clientName, setClientName] = useState('designcheck');
  const [isLoading, setIsLoading] = useState(false);
  const [sqlResults, setSqlResults] = useState(null);
  const [executedSql, setExecutedSql] = useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, sqlResults]);

  useEffect(() => {
    if (bot) {
      setMessages([{ role: 'assistant', content: `Chatting with ${bot.id}. How can I help?` }]);
    }
  }, [bot]);

  const handleSendMessage = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || !bot?.id || isLoading) return;

    const userMessageContent = userInput.trim();
    const newMessage = { role: 'user', content: userMessageContent };
    const currentMessages = [...messages, newMessage];

    setMessages(currentMessages);
    setUserInput('');
    setIsLoading(true);
    setSqlResults(null);

    try {
      const history = currentMessages.map(msg => ({ role: msg.role, content: msg.content }));
      const response = await botApi.chatWithBot(bot.id, history);
      const assistantMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant', content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, bot, messages, isLoading]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => console.log('SQL copied to clipboard'))
      .catch(err => console.error('Failed to copy text: ', err));
  };

  const executeSQL = useCallback(async (sql) => {
    if (!clientName.trim()) {
        alert("Please enter a client name before executing SQL.");
        return;
    }
    console.log(`Executing SQL for client: ${clientName}`);
    setIsLoading(true);
    setSqlResults(null);
    setExecutedSql(sql);

    try {
      const data = await botApi.executeSql(sql, clientName);

      if (data.error) {
        console.error('SQL execution error:', data.message);
        setSqlResults({ error: data.message || 'Error executing SQL' });
      } else {
        console.log('Execution result:', data);
        setSqlResults(data);
      }
    } catch (error) {
      console.error('Error executing SQL:', error);
      setSqlResults({ error: `Failed to execute SQL query: ${error.message || 'Unknown error'}` });
    } finally {
      setIsLoading(false);
    }
  }, [clientName]);

  const renderResultsTable = () => {
    if (!sqlResults) return null;

    return (
      <div className="results-container">
        <div className="results-header">
          <h3>SQL Execution Result</h3>
          <button className="close-btn" onClick={() => setSqlResults(null)}>Close</button>
        </div>
        {sqlResults.error ? (
          <div style={{ color: 'red' }}>Error: {sqlResults.error}</div>
        ) : (!sqlResults || !Array.isArray(sqlResults) || sqlResults.length === 0) ? (
          <>
            <p>Query executed successfully. No results returned or empty result set.</p>
            <pre className="executed-sql-display">{executedSql}</pre>
          </>
        ) : (
          <>
            <p><strong>Result ({sqlResults.length} rows):</strong></p>
            <div className="table-wrapper">
              <table className="result-table">
                <thead>
                  <tr>
                    {Object.keys(sqlResults[0]).map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sqlResults.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(row).map((column) => (
                        <td key={`${rowIndex}-${column}`}>
                          {typeof row[column] === 'object'
                            ? JSON.stringify(row[column])
                            : row[column] === null
                              ? 'NULL'
                              : String(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMessageContent = (content, role) => {
    if (role !== 'assistant' || typeof content !== 'string') {
      if (role === 'user') {
        return <span className="copyable-user-message" title="Click to copy" onClick={() => copyToClipboard(content)}>{content}</span>;
      }
      return content;
    }

    const codeRegex = /```(sql)?\s*([\s\S]*?)```/g;
    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const isSql = match[1] === 'sql';
      const code = match[2].trim();

      parts.push(
        <div
          className={isSql ? "sql-box" : "code-box"}
          key={`code-${match.index}`}
        >
          {isSql && (
            <button
              className="exec-btn"
              onClick={() => executeSQL(code)}
              disabled={isLoading}
              title="Execute SQL"
            >
              Execute
            </button>
          )}
          <button
            className="copy-btn"
            onClick={() => copyToClipboard(code)}
            title="Copy Code"
          >
            Copy
          </button>
          <pre><code>{code}</code></pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  if (!bot) return null;

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-modal-header">
          <h2>Chat with {bot.name}</h2>
           <div className="client-input-container">
             <label htmlFor="clientName">Client:</label>
             <input
               id="clientName"
               type="text"
               value={clientName}
               onChange={(e) => setClientName(e.target.value)}
               placeholder="Enter client name"
               disabled={isLoading}
             />
           </div>
          <button onClick={onClose} className="close-modal-btn" title="Close Chat">&times;</button>
        </div>

        <div className="chat-container" ref={chatContainerRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong>
              <div className="message-content-wrapper">
                {renderMessageContent(message.content, message.role)}
              </div>
            </div>
          ))}
          {isLoading && <div className="message assistant-message"><strong>Assistant:</strong> Thinking...</div>}
          {renderResultsTable()}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={isLoading}
            rows={3}
          />
          <button
            type="submit"
            disabled={!userInput.trim() || isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

ChatModal.propTypes = {
  bot: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onClose: PropTypes.func.isRequired,
};

export default ChatModal;

