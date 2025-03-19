import * as React from "react";
import { memo, useEffect, useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { usePlayerContext } from "../../../context/usePlayerContext";
import { PROXY_URL } from "../../../config/constants";
import axios from "axios";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { useTableContext } from "../../../context/TableContext";
import { NodeRpcClient } from "@bitcoinbrisbane/block52";
import { getSignature, getPublicKey } from '../../../utils/accountUtils';
import useUserWallet from "../../../hooks/useUserWallet";

type VacantPlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
};

const isDemoMode = true;

const VacantPlayer: React.FC<VacantPlayerProps> = memo(({ left, top, index }) => {
    const { tableData, setTableData, nonce, refreshNonce, userPublicKey } = useTableContext();
    const [localTableData, setLocalTableData] = useState(tableData);
    const { id: tableId } = useParams();
    const userAddress = localStorage.getItem("user_eth_public_key");
    const privateKey = localStorage.getItem("user_eth_private_key");
    const wallet = new ethers.Wallet(privateKey!);

    const { account, balance, isLoading: walletLoading } = useUserWallet(); // this is the wallet in the browser.

    // Add state for buy-in modal
    const [showBuyInModal, setShowBuyInModal] = useState(false);
    const [buyInAmount, setBuyInAmount] = useState("");
    const [buyInError, setBuyInError] = useState("");

    // Debug logs for initial state
    console.log(`VacantPlayer ${index} initial state:`, {
        userAddress,
        hasTableData: !!tableData,
        hasLocalTableData: !!localTableData,
        tableId
    });

    // Update local table data with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setLocalTableData(tableData);
            console.log(`VacantPlayer ${index} updated localTableData:`, {
                hasData: !!tableData,
                players: tableData?.data?.players?.map((p: any) => ({
                    address: p.address,
                    seat: p.seat
                }))
            });
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [tableData, index]);

    // First, check if user is already playing
    // First, check if user is already playing
    const isUserAlreadyPlaying = React.useMemo(() => {
        if (!userAddress) {
            console.log(`VacantPlayer ${index} - No user address found`);
            return false;
        }
        
        if (!localTableData?.data?.players) {
            console.log(`VacantPlayer ${index} - No players data found`);
            return false;
        }
        
        // Log each player for comparison
        localTableData.data.players.forEach((player: any, idx: number) => {
            console.log(`Player ${idx} comparison:`, {
                playerAddress: player.address,
                userAddress: userAddress,
                isMatch: player.address?.toLowerCase() === userAddress?.toLowerCase(),
                playerSeat: player.seat
            });
        });
        
        const result = localTableData.data.players.some((player: any) => 
            player.address?.toLowerCase() === userAddress?.toLowerCase()
        );
        
        console.log(`VacantPlayer ${index} - isUserAlreadyPlaying:`, result);
        return result;
    }, [localTableData?.data?.players, userAddress, index]);

    // Calculate next available seat
    const nextAvailableSeat = React.useMemo(() => {
        if (isUserAlreadyPlaying) {
            console.log(`VacantPlayer ${index} - User already playing, no available seat`);
            return -1;
        }
        
        // Get occupied seats
        const occupiedSeats = new Set();
        if (localTableData?.data?.players) {
            localTableData.data.players.forEach((player: any) => {
                if (player.address && player.address !== "0x0000000000000000000000000000000000000000") {
                    occupiedSeats.add(player.seat);
                }
            });
        }
        
        console.log(`VacantPlayer ${index} - Occupied seats:`, Array.from(occupiedSeats));
        
        // Find the first available seat (0-8)
        for (let i = 0; i < 9; i++) {
            if (!occupiedSeats.has(i)) {
                console.log(`VacantPlayer ${index} - First available seat:`, i);
                return i;
            }
        }
        
        console.log(`VacantPlayer ${index} - No available seats found`);
        return -1;
    }, [isUserAlreadyPlaying, localTableData?.data?.players, index]);

    // Check if this seat is vacant (not occupied by any player)
    const isSeatVacant = React.useMemo(() => {
        if (!localTableData?.data?.players) {
            return true; // If no player data, assume seat is vacant
        }
        
        // Check if any player occupies this seat
        const isOccupied = localTableData.data.players.some((player: any) => 
            player.seat === index && 
            player.address && 
            player.address !== "0x0000000000000000000000000000000000000000"
        );
        
        console.log(`VacantPlayer ${index} - isSeatVacant:`, !isOccupied);
        return !isOccupied;
    }, [localTableData?.data?.players, index]);

    // Check if this seat is available to join
    // Allow joining at any vacant seat
    const canJoinThisSeat = React.useMemo(() => {
        // User can join if:
        // 1. The seat is vacant
        // 2. The user is not already playing
        const result = isSeatVacant && !isUserAlreadyPlaying;
        
        console.log(`VacantPlayer ${index} - canJoinThisSeat:`, {
            isSeatVacant,
            isUserAlreadyPlaying,
            result
        });
        
        return result;
    }, [isSeatVacant, isUserAlreadyPlaying]);

    const isNextAvailableSeat = index === nextAvailableSeat;
    console.log(`VacantPlayer ${index} - isNextAvailableSeat:`, isNextAvailableSeat, {
        index,
        nextAvailableSeat
    });

    // Check if this is the first player
    const isFirstPlayer =
        !localTableData?.data?.players?.length || localTableData.data.players.every((player: any) => player.address === "0x0000000000000000000000000000000000000000");

    // Get blind values from table data
    const smallBlindWei = localTableData?.data?.smallBlind || "0";
    const bigBlindWei = localTableData?.data?.bigBlind || "0";
    const smallBlindDisplay = ethers.formatUnits(smallBlindWei, 18);
    const bigBlindDisplay = ethers.formatUnits(bigBlindWei, 18);

    // Get dealer position from table data
    const dealerPosition = localTableData?.data?.dealer || 0;
    console.log(`VacantPlayer ${index} - Dealer position:`, dealerPosition);

    // Calculate small blind and big blind positions
    const smallBlindPosition = (dealerPosition + 1) % 9; // Assuming 9 max seats
    const bigBlindPosition = (dealerPosition + 2) % 9;
    console.log(`VacantPlayer ${index} - Blind positions:`, {
        dealer: dealerPosition,
        smallBlind: smallBlindPosition,
        bigBlind: bigBlindPosition
    });

    // Helper function to get position name
    const getPositionName = (index: number) => {
        // Use the actual positions from table data instead of calculating
        const smallBlindPosition = localTableData?.data?.smallBlindPosition;
        const bigBlindPosition = localTableData?.data?.bigBlindPosition;
        const dealerPosition = localTableData?.data?.dealer;
        
        if (index === dealerPosition) return "Dealer (D)";
        if (index === smallBlindPosition) return "Small Blind (SB)";
        if (index === bigBlindPosition) return "Big Blind (BB)";
        return "";
    };

    const handleJoinClick = React.useCallback(async () => {
        console.log("\n=== JOIN CLICK DETECTED ===");
        console.log("Can join?", canJoinThisSeat);
        console.log("isSeatVacant:", isSeatVacant);
        console.log("isUserAlreadyPlaying:", isUserAlreadyPlaying);
        console.log("Seat Index:", index);
        console.log("Table ID:", tableId);
        
        if (!canJoinThisSeat) {
            console.log("Cannot join: either seat is taken or user is already playing");
            return;
        }
        
        // Instead of joining immediately, show the buy-in modal
        setShowBuyInModal(true);
        
        // Set default buy-in amount (20x big blind)
        const bigBlindValue = localTableData?.data?.bigBlind || "200000000000000000"; // 0.2 USDC
        const twentyBigBlinds = (BigInt(bigBlindValue) * BigInt(20)).toString();
        const defaultBuyIn = ethers.formatUnits(twentyBigBlinds, 18);
        setBuyInAmount(defaultBuyIn);
        
    }, [canJoinThisSeat, isUserAlreadyPlaying, tableId, localTableData, index]);
    
    // Function to handle the actual join after user confirms buy-in amount
    const handleConfirmBuyIn = async () => {
        if (!buyInAmount || parseFloat(buyInAmount) <= 0) {
            setBuyInError("Please enter a valid buy-in amount");
            return;
        }
    
        if (!isDemoMode) { // ✅ Only check funds if not in demo mode
            if (balance && BigInt(ethers.parseUnits(buyInAmount, 18)) > BigInt(balance)) {
                setBuyInError(`Amount exceeds your balance of ${ethers.formatUnits(balance, 18)} USDC`);
                return;
            }
        }
    
        try {
            console.log("Joining table in demo mode...");
            setShowBuyInModal(false);
            setBuyInError("");
    
            // Call join function immediately
            await handleJoinTable(ethers.parseUnits(buyInAmount, 18).toString());
        } catch (error) {
            console.error("Error processing buy-in:", error);
            setBuyInError("Failed to process buy-in. Please try again.");
        }
    };

    const handleJoinTable = async (buyInWei: string) => {
        if (!userAddress || !privateKey) {
            console.error("Missing user address or private key");
            return;
        }
    
        if (isDemoMode) {
            console.log("Demo mode enabled: skipping server request.");
            // ✅ Directly update table data (fake the join action)
            setTableData((prevData: any) => ({
                ...prevData,
                data: {
                    ...prevData.data,
                    players: [
                        ...prevData.data.players,
                        {
                            seat: nextAvailableSeat,
                            address: userAddress,
                            stack: buyInWei, // Fake stack amount
                            status: "active",
                        }
                    ]
                }
            }));
            return;
        }
    
        try {
            await refreshNonce(userAddress);
            const currentNonce = nonce?.toString() || "0";
    
            const signature = await getSignature(
                privateKey,
                currentNonce,
                userAddress,
                tableId,
                buyInWei,
                "join"
            );
    
            const requestData = {
                id: "1",
                method: "transfer",
                userAddress,
                tableId,
                buyInAmount: buyInWei,
                signature,
                publicKey: userPublicKey
            };
    
            console.log("Sending join request:", requestData);
            const response = await axios.post(`${PROXY_URL}/table/${tableId}/join`, requestData);
            console.log("Join response:", response.data);
    
            if (response.data?.result?.data) {
                setTableData(response.data.result.data);
            }
        } catch (error) {
            console.error("Error joining table:", error);
            setShowBuyInModal(true);
            setBuyInError("Failed to join table. Please try again.");
        }
    };
    
    // Only log position once during mount
    useEffect(() => {
        console.log("VacantPlayer mounted at position:", { left, top, index });
    }, []);

    return (
        <div
            className={`absolute ${isSeatVacant ? "cursor-pointer" : ""}`}
            style={{ left, top }}
            onClick={canJoinThisSeat ? handleJoinClick : undefined}
        >
            <div className={`flex justify-center gap-4 mb-2 ${canJoinThisSeat ? "hover:cursor-pointer" : "cursor-default"}`}>
                <FaRegUserCircle color="#f0f0f0" className="w-12 h-12" />
            </div>
            <div className="text-white text-center">
                <div className="text-sm mb-1">Seat {index}</div>
                
                {isUserAlreadyPlaying
                    ? "Already playing"
                    : canJoinThisSeat
                      ? index === localTableData?.data?.bigBlindPosition
                          ? `Click to Join ($${bigBlindDisplay})`
                          : index === localTableData?.data?.smallBlindPosition
                            ? `Click to Join ($${smallBlindDisplay})`
                            : `Click to Join`
                      : "Seat Taken"}
            </div>
            {/* Position indicator */}
            {getPositionName(index) && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="px-2 py-1 bg-gray-800/80 rounded-md text-xs text-white">{getPositionName(index)}</div>
                </div>
            )}
            
            {/* Buy-in Modal */}
            {showBuyInModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4 text-white">Buy In</h2>
                        <p className="mb-4 text-gray-300">
                            Enter the amount you want to buy in with (in USDC):
                        </p>
                        
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">Amount:</label>
                            <input
                                type="number"
                                value={buyInAmount}
                                onChange={(e) => setBuyInAmount(e.target.value)}
                                className="w-full p-2 bg-gray-700 text-white rounded"
                                placeholder="e.g., 4.0"
                                step="0.1"
                                min="0.1"
                            />
                            {buyInError && (
                                <p className="text-red-500 mt-1">{buyInError}</p>
                            )}
                        </div>
                        
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setShowBuyInModal(false);
                                    setBuyInError("");
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmBuyIn}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for memo
    return prevProps.left === nextProps.left && 
           prevProps.top === nextProps.top && 
           prevProps.index === nextProps.index;
});

VacantPlayer.displayName = "VacantPlayer";

export default VacantPlayer;
