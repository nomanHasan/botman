import React, { useState, useEffect } from 'react';
import { botApi, twoStepsApi } from '../services';
import './TwoStepsChat.css';

const TwoStepsChat = () => {
  return (
    <div className="two-steps-chat-container">
      <div className="chat-header">
        <h2>2Steps Chat</h2>
      </div>
      
      <div className="chat-wrapper">
        <TwoStepsChatInterface />
      </div>
    </div>
  );
};

// TwoStepsChat interface component
const TwoStepsChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [clientName, setClientName] = useState('designcheck');
  const [isLoading, setIsLoading] = useState(false);
  // Track SQL results per message using messageId as key
  const [messageResults, setMessageResults] = useState({});
  const chatContainerRef = React.useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, messageResults]);

  useEffect(() => {
    // Welcome message when component mounts
    const welcomeMessageId = `msg_welcome_${Date.now()}`;
    setMessages([{ 
      id: welcomeMessageId,
      role: 'assistant', 
      content: 'Welcome to 2Steps Chat. How can I help you today?' 
    }]);
  }, []);

  const handleSendMessage = React.useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessageContent = userInput.trim();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage = { id: messageId, role: 'user', content: userMessageContent };
    const currentMessages = [...messages, newMessage];

    setMessages(currentMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      // Use the twoStepsChat API directly instead of the chat function
      const response = await twoStepsApi.twoStepsChat(userMessageContent, clientName);
      
      let assistantContent = '';

      console.log(response)
      
      // Process the response based on status
      if (response.status === 'OK') {
        // If we have SQL and results, format a message with them
        if (response.sql) {
          assistantContent = `${response.message || 'I found this information for you:'}\n\n\`\`\`sql\n${response.sql}\n\`\`\``;
        } else {
          assistantContent = response.message || 'I processed your request, but no SQL query was generated.';
        }
        
        // Add table information if available
        if (response.tableList && response.tableList.length > 0) {
          assistantContent += `\n\nRelevant tables: ${response.tableList.join(', ')}`;
        }
      } else {
        // Handle error or other statuses
        assistantContent = response.message || `Status: ${response.status}. ${response.error || 'No additional information available.'}`;
      }
      
      const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const assistantMessage = { id: assistantMessageId, role: 'assistant', content: assistantContent };
      
      // If we have SQL and results, automatically store them for this message
      if (response.status === 'OK' && response.sql && response.result) {
        setMessageResults(prev => ({
          ...prev,
          [assistantMessageId]: { 
            results: response.result, 
            sql: response.sql 
          }
        }));
      }
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const errorMessage = { 
        id: errorMessageId, 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, messages, isLoading, clientName]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => console.log('Text copied to clipboard'))
      .catch(err => console.error('Failed to copy text: ', err));
  };

  const executeSQL = React.useCallback(async (sql, messageId) => {
    if (!clientName.trim()) {
        alert("Please enter a client name before executing SQL.");
        return;
    }
    console.log(`Executing SQL for client: ${clientName}, messageId: ${messageId}`);
    setIsLoading(true);

    try {
      const data = await botApi.executeSql(sql, clientName);
      
      if (data.error) {
        console.error('SQL execution error:', data.message);
        setMessageResults(prev => ({
          ...prev,
          [messageId]: { error: data.message || 'Error executing SQL', sql }
        }));
      } else {
        console.log('Execution result:', data);
        setMessageResults(prev => ({
          ...prev, 
          [messageId]: { results: data, sql }
        }));
      }
    } catch (error) {
      console.error('Error executing SQL:', error);
      setMessageResults(prev => ({
        ...prev,
        [messageId]: { error: `Failed to execute SQL query: ${error.message || 'Unknown error'}`, sql }
      }));
    } finally {
      setIsLoading(false);
    }
  }, [clientName]);

  const renderMessageSqlResults = (messageId) => {
    const result = messageResults[messageId];
    if (!result) return null;

    return (
      <div className="message-sql-results">
        <div className="results-header">
          <h4>SQL Execution Result using {clientName}</h4>
          <button className="close-btn" onClick={() => {
            setMessageResults(prev => {
              const newResults = { ...prev };
              delete newResults[messageId];
              return newResults;
            });
          }}>Close</button>
        </div>
        {result.error ? (
          <div className="error-message">Error: {result.error}</div>
        ) : (!result.results || !Array.isArray(result.results) || result.results.length === 0) ? (
          <>
            <p>Query executed successfully. No results returned or empty result set.</p>
            <pre className="executed-sql-display">{result.sql}</pre>
          </>
        ) : (
          <>
            <p><strong>Result ({result.results.length} rows):</strong></p>
            <div className="table-wrapper">
              <table className="result-table">
                <thead>
                  <tr>
                    {Object.keys(result.results[0]).map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((row, rowIndex) => (
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

  const renderMessageContent = (content, role, messageId) => {
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
              onClick={() => executeSQL(code, messageId)}
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



  return (
    <div className="chat-modal-fullscreen">
      <div className="chat-modal-header">
        <h2>2Steps Chat</h2>
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
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong>
            <div className="message-content-wrapper">
              {renderMessageContent(message.content, message.role, message.id || index)}
              {message.role === 'assistant' && messageResults[message.id || index] && renderMessageSqlResults(message.id || index)}
            </div>
          </div>
        ))}
        {isLoading && <div className="message assistant-message"><strong>Assistant:</strong> Thinking...</div>}
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
  );
};

export default TwoStepsChat;
