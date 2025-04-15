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
  }
};

export default botApi;