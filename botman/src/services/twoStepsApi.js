/**
 * TwoSteps Chat API Service
 * Handles all API calls related to the 2steps chat feature
 */
import httpClient from './httpClient';
import { API_ENDPOINTS } from './config';

/**
 * TwoSteps API service object with methods for each API operation
 */
const twoStepsApi = {
  /**
   * Sends a message to the 2steps chat endpoint.
   * @param {Array} history - The chat history [{role: 'user'/'assistant', content: '...'}].
   * @param {string} model - The model to use for the chat.
   * @returns {Promise<object>} - The assistant's response { response: string }.
   */
  chat: async (history, model = 'gpt-4o') => {
    try {
      const messages = [...history];
      const response = await httpClient.post(`${API_ENDPOINTS.TWOSTEPS_CHAT}/chat`, { messages, model });
      const assistantMessage = response?.output?.find(item => item.type === 'message' && item.role === 'assistant');
      const responseText = assistantMessage?.content?.[0]?.text || "Sorry, I couldn't get a response.";
      return { response: responseText };
    } catch (error) {
      console.error('API Error in 2steps chat:', error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while communicating with the service.";
      return { response: `Error: ${errorMessage}` };
    }
  },

  /**
   * Sends a message to the /2steps-chat endpoint for SQL generation and execution.
   * @param {string} message - The user's message/question.
   * @param {string} clientName - The name of the client database to query.
   * @returns {Promise<object>} - The result including SQL and execution data.
   */
  twoStepsChat: async (message, clientName = 'designcheck') => {
    try {
      const response = await httpClient.post(API_ENDPOINTS.TWOSTEPS_CHAT, { 
        message, 
        clientName 
      });
      return response;
    } catch (error) {
      console.error('API Error in 2steps-chat:', error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while processing your request.";
      return { 
        status: 'ERROR', 
        message: `Error: ${errorMessage}` 
      };
    }
  },

  /**
   * Executes an SQL query via the backend.
   * @param {string} sql - The SQL query string.
   * @param {string} clientName - The name of the client database/context.
   * @returns {Promise<object>} - The execution result { data: [...] } or { error: '...', message: '...' }.
   */
  executeSql: async (sql, clientName) => {
    try {
      const response = await httpClient.post(`${API_ENDPOINTS.TWOSTEPS_CHAT}/execute`, { sql, clientName });
      return response.data;
    } catch (error) {
      console.error("API Error executing SQL:", error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while executing the SQL query.";
      return { error: true, message: errorMessage };
    }
  },

  /**
   * Get all available models
   * @returns {Promise<Array>} - Promise resolving to array of models
   */
  getAllModels: async () => {
    const response = await httpClient.get(`${API_ENDPOINTS.TWOSTEPS_CHAT}/models`);
    return response.data;
  }
};

export default twoStepsApi;
