/**
 * Bot API Service
 * Handles all API calls related to bot management
 */
import httpClient from './httpClient';
import { API_ENDPOINTS } from './config';

/**
 * Bot API service object with methods for each API operation
 */
const botApi = {
  /**
   * Get all bots
   * @returns {Promise<Array>} - Promise resolving to array of bots
   */
  getAllBots: async () => {
    const response = await httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/bots`);
    return response.bots;
  },

  /**
   * Get a single bot by ID
   * @param {string|number} botId - ID of the bot to retrieve
   * @returns {Promise<Object>} - Promise resolving to bot data
   */
  getBotById: async (botId) => {
    const response = await httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/bots/${botId}`);
    return response.bot;
  },

  /**
   * Create a new bot
   * @param {Object} botData - Bot data to create
   * @returns {Promise<Object>} - Promise resolving to created bot data
   */
  createBot: async (botData) => {
    return httpClient.post(`${API_ENDPOINTS.BOTMANAGER}/bots`, botData);
  },

  /**
   * Update an existing bot
   * @param {string|number} botId - ID of the bot to update
   * @param {Object} botData - Updated bot data
   * @returns {Promise<Object>} - Promise resolving to updated bot data
   */
  updateBot: async (botId, botData) => {
    return httpClient.put(`${API_ENDPOINTS.BOTMANAGER}/bots/${botId}`, botData);
  },

  /**
   * Delete a bot
   * @param {string|number} botId - ID of the bot to delete
   * @returns {Promise<Object>} - Promise resolving to operation result
   */
  deleteBot: async (botId) => {
    return httpClient.delete(`${API_ENDPOINTS.BOTMANAGER}/bots/${botId}`);
  },

  /**
   * Create vector store for a bot
   * @param {string|number} botId - ID of the bot
   * @returns {Promise<Object>} - Promise resolving to vector store data
   */
  createVectorStore: async (botId) => {
    return httpClient.post(`${API_ENDPOINTS.BOTMANAGER}/bots/${botId}/update`);
  },

  /**
   * Update vector stores for multiple bots
   * @param {string[]|number[]} botIds - Array of bot IDs to update
   * @returns {Promise<Object>} - Promise resolving to update results
   */
  updateMultipleVectorStores: async (botIds) => {
    return httpClient.post(`${API_ENDPOINTS.BOTMANAGER}/bots/update-multiple`, { botIds });
  },

  /**
   * Get all commands
   * @returns {Promise<Array>} - Promise resolving to array of commands
   */
  getAllCommands: async () => {
    const response = await httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/commands`);
    return response.commands;
  },

  /**
   * Get a single command by ID
   * @param {number} commandId - ID of the command to retrieve
   * @returns {Promise<Object>} - Promise resolving to command data
   */
  getCommandById: async (commandId) => {
    return httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/commands/${commandId}`);
  },

  /**
   * Get all prompts
   * @returns {Promise<Array>} - Promise resolving to array of prompts
   */
  getAllPrompts: async () => {
    const response = await httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/prompts`);
    return response.prompts;
  },

  /**
   * Get a single prompt by ID
   * @param {number} promptId - ID of the prompt to retrieve
   * @returns {Promise<Object>} - Promise resolving to prompt data
   */
  getPromptById: async (promptId) => {
    return httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/prompts/${promptId}`);
  },

  /**
   * Get all available tables
   * @returns {Promise<Array>} - Promise resolving to array of table names
   */
  getAllTables: async () => {
    const response = await httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/tables`);
    return response.tables;
  },

  /**
   * Get details for a specific table
   * @param {string} tableName - Name of the table (e.g., 'my_table' or 'admin.my_table')
   * @returns {Promise<Object>} - Promise resolving to table details (description, columns)
   */
  getTableDetails: async (tableName) => {
    const encodedTableName = encodeURIComponent(tableName);
    return httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/tables/${encodedTableName}`);
  },

  /**
   * Update multiple tables with descriptions and column comments.
   * @param {Array<Object>} tablesData - Array of table update objects.
   * Each object should have { name: string, description?: string, columns?: [{ name: string, comment: string }] }
   * @returns {Promise<Object>} - Promise resolving to the API response
   */
  updateMultipleTables: async (tablesData) => {
    const response = await httpClient.put(`${API_ENDPOINTS.BOTMANAGER}/tables`, { tables: tablesData });
    return response;
  },

  /**
   * Get all tables and their columns
   * @returns {Promise<Object>} - Promise resolving to an object with table names as keys and arrays of column names as values
   */
  getAllTablesAndColumns: async () => {
    const response = await httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/table-columns`);
    return response.tables;
  },

  /**
   * Get all vector stores
   * @returns {Promise<Array>} - Promise resolving to array of vector stores
   */
  getAllVectorStores: async () => {
    return httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/vector-stores`);
  },

  /**
   * Get vector store by ID
   * @param {string} vectorStoreId - ID of the vector store
   * @returns {Promise<Object>} - Promise resolving to vector store data
   */
  getVectorStoreById: async (vectorStoreId) => {
    return httpClient.get(`${API_ENDPOINTS.BOTMANAGER}/vector-stores/${vectorStoreId}`);
  },

  /**
   * Delete vector store
   * @param {string} vectorStoreId - ID of the vector store to delete
   * @returns {Promise<Object>} - Promise resolving to operation result
   */
  deleteVectorStore: async (vectorStoreId) => {
    return httpClient.delete(`${API_ENDPOINTS.BOTMANAGER}/vector-stores/${vectorStoreId}`);
  },

  /**
   * Find bots associated with specific table names.
   * @param {string[]} tableNames - Array of table names.
   * @returns {Promise<Array>} - Promise resolving to an array of bot objects.
   */
  findBotsByTableNames: async (tableNames) => {
    const response = await httpClient.post(`${API_ENDPOINTS.BOTMANAGER}/find-bots-by-table-names`, { tables: tableNames });
    return response.bots || response;
  },

  /**
   * Sends a message to a specific bot's chat endpoint.
   * Assumes a backend endpoint like POST /api/bots/{botId}/chat
   * This endpoint should use the OpenAI Responses API internally.
   * @param {string} botId - The ID of the bot to chat with.
   * @param {string} message - The user's message.
   * @param {Array} history - The chat history [{role: 'user'/'assistant', content: '...'}].
   * @returns {Promise<object>} - The assistant's response { response: string }.
   */
  chatWithBot: async (botId, history) => {
    try {
      const messages = [
        ...history
      ];
      const response = await httpClient.post(`${API_ENDPOINTS.BOTMANAGER}/bots/${botId}/chat`, { messages });
      const assistantMessage = response?.output?.find(item => item.type === 'message' && item.role === 'assistant');
      const botResponseText = assistantMessage?.content?.[0]?.text || "Sorry, I couldn't get a response.";
      return { response: botResponseText };
    } catch (error) {
      console.error(`API Error chatting with bot ${botId}:`, error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while communicating with the bot.";
      return { response: `Error: ${errorMessage}` };
    }
  },

  /**
   * Executes an SQL query via the backend.
   * Assumes a backend endpoint like POST /api/execute-sql or uses /wingman/execute
   * @param {string} sql - The SQL query string.
   * @param {string} clientName - The name of the client database/context.
   * @returns {Promise<object>} - The execution result { data: [...] } or { error: '...', message: '...' }.
   */
  executeSql: async (sql, clientName) => {
    try {
      const response = await httpClient.post(`${API_ENDPOINTS.BOTMANAGER}/execute`, { sql, clientName });
      return response.data;
    } catch (error) {
      console.error("API Error executing SQL:", error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while executing the SQL query.";
      return { error: true, message: errorMessage };
    }
  }
};

export default botApi;