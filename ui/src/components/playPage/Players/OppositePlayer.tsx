import * as React from "react";
import Badge from "../reusable/Badge";
import ProgressBar from "../reusable/ProgressBar";
import { usePlayerContext } from "../../../context/usePlayerContext";
import { PlayerStatus } from "@bitcoinbrisbane/block52"
import PlayerCard from "./PlayerCard";
import { BigUnit } from "bigunit";

type OppositePlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
    currentIndex: number;
    color?: string;
    status?: string;
    isCardVisible: number;
    setCardVisible: (index: number) => void;
    setStartIndex: (index: number) => void;
};

const OppositePlayer: React.FC<OppositePlayerProps> = ({ left, top, index, color, isCardVisible, setCardVisible, setStartIndex }) => {
    const { players } = usePlayerContext();
    return (
        <>
            <div
                key={index}
                className={`${players[index].status && players[index].status === PlayerStatus.FOLDED ? "opacity-60" : ""
                    }  absolute flex flex-col justify-center text-gray-600 w-[150px] h-[140px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-[10]`}
                style={{
                    left: left,
                    top: top,
                    transition: "top 1s ease, left 1s ease"
                }}
                onClick={() => setCardVisible(index)}
            >
                <div className="flex justify-center gap-1">
                    <img src={`/cards/Back.svg`} alt="Opposite Player Card" className="w-[35%] h-[auto]" />
                    <img src={`/cards/Back.svg`} alt="Opposite Player Card" className="w-[35%] h-[auto]" />
                </div>
                <div className="relative flex flex-col justify-end mt-[-6px] mx-1">
                    <div
                        style={{ backgroundColor: color }}
                        className={`b-[0%] mt-[auto] w-full h-[55px]  shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md flex flex-col`}
                    >
                        {/* <p className="text-white font-bold text-sm mt-auto mb-1.5 self-center">+100</p> */}
                        <ProgressBar index={index} />
                        {players[index].status && players[index].status === PlayerStatus.FOLDED && (
                            <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">FOLD</span>
                        )}
                        {players[index].status && players[index].status === PlayerStatus.ALL_IN && (
                            <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">ALL IN</span>
                        )}
                    </div>
                    <div className="absolute top-[0%] w-full">
                        <Badge count={index + 1} value={BigUnit.from(players[index]?.stack, 18).toNumber()} color={color} />
                    </div>
                </div>
            </div>

            <div
                className={`absolute  z-[1000] transition-all duration-1000 ease-in-out transform ${isCardVisible
                    ? "opacity-100 animate-slide-left-to-right" // Apply slide-left-to-right animation when visible
                    : "opacity-0 animate-slide-top-to-bottom" // Apply slide-top-to-bottom animation when hidden
                    }`}
                style={{
                    left: left, // You can use dynamic left values here
                    top: top, // You can use dynamic top values here
                    transform: "translate(-50%, -50%)", // To center the div
                }}
            >
                {
                    isCardVisible === index && (
                        <PlayerCard
                            id={index + 1}
                            label="SIT HERE"
                            // left={left}
                            // top={top}
                            color={color}
                            setStartIndex={(index: number) => setStartIndex(index)}
                            onClose={() => setCardVisible(-1)}
                        />
                    )
                }
            </div>
        </>
    );
};

export default OppositePlayer;
