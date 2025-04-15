import { create } from 'zustand';
import { botApi } from '../services';

const useBotStore = create((set, get) => ({
  bots: [],
  commands: [],
  prompts: [],
  vectorStores: [],
  allTables: [],
  isLoading: false,
  error: null,
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
      set({ allTables: tables, isLoading: false });
    } catch (error) {
      console.error('Error fetching tables:', error);
      set({ error: error.message || 'Failed to fetch tables', isLoading: false });
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
            const newMetadata = { ...bot.metadata };
            delete newMetadata.vector_store_id;
            delete newMetadata.vector_store_updated;
            return { ...bot, metadata: newMetadata };
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