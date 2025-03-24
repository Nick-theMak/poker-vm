import { useEffect, useState } from "react";
import * as React from "react";
import { useTableContext } from "../context/TableContext";
import { PlayerActionType } from "@bitcoinbrisbane/block52";


import axios from "axios";
import { getUserTableStatus } from "../utils/accountUtils";
import { isPlayerTurnToPostBlind } from "../utils/tableUtils";
import { ethers } from "ethers";

// Define a type for the user status
type UserTableStatus = {
    isInTable: boolean;
    isPlayerTurn: boolean;
    seat: any;
    stack: any;
    status: any;
    availableActions: any;
    canPostSmallBlind: any;
    canPostBigBlind: any;
    canCheck: any;
    canCall: any;
    canBet: any;
    canRaise: any;
    canFold: any;
    betLimits: any;
    raiseLimits: any;
    callAmount: any;
    smallBlindAmount: any;
    bigBlindAmount: any;
} | null;

const PokerActionPanel: React.FC = () => {
    const { tableData, playerLegalActions, isPlayerTurn, canDeal, dealTable } = useTableContext();
    const [publicKey, setPublicKey] = useState<string>();
    const [raiseAmount, setRaiseAmount] = useState(0);
    const [isBetAction, setIsBetAction] = useState(false);
    const [isCallAction, setIsCallAction] = useState(false);
    const [isCheckAction, setIsCheckAction] = useState(false);
    const [isRaiseAction, setIsRaiseAction] = useState(false);
    const [balance, setBalance] = useState(0);

    // Get user's seat from localStorage or tableData
    const userAddress = localStorage.getItem("user_eth_public_key")
    const userPlayer = tableData?.data?.players?.find((player: any) => player.address?.toLowerCase() === userAddress?.toLowerCase());
    const userSeat = userPlayer?.seat;
    
    // Check if current user has the deal action
    const currentUserCanDeal = userPlayer?.legalActions?.some((action: any) => action.action === "deal") || false;
    
    // Only show deal button if global canDeal is true AND current user has the deal action
    const shouldShowDealButton = canDeal && currentUserCanDeal;

    // const { data } = useUserBySeat(publicKey || "", userSeat);
    const [userStatus, setUserStatus] = useState<UserTableStatus>(null);

    // Get current player's possible actions
    const nextToAct = tableData?.nextToAct;
    const currentPlayer = tableData?.players?.find((p: any) => p.seat === nextToAct);
    const currentPlayerActions = currentPlayer?.legalActions || [];

    // Check if each action is available based on playerLegalActions
    const canFold = playerLegalActions?.some((a: any) => a.action === PlayerActionType.FOLD);
    const canCall = playerLegalActions?.some((a: any) => a.action === PlayerActionType.CALL);
    const canRaise = playerLegalActions?.some((a: any) => a.action === PlayerActionType.RAISE);
    const canCheck = playerLegalActions?.some((a: any) => a.action === PlayerActionType.CHECK);
    const canBet = playerLegalActions?.some((a: any) => a.action === PlayerActionType.BET);

    // Get min/max values for bet and raise
    const betAction = playerLegalActions?.find((a: any) => a.action === PlayerActionType.BET);
    const raiseAction = playerLegalActions?.find((a: any) => a.action === PlayerActionType.RAISE);
    const callAction = playerLegalActions?.find((a: any) => a.action === PlayerActionType.CALL);

    // Convert values to ETH for display
    const minBet = betAction ? Number(ethers.formatUnits(betAction.min || "0", 18)) : 0;
    const maxBet = betAction ? Number(ethers.formatUnits(betAction.max || "0", 18)) : 0;
    const minRaise = raiseAction ? Number(ethers.formatUnits(raiseAction.min || "0", 18)) : 0;
    const maxRaise = raiseAction ? Number(ethers.formatUnits(raiseAction.max || "0", 18)) : 0;
    const callAmount = callAction ? Number(ethers.formatUnits(callAction.min || "0", 18)) : 0;

    // Get total pot for percentage calculations
    const totalPot = tableData?.data?.pots?.reduce((sum: number, pot: string) => 
        sum + Number(ethers.formatUnits(pot, 18)), 0) || 0;

    useEffect(() => {
        if (tableData) {
            console.log("Table Data:asdfasd", tableData);
            const status = getUserTableStatus(tableData);
            console.log("User Status:", status);
            setUserStatus(status);

            // Check if it's the current user's turn directly from tableData
            const nextToActPlayer = tableData.players?.find((player: any) => player.seat === tableData.nextToAct);

            if (nextToActPlayer && nextToActPlayer.address?.toLowerCase() === userAddress) {
                console.log("It's your turn to act!");

                // Check if this is a small blind posting situation
                const isSmallBlindPosition = tableData.smallBlindPosition === nextToActPlayer.seat;
                console.log("Is small blind position:", isSmallBlindPosition);

                // Set minimal user status if needed
                if (!status) {
                    setUserStatus({
                        isInTable: true,
                        isPlayerTurn: true,
                        seat: nextToActPlayer.seat,
                        availableActions: nextToActPlayer.legalActions || [],
                        // Add other necessary properties with default values
                        stack: nextToActPlayer.stack || "0",
                        status: "active",
                        canPostSmallBlind: isSmallBlindPosition,
                        canPostBigBlind: tableData.bigBlindPosition === nextToActPlayer.seat,
                        canCheck: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.CHECK),
                        canCall: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.CALL),
                        canBet: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.BET),
                        canRaise: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.RAISE),
                        canFold: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.FOLD),
                        betLimits: null,
                        raiseLimits: null,
                        callAmount: "0",
                        smallBlindAmount: tableData.smallBlind || "0",
                        bigBlindAmount: tableData.bigBlind || "0"
                    });
                }
            }
        }
    }, [tableData]);



    useEffect(() => {
        const localKey = localStorage.getItem("user_eth_public_key");
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, [publicKey]);

    // Log the player's legal actions
    useEffect(() => {
        console.log("Footer - Player's legal actions:", {
            actions: playerLegalActions,
            isPlayerTurn,
            nextToAct: tableData?.nextToAct,
            userSeat
        });
    }, [playerLegalActions, isPlayerTurn, tableData, userSeat]);

    const handleRaiseChange = (newAmount: number) => {
        setRaiseAmount(newAmount);
    };

    // Player action function to handle all game actions
    const setPlayerAction = async (action: PlayerActionType, amount: string) => {
        console.log("Setting player action:", action, amount);
        if (!userAddress || !tableData?.data?.address) {
            console.error("Missing user address or table ID");
            return;
        }

        try {
            console.log(`Executing player action: ${action} with amount: ${amount}`);

            // Get the private key from localStorage
            const privateKey = localStorage.getItem("user_eth_private_key");
            if (!privateKey) {
                console.error("Private key not found");
                return;
            }

            // Create a wallet instance to sign the message
            const wallet = new ethers.Wallet(privateKey);

            // Create the message to sign (format: action + amount + tableId + timestamp)
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const tableId = tableData.data.address;
            const message = `${action}${amount}${tableId}${timestamp}`;

            // Sign the message
            const signature = await wallet.signMessage(message);

            console.log("Message signed:", message);
            console.log("Signature:", signature);

            // Send the action to the backend
            const proxyUrl = import.meta.env.VITE_PROXY_URL || "http://localhost:8080";
            const response = await axios.post(`${proxyUrl}/table/${tableId}/playeraction`, {
                userAddress,
                action,
                amount,
                signature,
                timestamp
            });

            console.log("Player action response:", response.data);

            // Reset UI states after action
            setIsBetAction(false);
            setIsCallAction(false);
            setIsCheckAction(false);
            setIsRaiseAction(false);
        } catch (error) {
            console.error("Error executing player action:", error);
        }
    };

    // Handler functions for different actions
    const handlePostSmallBlind = () => {
        console.log("Posting small blind");
        if (userStatus?.smallBlindAmount) {
            setPlayerAction(PlayerActionType.SMALL_BLIND, userStatus.smallBlindAmount);
        }
    };

    const handlePostBigBlind = () => {
        console.log("Posting big blind");
        
        // Add more detailed logging
        console.log("Big blind details:", {
            userStatus,
            bigBlindAmount: userStatus?.bigBlindAmount,
            tableData: tableData?.data
        });
        
        if (userStatus?.bigBlindAmount) {
            // Convert to string if it's not already
            const bigBlindAmountString = userStatus.bigBlindAmount.toString();
            console.log("Sending big blind action with amount:", bigBlindAmountString);
            
            // Call the action with explicit string conversion
            setPlayerAction(PlayerActionType.BIG_BLIND, bigBlindAmountString);
        } else {
            console.error("Missing big blind amount in userStatus");
        }
    };

    const handleCheck = () => {
        console.log("Checking");
        
    
        
        // iisSmallBlindInPreflop) 
            console.log("Small blind player in preflop - converting check to call");
            // Calculate the difference between big blind and small blind
            const smallBlindAmount = tableData?.data?.smallBlind || "0";
            const bigBlindAmount = tableData?.data?.bigBlind || "0";
            
            // Calculate difference to call (big blind - small blind)
            const diffAmount = BigInt(bigBlindAmount) - BigInt(smallBlindAmount);
            
            console.log("Calling with difference amount:", diffAmount.toString());
            setPlayerAction(PlayerActionType.CALL, diffAmount.toString());
        //  else 
        //     // Regular check action
        //     setPlayerAction(PlayerActionType.CHECK, "100000000000000000");
        //     // waht shoudl we say here?
        //     console.log("You can't check here");
        // }
    };

    const handleCall = () => {
        console.log("Calling");
        if (callAction) {
            // Use the callAction.min value directly from the action object
            // This ensures we're using the exact value expected by the contract
            console.log("Calling with amount:", callAction.min);
            setPlayerAction(PlayerActionType.CALL, callAction.min.toString());
        } else {
            console.error("Call action not available");
        }
    };

    const handleFold = () => {
        console.log("Folding");
        setPlayerAction(PlayerActionType.FOLD, "0");
    };

    const handleBet = () => {
        console.log("Betting");
        setIsBetAction(true);
    };

    const handleRaise = () => {
        console.log("Raising");
        setIsRaiseAction(true);
    };

    const submitRaise = () => {
        if (raiseAmount > 0) {
            // Convert the raiseAmount (which is in ETH) back to wei for the contract
            const raiseAmountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();
            console.log("Raising with amount (wei):", raiseAmountWei);
            setPlayerAction(PlayerActionType.RAISE, raiseAmountWei);
            setIsRaiseAction(false);
        }
    };

    const submitBet = () => {
        if (raiseAmount > 0) {
            // Convert the raiseAmount (which is in ETH) back to wei for the contract
            const betAmountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();
            console.log("Betting with amount (wei):", betAmountWei);
            setPlayerAction(PlayerActionType.BET, betAmountWei);
            setIsBetAction(false);
        }
    };

    // Make sure we're passing the actual table data object, not the wrapper
    const actualTableData = tableData?.data;
    
    // Use our helper functions to determine if blind buttons should be shown
    const shouldShowSmallBlindButton = isPlayerTurnToPostBlind(actualTableData, userAddress || "", 'small');
    const shouldShowBigBlindButton = isPlayerTurnToPostBlind(actualTableData, userAddress || "", 'big');
    
    // Add debug logging to see what's happening
    console.log("Blind button visibility:", {
        userAddress,
        shouldShowSmallBlindButton,
        shouldShowBigBlindButton,
        tableData: actualTableData
    });

    // Add a more robust check for whether it's actually the player's turn
    useEffect(() => {
        // Log detailed information about the current game state
        console.log("Detailed game state check:", {
            tableData,
            playerLegalActions,
            isPlayerTurn,
            activePlayers: tableData?.data?.players?.filter((p: any) => 
                p.status !== 'folded' && p.status !== 'sitting-out'),
            userAddress,
            nextToAct: tableData?.data?.nextToAct
        });
        
        // If there are no legal actions or all players except one have folded,
        // we shouldn't show action buttons even if isPlayerTurn is true
        const activePlayers = tableData?.data?.players?.filter((p: any) => 
            p.status !== 'folded' && p.status !== 'sitting-out');
        
        if (activePlayers?.length <= 1) {
            console.log("Only one active player left - no actions needed");
        }
    }, [tableData, playerLegalActions, isPlayerTurn, userAddress]);

    // Update the showActionButtons logic to be more robust
    const hasLegalActions = playerLegalActions && playerLegalActions.length > 0;
    const activePlayers = tableData?.data?.players?.filter((p: any) => 
        p.status !== 'folded' && p.status !== 'sitting-out');
    const gameInProgress = activePlayers && activePlayers.length > 1;

    // Only show action buttons if it's the player's turn, they have legal actions, the game is in progress,
    // AND there's no big blind or small blind to post (prioritize blind posting)
    const showActionButtons = isPlayerTurn && hasLegalActions && gameInProgress && 
        !shouldShowBigBlindButton && !shouldShowSmallBlindButton;

    // Add this function to handle big blind posting
    const emergencyPostBigBlind = () => {
        console.log("Emergency Big Blind function called");
        
        if (!tableData || !tableData.data) {
            console.error("No table data available");
            return;
        }
        
        const bigBlindAmount = tableData.data.bigBlind || "0";
        console.log("Big blind amount:", bigBlindAmount);
        
        // Call the action handler directly
        setPlayerAction(PlayerActionType.BIG_BLIND, bigBlindAmount);
    };

    // Add this at the top of your component
    useEffect(() => {
        // Create a global keyboard shortcut for posting big blind
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'b' && shouldShowBigBlindButton) {
                console.log("Big blind keyboard shortcut triggered");
                
                if (!tableData || !tableData.data) {
                    console.error("No table data available");
                    return;
                }
                
                const bigBlindAmount = tableData.data.bigBlind || "0";
                console.log("Big blind amount:", bigBlindAmount);
                
                // Call the action handler directly
                setPlayerAction(PlayerActionType.BIG_BLIND, bigBlindAmount);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [tableData, shouldShowBigBlindButton]);

    // Add a handler for the deal button
    const handleDeal = () => {
        console.log("Deal button clicked");
        dealTable();
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1e2a3a] via-[#2c3e50] to-[#1e2a3a] text-white p-4 pb-6 flex justify-center items-center border-t-2 border-[#3a546d] relative">
            {/* Animated light effects */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#64ffda] to-transparent opacity-70"></div>
                <div className="absolute top-[10%] left-[1%] w-[1px] h-[80%] bg-[#64ffda] opacity-20 animate-pulse"></div>
                <div className="absolute top-[10%] right-[1%] w-[1px] h-[80%] bg-[#64ffda] opacity-20 animate-pulse" style={{animationDelay: '0.7s'}}></div>
            </div>
            
            <div className="flex flex-col w-[600px] space-y-3 justify-center rounded-lg relative z-10">
                {/* Deal Button - Show above other buttons when available */}
                {shouldShowDealButton && (
                    <div className="flex justify-center mb-3">
                        <button
                            onClick={handleDeal}
                            className="bg-gradient-to-r from-[#2c7873] to-[#1e5954] hover:from-[#1e5954] hover:to-[#0f2e2b] 
                            text-white font-bold py-3 px-8 rounded-lg shadow-lg 
                            border-2 border-[#3a9188] transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            DEAL
                        </button>
                    </div>
                )}

                {/* Player Action Buttons Container */}
                <div className="flex justify-center items-center">
                    {shouldShowSmallBlindButton && (
                        <button
                            onClick={handlePostSmallBlind}
                            className="bg-gradient-to-r from-[#2c7873] to-[#1e5954] hover:from-[#1e5954] hover:to-[#0f2e2b] 
                            text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all duration-200 
                            border border-[#3a9188] hover:border-[#64ffda] flex items-center transform hover:scale-105"
                        >
                            <span className="mr-1">Post Small Blind</span>
                            <span className="bg-[#0f172a80] px-2 py-1 rounded text-[#64ffda] text-sm">
                                ${Number(ethers.formatUnits(userStatus?.smallBlindAmount || "0", 18)).toFixed(2)}
                            </span>
                        </button>
                    )}

                    {shouldShowBigBlindButton && (
                        <button
                            onClick={handlePostBigBlind}
                            className="bg-gradient-to-r from-[#2c7873] to-[#1e5954] hover:from-[#1e5954] hover:to-[#0f2e2b] 
                            text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all duration-200 
                            border border-[#3a9188] hover:border-[#64ffda] flex items-center transform hover:scale-105"
                        >
                            <span className="mr-1">Post Big Blind</span>
                            <span className="bg-[#0f172a80] px-2 py-1 rounded text-[#64ffda] text-sm">
                                ${Number(ethers.formatUnits(userStatus?.bigBlindAmount || "0", 18)).toFixed(2)}
                            </span>
                        </button>
                    )}
                </div>

                {/* Only show action buttons if it's the player's turn, they have legal actions, and it's not time to post blinds */}
                {showActionButtons ? (
                    <>
                        <div className="flex justify-between gap-2">
                            {canFold && (
                                <button
                                    className="cursor-pointer bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] hover:from-[#991b1b] hover:to-[#b91c1c]
                                    px-4 py-2 rounded-lg w-full border border-[#7f1d1d] hover:border-[#ef4444] shadow-md
                                    transition-all duration-200 font-medium transform hover:scale-105"
                                    onClick={handleFold}
                                >
                                    FOLD
                                </button>
                            )}
                            {canCheck && (
                                <button
                                    className="cursor-pointer bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] hover:from-[#1e40af] hover:to-[#2563eb]
                                    px-4 py-2 rounded-lg w-full border border-[#1e3a8a] hover:border-[#3b82f6] shadow-md
                                    transition-all duration-200 font-medium transform hover:scale-105"
                                    onClick={handleCheck}
                                >
                                    CHECK
                                </button>
                            )}
                            {canCall && (
                                <button
                                    className="cursor-pointer bg-gradient-to-r from-[#065f46] to-[#047857] hover:from-[#047857] hover:to-[#059669]
                                    px-4 py-2 rounded-lg w-full border border-[#065f46] hover:border-[#10b981] shadow-md
                                    transition-all duration-200 font-medium transform hover:scale-105"
                                    onClick={handleCall}
                                >
                                    CALL <span className="text-[#64ffda]">${callAmount.toFixed(2)}</span>
                                </button>
                            )}
                            {canRaise && (
                                <button
                                    className="cursor-pointer bg-gradient-to-r from-[#7e22ce] to-[#9333ea] hover:from-[#9333ea] hover:to-[#a855f7]
                                    px-4 py-2 rounded-lg w-full border border-[#7e22ce] hover:border-[#c084fc] shadow-md
                                    transition-all duration-200 font-medium transform hover:scale-105"
                                    onClick={handleRaise}
                                >
                                    RAISE <span className="text-[#64ffda]">${raiseAmount.toFixed(2)}</span>
                                </button>
                            )}
                            {canBet && (
                                <button
                                    className="cursor-pointer bg-gradient-to-r from-[#7e22ce] to-[#9333ea] hover:from-[#9333ea] hover:to-[#a855f7]
                                    px-4 py-2 rounded-lg w-full border border-[#7e22ce] hover:border-[#c084fc] shadow-md
                                    transition-all duration-200 font-medium transform hover:scale-105"
                                    onClick={handleBet}
                                >
                                    BET <span className="text-[#64ffda]">${raiseAmount.toFixed(2)}</span>
                                </button>
                            )}
                        </div>

                        {/* Only show slider and betting options if player can bet or raise */}
                        {(canBet || canRaise) && (
                            <>
                                {/* Slider and Controls */}
                                <div className="flex items-center space-x-4 bg-[#0f172a40] p-2 rounded-lg border border-[#3a546d]">
                                    <button
                                        className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                        py-1 px-4 rounded-lg border border-[#3a546d] hover:border-[#64ffda]
                                        transition-all duration-200"
                                        onClick={() => handleRaiseChange(Math.max(raiseAmount - 0.1, canBet ? minBet : minRaise))}
                                        disabled={!isPlayerTurn}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="range"
                                        min={canBet ? minBet : minRaise}
                                        max={canBet ? maxBet : maxRaise}
                                        step={0.1}
                                        value={raiseAmount}
                                        onChange={e => handleRaiseChange(Number(e.target.value))}
                                        className="flex-1 accent-[#64ffda]"
                                        disabled={!isPlayerTurn}
                                    />
                                    <button
                                        className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                        py-1 px-4 rounded-lg border border-[#3a546d] hover:border-[#64ffda]
                                        transition-all duration-200"
                                        onClick={() => handleRaiseChange(Math.min(raiseAmount + 0.1, canBet ? maxBet : maxRaise))}
                                        disabled={!isPlayerTurn}
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Additional Options */}
                                <div className="flex justify-between gap-2 mb-1">
                                    <button
                                        className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                        px-2 py-1.5 rounded-lg w-full border border-[#3a546d] hover:border-[#64ffda] shadow-md
                                        transition-all duration-200 text-xs transform hover:scale-105"
                                        onClick={() => setRaiseAmount(Math.max(totalPot / 4, canBet ? minBet : minRaise))}
                                        disabled={!isPlayerTurn}
                                    >
                                        1/4 Pot
                                    </button>
                                    <button
                                        className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                        px-2 py-1.5 rounded-lg w-full border border-[#3a546d] hover:border-[#64ffda] shadow-md
                                        transition-all duration-200 text-xs transform hover:scale-105"
                                        onClick={() => setRaiseAmount(Math.max(totalPot / 2, canBet ? minBet : minRaise))}
                                        disabled={!isPlayerTurn}
                                    >
                                        1/2 Pot
                                    </button>
                                    <button
                                        className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                        px-2 py-1.5 rounded-lg w-full border border-[#3a546d] hover:border-[#64ffda] shadow-md
                                        transition-all duration-200 text-xs transform hover:scale-105"
                                        onClick={() => setRaiseAmount(Math.max((totalPot / 4) * 3, canBet ? minBet : minRaise))}
                                        disabled={!isPlayerTurn}
                                    >
                                        3/4 Pot
                                    </button>
                                    <button
                                        className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                        px-2 py-1.5 rounded-lg w-full border border-[#3a546d] hover:border-[#64ffda] shadow-md
                                        transition-all duration-200 text-xs transform hover:scale-105"
                                        onClick={() => setRaiseAmount(Math.max(totalPot, canBet ? minBet : minRaise))}
                                        disabled={!isPlayerTurn}
                                    >
                                        Pot
                                    </button>
                                    <button
                                        className="bg-gradient-to-r from-[#7e22ce] to-[#9333ea] hover:from-[#9333ea] hover:to-[#a855f7]
                                        px-2 py-1.5 rounded-lg w-full border border-[#7e22ce] hover:border-[#c084fc] shadow-md
                                        transition-all duration-200 text-xs font-medium transform hover:scale-105"
                                        onClick={() => setRaiseAmount(canBet ? maxBet : maxRaise)}
                                        disabled={!isPlayerTurn}
                                    >
                                        ALL-IN
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default PokerActionPanel;
