import * as React from "react";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { useTableContext } from "../../../context/TableContext";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { BigUnit } from "bigunit";
import { formatWeiToDollars } from "../../../utils/numberUtils";

type PlayerProps = {
    left?: string;
    top?: string;
    index: number;
    currentIndex: number;
    color?: string;
    status?: string;
    avatar?: string; // ✅ New prop to hold NFT image
};

const Player: React.FC<PlayerProps> = ({ left, top, index, color, status, avatar }) => {
    const { tableData } = useTableContext();

    console.log("Player rendered with these props:", { left, top, index, color, status, avatar });

    // Get player data from table context
    const playerData = React.useMemo(() => {
        if (!tableData?.data?.players) return null;
        return tableData.data.players.find((p: any) => p.seat === index);
    }, [tableData, index]);

    if (!playerData) {
        console.log("No player data for seat", index);
        return <></>;
    }

    // Format stack value
    const stackValue = playerData.stack ? BigUnit.from(playerData.stack, 18).toNumber() : 0;
    const stackValueDollars = formatWeiToDollars(playerData.stack);

    // Get hole cards if available
    const holeCards = playerData.holeCards || ["Back", "Back"];

    return (
        <div
            key={index}
            className={`${
                playerData.status === PlayerStatus.FOLDED ? "opacity-60" : ""
            } absolute flex flex-col justify-center text-gray-600 w-[150px] h-[140px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
            style={{
                left: left,
                top: top,
                transition: "top 1s ease, left 1s ease"
            }}
        >
            {/* ✅ Display NFT if available, otherwise show hole cards */}
            <div className="flex justify-center gap-1">
                {avatar ? (
                    <img 
                        src={avatar} 
                        alt="Player NFT" 
                        className="w-[90px] h-[90px] rounded-full border-2 border-yellow-400 shadow-md"
                    />
                ) : (
                    <>
                        <img src={`/cards/${holeCards[0]}.svg`} width={60} height={80} />
                        <img src={`/cards/${holeCards[1]}.svg`} width={60} height={80} />
                    </>
                )}
            </div>

            {/* ✅ Stack info and player status */}
            <div className="relative flex flex-col justify-end mt-[-6px] mx-1s">
                <div
                    style={{ backgroundColor: "green" }}
                    className={`b-[0%] mt-[auto] w-full h-[55px] shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md flex flex-col`}
                >
                    <ProgressBar index={index} />

                    {/* ✅ Show FOLD or ALL IN status */}
                    {playerData.status === PlayerStatus.FOLDED && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">
                            FOLD
                        </span>
                    )}
                    {playerData.status === PlayerStatus.ALL_IN && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">
                            ALL IN
                        </span>
                    )}
                </div>

                {/* ✅ Player Stack Value */}
                <div className="absolute top-[0%] w-full">
                    <Badge count={index} value={stackValueDollars} color={color} />
                </div>
            </div>
        </div>
    );
};

export default Player;
