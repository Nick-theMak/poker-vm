import { useEffect, useState } from "react";
import { playerPosition, chipPosition, dealerPosition } from "../../utils/PositionArray";
import { IoMenuSharp } from "react-icons/io5";
import PokerActionPanel from "../Footer";
import PokerLog from "../PokerLog";
import OppositePlayerCards from "./Card/OppositePlayerCards";
import VacantPlayer from "./Players/VacantPlayer";
import OppositePlayer from "./Players/OppositePlayer";
import Player from "./Players/Player";
import Dealer from "./common/Dealer";
import Chip from "./common/Chip";
import { usePlayerContext } from "../../context/usePlayerContext";
import { PlayerStatus, TexasHoldemGameStateDTO, TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import TurnAnimation from "./TurnAnimation/TurnAnimation";
import { LuPanelLeftOpen } from "react-icons/lu";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { LuPanelLeftClose } from "react-icons/lu";
import useUserWallet from "../../hooks/useUserWallet";
import { useNavigate, useParams } from "react-router-dom";

import useUserBySeat from "../../hooks/useUserBySeat";

import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { PROXY_URL } from "../../config/constants";
import { useTableContext } from "../../context/TableContext";
import { FaCopy } from "react-icons/fa";
import { getUserTableStatus } from "../../utils/accountUtils";
import React from "react";
import { getDealerPosition, getBigBlindPosition, getSmallBlindPosition } from '../../utils/tableUtils';

//* Here's the typical sequence of a poker hand:
//* ANTE - Initial forced bets
//* PREFLOP - Players get their hole cards, betting round
//* FLOP - First 3 community cards dealt, betting round
//* TURN - Fourth community card dealt, betting round
//* RIVER - Final community card dealt, final betting round
//* SHOWDOWN - Players show their cards to determine winner

//* Define the interface for the position object
interface PositionArray {
    left?: string;
    top?: string;
    bottom?: string;
    right?: string;
    color?: string;
}

const calculateZoom = () => {
    const baseWidth = 1600;
    const baseHeight = 850;
    const scaleWidth = window.innerWidth / baseWidth;
    const scaleHeight = window.innerHeight / baseHeight;
    const calculatedScale = Math.min(scaleWidth, scaleHeight);
    return Math.max(calculatedScale, 0.7);
};

const useTableData = () => {
    const { tableData, isLoading, error } = useTableContext();

    // Default empty state
    const emptyState = {
        isLoading: false,
        error: null,
        tableDataType: "cash",
        tableDataAddress: "",
        tableDataSmallBlind: "0",
        tableDataBigBlind: "0",
        tableDataSmallBlindPosition: 0,
        tableDataBigBlindPosition: 0,
        tableDataDealer: 0,
        tableDataPlayers: [],
        tableDataCommunityCards: [],
        tableDataDeck: "",
        tableDataPots: ["0"],
        tableDataNextToAct: -1,
        tableDataRound: "preflop",
        tableDataWinners: [],
        tableDataSignature: ""
    };

    if (isLoading) {
        return { ...emptyState, isLoading: true };
    }

    if (error) {
        return { ...emptyState, error };
    }

    const data = tableData?.data;
    if (!data || data.type !== "cash") {
        return emptyState;
    }

    return {
        isLoading: false,
        error: null,
        tableDataType: data.type,
        tableDataAddress: data.address,
        tableDataSmallBlind: `${Number(ethers.formatUnits(data.smallBlind || "0", 18))}`,
        tableDataBigBlind: `${Number(ethers.formatUnits(data.bigBlind || "0", 18))}`,
        tableDataSmallBlindPosition: data.smallBlindPosition,
        tableDataBigBlindPosition: data.bigBlindPosition,
        tableDataDealer: data.dealer,
        tableDataPlayers: data.players || [],
        tableDataCommunityCards: data.communityCards || [],
        tableDataDeck: data.deck || "",
        tableDataPots: data.pots || ["0"],
        tableDataNextToAct: data.nextToAct ?? -1,
        tableDataRound: data.round || "preflop",
        tableDataWinners: data.winners || [],
        tableDataSignature: data.signature || ""
    };
};

// Helper function to format Wei to USD with commas
const formatWeiToUSD = (weiAmount: string | number): string => {
    try {
        // Convert from Wei (18 decimals) to standard units
        const usdValue = Number(ethers.formatUnits(weiAmount.toString(), 18));
        // Format to 2 decimal places and add commas
        return usdValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (error) {
        console.error("Error formatting Wei amount:", error);
        return "0.00";
    }
};



const Table = () => {
    const { id } = useParams<{ id: string }>();
    const context = usePlayerContext();
    const { tableData, nextToActInfo, currentRound, totalPot, playerLegalActions, isPlayerTurn } = useTableContext();
    
    // Keep the existing variable
    const currentUserAddress = localStorage.getItem("user_eth_public_key");
    console.log("Current user address from localStorage:", currentUserAddress);

    // Create a different variable for comparison purposes
    const userWalletAddress = React.useMemo(() => {
        return currentUserAddress ? currentUserAddress.toLowerCase() : null;
    }, [currentUserAddress]);

    // Add the new hook usage here with prefixed names
    const tableDataValues = useTableData();
    
    // Find the current user's seat using the new variable
    const currentUserSeat = React.useMemo(() => {
        if (!userWalletAddress || !tableDataValues.tableDataPlayers) return -1;
        
        const playerIndex = tableDataValues.tableDataPlayers.findIndex(
            (player: any) => player.address?.toLowerCase() === userWalletAddress
        );
        
        return playerIndex >= 0 ? playerIndex : -1;
    }, [userWalletAddress, tableDataValues.tableDataPlayers]);

    // // Only log when tableData changes, not on every render
    // useEffect(() => {
    //     console.log("Destructured Table Data:", tableDataValues);
    //     console.log("Current User Seat:", currentUserSeat);
    // }, [tableDataValues, currentUserSeat]);

    // Define activePlayers only once
    const activePlayers = tableDataValues.tableDataPlayers?.filter((player: any) => player.address !== "0x0000000000000000000000000000000000000000") ?? [];

    useEffect(() => {
        console.log("Active Players:", activePlayers);
        // If there are active players, set their positions
        if (activePlayers.length > 0) {
            // Player in seat 0
            if (activePlayers.find((p: any) => p.seat === 0)) {
                const player0 = activePlayers.find((p: any) => p.seat === 0);
                console.log("Player 0:", player0);
            }

            // Player in seat 1
            if (activePlayers.find((p: any) => p.seat === 1)) {
                const player1 = activePlayers.find((p: any) => p.seat === 1);
                console.log("Player 1:", player1);
            }
        }
    }, [activePlayers]);

    // Early return if no id
    if (!id) {
        return <div className="h-screen flex items-center justify-center text-white">Invalid table ID</div>;
    }

    // Destructure context including loading and error states
    const {
        seat, // todo
        pots, // todo
        communityCards // todo
    } = context;

    // Handle loading state

    const [currentIndex, setCurrentIndex] = useState<number>(1);
    // const [type, setType] = useState<string | null>(null);
    const [startIndex, setStartIndex] = useState<number>(0);

    const [playerPositionArray, setPlayerPositionArray] = useState<PositionArray[]>([]);
    const [chipPositionArray, setChipPositionArray] = useState<PositionArray[]>([]);
    const [dealerPositionArray, setDealerPositionArray] = useState<PositionArray[]>([]);
    const [zoom, setZoom] = useState(calculateZoom());
    const [openSidebar, setOpenSidebar] = useState(false);

    const [userSeat, setUserSeat] = useState<number | null>(null);  
    const [userNFT, setUserNFT] = useState<string | null>(null);

    const [flipped1, setFlipped1] = useState(false);
    const [flipped2, setFlipped2] = useState(false);
    const [flipped3, setFlipped3] = useState(false);
    const [isCardVisible, setCardVisible] = useState(-1);
    const { data } = useUserBySeat(id, seat);

    const navigate = useNavigate();

    const { account, balance, isLoading: walletLoading } = useUserWallet(); // this is the wallet in the browser.

    const [dealerButtonPosition, setDealerButtonPosition] = useState({ left: '0px', top: '0px' });
    const [isDealerButtonVisible, setIsDealerButtonVisible] = useState(false);


    const [smallBlindPosition, setSmallBlindPosition] = useState({ left: '0px', top: '0px' });
    const [isSmallBlindVisible, setIsSmallBlindVisible] = useState(false);
    const [bigBlindPosition, setBigBlindPosition] = useState({ left: '0px', top: '0px' });
    const [isBigBlindVisible, setIsBigBlindVisible] = useState(false);


    useEffect(() => {
        const savedNFT = localStorage.getItem("selectedNFT");
        if (savedNFT) {
            setUserNFT(savedNFT);
        } else {
            setUserNFT("https://ipfs.io/ipfs/bafybeiafzj33jeqrkbjjqjwprsctvstryo7p4w5ut32gu7762574g73wfa"); // Default NFT
        }
    }, []);

    useEffect(() => {
        if (tableData?.data) {
            try {
                // Handle dealer button
                if (tableData.data.dealer !== undefined && tableData.data.dealer !== null) {
                    const dealerSeat = tableData.data.dealer === 9 ? 0 : tableData.data.dealer;
                    const dealerPos = dealerPosition.nine[dealerSeat];
                    
                    if (dealerPos) {
                        // Just set the original position
                        setDealerButtonPosition({
                            left: dealerPos.left,
                            top: dealerPos.top
                        });
                        setIsDealerButtonVisible(true);
                    }
                }
                
                // Handle small blind button
                if (tableData.data.smallBlindPosition !== undefined && tableData.data.smallBlindPosition !== null) {
                    const sbSeat = tableData.data.smallBlindPosition === 9 ? 0 : tableData.data.smallBlindPosition;
                    const sbPos = dealerPosition.nine[sbSeat]; // Using same position array
                    
                    if (sbPos) {
                        setSmallBlindPosition({
                            left: sbPos.left,
                            top: sbPos.top
                        });
                        setIsSmallBlindVisible(true);
                    }
                }
                
                // Handle big blind button
                if (tableData.data.bigBlindPosition !== undefined && tableData.data.bigBlindPosition !== null) {
                    const bbSeat = tableData.data.bigBlindPosition === 9 ? 0 : tableData.data.bigBlindPosition;
                    const bbPos = dealerPosition.nine[bbSeat]; // Using same position array
                    
                    if (bbPos) {
                        setBigBlindPosition({
                            left: bbPos.left,
                            top: bbPos.top
                        });
                        setIsBigBlindVisible(true);
                    }
                }
            } catch (error) {
                console.error("Error setting position indicators:", error);
            }
        }
    }, [tableData?.data?.address]); // Only update when table changes

    useEffect(() => (seat ? setStartIndex(seat) : setStartIndex(0)), [seat]);

    useEffect(() => {
        const reorderedPlayerArray = [...playerPositionArray.slice(startIndex), ...playerPositionArray.slice(0, startIndex)];
        const reorderedDealerArray = [...dealerPositionArray.slice(startIndex), ...dealerPositionArray.slice(0, startIndex)];
        const reorderedChipArray = [...chipPositionArray.slice(startIndex), ...chipPositionArray.slice(0, startIndex)];
        setPlayerPositionArray(reorderedPlayerArray);
        setChipPositionArray(reorderedChipArray);
        setDealerPositionArray(reorderedDealerArray);
    }, [startIndex]);

    function threeCardsTable() {
        setTimeout(() => {
            setFlipped1(true);
        }, 1000);
        setTimeout(() => {
            setFlipped2(true);
        }, 1100);
        setTimeout(() => {
            setFlipped3(true);
        }, 1200);
    }

    const { players, dealerIndex, tableSize, openOneMore, openTwoMore, showThreeCards } = usePlayerContext();

    useEffect(() => {
        if (showThreeCards) {
            threeCardsTable();
        }
    }, [showThreeCards]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentIndex(prevIndex => {
                if (prevIndex === 2) {
                    // Handle case where prevIndex is 2 (e.g., no change or custom logic)
                    return prevIndex + 2; // For example, keep it the same
                } else if (prevIndex === 4) {
                    // If prevIndex is 4, increment by 2
                    return prevIndex + 2;
                } else if (prevIndex === 9) {
                    // If prevIndex is 4, increment by 2
                    return prevIndex - 8;
                } else {
                    // Otherwise, just increment by 1
                    return prevIndex + 1;
                }
            });
        }, 30000);

        // Cleanup the timer on component unmount
        return () => clearTimeout(timer);
    }, [currentIndex]);

    useEffect(() => {
        const handleResize = () => setZoom(calculateZoom());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        //* set the number of players
        switch (tableSize) {
            case 6:
                setPlayerPositionArray(playerPosition.six);
                setChipPositionArray(chipPosition.six);
                setDealerPositionArray(dealerPosition.six);
                break;
            case 9:
                setPlayerPositionArray(playerPosition.nine);
                setChipPositionArray(chipPosition.nine);
                setDealerPositionArray(dealerPosition.nine);
                break;
            default:
                setPlayerPositionArray([]);
                setChipPositionArray([]);
                setDealerPositionArray([]);
        }
    }, [tableSize]);

    const onCloseSideBar = () => {
        setOpenSidebar(!openSidebar);
    };

    const onGoToDashboard = () => {
        navigate("/");
    };

    // Add null check before logging
    if (!context || !context.gamePlayers) {
        console.log("Context or gamePlayers not ready yet");
        return null; // or return a loading state
    }

    // Add this helper function for copying to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here if you want
    };

    // Add this function to check if the game is still in progress
    const isGameInProgress = () => {
        const activePlayers = tableData?.data?.players?.filter((p: any) => 
            p.status !== 'folded' && p.status !== 'sitting-out');
        return activePlayers && activePlayers.length > 1;
    };

    // Add this check early in your component
    if (tableDataValues.isLoading) {
        return <div className="h-screen flex items-center justify-center text-white">Loading table data...</div>;
    }

    if (tableDataValues.error) {
        return <div className="h-screen flex items-center justify-center text-white">Error: {tableDataValues.error.message}</div>;
    }

    if (!tableDataValues.tableDataPlayers || !tableDataValues.tableDataCommunityCards) {
        return <div className="h-screen flex items-center justify-center text-white">Waiting for table data...</div>;
    }

    const handleJoinSeat = (seatIndex: number) => {
        setUserSeat(seatIndex);
    };


    return (
        <div className="h-screen flex flex-col">
            {/*//! HEADER */}
            <div className="flex-shrink-0">
                <div className="w-[100vw] h-[65px] bottom-0 bg-custom-mong top-5 text-center flex items-center justify-between border-gray-400 px-4 z-0">
                    <div className="flex items-center space-x-2">
                        {/* <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-r border-white">
                            <IoMenuSharp size={20} />
                        </div> */}
                        <span className="text-white text-sm font-medium text-[20px] cursor-pointer" onClick={() => navigate("/")}>
                            Lobby
                        </span>
                    </div>

                    {/* Middle Section - Add Wallet Info */}
                    <div className="flex flex-col items-center text-white text-sm">
                        <div>Table Address: {id ? id : "Invalid Table"}</div>
                        {tableData && <div>Table Type: {tableData.data?.type}</div>}
                    </div>

                    {/* Right Section - Updated with icon and compact layout */}
                    <div className="flex items-center">
                        <div className="flex flex-col items-end justify-center text-white text-[11px] mr-2">
                            {walletLoading ? (
                                <span>Loading...</span>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <span className="opacity-75">Account:</span>
                                        <span className="font-mono text-[10px]">
                                            {`${localStorage.getItem("user_eth_public_key")?.slice(0, 6)}...${localStorage.getItem("user_eth_public_key")?.slice(-4)}`}
                                        </span>
                                        <FaCopy
                                            className="ml-1 cursor-pointer hover:text-green-400 transition-colors duration-200"
                                            size={12}
                                            onClick={() => copyToClipboard(localStorage.getItem("user_eth_public_key") || "")}
                                            title="Copy full address"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="opacity-75">Balance:</span>
                                        <span className="font-medium text-green-400">
                                            ${balance ? formatWeiToUSD(balance) : "0.00"}
                                            <span className="text-[10px] ml-1 text-gray-400">MONG</span>
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-center w-10 h-10 cursor-pointer">
                            <RiMoneyDollarCircleLine
                                color="#f0f0f0"
                                size={25}
                                onClick={() => navigate("/deposit")}
                                className="hover:text-green-400 transition-colors duration-200"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-custom-table text-white flex justify-between items-center p-2 h-[25px]">
                    {/* Left Section */}
                    <div className="flex items-center">
                        <span className="px-2 rounded text-[12px]">${`${tableDataValues.tableDataSmallBlind}/$${tableDataValues.tableDataBigBlind}`}</span>
                        <span className="ml-2 text-[12px]">
                            Game Type: <span className="font-semibold text-[13px] text-yellow-400">{tableDataValues.tableDataType}</span>
                        </span>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center">
                        <span className="text-sm cursor-pointer" onClick={onCloseSideBar}>
                            {openSidebar ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
                        </span>
                        <button className="ml-2 px-3 rounded" onClick={onGoToDashboard}>
                            X
                        </button>
                    </div>
                </div>
            </div>

            {/*//! BODY */}
            <div className="flex w-full flex-grow overflow-hidden bg-custom-mong">
                {/*//! TABLE + FOOTER */}
                <div
                    className={`flex-grow flex flex-col justify-between transition-all duration-250 overflow-hidden bg-mong-custom`}
                    style={{
                        transition: "margin 0.3s ease"
                    }}
                >
                    {/*//! TABLE */}
                    <div className="flex-grow flex flex-col align-center justify-center min-h-[calc(100vh-280px)] z-[100]">
                        <div className="zoom-container h-[450px] w-[900px] m-[auto]" style={{ zoom }}>
                            <div className="flex-grow scrollbar-none bg-custom-mong h-full flex flex-col justify-center items-center relative">
                                <div className="w-[900px] h-[450px] relative text-center block transform translate-y-[30px]">
                                    <div className="h-full flex align-center justify-center">
                                        <div className="z-20 relative flex flex-col w-[900px] h-[350px] left-1/2 top-5 transform -translate-x-1/2 text-center border-[2px] border-[#c9c9c985] rounded-full items-center justify-center shadow-[0_7px_13px_rgba(0,0,0,0.3)]">
                                            {/* //! Table */}
                                            <div className="px-4 h-[25px] rounded-full bg-[#00000054] flex align-center justify-center">
                                                <span className="text-[#dbd3d3] mr-2">
                                                    Total Pot:{" "}
                                                    {tableDataValues.tableDataPots?.[0] === "0"
                                                        ? "0.00"
                                                        : tableDataValues.tableDataPots
                                                              ?.reduce((sum: number, pot: string) => sum + Number(ethers.formatUnits(pot, 18)), 0)
                                                              .toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="px-4 h-[21px] rounded-full bg-[#00000054] flex align-center justify-center mt-2">
                                                <span className="text-[#dbd3d3] mr-2 flex items-center whitespace-nowrap">
                                                    Round:{" "}
                                                    <span className="font-semibold text-yellow-400 ml-1">
                                                        {tableDataValues.tableDataRound || "Round Data Not Available"}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="px-4 h-[21px] rounded-full bg-[#00000054] flex align-center justify-center mt-2">
                                                <span className="text-[#dbd3d3] mr-2">
                                                    Main Pot:{" "}
                                                    {tableDataValues.tableDataPots?.[0] === "0"
                                                        ? "0.00"
                                                        : Number(ethers.formatUnits(tableDataValues.tableDataPots?.[0] || "0", 18)).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 mt-8">
                                                {tableDataValues.tableDataRound === "preflop"
                                                    ? // Show face-down cards in preflop
                                                      Array(5)
                                                          .fill(null)
                                                          .map((_, index) => (
                                                              <div
                                                                  key={index}
                                                                  className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]"
                                                              />
                                                          ))
                                                    : // Show actual cards for other rounds
                                                      (tableDataValues.tableDataCommunityCards || []).map((card: any, index: number) => (
                                                          <div key={index} className="card animate-fall">
                                                              <OppositePlayerCards frontSrc={`/cards/${card}.svg`} backSrc="/cards/Back.svg" flipped={true} />
                                                          </div>
                                                      ))}
                                            </div>
                                            {/*//! CHIP */}
                                            {/* {chipPositionArray.map((position, index) => (
                                                <div
                                                    key={`key-${index}`}
                                                    style={{
                                                        left: position.left,
                                                        bottom: position.bottom
                                                    }}
                                                    className="absolute"
                                                >
                                                    <Chip amount={Number(tableDataValues.tableDataPots[index])} />
                                                </div>
                                            ))} */}
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 z-30">
                                        {playerPositionArray.map((position, positionIndex) => {
                                            // Find the player at this seat position
                                            const playerAtThisSeat = activePlayers.find((p: any) => p.seat === positionIndex);
                                            
                                            // Check if this player is the current user
                                            const isCurrentUser = playerAtThisSeat && 
                                                playerAtThisSeat.address?.toLowerCase() === userWalletAddress;
                                            
                                            // More detailed logging
                                            if (playerAtThisSeat) {
                                                console.log(`Seat ${positionIndex} detailed comparison:`, {
                                                    playerAddress: playerAtThisSeat.address,
                                                    playerAddressLower: playerAtThisSeat.address?.toLowerCase(),
                                                    currentUserAddress: userWalletAddress,
                                                    currentUserAddressLower: userWalletAddress?.toLowerCase(),
                                                    isMatch: isCurrentUser,
                                                    exactCompare: playerAtThisSeat.address === userWalletAddress,
                                                    lowerCompare: playerAtThisSeat.address?.toLowerCase() === userWalletAddress?.toLowerCase()
                                                });
                                            }
                                            
                                            const componentToRender = !playerAtThisSeat ? (
                                                // No player at this seat - show vacant player
                                                <VacantPlayer index={positionIndex} left={position.left} top={position.top} />
                                            ) : isCurrentUser ? (
                                                // This is the current user's position - use Player component
                                                <Player
                                                    index={positionIndex}
                                                    currentIndex={currentIndex}
                                                    left={position.left}
                                                    top={position.top}
                                                    color={position.color}
                                                    status={tableDataValues.tableDataPlayers?.[positionIndex]?.status}
                                                    avatar={isCurrentUser && userNFT ? userNFT : undefined} // ✅ Pass NFT only if it's the current user
                                                />
                                            ) : (
                                                // This is another player's position - use OppositePlayer component
                                                <OppositePlayer
                                                    index={positionIndex}
                                                    currentIndex={currentIndex}
                                                    setStartIndex={(index: number) => setStartIndex(index)}
                                                    left={position.left}
                                                    top={position.top}
                                                    color={position.color}
                                                    status={tableDataValues.tableDataPlayers?.[positionIndex]?.status}
                                                    isCardVisible={isCardVisible}
                                                    setCardVisible={setCardVisible}
                                                />
                                            );

                                            console.log(`Rendering component for seat ${positionIndex}:`, {
                                                isVacant: !playerAtThisSeat,
                                                isCurrentUser,
                                                componentType: !playerAtThisSeat ? 'VacantPlayer' : 
                                                               isCurrentUser ? 'Player' : 'OppositePlayer',
                                                currentUserAddress: userWalletAddress
                                            });
                                            
                                            return (
                                                <div key={positionIndex} className="z-[10]">
                                                    {componentToRender}
                                                    <div>
                                                        <TurnAnimation left={position.left} top={position.top} index={positionIndex} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/*//! Dealer */}
                                    {isDealerButtonVisible && (
                                        <div 
                                            className="absolute z-50 bg-white text-black font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-black"
                                            style={{
                                                left: `calc(${dealerButtonPosition.left} + 200px)`,
                                                top: dealerButtonPosition.top,
                                                transform: 'none'
                                            }}
                                        >
                                            D
                                        </div>
                                    )}
                                    {isSmallBlindVisible && (
                                        <div 
                                            className="absolute z-50 bg-blue-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-black"
                                            style={{
                                                left: smallBlindPosition.left,
                                                top: smallBlindPosition.top,
                                                transform: 'none'
                                            }}
                                        >
                                            SB
                                        </div>
                                    )}
                                    {isBigBlindVisible && (
                                        <div 
                                            className="absolute z-50 bg-red-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-black"
                                            style={{
                                                left: bigBlindPosition.left,
                                                top: bigBlindPosition.top,
                                                transform: 'none'
                                            }}
                                        >
                                            BB
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mr-3 mb-1">
                            {data && <span className="text-white bg-[#0c0c0c80] rounded-full px-2">{data.hand_strength}</span>}
                        </div>
                    </div>
                    {/*//! FOOTER */}
                    <div className="flex-shrink-0 w-full h-[190px] bg-custom-mong text-center z-[0] flex justify-center">
                        <PokerActionPanel />
                    </div>
                </div>
                {/*//! SIDEBAR */}
                <div
                    className={`fixed top-[0px] right-0 h-full bg-custom-mong overflow-hidden transition-all duration-300 ease-in-out relative ${
                        openSidebar ? "w-[300px]" : "w-0"
                    }`}
                    style={{
                        boxShadow: openSidebar ? "0px 0px 10px rgba(0,0,0,0.5)" : "none"
                    }}
                >
                    <div className={`transition-opacity duration-300 ${openSidebar ? "opacity-100" : "opacity-0"} absolute left-0 top-0`}>
                        <PokerLog />
                    </div>
                </div>
            </div>
            {/* Add a message for empty table if needed */}
            {activePlayers.length === 0 && (
                <div className="absolute top-24 right-4 text-white bg-black bg-opacity-50 p-4 rounded">Waiting for players to join...</div>
            )}
            {/* Add a message for the current user's seat */}
            {currentUserSeat >= 0 && (
                <div className="absolute top-24 left-4 text-white bg-black bg-opacity-50 p-2 rounded">
                    You are seated at position {currentUserSeat + 1}
                </div>
            )}
            {/* Add an indicator for whose turn it is */}
            {nextToActInfo && isGameInProgress() && (
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-70 p-2 rounded">
                    {nextToActInfo.isCurrentUserTurn && playerLegalActions && playerLegalActions.length > 0 ? (
                        <span className="text-green-400 font-bold">Your turn to act!</span>
                    ) : (
                        <span>Waiting for {nextToActInfo.seat === 1 ? "Small Blind" : 
                              nextToActInfo.seat === 2 ? "Big Blind" : 
                              `player at position ${nextToActInfo.seat + 1}`} to act</span>
                    )}
                </div>
            )}
            {/* Show a message when the hand is over */}
            {tableData?.data?.players && !isGameInProgress() && activePlayers.length > 0 && (
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-70 p-2 rounded">
                    <span>Hand complete - waiting for next hand</span>
                </div>
            )}
        </div>
    );
};

export default Table;
