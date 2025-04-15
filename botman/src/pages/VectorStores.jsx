import React, { useEffect, useState } from 'react';
import useBotStore from '../store/useBotStore';

const VectorStores = () => {
  const { vectorStores, fetchVectorStores, isLoading, error, deleteVectorStore } = useBotStore();
  const [selectedVectorStore, setSelectedVectorStore] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  useEffect(() => {
    fetchVectorStores();
  }, [fetchVectorStores]);
  
  const handleShowDetails = (vectorStore) => {
    setSelectedVectorStore(vectorStore);
  };
  
  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setConfirmDelete(id);
  };
  
  const confirmDeleteVectorStore = async (id) => {
    try {
      await deleteVectorStore(id);
      setConfirmDelete(null);
      if (selectedVectorStore?.id === id) {
        setSelectedVectorStore(null);
      }
    } catch (error) {
      console.error('Error deleting vector store:', error);
    }
  };
  
  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading vector stores...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Vector Stores</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: '1' }}>
          {vectorStores.data?.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No vector stores found</p>
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
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vectorStores.data?.map((vs) => (
                    <tr 
                      key={vs.id} 
                      onClick={() => handleShowDetails(vs)}
                      style={{ 
                        borderBottom: '1px solid #eee', 
                        cursor: 'pointer',
                        backgroundColor: selectedVectorStore?.id === vs.id ? '#e3f2fd' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px' }}>{vs.id}</td>
                      <td style={{ padding: '12px' }}>{vs.name}</td>
                      <td style={{ padding: '12px' }}>
                        {confirmDelete === vs.id ? (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteVectorStore(vs.id);
                              }}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelDelete();
                              }}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#9e9e9e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleDeleteClick(vs.id, e)}
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
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {selectedVectorStore && (
          <div style={{ 
            flex: '1',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '20px',
            backgroundColor: '#f9f9f9'
          }}>
            <h2>Vector Store Details</h2>
            <p><strong>ID:</strong> {selectedVectorStore.id}</p>
            <p><strong>Name:</strong> {selectedVectorStore.name}</p>
            
            {selectedVectorStore.file_ids && (
              <div>
                <h3>Files:</h3>
                <ul>
                  {selectedVectorStore.file_ids.map(fileId => (
                    <li key={fileId}>{fileId}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedVectorStore.bot && (
              <div style={{ marginTop: '20px' }}>
                <h3>Associated Bot</h3>
                <p><strong>Bot ID:</strong> {selectedVectorStore.bot.id}</p>
                <p><strong>Description:</strong> {selectedVectorStore.bot.description}</p>
                <p><strong>Prompt ID:</strong> {selectedVectorStore.bot.prompt_id}</p>
                
                {selectedVectorStore.bot.tables && selectedVectorStore.bot.tables.length > 0 && (
                  <div>
                    <h4>Associated Tables:</h4>
                    <ul>
                      {selectedVectorStore.bot.tables.map((table, idx) => (
                        <li key={idx}>{table}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorStores;