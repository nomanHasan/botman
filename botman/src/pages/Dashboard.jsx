import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useBotStore from '../store/useBotStore';
import { botApi } from '../services';

/* eslint-disable */
/* biome-ignore lint/a11y/useButtonType: This rule is globally disabled for this file */

const BotUpdateModal = ({ isOpen, onClose, bot, onUpdate }) => {
  const formatVectorStoreUpdate = (bot) => {
    if (!bot.metadata?.vector_store_id) return 'Not created';
    const timestamp = bot.metadata?.vector_store_updated || Date.now();
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };
  const { allTables, fetchTables, isLoading } = useBotStore();
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    prompt: '',
    tables: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tables when modal opens
  useEffect(() => {
    if (isOpen && allTables.length === 0) {
      fetchTables();
    }
  }, [isOpen, allTables.length, fetchTables]);

  // Update form data when bot changes
  useEffect(() => {
    if (bot) {
      setFormData({
        id: bot.id || '',
        description: bot.description || '',
        prompt: bot.prompt || '',
        tables: bot.tables || []
      });
    }
  }, [bot]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTableToggle = (table) => {
    setFormData(prev => {
      const tables = prev.tables.includes(table)
        ? prev.tables.filter(t => t !== table)
        : [...prev.tables, table];
      return { ...prev, tables };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Extract changes
      const changes = {};
      if (formData.description !== bot.description) {
        changes.description = formData.description;
      }
      if (formData.prompt !== bot.prompt) {
        changes.prompt = formData.prompt;
      }
      if (JSON.stringify(formData.tables) !== JSON.stringify(bot.tables)) {
        changes.tables = formData.tables;
      }

      // Only update if something changed
      if (Object.keys(changes).length > 0) {
        await onUpdate(bot.id, changes);
      }
      onClose();
    } catch (error) {
      console.error('Error updating bot:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter tables based on search term
  const filteredTables = allTables.filter(table =>
    table.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen || !bot) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '5px',
        width: '80%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h2>Bot: {bot.id}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bot ID:</label>
            <input
              type="text"
              value={formData.id}
              disabled
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prompt:</label>
            <textarea
              name="prompt"
              value={formData.prompt}
              onChange={handleChange}
              rows={10}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tables:</label>
            <input
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            />

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading tables...</div>
            ) : (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '20px',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                {filteredTables.length > 0 ? (
                  filteredTables.map((table) => (
                    <div key={table} style={{
                      padding: '5px 10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: formData.tables.includes(table) ? '#d1e6f9' : '#ffffff',
                      color: '#333333',
                      cursor: 'pointer'
                    }} onClick={() => handleTableToggle(table)}>
                      {table}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '10px', color: '#666' }}>
                    {searchTerm ? 'No matching tables found' : 'No tables available'}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '14px', color: '#666' }}>Selected tables: {formData.tables.length}</p>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Associated Commands:</label>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {bot.associated_commands && bot.associated_commands.length > 0 ? (
                bot.associated_commands.map((cmd) => (
                  <li key={cmd.command_id}>
                    Command #{cmd.command_id} - {cmd.summary}
                  </li>
                ))
              ) : (
                <li>No commands associated</li>
              )}
            </ul>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Vector Store:</label>
            {bot.metadata?.vector_store_id ? (
              <div>
                <p style={{ margin: 0 }}>{bot.metadata.vector_store_id}</p>
                <p style={{ fontSize: '14px', color: '#666', margin: '5px 0 0 0' }}>
                  Last updated: {formatVectorStoreUpdate(bot)}
                </p>
              </div>
            ) : (
              <p style={{ margin: 0 }}>No vector store created yet</p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e0e0e0',
                color: '#333333',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4a4a4a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChatModal = ({ isOpen, onClose, bot, vectorStoreId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenUsage, setTokenUsage] = useState(0);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await botApi.chat({
        input: [userMessage],
        vectorStoreId,
      });

      const assistantMessage = { role: 'assistant', content: response.output_text };
      setMessages((prev) => [...prev, assistantMessage]);
      setTokenUsage((prev) => prev + response.token_usage);
    } catch (error) {
      console.error('Error during chat:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '80%',
        maxWidth: '600px',
        maxHeight: '80%',
        overflowY: 'auto',
      }}>
        <h2>Chat with {bot.name}</h2>
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          marginBottom: '20px',
          border: '1px solid #ddd',
          padding: '10px',
          borderRadius: '4px',
        }}>
          {messages.map((message, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <strong>{message.role === 'user' ? 'You' : 'Bot'}:</strong>
              <p style={{ whiteSpace: 'pre-wrap', margin: '5px 0' }}>{message.content}</p>
            </div>
          ))}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleSendMessage}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Token Usage: {tokenUsage}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const {
    bots,
    fetchBots,
    isLoading,
    error,
    setSelectedBot,
    updateBotWithVectorStore,
    updateBot,
    deleteBot,
    updateMultipleVectorStores,
    selectedBot
  } = useBotStore();

  const [loading, setLoading] = useState({});
  const [selectedBots, setSelectedBots] = useState([]);
  const [updatingVectorStores, setUpdatingVectorStores] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const handleUpdateBot = (bot, e) => {
    if (e) e.stopPropagation();
    setSelectedBot(bot);
    setIsUpdateModalOpen(true);
  };

  const handleBotUpdate = async (botId, data) => {
    try {
      await updateBot(botId, data);
      fetchBots(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error updating bot:', error);
      return false;
    }
  };

  const handleCreateVectorStore = async (botId, e) => {
    e.preventDefault();

    setLoading(prev => ({ ...prev, [botId]: true }));

    try {
      // Call the API service
      const result = await botApi.createVectorStore(botId);

      // Update the store with the result from API
      if (result.details && result.details.finalVectorStoreId) {
        updateBotWithVectorStore(botId, result.details.finalVectorStoreId);
      }

      // Refresh the bot list
      fetchBots();
    } catch (error) {
      console.error('Error creating vector store:', error);
    } finally {
      setLoading(prev => ({ ...prev, [botId]: false }));
    }
  };

  const handleDeleteBot = async (botId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Are you sure you want to delete this bot?`)) {
      try {
        await deleteBot(botId);
      } catch (error) {
        console.error('Error deleting bot:', error);
      }
    }
  };

  const toggleBotSelection = (botId, e) => {
    e.stopPropagation(); // Prevent row click
    setSelectedBots(prev => {
      if (prev.includes(botId)) {
        return prev.filter(id => id !== botId);
      } else {
        return [...prev, botId];
      }
    });
  };

  const toggleAllBots = (e) => {
    if (selectedBots.length === bots.length) {
      setSelectedBots([]);
    } else {
      setSelectedBots(bots.map(bot => bot.id));
    }
  };

  const updateSelectedBotsVectorStores = async () => {
    if (selectedBots.length === 0) {
      alert('Please select at least one bot to update');
      return;
    }

    setUpdatingVectorStores(true);
    try {
      await updateMultipleVectorStores(selectedBots);
      // Bots will be refreshed from the store action
      setSelectedBots([]); // Clear selection after update
    } catch (error) {
      console.error('Error updating vector stores:', error);
    } finally {
      setUpdatingVectorStores(false);
    }
  };

  const handleChat = (bot, e) => {
    if (e) e.stopPropagation();
    setSelectedBot(bot);
    setIsChatModalOpen(true);
  };

  // Helper to truncate text for display
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper to truncate tables list for display
  const truncateTables = (tables) => {
    if (!tables || tables.length === 0) return 'No tables';
    if (tables.length <= 3) return tables.join(', ');
    return `${tables.slice(0, 3).join(', ')}... +${tables.length - 3} more`;
  };

  // Helper to format vector store update time
  const formatVectorStoreUpdate = (bot) => {
    if (!bot.metadata?.vector_store_id) return 'Not created';

    // Extract timestamp from metadata if available
    const timestamp = bot.metadata?.vector_store_updated || Date.now();
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading bots...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', color: '#333333' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                <input
                  type="checkbox"
                  checked={selectedBots.length === bots.length && bots.length > 0}
                  onChange={toggleAllBots}
                />
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Bot Name</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Prompt</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tables</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Command</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Vector Store</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Updated</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bots.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '20px', textAlign: 'center' }}>No bots found</td>
              </tr>
            ) : (
              bots.map((bot) => (
                <tr
                  key={bot.id}
                  style={{
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedBots.includes(bot.id) ? '#e3f2fd' : 'transparent'
                  }}
                // onClick={() => handleUpdateBot(bot)}
                >
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedBots.includes(bot.id)}
                      onChange={(e) => toggleBotSelection(bot.id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>{bot.id}</td>
                  <td style={{ padding: '12px' }}>
                    <div
                      title={bot.description || ''}
                      style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {truncateText(bot.description, 30) || 'No description'}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div
                      title={bot.prompt || ''}
                      style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {truncateText(bot.prompt, 30) || 'No prompt'}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div title={bot.tables?.join(', ') || 'No tables'} style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {truncateTables(bot.tables)}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {bot.associated_commands && bot.associated_commands.length > 0
                      ? `Command #${bot.associated_commands[0].command_id}`
                      : 'No command'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {bot.metadata?.vector_store_id ? (
                      <div style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                        title={bot.metadata.vector_store_id}
                      >
                        {truncateText(bot.metadata.vector_store_id, 15)}
                      </div>
                    ) : (
                      <div style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        Not created
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {formatVectorStoreUpdate(bot)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        // onClick={(e) => handleUpdateBot(bot, e)}
                        type="button"
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleChat(bot, e)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: 'hsl(83 25% 45% / 1)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Chat
                      </button>
                      {/* <button
                        onClick={(e) => handleDeleteBot(bot.id, e)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={updateSelectedBotsVectorStores}
          disabled={selectedBots.length === 0 || updatingVectorStores}
          style={{
            padding: '10px 20px',
            backgroundColor: selectedBots.length === 0 ? '#cccccc' : '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedBots.length === 0 || updatingVectorStores ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {updatingVectorStores
            ? 'Updating Vector Stores...'
            : `Update Vector Stores (${selectedBots.length})`}
        </button>
      </div>

      <BotUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        bot={selectedBot}
        onUpdate={handleBotUpdate}
      />
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        bot={selectedBot}
        vectorStoreId={selectedBot?.metadata?.vector_store_id}
      />
    </div>
  );
};

export default Dashboard;