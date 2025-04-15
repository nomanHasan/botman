import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useBotStore from '../store/useBotStore';

const PromptDetails = ({ prompt, commands }) => {
  if (!prompt) return null;

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '5px', 
      padding: '20px',
      marginBottom: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>Prompt #{prompt.prompt_id}</h2>
      <p><strong>Purpose:</strong> {prompt.purpose}</p>
      <p><strong>Section:</strong> {prompt.section}</p>
      <p><strong>Description:</strong> {prompt.description}</p>
      <p><strong>Created:</strong> {new Date(prompt.created).toLocaleString()}</p>
      
      {prompt.prompt && (
        <div>
          <h3>Prompt Text:</h3>
          <div style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '15px', 
            borderRadius: '3px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            {prompt.prompt}
          </div>
        </div>
      )}
      
      {prompt.metadata && Object.keys(prompt.metadata).length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h3>Metadata:</h3>
          <pre style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '3px',
            overflow: 'auto',
            fontSize: '14px'
          }}>
            {JSON.stringify(prompt.metadata, null, 2)}
          </pre>
        </div>
      )}
      
      {commands && commands.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h3>Associated Commands</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {commands.map(cmd => (
              <li 
                key={cmd.command_id} 
                style={{ 
                  padding: '10px', 
                  marginBottom: '5px', 
                  backgroundColor: '#e3f2fd',
                  borderRadius: '3px'
                }}
              >
                <strong>Command #{cmd.command_id}:</strong> {cmd.summary}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Prompts = () => {
  const { promptId } = useParams();
  const { prompts, fetchPrompts, isLoading, error, commands, fetchCommands } = useBotStore();
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [relatedCommands, setRelatedCommands] = useState([]);
  
  useEffect(() => {
    fetchPrompts();
    fetchCommands();
  }, [fetchPrompts, fetchCommands]);
  
  useEffect(() => {
    if (promptId && prompts.length > 0) {
      const prompt = prompts.find(p => p.prompt_id === parseInt(promptId));
      setSelectedPrompt(prompt);
      
      // Find related commands
      if (prompt && commands.length > 0) {
        const related = commands.filter(cmd => {
          const promptIdFromArgs = cmd.args?.prompt_id?.default;
          return promptIdFromArgs && parseInt(promptIdFromArgs) === prompt.prompt_id;
        });
        setRelatedCommands(related);
      }
    }
  }, [promptId, prompts, commands]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading prompts...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>Error: {error}</div>;
  }

  // Helper to check if prompt is a bot
  const isBotPrompt = (metadata) => {
    if (!metadata) return false;
    
    const metaObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    return !!metaObj.bot_id;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Prompts</h1>
      
      {selectedPrompt ? (
        <PromptDetails prompt={selectedPrompt} commands={relatedCommands} />
      ) : (
        <div>
          {prompts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No prompts found</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Purpose</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Section</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Created</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((prompt) => (
                    <tr 
                      key={prompt.prompt_id} 
                      onClick={() => setSelectedPrompt(prompt)}
                      style={{ 
                        borderBottom: '1px solid #eee', 
                        cursor: 'pointer',
                        backgroundColor: selectedPrompt?.prompt_id === prompt.prompt_id ? '#e3f2fd' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px' }}>{prompt.prompt_id}</td>
                      <td style={{ padding: '12px' }}>{prompt.purpose}</td>
                      <td style={{ padding: '12px' }}>{prompt.section}</td>
                      <td style={{ padding: '12px' }}>{formatDate(prompt.created)}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ 
                          padding: '5px 10px',
                          backgroundColor: isBotPrompt(prompt.metadata) ? '#e8f5e9' : '#f5f5f5',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {isBotPrompt(prompt.metadata) ? 'Bot' : 'Standard'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Prompts;