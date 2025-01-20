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
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import TurnAnimation from "./TurnAnimation/TurnAnimation";
import { LuPanelLeftOpen } from "react-icons/lu";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { LuPanelLeftClose } from "react-icons/lu";
import useUserWallet from "../../hooks/useUserWallet";
import { useNavigate, useParams } from "react-router-dom";
import useTableType from "../../hooks/useTableType";
import { toDollarFromString } from "../../utils/numberUtils";
import useUserBySeat from "../../hooks/useUserBySeat";
import axios from "axios";
import { ethers } from "ethers";

//* Define the interface for the position object
interface PositionArray {
    left?: string;
    top?: string;
    bottom?: string;
    right?: string;
    color?: string;
}

const MOCK_API_URL = "https://orca-app-k9l4d.ondigitalocean.app";

const calculateZoom = () => {
    const baseWidth = 1800;
    const baseHeight = 950;
    const scaleWidth = window.innerWidth / baseWidth; // Scale relative to viewport width
    const scaleHeight = window.innerHeight / baseHeight; // Scale relative to viewport height
    return Math.min(scaleWidth, scaleHeight);
};

const Table = () => {
    const { id } = useParams<{ id: string }>();

    if (!id) {
        console.error("Table ID is missing");
        // Return some markup saying that the table ID is missing
        // return <div>Table ID is missing</div>;
        return <></>;
    }

    const [currentIndex, setCurrentIndex] = useState<number>(1);
    // const [type, setType] = useState<string | null>(null);
    const [startIndex, setStartIndex] = useState<number>(0);
    const { totalPot, seat, smallBlind, bigBlind, tableType, roundType, playerSeats, pots, communityCards } = usePlayerContext();
    const [playerPositionArray, setPlayerPositionArray] = useState<PositionArray[]>([]);
    const [chipPositionArray, setChipPositionArray] = useState<PositionArray[]>([]);
    const [dealerPositionArray, setDealerPositionArray] = useState<PositionArray[]>([]);
    const [zoom, setZoom] = useState(calculateZoom());
    const [openSidebar, setOpenSidebar] = useState(false);

    const [flipped1, setFlipped1] = useState(false);
    const [flipped2, setFlipped2] = useState(false);
    const [flipped3, setFlipped3] = useState(false);
    const [isCardVisible, setCardVisible] = useState(-1);
    const { data } = useUserBySeat(id, seat);

    const navigate = useNavigate();

    const { account, balance, isLoading } = useUserWallet();
    const { type } = useTableType(id);

    const context = usePlayerContext();
    const [wagmiStore, setWagmiStore] = useState<any>(null);
    const [block52Balance, setBlock52Balance] = useState<string>("");

    // const reorderPlayerPositions = (startIndex: number) => {
    //     // Separate out the color and position data
    //     const colors = playerPositionArray.map(item => item.color);
    //     const positions = playerPositionArray.map(({ left, top }) => ({ left, top }));

    //     // Reorder the positions array starting from `startIndex`
    //     const reorderedPositions = [...positions.slice(startIndex), ...positions.slice(0, startIndex)];

    //     // Reconstruct the array with reordered positions and the same color order
    //     return reorderedPositions.map((position, index) => ({
    //         ...position,
    //         color: colors[index]
    //     }));
    // };

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

    useEffect(() => {
        // Get wagmi store data
        const wagmiData = localStorage.getItem("wagmi.store");
        if (wagmiData) {
            const parsedData = JSON.parse(wagmiData);
            setWagmiStore(parsedData);

            // Get MetaMask account address from wagmiStore
            const metamaskAddress = parsedData.state.connections.value[0][1].accounts[0];

            // Use MetaMask address for Block52 balance query
            axios
                .get(`https://proxy.block52.xyz/account/${metamaskAddress}`)
                .then(response => {
                    setBlock52Balance(response.data.balance);
                    console.log("Block52 Account Data:", response.data);
                })
                .catch(error => console.error("Error fetching Block52 balance:", error));
        }
    }, []);

    // Detailed logging of all context values
    // console.log('Player Context:', {
    //     players: context.players,
    //     pots: context.pots,
    //     tableSize: context.tableSize,
    //     seat: context.seat,
    //     totalPot: context.totalPot,
    //     bigBlind: context.bigBlind,
    //     smallBlind: context.smallBlind,
    //     roundType: context.roundType,
    //     tableType: context.tableType,
    //     gamePlayers: context.gamePlayers,
    //     nextToAct: context.nextToAct,
    //     playerSeats: context.playerSeats,
    //     dealerIndex: context.dealerIndex,
    //     lastPot: context.lastPot,
    //     playerIndex: context.playerIndex,
    //     openOneMore: context.openOneMore,
    //     openTwoMore: context.openTwoMore,
    //     showThreeCards: context.showThreeCards
    // });

    // Detailed game state logging
    console.log("Current Game State:", {
        // Round info
        round: context.roundType,
        totalPot: context.totalPot,
        blinds: `${context.smallBlind}/${context.bigBlind}`,

        // Active players
        activeSeats: context.playerSeats,
        nextToAct: context.nextToAct,

        // Current player's possible actions
        currentPlayer: context.gamePlayers?.find(p => p.seat === context.nextToAct),
        possibleActions: context.gamePlayers
            ?.find(p => p.seat === context.nextToAct)
            ?.actions?.map(a => ({
                action: a.action,
                min: a.min,
                max: a.max
            })),

        // Dealer position
        dealer: context.dealerIndex,

        // Player states
        smallBlindPlayer: context.gamePlayers?.find(p => p.isSmallBlind),
        bigBlindPlayer: context.gamePlayers?.find(p => p.isBigBlind),

        // Last actions
        lastActions: context.gamePlayers?.map(p => ({
            seat: p.seat,
            lastAction: p.lastAction
        }))
    });

    // Add null check before logging
    if (!context || !context.gamePlayers) {
        console.log("Context or gamePlayers not ready yet");
        return null; // or return a loading state
    }

    // Add useEffect to log wallet info whenever it changes
    useEffect(() => {
        console.log("Connected Wallet Info:", {
            address: account,
            balance: balance,
            isLoading: isLoading
        });
    }, [account, balance, isLoading]);

    return (
        <div className="h-screen">
            {/*//! HEADER */}
            <div>
                <div className="w-[100vw] h-[65px] bottom-0 bg-[#404040] top-5 text-center flex items-center justify-between border-gray-400 px-4 z-0">
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
                        <div>Table Wallet: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not Connected"}</div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center">
                        <div className="flex flex-col items-end justify-center text-white text-[13px]">
                            <span>{isLoading ? "Loading..." : ""}</span>
                            {wagmiStore && (
                                <div className="text-xs">
                                    Connected: {wagmiStore.state.connections.value[0][1].connector.name}(
                                    {wagmiStore.state.connections.value[0][1].accounts[0].slice(0, 6)}...
                                    {wagmiStore.state.connections.value[0][1].accounts[0].slice(-4)})
                                </div>
                            )}
                            {block52Balance && <div className="text-xs">Block52 Balance (USD): ${Number(ethers.formatEther(block52Balance)).toFixed(2)}</div>}
                        </div>

                        <div className="flex items-center justify-center w-10 h-10 cursor-pointer">
                            <RiMoneyDollarCircleLine color="#f0f0f0" size={25} onClick={() => navigate("/deposit")} />
                        </div>
                        {/* <div className="ml-2 flex items-center justify-center w-10 h-10 bg-gray-500 rounded-full">
                            <CiCalendar color="#f0f0f0" size={25} />
                        </div>
                        <div className="ml-2 flex items-center justify-center w-10 h-10 bg-gray-500 rounded-full">
                            <BiBorderAll color="#f0f0f0" size={25} />
                        </div> */}
                    </div>
                </div>

                <div className="bg-gray-900 text-white flex justify-between items-center p-2 h-[25px]">
                    {/* Left Section */}
                    <div className="flex items-center">
                        <span className="px-2 rounded text-[12px]">${`${smallBlind}/$${bigBlind}`}</span>
                        <span className="ml-2 text-[12px]">
                            Game Type: <span className="font-semibold text-[13px] text-yellow-400">{tableType}</span>
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
            <div className="flex w-full h-[calc(100%-90px)]">
                {/*//! TABLE + FOOTER */}
                <div
                    className={`flex-grow flex flex-col justify-between transition-all duration-250`}
                    style={{
                        transition: "margin 0.3s ease"
                    }}
                >
                    {/*//! TABLE */}
                    <div className="flex flex-col align-center justify-center h-[calc(100%-190px)] z-[100]">
                        <div className="zoom-container h-[400px] w-[800px] m-[auto]" style={{ zoom }}>
                            <div className="flex-grow scrollbar-none bg-custom-table h-full flex flex-col justify-center items-center relative z-0">
                                <div className="w-[800px] h-[400px] relative text-center block z-[-2] transform translate-y-[30px]">
                                    <div className="h-full flex align-center justify-center">
                                        <div className="z-[20] relative flex flex-col w-[800px] h-[300px] left-1/2 top-5 transform -translate-x-1/2 text-center border-[2px] border-[#c9c9c985] rounded-full items-center justify-center shadow-[0_7px_13px_rgba(0,0,0,0.3)]">
                                            {/* //! Table */}
                                            <div className="px-4 h-[25px] rounded-full bg-[#00000054] flex align-center justify-center">
                                                <span className="text-[#dbd3d3] mr-2">Total Pot: {totalPot}</span>
                                            </div>
                                            <div className="px-4 h-[21px] rounded-full bg-[#00000054] flex align-center justify-center mt-2">
                                                <span className="text-[#dbd3d3] mr-2 flex items-center whitespace-nowrap">
                                                    Round: <span className="font-semibold text-yellow-400 ml-1">{roundType}</span>
                                                </span>
                                            </div>
                                            <div className="px-4 h-[21px] rounded-full bg-[#00000054] flex align-center justify-center mt-2">
                                                <span className="text-[#dbd3d3] mr-2">Main Pot: 50</span>
                                            </div>
                                            <div className="flex gap-2 mt-8">
                                                <div className="card animate-fall delay-200">
                                                    <OppositePlayerCards
                                                        frontSrc={`/cards/${communityCards[0]}.svg`}
                                                        backSrc="/cards/Back.svg"
                                                        flipped={flipped1}
                                                    />
                                                </div>
                                                <div className="card animate-fall delay-400">
                                                    <OppositePlayerCards
                                                        frontSrc={`/cards/${communityCards[1]}.svg`}
                                                        backSrc="/cards/Back.svg"
                                                        flipped={flipped2}
                                                    />
                                                </div>
                                                <div className="card animate-fall delay-600">
                                                    <OppositePlayerCards
                                                        frontSrc={`/cards/${communityCards[2]}.svg`}
                                                        backSrc="/cards/Back.svg"
                                                        flipped={flipped3}
                                                    />
                                                </div>
                                                {openOneMore ? (
                                                    <div className="card animate-fall delay-600">
                                                        <OppositePlayerCards
                                                            frontSrc={`/cards/${communityCards[3]}.svg`}
                                                            backSrc="/cards/Back.svg"
                                                            flipped={flipped3}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]"></div>
                                                )}
                                                {openTwoMore ? (
                                                    <div className="card animate-fall delay-600">
                                                        <OppositePlayerCards
                                                            frontSrc={`/cards/${communityCards[4]}.svg`}
                                                            backSrc="/cards/Back.svg"
                                                            flipped={flipped3}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]"></div>
                                                )}
                                            </div>
                                            {/*//! CHIP */}
                                            {chipPositionArray.map((position, index) => {
                                                return (
                                                    <div
                                                        key={`key-${index}`} // Make sure to add a unique key
                                                        style={{
                                                            left: position.left,
                                                            bottom: position.bottom
                                                        }}
                                                        className="absolute"
                                                    >
                                                        <Chip amount={Number(pots[index])} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {playerPositionArray.map((position, index) => {
                                        return (
                                            <div key={index} className="z-[10]">
                                                {!playerSeats.includes(index) ? (
                                                    <VacantPlayer index={index} left={position.left} top={position.top} />
                                                ) : index !== seat ? (
                                                    <OppositePlayer
                                                        index={index}
                                                        currentIndex={currentIndex}
                                                        setStartIndex={(index: number) => setStartIndex(index)}
                                                        left={position.left}
                                                        top={position.top}
                                                        color={position.color}
                                                        status={players[index]?.status}
                                                        isCardVisible={isCardVisible}
                                                        setCardVisible={setCardVisible}
                                                    />
                                                ) : (
                                                    <Player
                                                        index={index}
                                                        currentIndex={currentIndex}
                                                        left={position.left}
                                                        top={position.top}
                                                        color={position.color}
                                                        status={players[index]?.status}
                                                    />
                                                )}
                                                <div>
                                                    <TurnAnimation left={position.left} top={position.top} index={index} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/*//! Dealer */}
                                    <div
                                        style={{
                                            top: dealerPositionArray[dealerIndex]?.top,
                                            left: dealerPositionArray[dealerIndex]?.left,
                                            transition: "top 1s ease, left 1s ease"
                                        }}
                                        className="absolute"
                                    >
                                        <Dealer />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mr-3 mb-1">
                            {data && <span className="text-white bg-[#0c0c0c80] rounded-full px-2">{data.hand_strength}</span>}
                        </div>
                    </div>
                    {/*//! FOOTER */}
                    <div className="mb-[0] w-full h-[190px] bottom-0 bg-custom-footer top-5 text-center z-[0] flex justify-center">
                        <PokerActionPanel />
                    </div>
                </div>
                {/*//! SIDEBAR */}
                <div
                    className={`fixed top-[0px] right-0 h-full bg-custom-header overflow-hidden transition-all duration-300 ease-in-out relative ${
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
                {/* <div
                    className={`transition-all duration-300 ease-in-out bg-custom-header flex flex-col items-center justify-center p-4 ${openSidebar ? "w-[250px] opacity-100" : "w-0 opacity-0"
                        }`}
                    style={{
                        overflow: openSidebar ? "visible" : "hidden", // Prevents content from spilling when hidden
                    }}
                >
                    <PokerLog />
                </div> */}
            </div>
        </div>
    );
};

export default Table;
