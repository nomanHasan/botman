import { create } from 'zustand';
import { botApi } from '../services';

const useBotStore = create((set, get) => ({
  bots: [],
  commands: [],
  prompts: [],
  vectorStores: [],
  tables: [],
  tableDetailsCache: {},
  allTablesAndColumns: {},
  isLoading: false,
  isLoadingTableDetails: false,
  isLoadingAllTablesAndColumns: false,
  error: null,
  errorTableDetails: null,
  errorAllTablesAndColumns: null,
  selectedBot: null,
  selectedCommand: null,
  selectedPrompt: null,
  selectedVectorStore: null,
  selectedBots: [],
  
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

  fetchTableDetails: async (tableName) => {
    if (get().tableDetailsCache[tableName]) {
      return;
    }
    set({ isLoadingTableDetails: true, errorTableDetails: null });
    try {
      const details = await botApi.getTableDetails(tableName);
      set(state => ({
        tableDetailsCache: {
          ...state.tableDetailsCache,
          [tableName]: details
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

  fetchAllTablesAndColumns: async () => {
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
  
  updateTablesData: async (tablesData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await botApi.updateMultipleTables(tablesData);
      set({ tableDetailsCache: {} }); 
      await get().fetchTables(); 
      await get().fetchAllTablesAndColumns();
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Error updating tables data:', error);
      set({ error: error.message || 'Failed to update tables data', isLoading: false });
      throw error;
    }
  },
  
  setSelectedBot: (bot) => set({ selectedBot: bot }),
  setSelectedCommand: (command) => set({ selectedCommand: command }),
  setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),
  setSelectedVectorStore: (vectorStore) => set({ selectedVectorStore: vectorStore }),
  
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
  
  updateBot: async (botId, botData) => {
    set({ isLoading: true, error: null });
    try {
      await botApi.updateBot(botId, botData);
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