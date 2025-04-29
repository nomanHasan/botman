import { create } from 'zustand';
import { botApi } from '../services';

const useBotStore = create((set, get) => ({
  bots: [],
  commands: [],
  prompts: [],
  vectorStores: [],
  tables: [],
  tableDetailsCache: {}, // Cache for storing details of fetched tables { tableName: { description: '...', columns: [...] } }
  allTablesAndColumns: {}, // New state to store all tables and columns { tableName: [col1, col2], ... }
  isLoading: false,
  isLoadingTableDetails: false, // Separate loading state for table details
  isLoadingAllTablesAndColumns: false,
  error: null,
  errorTableDetails: null, // Separate error state for table details
  errorAllTablesAndColumns: null,
  selectedBot: null,
  selectedCommand: null,
  selectedPrompt: null,
  selectedVectorStore: null,
  selectedBots: [],
  
  // Fetch data functions
  fetchBots: async () => {
    set({ isLoading: true, error: null });
    try {
      const bots = await botApi.getAllBots();
      set({ bots, isLoading: false });
    } catch (error) {
      console.error('Error fetching bots:', error);
      set({ error: error.message || 'Failed to fetch bots', isLoading: false });
    }
  },
  
  fetchCommands: async () => {
    set({ isLoading: true, error: null });
    try {
      const commands = await botApi.getAllCommands();
      set({ commands, isLoading: false });
    } catch (error) {
      console.error('Error fetching commands:', error);
      set({ error: error.message || 'Failed to fetch commands', isLoading: false });
    }
  },
  
  fetchPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      const prompts = await botApi.getAllPrompts();
      set({ prompts, isLoading: false });
    } catch (error) {
      console.error('Error fetching prompts:', error);
      set({ error: error.message || 'Failed to fetch prompts', isLoading: false });
    }
  },
  
  fetchVectorStores: async () => {
    set({ isLoading: true, error: null });
    try {
      const vectorStores = await botApi.getAllVectorStores();
      set({ vectorStores, isLoading: false });
    } catch (error) {
      console.error('Error fetching vector stores:', error);
      set({ error: error.message || 'Failed to fetch vector stores', isLoading: false });
    }
  },
  
  fetchTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const tables = await botApi.getAllTables();
      set({ tables, isLoading: false });
    } catch (error) {
      console.error('Error fetching tables:', error);
      set({ error: error.message || 'Failed to fetch tables', isLoading: false });
    }
  },

  /**
   * Fetches details for a specific table and caches the result.
   * @param {string} tableName The name of the table to fetch details for.
   */
  fetchTableDetails: async (tableName) => {
    // Check cache first
    if (get().tableDetailsCache[tableName]) {
      return; // Already fetched
    }

    set({ isLoadingTableDetails: true, errorTableDetails: null });
    try {
      const details = await botApi.getTableDetails(tableName);
      set(state => ({
        tableDetailsCache: {
          ...state.tableDetailsCache,
          [tableName]: details // Store details under the table name key
        },
        isLoadingTableDetails: false
      }));
    } catch (error) {
      console.error(`Error fetching details for table ${tableName}:`, error);
      set({ 
        errorTableDetails: error.message || `Failed to fetch details for ${tableName}`, 
        isLoadingTableDetails: false 
      });
    }
  },

  /**
   * Fetches all tables and their columns.
   */
  fetchAllTablesAndColumns: async () => {
    // Check if already fetched
    if (Object.keys(get().allTablesAndColumns).length > 0) {
      return;
    }

    set({ isLoadingAllTablesAndColumns: true, errorAllTablesAndColumns: null });
    try {
      const tablesAndColumns = await botApi.getAllTablesAndColumns();
      set({
        allTablesAndColumns: tablesAndColumns,
        isLoadingAllTablesAndColumns: false
      });
    } catch (error) {
      console.error('Error fetching all tables and columns:', error);
      set({
        errorAllTablesAndColumns: error.message || 'Failed to fetch tables and columns',
        isLoadingAllTablesAndColumns: false
      });
    }
  },
  
  updateTablesData: async (tablesData) => { // Renamed function, parameter name changed for clarity
    set({ isLoading: true, error: null });
    try {
      const result = await botApi.updateMultipleTables(tablesData); // Call the new API function
      
      // Refresh tables data and details after update
      // Clear cache as descriptions/comments might have changed
      set({ tableDetailsCache: {} }); 
      await get().fetchTables(); 
      await get().fetchAllTablesAndColumns(); // Fetch all tables and columns again
      // Optionally re-fetch details for affected tables if needed immediately, 
      // or let them be fetched on demand later.
      
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Error updating tables data:', error); // Updated error message
      set({ error: error.message || 'Failed to update tables data', isLoading: false }); // Updated error message
      throw error;
    }
  },
  
  // Modal actions
  setSelectedBot: (bot) => set({ selectedBot: bot }),
  setSelectedCommand: (command) => set({ selectedCommand: command }),
  setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),
  setSelectedVectorStore: (vectorStore) => set({ selectedVectorStore: vectorStore }),
  
  // Selection functions
  toggleBotSelection: (botId) => {
    set(state => {
      const isSelected = state.selectedBots.includes(botId);
      return {
        selectedBots: isSelected 
          ? state.selectedBots.filter(id => id !== botId)
          : [...state.selectedBots, botId]
      };
    });
  },
  
  selectAllBots: () => {
    set(state => ({
      selectedBots: state.bots.map(bot => bot.id)
    }));
  },
  
  clearSelectedBots: () => {
    set({ selectedBots: [] });
  },
  
  // Bot actions
  updateBot: async (botId, botData) => {
    set({ isLoading: true, error: null });
    try {
      await botApi.updateBot(botId, botData);
      
      // Update the local state
      set((state) => ({
        bots: state.bots.map(bot => 
          bot.id === botId ? { ...bot, ...botData } : bot
        ),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating bot:', error);
      set({ 
        error: error.message || 'Failed to update bot', 
        isLoading: false 
      });
      return false;
    }
  },
  
  createVectorStore: async (botId) => {
    try {
      const result = await botApi.createVectorStore(botId);
      return result;
    } catch (error) {
      console.error('Error creating vector store:', error);
      set({ error: error.message || 'Failed to create vector store' });
      throw error;
    }
  },

  updateBotWithVectorStore: (botId, vectorStoreId) => set((state) => ({
    bots: state.bots.map(bot => 
      bot.id === botId 
        ? { 
            ...bot, 
            metadata: { 
              ...bot.metadata, 
              vector_store_id: vectorStoreId,
              vector_store_updated: Date.now()
            } 
          } 
        : bot
    )
  })),
  
  deleteBot: async (botId) => {
    try {
      await botApi.deleteBot(botId);
      set((state) => ({
        bots: state.bots.filter(bot => bot.id !== botId),
        selectedBots: state.selectedBots.filter(id => id !== botId)
      }));
      return true;
    } catch (error) {
      console.error('Error deleting bot:', error);
      set({ error: error.message || 'Failed to delete bot' });
      return false;
    }
  },
  
  deleteVectorStore: async (vectorStoreId) => {
    try {
      await botApi.deleteVectorStore(vectorStoreId);
      set((state) => ({
        vectorStores: {
          ...state.vectorStores,
          data: state.vectorStores.data.filter(vs => vs.id !== vectorStoreId)
        },
        bots: state.bots.map(bot => {
          if (bot.metadata?.vector_store_id === vectorStoreId) {
            // Use destructuring and spread syntax to omit properties instead of delete
            const { vector_store_id, vector_store_updated, ...restMetadata } = bot.metadata;
            return { ...bot, metadata: restMetadata };
          }
          return bot;
        })
      }));
      return true;
    } catch (error) {
      console.error('Error deleting vector store:', error);
      set({ error: error.message || 'Failed to delete vector store' });
      return false;
    }
  },

  updateMultipleVectorStores: async (botIds) => {
    set({ isLoading: true, error: null });
    try {
      const result = await botApi.updateMultipleVectorStores(botIds);
      // Refresh the bots list after update
      await get().fetchBots();
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Error updating vector stores:', error);
      set({ 
        error: error.message || 'Failed to update vector stores',
        isLoading: false
      });
      throw error;
    }
  },
}));

export default useBotStore;