import React, { useState, useEffect } from "react";
import useFetchNFTs from "../hooks/useFetchNFTs";
import CustomButton from "../assets/components/CustomButton";

interface NFTSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectNFT: (image: string) => void;
}

const NFTSidebar: React.FC<NFTSidebarProps> = ({ isOpen, onClose, onSelectNFT }) => {
    const nfts = useFetchNFTs();
    const [selectedNFT, setSelectedNFT] = useState<string | null>(null);

    useEffect(() => {
        const savedNFT = localStorage.getItem("selectedNFT");
        if (savedNFT) {
            setSelectedNFT(savedNFT);
        }
    }, []);

    const handleSelectNFT = (image: string) => {
        setSelectedNFT(image);
        localStorage.setItem("selectedNFT", image);
        onSelectNFT(image);
        onClose(); // Close sidebar after selection
    };

    return (
        <div
            className={`fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-lg transition-transform duration-300 ${
                isOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
            {/* Sidebar Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-white text-lg font-bold">Select an NFT</h2>
                <button className="text-gray-400 hover:text-white" onClick={onClose}>
                    ✖
                </button>
            </div>

            {/* NFT List */}
            <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-50px)]">
                {nfts.length > 0 ? (
                    nfts.map(nft => (
                        <div
                            key={nft.id}
                            className={`border rounded-lg p-2 cursor-pointer ${selectedNFT === nft.image ? "border-pink-500" : "border-gray-700"}`}
                            onClick={() => handleSelectNFT(nft.image)}
                        >
                            <img src={nft.image} alt={`NFT ${nft.id}`} className="w-full h-32 object-cover rounded-md" />
                            <p className="text-gray-300 text-center mt-2">Token ID: {nft.id}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-center">No NFTs found.</p>
                )}
<div className="absolute bottom-0 left-0 w-full p-4 flex justify-center">
  <CustomButton
    onClick={() => window.open("https://opensea.io/collection/mongs-nft", "_blank")}
    buttonStyle="default"
    width={200}
    height={50}
  >
    Get your own mong
  </CustomButton>
</div>
            </div>
        </div>
    );
};

export default NFTSidebar;
