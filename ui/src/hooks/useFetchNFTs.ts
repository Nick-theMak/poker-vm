import { useEffect, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import useUserWalletConnect from "../hooks/useUserWalletConnect";
import { nftabi } from "../abis/NFTABI";
import { NFT_CONTRACT_ADDRESS } from "../config/constants";
import { Abi } from "viem";

export const useFetchNFTs = () => {
    const { address, isConnected } = useUserWalletConnect();
    const [nfts, setNFTs] = useState<{ id: string; image: string }[]>([]);

    useEffect(() => {
        if (isConnected && address) {
            fetchNFTs();
        }
    }, [isConnected, address]);

    const fetchNFTs = async () => {
        try {
            console.log("Fetching NFTs for:", address);

            const wagmiContractConfig = {
                address: NFT_CONTRACT_ADDRESS as `0x${string}`,
                abi: nftabi as Abi,
                chainId: 1
            };

            // ✅ Fetch NFT balance
            const { data: balance } = await useReadContract({
                ...wagmiContractConfig,
                functionName: "balanceOf",
                args: [address as `0x${string}`]
            });

            if (!balance) {
                setNFTs(demoNFTs); // ✅ Use demo NFTs if balance is zero
                return;
            }
            const nftCount = Number(balance.toString());
            console.log(`User owns ${nftCount} NFTs.`);

            if (nftCount === 0) {
                console.log("No NFTs found, using demo NFTs.");
                setNFTs(demoNFTs);
                return;
            }

            // ✅ Fetch Token IDs
            const tokenIds = await useReadContracts({
                contracts: Array.from({ length: nftCount }, (_, i) => ({
                    ...wagmiContractConfig,
                    functionName: "tokenOfOwnerByIndex" as const,
                    args: [address as `0x${string}`, i]
                }))
            });

            if (!tokenIds || !tokenIds.data) return;
            const validTokenIds = tokenIds.data
                .map(entry => entry?.result)
                .filter((id): id is string | number => id !== undefined);

            // ✅ Fetch Metadata URIs
            const tokenURIs = await useReadContracts({
                contracts: validTokenIds.map(tokenId => ({
                    ...wagmiContractConfig,
                    functionName: "tokenURI" as const,
                    args: [tokenId.toString()]
                }))
            });

            if (!tokenURIs || !tokenURIs.data) return;
            const validTokenURIs = tokenURIs.data
                .map(entry => entry?.result)
                .filter((uri): uri is string => typeof uri === "string")
                .map(uri => uri.replace("ipfs://", "https://ipfs.io/ipfs/"));

            const nftList: { id: string; image: string }[] = [];

            // ✅ Fetch NFT Images
            for (let i = 0; i < validTokenURIs.length; i++) {
                try {
                    const response = await fetch(validTokenURIs[i]);
                    if (!response.ok) continue;
                    const metadata = await response.json();
                    const imageUrl = metadata?.image?.startsWith("ipfs://")
                        ? metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")
                        : metadata.image || "";

                    nftList.push({ id: validTokenIds[i].toString(), image: imageUrl });
                } catch (error) {
                    console.error(`Error fetching metadata for ${validTokenURIs[i]}`, error);
                }
            }

            setNFTs(nftList);
            console.log("Fetched NFTs:", nftList);
        } catch (error) {
            console.error("Error fetching NFTs:", error);
            setNFTs(demoNFTs); // ✅ If an error occurs, fallback to demo NFTs
        }
    };

    // ✅ Updated Demo NFTs
    const demoNFTs = [
        { id: "1000259", image: "https://ipfs.io/ipfs/bafybeicueawvkhthacvoyeqlbnpwlumgffwgpxczvtexpm5no2hvyxkzey/1000259" },
        { id: "1000260", image: "https://ipfs.io/ipfs/bafybeiafzj33jeqrkbjjqjwprsctvstryo7p4w5ut32gu7762574g73wfa" },
        { id: "1000261", image: "https://ipfs.io/ipfs/bafybeih5bylsdf7qcy3w3njhlsw3k6jykd6g3xk73ng5lz53q6jzqs7xgq" },
        { id: "5813", image: "https://ipfs.io/ipfs/bafkreig7tvslgokwapbwmjc3einabtm2s3fc3fsydub27iudll2jzchxj4" }, // MONG #5813
        { id: "3611", image: "https://ipfs.io/ipfs/bafybeibjohuvwd2yrauo4bvgaiyp2noietxxrt5batstnaojtq6texvep4" } // MONG #3611
    ];

    return nfts;
};

export default useFetchNFTs;
