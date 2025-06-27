import React, { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import { botApi, twoStepsApi } from '../services';
import { showToast } from '../services/toastService';
import './TwoStepsChat.css';

const TwoStepsChat = () => {
  const [isReloadingSchema, setIsReloadingSchema] = useState(false);

  const handleReloadSchema = async () => {
    setIsReloadingSchema(true);
    try {
      const response = await twoStepsApi.refetchSchema();
      if (response.status === 'OK') {
        showToast('✅ Schema reloaded successfully!');
      } else {
        showToast('❌ Failed to reload schema: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      showToast('❌ Error reloading schema: ' + error.message);
    } finally {
      setIsReloadingSchema(false);
    }
  };

  return (
    <div className="two-steps-chat-container modern-ui">
      {isReloadingSchema && (
        <div className="loading-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div>Reloading schema...</div>
          </div>
        </div>
      )}
      <div className="chat-header modern-header">
        <h2>
          <span className="chat-title">2Steps Chat</span>
        </h2>
        <button
          className="primary-btn reload-btn"
          type="button"
          title="After Database Schema Changes, click to reload the schema for the 2Steps Chat"
          onClick={handleReloadSchema}
          disabled={isReloadingSchema}
          style={{
            backgroundColor: isReloadingSchema ? '#cccccc' : '#4CAF50',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: isReloadingSchema ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          <span className="reload-label">
            {isReloadingSchema ? 'Reloading...' : 'Reload Schema'}
          </span>
        </button>
      </div>

      <div className="chat-wrapper modern-chat-wrapper" style={{
        pointerEvents: isReloadingSchema ? 'none' : 'auto',
        opacity: isReloadingSchema ? 0.6 : 1
      }}>
        <TwoStepsChatInterface isDisabled={isReloadingSchema} />
      </div>
    </div>
  );
};

// TwoStepsChat interface component
const TwoStepsChatInterface = ({ isDisabled = false }) => {
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
      content: 'Welcome to 2Steps Chat. How can I help you today?',
      status: null,
      tokenUsage: null
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
      // Response has a tokenUsage with type export interface TokenUsage { tablePass?: ResponseUsage; sqlPass?: ResponseUsage;total?: ResponseUsage; }

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
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: assistantContent,
        status: response.status, // Store the status for display
        tokenUsage: response.tokenUsage // Store token usage data
      };

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

      // Still Show sql in case of error, but make the execute button disabled
      if (response.status !== 'OK' && response.sql) {
        assistantMessage.content += `\n\n\`\`\`sql\n${response.sql}\n\`\`\``;
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const errorMessage = {
        id: errorMessageId,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
        status: 'ERROR', // Add error status
        tokenUsage: null // No token usage for errors
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
      showToast("Please enter a client name before executing SQL.");
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
              disabled={isLoading || isDisabled}
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

  const renderStatusPill = (status) => {
    if (!status) return null;

    const getStatusColor = (status) => {
      switch (status.toUpperCase()) {
        case 'OK':
          return 'success';
        case 'ERROR':
          return 'error';
        case 'PENDING':
          return 'pending';
        case 'WARNING':
          return 'warning';
        default:
          return 'default';
      }
    };

    return (
      <span className={`status-pill status-${getStatusColor(status)}`}>
        {status}
      </span>
    );
  };

  const renderTokenUsagePill = (tokenUsage) => {
    if (!tokenUsage) return null;
    
    const { tablePass, sqlPass } = tokenUsage;
    
    // Calculate total tokens ourselves from tablePass and sqlPass
    const tablePassTokens = (tablePass?.prompt_tokens || 0) + (tablePass?.completion_tokens || 0);
    const sqlPassTokens = (sqlPass?.prompt_tokens || 0) + (sqlPass?.completion_tokens || 0);
    const totalTokens = tablePassTokens + sqlPassTokens;
    
    if (totalTokens === 0) return null;

    // Cost calculation function with high precision
    const calculateCost = (passData) => {
      if (!passData) return { cached: 0, uncached: 0, output: 0, total: 0 };
      
      const cachedTokens = passData.prompt_tokens_details?.cached_tokens || 0;
      const totalPromptTokens = passData.prompt_tokens || 0;
      const uncachedTokens = totalPromptTokens - cachedTokens;
      const outputTokens = passData.completion_tokens || 0;
      
      // High precision cost calculation (using exact decimal values)
      const cachedCost = (cachedTokens * 0.5) / 1000000;
      const uncachedCost = (uncachedTokens * 2.0) / 1000000;
      const outputCost = (outputTokens * 8.0) / 1000000;
      const totalCost = cachedCost + uncachedCost + outputCost;
      
      return { cached: cachedCost, uncached: uncachedCost, output: outputCost, total: totalCost };
    };

    // Calculate adjusted tokens function - converts all costs to uncached token equivalent
    const calculateAdjustedTokens = (passData) => {
      if (!passData) return 0;
      
      const cachedTokens = passData.prompt_tokens_details?.cached_tokens || 0;
      const totalPromptTokens = passData.prompt_tokens || 0;
      const uncachedTokens = totalPromptTokens - cachedTokens;
      const outputTokens = passData.completion_tokens || 0;
      
      // Convert cached tokens to uncached equivalent based on cost ratio
      // Cached cost = $0.50/1M, Uncached cost = $2.00/1M
      // So 1 cached token = 0.25 uncached tokens in cost terms
      const cachedToUncachedRatio = 0.5 / 2.0; // 0.25
      const adjustedCachedTokens = cachedTokens * cachedToUncachedRatio;
      
      // Convert output tokens to uncached equivalent based on cost ratio
      // Output cost = $8.00/1M, Uncached cost = $2.00/1M
      // So 1 output token = 4 uncached tokens in cost terms
      const outputToUncachedRatio = 8.0 / 2.0; // 4.0
      const adjustedOutputTokens = outputTokens * outputToUncachedRatio;
      
      // Total adjusted tokens (all in uncached token equivalent)
      return adjustedCachedTokens + uncachedTokens + adjustedOutputTokens;
    };

    // Calculate costs for each pass
    const tablePassCost = calculateCost(tablePass);
    const sqlPassCost = calculateCost(sqlPass);
    
    // Calculate adjusted tokens for each pass
    const tablePassAdjustedTokens = calculateAdjustedTokens(tablePass);
    const sqlPassAdjustedTokens = calculateAdjustedTokens(sqlPass);
    const totalAdjustedTokens = tablePassAdjustedTokens + sqlPassAdjustedTokens;
    
    // Calculate overall cost (no separate total cost since we removed total)
    const overallCost = tablePassCost.total + sqlPassCost.total;

    // Format cost for display with high precision
    const formatCost = (cost) => {
      if (cost < 0.000001) return '$0.000000';
      return `$${cost.toFixed(6)}`;
    };

    // Helper to render ellipsis with tooltip
    const renderEllipsisSpan = (str) => (
      <span
        className="ellipsis-span"
        title={str || ''}
        style={{
          display: 'inline-block',
          maxWidth: 220,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          verticalAlign: 'bottom',
          cursor: 'pointer',
        }}
        onClick={() => {
          if (str) {
            navigator.clipboard.writeText(str);
            showToast('Copied to Clipboard');
          }
        }}
      >
        {str || <em>(empty)</em>}
      </span>
    );

    // Generate unique ID for tooltip
    const tooltipId = `token-tooltip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create the detailed tooltip content
    const tooltipContent = (
      <div className="token-tooltip-content">
        <div className="tooltip-section">
          <div className="tooltip-title">Total Usage & Cost</div>
          <div className="tooltip-item">
            <div className="tooltip-row">
              <span>Raw Tokens:</span>
              <span>{totalTokens.toLocaleString()}</span>
            </div>
            <div className="tooltip-row">
              <span>Adjusted Tokens:</span>
              <span>{Math.round(totalAdjustedTokens).toLocaleString()} <small>(cost-equivalent)</small></span>
            </div>
            <div className="tooltip-row tooltip-total">
              <span>Estimated Cost:</span>
              <span className="cost-highlight">{formatCost(overallCost)}</span>
            </div>
          </div>
        </div>
        
        {tablePass && (tablePass.prompt_tokens || tablePass.completion_tokens) && (
          <div className="tooltip-section">
            <div className="tooltip-title">Table Pass Breakdown</div>
            <div className="tooltip-item">
              <div className="tooltip-row">
                <span>Cached Tokens:</span>
                <span>{(tablePass.prompt_tokens_details?.cached_tokens || 0).toLocaleString()} ({formatCost(tablePassCost.cached)})</span>
              </div>
              <div className="tooltip-row">
                <span>Uncached Tokens:</span>
                <span>{((tablePass.prompt_tokens || 0) - (tablePass.prompt_tokens_details?.cached_tokens || 0)).toLocaleString()} ({formatCost(tablePassCost.uncached)})</span>
              </div>
              <div className="tooltip-row">
                <span>Output Tokens:</span>
                <span>{(tablePass.completion_tokens || 0).toLocaleString()} ({formatCost(tablePassCost.output)})</span>
              </div>
              <div className="tooltip-row tooltip-subtotal">
                <span>Subtotal:</span>
                <span>{formatCost(tablePassCost.total)}</span>
              </div>
              {tablePass.input && (
                <div className="tooltip-row">
                  <span>Input String:</span>
                  {renderEllipsisSpan(
                    Array.isArray(tablePass.input)
                      ? tablePass.input.map(m => m.content).join(' | ')
                      : String(tablePass.input)
                  )}
                </div>
              )}
              {tablePass.output && (
                <div className="tooltip-row">
                  <span>Output String:</span>
                  {renderEllipsisSpan(String(tablePass.output))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {sqlPass && (sqlPass.prompt_tokens || sqlPass.completion_tokens) && (
          <div className="tooltip-section">
            <div className="tooltip-title">SQL Pass Breakdown</div>
            <div className="tooltip-item">
              <div className="tooltip-row">
                <span>Cached Tokens:</span>
                <span>{(sqlPass.prompt_tokens_details?.cached_tokens || 0).toLocaleString()} ({formatCost(sqlPassCost.cached)})</span>
              </div>
              <div className="tooltip-row">
                <span>Uncached Tokens:</span>
                <span>{((sqlPass.prompt_tokens || 0) - (sqlPass.prompt_tokens_details?.cached_tokens || 0)).toLocaleString()} ({formatCost(sqlPassCost.uncached)})</span>
              </div>
              <div className="tooltip-row">
                <span>Output Tokens:</span>
                <span>{(sqlPass.completion_tokens || 0).toLocaleString()} ({formatCost(sqlPassCost.output)})</span>
              </div>
              <div className="tooltip-row tooltip-subtotal">
                <span>Subtotal:</span>
                <span>{formatCost(sqlPassCost.total)}</span>
              </div>
              {sqlPass.input && (
                <div className="tooltip-row">
                  <span>Input String:</span>
                  {renderEllipsisSpan(
                    Array.isArray(sqlPass.input)
                      ? sqlPass.input.map(m => m.content).join(' | ')
                      : String(sqlPass.input)
                  )}
                </div>
              )}
              {sqlPass.output && (
                <div className="tooltip-row">
                  <span>Output String:</span>
                  {renderEllipsisSpan(String(sqlPass.output))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="tooltip-section pricing-info">
          <div className="tooltip-title">Pricing</div>
          <div className="tooltip-item">
            <div className="tooltip-row">
              <span>Cached Input:</span>
              <span>$0.50/1M tokens</span>
            </div>
            <div className="tooltip-row">
              <span>Uncached Input:</span>
              <span>$2.00/1M tokens</span>
            </div>
            <div className="tooltip-row">
              <span>Output:</span>
              <span>$8.00/1M tokens</span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <>
        <button
          data-tooltip-id={tooltipId}
          className="token-usage-pill"
        >
          <span className="token-count">~{Math.round(totalAdjustedTokens).toLocaleString()}</span>
          <span className="token-label">TOKEN</span>
          <span className="cost-estimate">~{formatCost(overallCost)}</span>
        </button>
        
        <Tooltip
          id={tooltipId}
          place="bottom"
          content={tooltipContent}
          clickable={true}
          opacity={1}
          style={{
            opacity: 1,
            backgroundColor: '#fff',
            color: '#333',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            boxShadow: '0 8px 16px -4px rgba(0,0,0,0.15)',
            padding: '0',
            fontSize: '0.75rem',
            maxWidth: '320px',
            zIndex: 1000
          }}
        />
      </>
    );
  };



  return (
    <div className="chat-modal-fullscreen">
      {/* Toast notification removed, handled globally */}
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
            disabled={isLoading || isDisabled}
          />
        </div>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-header">
              <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong>
              {message.role === 'assistant' && message.status && renderStatusPill(message.status)}              
              {message.role === 'assistant' && message.tokenUsage && renderTokenUsagePill(message.tokenUsage)}
            </div>
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
          disabled={isLoading || isDisabled}
          rows={3}
        />
        <button
          type="submit"
          disabled={!userInput.trim() || isLoading || isDisabled}
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default TwoStepsChat;
