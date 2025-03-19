import React, { useEffect, useState } from "react"; // Import React and useEffect
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation
import { STORAGE_PUBLIC_KEY, STORAGE_PRIVATE_KEY } from "../hooks/useUserWallet";
import "./Dashboard.css";
import useUserWalletConnect from "../hooks/useUserWalletConnect"; // Add this import
import useUserWallet from "../hooks/useUserWallet"; // Add this import
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { Wallet } from "ethers";

import NFTSidebar from "./NFTSidebar";
import useFetchNFTs from "../hooks/useFetchNFTs";
import mongImage from "../assets/mongCoin/images/hero/3.png";
import CustomButton from "../assets/components/CustomButton";
import CustomHeader from "../assets/components/CustomHeader";
import { TypeAnimation } from "react-type-animation";

const getRandomVariant = () => (Math.random() < 0.5 ? "default" : "variant2");

// Create an enum of game types
enum GameType {
    CASH = "cash",
    TOURNAMENT = "tournament"
}

enum Variant {
    TEXAS_HOLDEM = "texas-holdem",
    OMAHA = "omaha"
}

const Dashboard: React.FC = () => {
    const seats = [6, 8];

    const navigate = useNavigate();
    const [publicKey, setPublicKey] = useState<string>();
    const [typeSelected, setTypeSelected] = useState<string>("cash");
    const [variantSelected, setVariantSelected] = useState<string>("texas-holdem");
    const [seatSelected, setSeatSelected] = useState<number>(6);
    const { isConnected, open, disconnect, address } = useUserWalletConnect();
    const { balance: b52Balance } = useUserWallet();
    const [games, setGames] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importKey, setImportKey] = useState("");
    const [importError, setImportError] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    const [isNFTSidebarOpen, setNFTSidebarOpen] = useState(false);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const nfts = useFetchNFTs();

    // Load saved NFT on component mount
    useEffect(() => {
        const savedNFT = localStorage.getItem("selectedNFT");
    
        if (savedNFT) {
            setProfilePic(savedNFT);
        } else if (nfts.length > 0) {
            setProfilePic(nfts[0].image); // ✅ Set profile pic only when NFTs are loaded
        }
    }, [nfts]);

    const handleSelectNFT = (image: string) => {
        setProfilePic(image);
        localStorage.setItem("selectedNFT", image);
        setNFTSidebarOpen(false);
    };

    // Add logging to fetch games
    const fetchGames = async () => {
        console.log("\n=== Fetching Games from Proxy ===");
        try {
            const response = await axios.get(`${PROXY_URL}/games`);
            console.log("Games Response:", response.data);

            // Map the response to our game types
            const games = response.data.map((game: any) => ({
                id: game.id,
                variant: game.variant,
                type: game.type,
                limit: game.limit,
                maxPlayers: game.max_players,
                minBuy: game.min,
                maxBuy: game.max
            }));

            console.log("Processed Games:", games);
            setGames(games);
        } catch (error) {
            console.error("Error fetching games:", error);
        }
    };

    useEffect(() => {
        console.log("Dashboard mounted, fetching games...");
        fetchGames();
    }, []);

    useEffect(() => {
        console.log("\n=== Dashboard Mounted ===");
        console.log("Connected Wallet:", address);
        console.log("Balance:", b52Balance);
        console.log("======================\n");

        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        console.log("Local Storage Key:", localKey);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

    useEffect(() => {
        console.log("\n=== Dashboard Balance Check ===");
        console.log("Connected Address:", address);
        console.log("Raw B52 Balance:", b52Balance);
        console.log("Formatted Balance:", b52Balance ? formatBalance(b52Balance) : "0");
        console.log("============================\n");
    }, [address, b52Balance]);

    const handleGameType = (type: GameType) => {
        console.log("\n=== Game Type Selected ===");
        console.log("Type:", type);

        if (type === GameType.CASH) {
            console.log("Setting type to CASH");
            setTypeSelected("cash");
        }

        if (type === GameType.TOURNAMENT) {
            console.log("Setting type to TOURNAMENT");
            setTypeSelected("tournament");
        }
    };

    const handleGameVariant = (variant: Variant) => {
        console.log("\n=== Game Variant Selected ===");
        console.log("Variant:", variant);

        if (variant === Variant.TEXAS_HOLDEM) {
            console.log("Setting variant to TEXAS HOLDEM");
            setVariantSelected("texas-holdem");
        }

        if (variant === Variant.OMAHA) {
            console.log("Setting variant to OMAHA");
            setVariantSelected("omaha");
        }
    };

    const handleSeat = (seat: number) => {
        setSeatSelected(seat);
    };

    const buildUrl = () => {
        // return `/table/${typeSelected}?variant=${variantSelected}&seats=${seatSelected}`;
        return `/table/0x22dfa2150160484310c5163f280f49e23b8fd34326`;
    };

    const handleNext = () => {
        const url = buildUrl();
        console.log("Next button clicked");

        // Redirect to the sit page
        navigate(url);
    };

    // const [loading, setLoading] = useState(true);
    // const [gameType, setGameType] = useState<string | null>(null);

    // Add function to format address
    const formatAddress = (address: string | undefined) => {
        if (!address) return "";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Modify formatBalance to add logging
    const formatBalance = (rawBalance: string | number) => {
        console.log("\n=== Format Balance Called ===");
        console.log("Input Balance:", rawBalance);
        const value = Number(rawBalance) / 1e18;
        console.log("Converted Value:", value);
        const formatted = value.toFixed(2);
        console.log("Formatted Result:", formatted);
        console.log("==========================\n");
        return formatted;
    };

    const handleImportPrivateKey = () => {
        try {
            // Validate private key format
            if (!importKey.startsWith("0x")) {
                setImportError("Private key must start with 0x");
                return;
            }
            if (importKey.length !== 66) {
                setImportError("Invalid private key length");
                return;
            }

            // Create wallet from private key to validate and get address
            const wallet = new Wallet(importKey);

            // Save to localStorage
            localStorage.setItem(STORAGE_PRIVATE_KEY, importKey);
            localStorage.setItem(STORAGE_PUBLIC_KEY, wallet.address);

            // Reset form and close modal
            setImportKey("");
            setImportError("");
            setShowImportModal(false);

            // Refresh page to update wallet
            window.location.reload();
        } catch (err) {
            setImportError("Invalid private key format");
        }
    };

    const handleCopyPrivateKey = async () => {
        const privateKey = localStorage.getItem(STORAGE_PRIVATE_KEY);
        if (privateKey) {
            try {
                await navigator.clipboard.writeText(privateKey);
                // Could add a toast notification here if you want
            } catch (err) {
                console.error("Failed to copy private key:", err);
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-custom-mong">
            <div className="absolute top-0 left-0 w-full z-50">
                <CustomHeader />
            </div>
            <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                    backgroundImage: `url(${mongImage})`,
                    backgroundSize: "contain",
                    backgroundPosition: "left center",
                    backgroundRepeat: "no-repeat",
                    zIndex: 0
                }}
            ></div>
            <div
                className="relative z-50 flex flex-col items-center justify-center w-full"
                style={{ minHeight: "10vh" }} // Ensures space is reserved
            >
                {/* First Line - Types out first */}
                <TypeAnimation
                    sequence={["The MONG Mob Presents:", 1500]}
                    wrapper="h1"
                    cursor={false}
                    speed={50}
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center"
                />

                {/* Second Line - Appears AFTER first line */}
                <TypeAnimation
                    sequence={["", 2500, "MongPoker"]}
                    wrapper="h1"
                    cursor={false}
                    speed={30}
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white text-center mt-1"
                />
                {/* Import Private Key Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-xl w-96">
                            <h3 className="text-xl font-bold text-white mb-4">Import Private Key</h3>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Enter private key (0x...)"
                                    value={importKey}
                                    onChange={e => setImportKey(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-pink-500 focus:outline-none"
                                />
                                {importError && <p className="text-red-500 text-sm">{importError}</p>}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowImportModal(false);
                                            setImportKey("");
                                            setImportError("");
                                        }}
                                        className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleImportPrivateKey}
                                        className="px-4 py-2 text-sm bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition duration-300"
                                    >
                                        Import
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="relative">
                    <img
                        src={profilePic || "/default-avatar.png"} // Fallback to default if no NFT selected
                        alt="Profile"
                        className="w-24 h-24 rounded-full border-4 border-pink-500"
                    />
                    <button onClick={() => setNFTSidebarOpen(true)} className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full">
                        🎨
                    </button>
                </div>

                {/* ✅ NFT Sidebar Component */}
                <NFTSidebar isOpen={isNFTSidebarOpen} onClose={() => setNFTSidebarOpen(false)} onSelectNFT={handleSelectNFT} />

                <div className="bg-gray-800 p-10 rounded-xl shadow-2xl w-full max-w-xl">
                    <h1 className="text-4xl font-extrabold text-center text-white mb-8">Start Playing Now</h1>

                    {/* Block52 Wallet Section */}
                    <div className="bg-gray-700 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-xl font-bold text-white">Block52 Game Wallet</h2>
                            <div className="relative group">
                                <svg
                                    className="w-5 h-5 text-gray-400 hover:text-white cursor-help transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <p className="mb-2">This is your Layer 2 gaming wallet, automatically created for you. No Web3 wallet required!</p>
                                    <p className="mb-2">You can deposit funds using ERC20 tokens, and the bridge will automatically credit your game wallet.</p>
                                    <p>All your in-game funds are secured and can be withdrawn at any time.</p>
                                    <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                        </div>
                        {publicKey && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-white text-sm">
                                        Address: <span className="font-mono text-pink-500">{formatAddress(publicKey)}</span>
                                    </p>
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition duration-300"
                                    >
                                        Import Private Key
                                    </button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-white text-sm">
                                        Balance: <span className="font-bold text-pink-500">${formatBalance(b52Balance || "0")} USDC</span>
                                    </p>
                                    <button
                                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition duration-300"
                                    >
                                        {showPrivateKey ? "Hide Private Key" : "Show Private Key"}
                                    </button>
                                </div>
                                {showPrivateKey && (
                                    <div className="mt-2 p-2 bg-gray-800 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <p className="text-white text-sm font-mono break-all">{localStorage.getItem(STORAGE_PRIVATE_KEY)}</p>
                                            <button
                                                onClick={handleCopyPrivateKey}
                                                className="ml-2 px-2 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition duration-300"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <Link
                                    to="/qr-deposit"
                                    className="block mt-2 text-center text-white bg-green-600 hover:bg-green-700 rounded-xl py-2 px-4 text-sm font-bold transition duration-300 transform hover:scale-105 shadow-lg border-[4px] border-black"
                                >
                                    Deposit
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Web3 Wallet Section */}
                    <div className="bg-gray-700 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-xl font-bold text-white">Web3 Wallet</h2>
                            <div className="relative group">
                                <svg
                                    className="w-5 h-5 text-gray-400 hover:text-white cursor-help transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <p className="mb-2">Optional: Connect your Web3 wallet (like MetaMask) for additional features.</p>
                                    <p>Not required to play - you can use the Block52 Game Wallet instead!</p>
                                    <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-white text-sm">
                                    Status:{" "}
                                    <span className={`font-bold ${isConnected ? "text-green-500" : "text-red-500"}`}>
                                        {isConnected ? "Connected" : "Not Connected"}
                                    </span>
                                </p>
                                {isConnected && address && (
                                    <p className="text-white text-sm">
                                        Address: <span className="font-mono text-pink-500">{formatAddress(address)}</span>
                                    </p>
                                )}
                            </div>
                            <div>
                                {!isConnected ? (
                                    <button
                                        onClick={open}
                                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300 border-[4px] border-black"
                                    >
                                        Connect
                                    </button>
                                ) : (
                                    <button
                                        onClick={disconnect}
                                        className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-300 border-[4px] border-black"
                                    >
                                        Disconnect
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between gap-6">
                            <CustomButton onClick={() => setTypeSelected("cash")} selected={typeSelected === "cash"} buttonStyle={getRandomVariant()}>
                                Cash
                            </CustomButton>
                            <CustomButton
                                onClick={() => setTypeSelected("tournament")}
                                selected={typeSelected === "tournament"}
                                buttonStyle={getRandomVariant()}
                            >
                                Tournament
                            </CustomButton>
                        </div>

                        <div className="flex justify-between gap-6">
                            <CustomButton
                                onClick={() => setVariantSelected("texas-holdem")}
                                selected={variantSelected === "texas-holdem"}
                                buttonStyle={getRandomVariant()}
                            >
                                Texas Holdem
                            </CustomButton>
                            <CustomButton onClick={() => setVariantSelected("omaha")} selected={variantSelected === "omaha"} buttonStyle={getRandomVariant()}>
                                Omaha
                            </CustomButton>
                        </div>

                        <div className="flex justify-between gap-6">
                            <CustomButton onClick={() => setSeatSelected(6)} selected={seatSelected === 6} buttonStyle={getRandomVariant()}>
                                6 Seats
                            </CustomButton>
                            <CustomButton onClick={() => setSeatSelected(8)} selected={seatSelected === 8} buttonStyle={getRandomVariant()}>
                                8 Seats
                            </CustomButton>
                        </div>

                        <Link
                            to="/table/0x22dfa2150160484310c5163f280f49e23b8fd34326"
                            className="relative block text-center text-white bg-pink-600 hover:bg-pink-700 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md border-[4px] border-black"
                        >
                            Next
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
