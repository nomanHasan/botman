import React, { useState, useEffect, useRef, useCallback } from 'react';
import useBotStore from '../store/useBotStore';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import botApi from '../services/botApi';

const Tables = () => {
  const {
    tables,
    fetchTables,
    updateTablesData,
    updateMultipleVectorStores,
    isLoading: isLoadingTables,
    error: tablesError,
    tableDetailsCache,
    fetchTableDetails,
    isLoadingTableDetails,
    errorTableDetails,
    allTablesAndColumns,
    fetchAllTablesAndColumns,
    isLoadingAllTablesAndColumns,
    errorAllTablesAndColumns
  } = useBotStore();

  const [expandedTable, setExpandedTable] = useState(null);
  const [modifiedColumns, setModifiedColumns] = useState({});
  const [modifiedDescriptions, setModifiedDescriptions] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [affectedBots, setAffectedBots] = useState([]);
  const [isLoadingAffectedBots, setIsLoadingAffectedBots] = useState(false);
  const [errorAffectedBots, setErrorAffectedBots] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    fetchTables();
    setTimeout(() => {
      fetchAllTablesAndColumns();
    }
      , 5000);
  }, [fetchTables, fetchAllTablesAndColumns]);

  const toggleTable = (tableName) => {
    if (expandedTable === tableName) {
      setExpandedTable(null);
    } else {
      setExpandedTable(tableName);
      if (!tableDetailsCache[tableName]) {
        fetchTableDetails(tableName);
      }
    }
  };

  const parseColumnComment = (comment) => {
    if (!comment) return { description: '', foreignKeys: [] };

    try {
      const parsed = JSON.parse(comment);
      const description = typeof parsed.description === 'string' ? parsed.description : '';
      const foreignKeys = Array.isArray(parsed.foreignKeys) ? parsed.foreignKeys : [];
      return {
        description,
        foreignKeys
      };
    } catch (e) {
      return { error: true, original: comment };
    }
  };

  const getModifiedColumnsState = useCallback((prev, tableName, columnName, changes) => {
    const key = `${tableName}.${columnName}`;

    // Find the original column data from the cache
    const tableDetails = tableDetailsCache[tableName];
    const originalColumnObject = tableDetails?.columns?.find(col => col.name === columnName);

    if (!originalColumnObject) {
      console.error(`Column ${columnName} not found in table ${tableName} cache.`);
      // Handle the error appropriately, maybe return prev state or throw an error
      return prev;
    }

    const originalParsedComment = parseColumnComment(originalColumnObject.comment);

    console.log('originalColumnData.comment:', originalColumnObject);

    const currentData = prev[key] || {
      description: originalParsedComment.description,
      foreignKeys: originalParsedComment.foreignKeys,
    };

    const updatedData = { ...currentData, ...changes };

    // Ensure description and foreignKeys are always defined for stringify
    const descriptionToSave = updatedData.description ?? updatedData.originalDescription ?? '';
    const foreignKeysToSave = updatedData.foreignKeys ?? updatedData.originalForeignKeys ?? [];

    let isActuallyModified = false;

    if (originalParsedComment.description !== updatedData.description) {
      isActuallyModified = true;
    } else if (originalParsedComment.foreignKeys.length !== updatedData.foreignKeys.length) {
      isActuallyModified = true;
    } else {
      const originalForeignKeysSet = new Set(originalParsedComment.foreignKeys);
      const updatedForeignKeysSet = new Set(updatedData.foreignKeys);
      isActuallyModified = [...originalForeignKeysSet].some(key => !updatedForeignKeysSet.has(key)) ||
        [...updatedForeignKeysSet].some(key => !originalForeignKeysSet.has(key));
    }

    console.log('isActuallyModified:', isActuallyModified);

    const newState = { ...prev };

    if (isActuallyModified) {
      newState[key] = {
        ...updatedData,
        description: descriptionToSave,
        foreignKeys: foreignKeysToSave,
        isModified: true,
        table: tableName,
        column: columnName,
      };
    } else {
      delete newState[key];
    }

    return newState;
  }, [tableDetailsCache]);


  const getModifiedDescriptionsState = useCallback((prev, tableName, newDescription) => {
    const key = `${tableName}`;
    const tableDetails = tableDetailsCache[tableName];
    const originalDescription = tableDetails?.description || '';
    const isModified = originalDescription !== newDescription;
    const newState = { ...prev };
    if (isModified) {
      newState[key] = {
        description: newDescription,
        isModified: true,
        table: tableName,
      };
    } else {
      delete newState[key];
    }
    return newState;
  }, [tableDetailsCache]);



  const handleColumnCommentChange = (tableName, column, value) => {
    setModifiedColumns(prev => {
      return getModifiedColumnsState(prev, tableName, column, { description: value });
    });
  };

  const handleForeignKeyChange = (tableName, column, values) => {
    setModifiedColumns(prev => getModifiedColumnsState(prev, tableName, column, { foreignKeys: values }));
  };

  const handleDescriptionChange = (tableName, value) => {
    setModifiedDescriptions(prev => {
      return getModifiedDescriptionsState(prev, tableName, value);
    });
  };

  const getAllForeignKeyOptions = (currentTableName) => {
    const options = [];
    for (const [tableName, columns] of Object.entries(allTablesAndColumns)) {
      if (tableName !== currentTableName) {
        for (const columnName of columns) {
          const value = `${tableName}.${columnName}`;
          options.push({ value: value, label: value });
        }
      }
    }
    return options;
  };

  const fetchAffectedBots = useCallback(async () => {
    const modifiedTableNames = [
      ...new Set(Object.keys(modifiedColumns).map(key => key.split('.')[0])),
      ...new Set(Object.keys(modifiedDescriptions).map(key => key))
    ];

    if (modifiedTableNames.length === 0) {
      setAffectedBots([]);
      setErrorAffectedBots(null);
      setIsLoadingAffectedBots(false);
      return;
    }

    setIsLoadingAffectedBots(true);
    setErrorAffectedBots(null);
    try {
      const bots = await botApi.findBotsByTableNames(modifiedTableNames);
      setAffectedBots(bots || []);
    } catch (err) {
      console.error("Error fetching affected bots:", err);
      setErrorAffectedBots(err.message || 'Failed to fetch affected bots');
      setAffectedBots([]);
    } finally {
      setIsLoadingAffectedBots(false);
    }
  }, [modifiedColumns, modifiedDescriptions]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setIsLoadingAffectedBots(true);
    debounceTimeoutRef.current = setTimeout(() => {
      fetchAffectedBots();
    }, 5000);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [modifiedColumns, modifiedDescriptions, fetchAffectedBots]);

  const handleUpdateSubmit = async () => {
    setIsSubmitting(true); // Start submission process
    setUpdateSuccess(false);
    setUpdateError(null);
    setErrorAffectedBots(null); // Clear previous bot update errors

    try {
      // Build groupedUpdates from modifiedColumns
      const groupedUpdates = Object.values(modifiedColumns).reduce((acc, modCol) => {
        const { table, column, description, foreignKeys } = modCol;
        if (!acc[table]) {
          acc[table] = {
            name: table,
            columns: []
          };
        }
        acc[table].columns.push({
          name: column,
          comment: JSON.stringify({
            description: description || '',
            foreignKeys: foreignKeys || []
          })
        });
        return acc;
      }, {});

      for (const key in modifiedDescriptions) {
        const descObj = modifiedDescriptions[key];
        const table = descObj.table;
        if (!groupedUpdates[table]) {
          groupedUpdates[table] = { name: table, columns: [], description: '' };
        }
        groupedUpdates[table].description = descObj.description;
      }

      const updatesForApi = Object.values(groupedUpdates);

      await updateTablesData(updatesForApi);

      const currentModifiedColumns = { ...modifiedColumns }; // Keep a copy for bot update logic
      const currentAffectedBots = [...affectedBots]; // Keep a copy

      setModifiedColumns({}); // Clear UI state immediately after table update success
      setModifiedDescriptions({}); // Clear UI state immediately after table update success

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (currentAffectedBots.length > 0) {
        const botIdsToUpdate = currentAffectedBots.map(bot => bot.id);
        try {
          await updateMultipleVectorStores(botIdsToUpdate);
          setUpdateSuccess(true); // Set final success after both steps
          setAffectedBots([]); // Clear affected bots after successful update
        } catch (vectorUpdateError) {
          console.error('Error updating vector stores for affected bots:', vectorUpdateError);
          setErrorAffectedBots(vectorUpdateError.message || 'Failed to update vector stores for affected bots.');
        }
      } else {
        setUpdateSuccess(true); // Set success as only table update was needed
      }

      setTimeout(() => {
        setUpdateSuccess(false);
      }, 5000);

    } catch (err) {
      console.error('Error submitting table updates:', err);
      setUpdateError(err.message || 'Failed to update column metadata');
      setTimeout(() => {
        setUpdateError(null);
      }, 5000);
    } finally {
      setIsSubmitting(false); // End submission process
    }
  };

  if (isLoadingTables || isLoadingAllTablesAndColumns) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading table data...</div>;
  }

  if (tablesError || errorAllTablesAndColumns) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
      Error loading table data: {tablesError || errorAllTablesAndColumns}
    </div>;
  }

  const hasModifications = Object.keys(modifiedColumns).length > 0 || Object.keys(modifiedDescriptions).length > 0;

  return (
    <div style={{ padding: '20px 20px 80px 20px' }}>
      <div>
        {tables?.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>No tables found</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {tables?.map((tableName) => {
              const tableDetails = tableDetailsCache[tableName];
              const isExpanded = expandedTable === tableName;

              return (
                <div
                  key={tableName}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleTable(tableName)}
                    key={tableName}
                    style={{
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                      borderBottom: isExpanded ? '1px solid #ddd' : 'none'
                    }}
                  >
                    <h4 style={{ margin: 0 }}>{tableName}</h4>
                    <span>{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '15px' }}>
                      {isLoadingTableDetails && !tableDetails && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>Loading details for {tableName}...</div>
                      )}
                      {errorTableDetails && !tableDetails && (
                        <div style={{ color: 'red', padding: '10px 0' }}>Error loading details: {errorTableDetails}</div>
                      )}

                      {tableDetails && (
                        <>
                          <MemoTableDescription
                            tableName={tableName}
                            description={tableDetails.description}
                            modifiedDescriptions={modifiedDescriptions}
                            handleDescriptionChange={handleDescriptionChange}
                          />

                          <div style={{ overflowX: 'auto' }}>
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
                            }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Column Name</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Foreign Keys</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tableDetails.columns?.map((column) => {
                                  const commentData = parseColumnComment(column.comment);
                                  const modifiedData = modifiedColumns[`${tableName}.${column.name}`];
                                  const isModified = modifiedData?.isModified;

                                  return <MemoTableRow
                                    key={column.name}
                                    column={column}
                                    isModified={isModified}
                                    commentData={commentData}
                                    modifiedData={modifiedData}
                                    handleColumnCommentChange={handleColumnCommentChange}
                                    tableName={tableName}
                                    getAllForeignKeyOptions={getAllForeignKeyOptions}
                                    handleForeignKeyChange={handleForeignKeyChange}
                                  />;
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasModifications && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '15px 20px',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}>
          <div>
            <p style={{ margin: 0 }}>
              <strong>{Object.keys(modifiedDescriptions).length}</strong> Table Description{Object.keys(modifiedDescriptions).length !== 1 ? 's' : ''} modified
            </p>
            <ul style={{ margin: '5px 0 0 0', padding: 0, listStyle: 'none', fontSize: '14px' }}>
              {Object.entries(modifiedDescriptions).slice(0, 3).map(([key]) => (
                <li key={key}>{key}</li>
              ))}
              {Object.keys(modifiedDescriptions).length > 3 && (
                <li title={
                  Object.keys(modifiedDescriptions).slice(3).map(key => key).join(', \n')
                }
                  style={{
                    color: 'blue',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                > ...and {Object.keys(modifiedDescriptions).length - 3} more </li>
              )}
            </ul>
            <p style={{ margin: 0 }}>
              <strong>{Object.keys(modifiedColumns).length}</strong> column{Object.keys(modifiedColumns).length !== 1 ? 's' : ''} modified
            </p>
            <ul style={{ margin: '5px 0 0 0', padding: 0, listStyle: 'none', fontSize: '14px' }}>
              {Object.entries(modifiedColumns).slice(0, 3).map(([key]) => (
                <li key={key}>{key}</li>
              ))}
              {Object.keys(modifiedColumns).length > 3 && (
                <li title={
                  Object.keys(modifiedColumns).slice(3).map(key => key).join(', \n')
                }
                  style={{
                    color: 'blue',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                > ...and {Object.keys(modifiedColumns).length - 3} more </li>
              )}
            </ul>
          </div>

          <div style={{ textAlign: 'center', flexGrow: 1, margin: '0 15px', fontSize: '14px' }}>
            {isLoadingAffectedBots && (
              <span>Loading affected bots...</span>
            )}
            {!isLoadingAffectedBots && errorAffectedBots && (
              <span style={{ color: 'orange' }}>Vector Store Update Error: {errorAffectedBots}</span>
            )}
            {!isLoadingAffectedBots && !errorAffectedBots && affectedBots.length > 0 && (
              <div>
                <strong style={{ display: 'block', marginBottom: '3px' }}>Bots to be updated:</strong>
                <span title={affectedBots.map(bot => bot.id || 'Unknown ID').join(', ')}>
                  {affectedBots.slice(0, 4).map(bot => bot.id || 'Unknown ID').join(', ')}
                  {affectedBots.length > 4 && `... (${affectedBots.length - 4} more)`}
                </span>
              </div>
            )}
            {!isLoadingAffectedBots && !errorAffectedBots && affectedBots.length === 0 && Object.keys(modifiedColumns).length > 0 && (
              <span>No bots associated with these tables.</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {updateSuccess && (
              <span style={{ color: 'green' }}>Updates saved successfully!</span>
            )}
            {updateError && (
              <span style={{ color: 'red' }}>Table Update Error: {updateError}</span>
            )}
            <button
              type='button'
              onClick={handleUpdateSubmit}
              disabled={isSubmitting || isLoadingTables || isLoadingTableDetails || isLoadingAffectedBots}
              style={{
                padding: '8px 16px',
                backgroundColor: isSubmitting || isLoadingTables || isLoadingTableDetails || isLoadingAffectedBots ? '#cccccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting || isLoadingTables || isLoadingTableDetails || isLoadingAffectedBots ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;


const MemoTableDescription = React.memo(({ tableName, description, modifiedDescriptions, handleDescriptionChange }) => {

  const [text, setText] = useState(description);
  useEffect(() => {
    if (modifiedDescriptions?.[tableName]?.description !== undefined) {
      setText(modifiedDescriptions[tableName].description);
    } else {
      setText(description);
    }
  }, [modifiedDescriptions, tableName, description]);

  const debouncedUpdate = useDebouncedCallback((value) => {
    handleDescriptionChange(tableName, value);
  }, 300, [tableName]);


  return (
    <textarea
      type="text"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        debouncedUpdate(e.target.value);
      }}
      style={{
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        backgroundColor: modifiedDescriptions?.[tableName]?.isModified ? '#fff59d' : 'white',
      }}
      rows={2}
      placeholder="Table description (optional)"
    />);
});


const MemoTableRow = React.memo(TableRow);

export function useDebouncedCallback(fn, delay = 300, deps = []) {
  const timer = useRef();

  const callback = useCallback(fn, deps);

  const debounced = useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return debounced;
}

function TableRow({ column, isModified, commentData, modifiedData, handleColumnCommentChange, tableName, getAllForeignKeyOptions, handleForeignKeyChange }) {

  const [text, setText] = useState(
    modifiedData?.description ?? (commentData.error ? '' : commentData.description)
  );

  useEffect(() => {
    if (modifiedData?.description !== undefined) {
      setText(modifiedData.description);
    }
  }, [modifiedData?.description]);

  const debouncedColCommentUpdate = useDebouncedCallback((value) => {
    handleColumnCommentChange(tableName, column.name, value);
  }
    , 300, [handleColumnCommentChange, tableName, column.name]);

  const onColumCommentChange = (e) => {
    setText(e.target.value);
    debouncedColCommentUpdate(e.target.value);
  };

  const currentForeignKeys = modifiedData?.foreignKeys !== undefined
    ? modifiedData.foreignKeys
    : (commentData.error ? [] : commentData.foreignKeys);

  const foreignKeyOptionsValue = getAllForeignKeyOptions(tableName).filter(option =>
    currentForeignKeys.includes(option.value)
  );

  return <tr
    key={column.name}
    style={{
      height: '42px',
      maxHeight: '42px',
      backgroundColor: isModified ? '#fffde7' : 'transparent'
    }}
  >
    <td style={{ padding: '4px' }}>{column.name}</td>
    <td style={{ padding: '4px' }}>{column.type}</td>
    <td style={{ padding: '4px' }}>
      {commentData.error ? (
        <div style={{ color: 'red' }}>
          <p>Invalid JSON format:</p>
          <pre style={{
            maxWidth: '500px',
            overflowX: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'pre-wrap',
            maxHeight: '1000px',
            backgroundColor: '#f8f8f8',
            padding: '5px',
          }}>{commentData.original}</pre>
        </div>
      ) : (
        <textarea
          type="text"
          value={text}
          onChange={onColumCommentChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            backgroundColor: isModified ? '#fff59d' : 'white',
          }}
          rows={2} />
      )}
    </td>
    <td style={{ padding: '4px' }}>
      {commentData.error ? (
        <div style={{ color: 'red' }}>Invalid JSON format</div>
      ) : (
        <AsyncSelect
          isMulti
          cacheOptions
          defaultOptions={getAllForeignKeyOptions(tableName)}
          loadOptions={(inputValue, callback) => {
            const allOptions = getAllForeignKeyOptions(tableName);
            const filtered = allOptions.filter(option =>
              option.label.toLowerCase().includes(inputValue.toLowerCase())
            );
            callback(filtered);
          }}
          value={foreignKeyOptionsValue}
          onChange={(selectedOptions) => {
            const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
            handleForeignKeyChange(tableName, column.name, values);
          }}
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: isModified ? '#fff59d' : 'white',
              borderColor: '#ddd',
              fontSize: '12px'
            }),
            valueContainer: (base) => ({
              ...base,
              padding: '0 8px',
              alignItems: 'center'
            }),
            input: (base) => ({
              ...base,
              margin: 0,
              padding: 0
            }),
            indicatorsContainer: (base) => ({
              ...base
            })
          }}
        />
      )}
    </td>
  </tr>;
}
