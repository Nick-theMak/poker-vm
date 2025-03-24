import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PROXY_URL } from '../config/constants';
import { getPublicKey, isUserPlaying } from '../utils/accountUtils';
import { whoIsNextToAct, getCurrentRound, getTotalPot, getPositionName } from '../utils/tableUtils';
import { getPlayersLegalActions, isPlayersTurn } from '../utils/playerUtils';
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import useUserWallet from "../hooks/useUserWallet";  // this is the browser wallet todo rename to useBrowserWallet

// Enable this to see verbose logging
const DEBUG_MODE = false;

// Helper function that only logs when DEBUG_MODE is true
const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

interface TableContextType {
  tableData: any;
  isLoading: boolean;
  error: Error | null;
  setTableData: (data: any) => void;
  nonce: number | null;
  refreshNonce: (address: string) => Promise<void>;
  userPublicKey: string | null;
  isCurrentUserPlaying: boolean;
  nextToActInfo: {
    seat: number;
    player: any;
    isCurrentUserTurn: boolean;
    availableActions: any[];
    timeRemaining: number;
  } | null;
  currentRound: string;
  totalPot: string;
  playerLegalActions: any[] | null;
  isPlayerTurn: boolean;
  dealTable: () => Promise<void>;
  canDeal: boolean;
  tableSize: number;
  tableType: string;
  roundType: string;
  openOneMore: boolean;
  openTwoMore: boolean;
  showThreeCards: boolean;
  performAction: (gameAddress: string, action: PlayerActionType, amount?: string, nonce?: number) => void;
  fold: () => void;
  check: () => void;
  call: () => void;
  raise: (amount: number) => void;
  bet: (amount: number) => void;
  setPlayerAction: (action: PlayerActionType, amount?: number) => void;
  // New user data by seat
  getUserBySeat: (seat: number) => any;
  currentUserSeat: number;
  userDataBySeat: Record<number, any>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

// Define WebSocket URL based on the proxy URL with safer parsing
const getWebSocketUrl = () => {
  try {
    // First try using the PROXY_URL
    const proxyUrl = new URL(PROXY_URL);
    return `${proxyUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${proxyUrl.host}/ws`;
  } catch (error) {
    // Fallback if PROXY_URL is invalid
    console.warn("Invalid PROXY_URL, falling back to default WebSocket URL");
    const hostname = window.location.hostname;
    if (hostname === 'app.block52.xyz') {
      return 'wss://proxy.block52.xyz/ws';
    } else {
      return `ws://${hostname}:8080/ws`;
    }
  }
};

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { id: tableId } = useParams<{ id: string }>();
  const wsRef = useRef<WebSocket | null>(null);
  
  const [tableData, setTableData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState<number | null>(null);
  const [userPublicKey, setUserPublicKey] = useState<string | null>(null);
  const [isCurrentUserPlaying, setIsCurrentUserPlaying] = useState<boolean>(false);
  const [nextToActInfo, setNextToActInfo] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<string>('');
  const [totalPot, setTotalPot] = useState<string>('0');
  const [playerLegalActions, setPlayerLegalActions] = useState<any[] | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);
  const [usePolling, setUsePolling] = useState<boolean>(true);
  const [tableSize, setTableSize] = useState<number>(9);
  const [tableType, setTableType] = useState<string>("");
  const [roundType, setRoundType] = useState<string>("");
  const [openOneMore, setOpenOneMore] = useState<boolean>(false);
  const [openTwoMore, setOpenTwoMore] = useState<boolean>(false);
  const [showThreeCards, setShowThreeCards] = useState<boolean>(false);
  // Add state for user data by seat
  const [userDataBySeat, setUserDataBySeat] = useState<Record<number, any>>({});
  const [currentUserSeat, setCurrentUserSeat] = useState<number>(-1);
  // Track WebSocket connection status
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [canDeal, setCanDeal] = useState<boolean>(false);
  
  const { b52 } = useUserWallet();

  // Helper to get user address from storage once
  const userWalletAddress = React.useMemo(() => {
    const address = localStorage.getItem("user_eth_public_key");
    return address ? address.toLowerCase() : null;
  }, []);

  // Calculate who is next to act whenever tableData changes
  useEffect(() => {
    if (tableData && tableData.data) {
      // Special case: if dealer position is 9, treat it as 0 for UI purposes
      if (tableData.data.dealer === 9) {
        tableData.data.dealer = 0;
      }
      
      // Use the utility function to determine who is next to act
      const nextToActData = whoIsNextToAct(tableData.data);
      setNextToActInfo(nextToActData);
      
      // Update other table information
      setCurrentRound(getCurrentRound(tableData.data));
      setTotalPot(getTotalPot(tableData.data));

      // Update current user's seat when table data changes
      if (userWalletAddress && tableData.data.players) {
        const playerIndex = tableData.data.players.findIndex(
          (player: any) => player.address?.toLowerCase() === userWalletAddress
        );
        setCurrentUserSeat(playerIndex >= 0 ? playerIndex : -1);
      }
    }
  }, [tableData, userWalletAddress]);

  // Fetch user data by seat when needed
  const fetchUserBySeat = useCallback(async (seat: number) => {
    if (!tableId || seat < 0 || !tableData?.data?.players?.[seat]) return null;
    
    try {
      // Check if we already have cached data and it's not stale
      const cachedData = userDataBySeat[seat];
      const isStale = !cachedData || 
                     (cachedData.lastFetched && 
                      Date.now() - cachedData.lastFetched > 30000); // Refresh every 30 seconds
      
      // If we have non-stale data, use it
      if (cachedData && !isStale) {
        return cachedData.data;
      }
      
      const response = await axios.get(`${PROXY_URL}/table/${tableId}/player/${seat}`);
      
      // Update the cache with new data and timestamp
      setUserDataBySeat(prev => ({
        ...prev,
        [seat]: { 
          data: response.data,
          lastFetched: Date.now()
        }
      }));
      
      return response.data;
    } catch (error) {
      if (DEBUG_MODE) console.error(`Error fetching user data for seat ${seat}:`, error);
      return null;
    }
  }, [tableId, tableData?.data?.players, userDataBySeat]);

  // Helper function to get user data by seat (from cache or fetch if needed)
  const getUserBySeat = useCallback((seat: number) => {
    const cachedData = userDataBySeat[seat];
    
    // If we don't have data or it's stale, trigger a fetch
    if (!cachedData || 
        (cachedData.lastFetched && Date.now() - cachedData.lastFetched > 30000)) {
      fetchUserBySeat(seat);
    }
    
    return cachedData?.data || null;
  }, [userDataBySeat, fetchUserBySeat]);

  // WebSocket connection setup with reconnection logic
  useEffect(() => {
    if (!tableId) return;
    
    debugLog('Setting up WebSocket connection for table:', tableId);
    
    // Close any existing connection
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      debugLog('Closing existing WebSocket connection');
      wsRef.current.close();
    }
    
    let reconnectTimer: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 2000; // 2 seconds
    
    const connectWebSocket = () => {
      try {
        // Get WebSocket URL with fallback
        const wsUrl = getWebSocketUrl();
        debugLog(`Connecting to WebSocket URL (attempt ${reconnectAttempts + 1}):`, wsUrl);
        
        // Create the WebSocket with error handling
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        ws.onopen = () => {
          debugLog('WebSocket connection established');
          setWsConnected(true);
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          
          // Subscribe to table updates
          const subscribeMessage = JSON.stringify({
            type: 'subscribe',
            tableId: tableId
          });
          debugLog('Sending subscription message:', subscribeMessage);
          ws.send(subscribeMessage);
          
          // Send a ping every 30 seconds to keep the connection alive
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            } else {
              clearInterval(pingInterval);
            }
          }, 30000);
        };
        
        ws.onmessage = (event) => {
          try {
            if (DEBUG_MODE) debugLog('WebSocket message received:', event.data);
            const data = JSON.parse(event.data);
            
            if (data.type === 'welcome') {
              debugLog('Received welcome message from server');
            } else if (data.type === 'tableUpdate') {
              debugLog('Received table update via WebSocket');
              
              if (data.data) {
                debugLog('Setting table data from WebSocket update');
                
                // Ensure all critical properties are present
                const tableState = data.data;
                
                // Make sure we're setting the data in the exact format expected by components
                const formattedData = {
                  data: tableState
                };
                
                setTableData(formattedData);
                setIsLoading(false);
              }
            } else if (data.type === 'subscribed') {
              debugLog('Successfully subscribed to table updates');
            } else if (data.type === 'pong') {
              debugLog('Received pong from server');
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };
        
        ws.onclose = (event) => {
          debugLog('WebSocket connection closed:', event.code, event.reason);
          setWsConnected(false);
          
          // Attempt to reconnect unless we're unmounting
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            debugLog(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_DELAY}ms`);
            
            reconnectTimer = setTimeout(() => {
              connectWebSocket();
            }, RECONNECT_DELAY);
          } else {
            console.log('Maximum WebSocket reconnect attempts reached, falling back to polling');
            setUsePolling(true);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        setUsePolling(true);
      }
    };
    
    connectWebSocket();
    
    return () => {
      debugLog('Cleaning up WebSocket connection');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
    };
  }, [tableId]);

  // Polling fallback - optimized to reduce unnecessary updates
  useEffect(() => {
    if (!tableId || (!usePolling && wsConnected)) return;
    
    debugLog(`Using ${wsConnected ? 'backup' : 'primary'} polling for table data`);
    
    let isFirstLoad = true;
    let lastUpdateTimestamp = 0;
    
    const fetchTableData = async () => {
      // Add debounce - only fetch if it's been at least 2 seconds since last update
      const now = Date.now();
      if (!isFirstLoad && now - lastUpdateTimestamp < 2000) {
        return;
      }
      
      debugLog('Polling: fetching data for table ID:', tableId);
      
      try {
        const baseUrl = window.location.hostname === 'app.block52.xyz' 
          ? 'https://proxy.block52.xyz'
          : PROXY_URL;

        debugLog('Using baseUrl:', baseUrl);
        
        const response = await axios.get(`${baseUrl}/table/${tableId}`);
        
        if (!response.data) {
          console.error('Polling received empty data');
          return;
        }
        
        // Only update if critical data has changed
        setTableData((prevData: any) => {
          if (!prevData || !prevData.data || isFirstLoad) {
            isFirstLoad = false;
            lastUpdateTimestamp = now;
            return { data: response.data };
          }
          
          // Special case: normalize dealer position
          // If dealer position is 9 in the response, treat it as 0 for consistency
          if (response.data.dealer === 9) {
            response.data.dealer = 0;
          }
          
          // Check if any critical game state has changed
          const hasPlayerChanges = JSON.stringify(response.data.players) !== 
                                  JSON.stringify(prevData.data.players);
          const hasNextToActChanged = response.data.nextToAct !== prevData.data.nextToAct;
          const hasRoundChanged = response.data.round !== prevData.data.round;
          const hasBoardChanged = JSON.stringify(response.data.board || response.data.communityCards) !== 
                                 JSON.stringify(prevData.data.board || prevData.data.communityCards);
          const hasPotChanged = JSON.stringify(response.data.pots) !== 
                                   JSON.stringify(prevData.data.pots);
          
          const hasImportantChanges = hasPlayerChanges || hasNextToActChanged || 
                                     hasRoundChanged || hasBoardChanged || hasPotChanged;
          
          if (hasImportantChanges) {
            debugLog('Polling detected changes, updating table data');
            lastUpdateTimestamp = now;
            return { data: response.data };
          }
          
          debugLog('Polling detected no changes, keeping current state');
          return prevData;
        });
      } catch (err) {
        console.error('Error fetching table data:', err);
      }
    };

    // Initial fetch
    fetchTableData();

    // Set up polling with longer interval when WebSocket is connected
    const interval = setInterval(
      fetchTableData, 
      wsConnected ? 10000 : 5000  // Slower polling when WS is connected
    );

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [tableId, usePolling, wsConnected]);

  // Update public key calculation
  useEffect(() => {
    const calculatePublicKey = () => {
      const privateKey = localStorage.getItem('user_eth_private_key');
      if (privateKey) {
        try {
          const publicKey = getPublicKey(privateKey);
          setUserPublicKey(publicKey);
          debugLog('Calculated Public Key:', publicKey);
        } catch (error) {
          console.error('Error calculating public key:', error);
        }
      }
    };

    calculatePublicKey();
  }, []);

  // Refresh nonce with debounce
  const refreshNonce = useCallback(async (address: string) => {
    try {
      const response = await axios.get(`${PROXY_URL}/nonce/${address}`);
      debugLog('Nonce Data:', response.data.result.data.nonce);
      
      if (response.data?.result?.data?.nonce !== undefined) {
        setNonce(response.data.result.data.nonce);
        return response.data.result.data.nonce;
      }
      return null;
    } catch (error) {
      console.error('Error fetching nonce:', error);
      return null;
    }
  }, []);

  // Optimize nonce refresh - less frequent polling
  useEffect(() => {
    const address = localStorage.getItem('user_eth_public_key');
    if (address) {
      refreshNonce(address);
      // Reduce frequency from 10s to 15s - still fast enough for gameplay
      const interval = setInterval(() => refreshNonce(address), 15000);
      return () => clearInterval(interval);
    }
  }, [refreshNonce]);

  // Update isCurrentUserPlaying when tableData changes
  useEffect(() => {
    if (tableData && tableData.data) {
      setIsCurrentUserPlaying(isUserPlaying(tableData.data));
    }
  }, [tableData]);

  // Update player legal actions when tableData changes
  useEffect(() => {
    if (tableData && tableData.data) {
      const userAddress = localStorage.getItem('user_eth_public_key');
      if (userAddress) {
        setPlayerLegalActions(getPlayersLegalActions(tableData.data, userAddress));
        setIsPlayerTurn(isPlayersTurn(tableData.data, userAddress));
      } else {
        setPlayerLegalActions(null);
        setIsPlayerTurn(false);
      }
    }
  }, [tableData]);

  // When the user has joined a table, fetch their seat data
  useEffect(() => {
    if (currentUserSeat >= 0 && tableId) {
      fetchUserBySeat(currentUserSeat);
    }
  }, [currentUserSeat, tableId, fetchUserBySeat]);

  // Add the deal function
  const dealTable = async () => {
    if (!tableId) {
      console.error("No table ID available");
      return;
    }
    
    try {
      debugLog("Dealing cards for table:", tableId);
      
      const response = await axios.post(`${PROXY_URL}/table/${tableId}/deal`);
      debugLog("Deal response:", response.data);
      
      if (response.data?.result?.data) {
        setTableData({ data: response.data.result.data });
      }
    } catch (error) {
      console.error("Error dealing cards:", error);
    }
  };

  // Add these functions from PlayerContext
  const performAction = useCallback(
    (gameAddress: string, action: PlayerActionType, amount?: string, nonce?: number) => {
      b52?.playerAction(gameAddress, action, amount ?? "", nonce);
    },
    [b52]
  );

  const fold = useCallback(() => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.FOLD, undefined, nonce);
    }
  }, [tableId, nonce, performAction]);

  const check = useCallback(() => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.CHECK, undefined, nonce);
    }
  }, [tableId, nonce, performAction]);

  const call = useCallback(() => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.CALL, undefined, nonce);
    }
  }, [tableId, nonce, performAction]);

  const raise = useCallback((amount: number) => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.RAISE, amount.toString(), nonce);
    }
  }, [tableId, nonce, performAction]);

  const bet = useCallback((amount: number) => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.BET, amount.toString(), nonce);
    }
  }, [tableId, nonce, performAction]);

  const setPlayerAction = useCallback((action: PlayerActionType, amount?: number) => {
    if (action === PlayerActionType.FOLD) {
      fold();
    } else if (action === PlayerActionType.CHECK) {
      check();
    } else if (action === PlayerActionType.CALL) {
      call();
    } else if (action === PlayerActionType.RAISE && amount !== undefined) {
      raise(amount);
    } else if (action === PlayerActionType.BET && amount !== undefined) {
      bet(amount);
    }
  }, [fold, check, call, raise, bet]);

  // Update table type and round info when table data changes
  useEffect(() => {
    if (tableData && tableData.data) {
      // Set table type if available in data
      setTableType(tableData.data.type || "No Limit Hold'em");
      
      // Set round type from the current round
      setRoundType(getCurrentRound(tableData.data));
    }
  }, [tableData]);

  // Add effect to determine if dealing is allowed
  useEffect(() => {
    if (tableData?.data) {
      // Check if any active player has the "deal" action in their legal actions
      const anyPlayerCanDeal = tableData.data.players?.some((player: any) => {
        return player.legalActions?.some((action: any) => action.action === "deal");
      }) || false;

      // Update canDeal state based on the presence of the deal action
      setCanDeal(anyPlayerCanDeal);

      if (DEBUG_MODE) {
        debugLog("Deal button visibility check:", {
          anyPlayerCanDeal,
          players: tableData.data.players?.map((p: any) => ({
            seat: p.seat,
            address: p.address,
            legalActions: p.legalActions
          }))
        });
      }
    } else {
      setCanDeal(false);
    }
  }, [tableData]);

  return (
    <TableContext.Provider value={{ 
      tableData: tableData ? { ...tableData, publicKey: userPublicKey } : null,
      setTableData, 
      isLoading, 
      error, 
      nonce, 
      refreshNonce, 
      userPublicKey,
      isCurrentUserPlaying,
      nextToActInfo,
      currentRound,
      totalPot,
      playerLegalActions,
      isPlayerTurn,
      dealTable,
      canDeal,
      tableSize,
      tableType,
      roundType,
      openOneMore,
      openTwoMore,
      showThreeCards,
      performAction,
      fold,
      check,
      call,
      raise,
      bet,
      setPlayerAction,
      // New user data functionality
      getUserBySeat,
      currentUserSeat,
      userDataBySeat
    }}>
      {children}
    </TableContext.Provider>
  );
};

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
}; 