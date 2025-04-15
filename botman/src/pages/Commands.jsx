import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useBotStore from '../store/useBotStore';

const CommandDetails = ({ command, prompt }) => {
  if (!command) return null;

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '5px', 
      padding: '20px',
      marginBottom: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>Command #{command.command_id}</h2>
      <p><strong>Summary:</strong> {command.summary}</p>
      <p><strong>Section:</strong> {command.section}</p>
      <p><strong>Description:</strong> {command.description}</p>
      
      {command.args && (
        <div>
          <h3>Arguments:</h3>
          <pre style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '3px',
            overflow: 'auto',
            fontSize: '14px'
          }}>
            {JSON.stringify(command.args, null, 2)}
          </pre>
        </div>
      )}
      
      {prompt && (
        <div style={{ marginTop: '15px' }}>
          <h3>Associated Prompt</h3>
          <p><strong>ID:</strong> {prompt.prompt_id}</p>
          <p><strong>Purpose:</strong> {prompt.purpose}</p>
          <p><strong>Section:</strong> {prompt.section}</p>
          <p><strong>Description:</strong> {prompt.description}</p>
        </div>
      )}
    </div>
  );
};

const Commands = () => {
  const { commandId } = useParams();
  const { commands, fetchCommands, isLoading, error } = useBotStore();
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [promptDetails, setPromptDetails] = useState(null);
  
  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);
  
  useEffect(() => {
    if (commandId && commands.length > 0) {
      const command = commands.find(c => c.command_id === parseInt(commandId));
      setSelectedCommand(command);
      
      if (command?.args?.prompt_id?.default) {
        const promptId = parseInt(command.args.prompt_id.default);
        // Fetch the prompt details if needed
        // This could be fetched directly or from the store if prompts are already loaded
      }
    }
  }, [commandId, commands]);

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading commands...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Commands</h1>
      
      {selectedCommand ? (
        <CommandDetails command={selectedCommand} prompt={promptDetails} />
      ) : (
        <div>
          {commands.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No commands found</p>
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
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Summary</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Section</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commands.map((command) => (
                    <tr 
                      key={command.command_id} 
                      onClick={() => setSelectedCommand(command)}
                      style={{ 
                        borderBottom: '1px solid #eee', 
                        cursor: 'pointer',
                        backgroundColor: selectedCommand?.command_id === command.command_id ? '#e3f2fd' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px' }}>{command.command_id}</td>
                      <td style={{ padding: '12px' }}>{command.summary}</td>
                      <td style={{ padding: '12px' }}>{command.section}</td>
                      <td style={{ padding: '12px' }}>{command.description}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ 
                          padding: '5px 10px',
                          backgroundColor: command.active ? '#e8f5e9' : '#ffebee',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {command.active ? 'Active' : 'Inactive'}
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

export default Commands;