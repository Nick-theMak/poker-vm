import { useEffect, useState } from "react";
import * as React from "react";
import { usePlayerContext } from "../context/usePlayerContext";
import CheckboxList from "./playPage/common/CheckboxList";
import { BigUnit } from "bigunit";

const PokerActionPanel: React.FC = () => {
    const { setPlayerAction, playerIndex, players, lastPot, pots } = usePlayerContext();
    const [raiseAmount, setRaiseAmount] = useState(0);
    const balance = BigUnit.from(players[0]?.stack, 18).toNumber();
    const pot = BigUnit.from(pots[0], 18).toNumber();
    useEffect(() => {
        setRaiseAmount(lastPot - pot + 1);
    }, [lastPot]);

    const handleRaiseChange = (newAmount: number) => {
        setRaiseAmount(newAmount);
    };

    const onFold = () => {
        setPlayerAction("fold");
    };

    const onCheck = () => {
        setPlayerAction("check");
    };

    const onRaise = () => {
        setPlayerAction("raise", raiseAmount);
    };

    return (
        <div className="flex justify-center rounded-lg h-full text-white z-[0]">
            {/* Action Buttons */}
            <div className="left-0 absolute">
                <CheckboxList />
            </div>
            {/* <ChipPurchase /> */}
            <div className="flex flex-col w-[600px] space-y-6 mb-2 justify-center rounded-lg">
                <div className="flex justify-between gap-2">
                    <button
                        disabled={playerIndex !== 0}
                        className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={onFold}
                    >
                        FOLD
                    </button>
                    <button
                        disabled={playerIndex !== 0}
                        className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={onCheck}
                    >
                        CHECK
                    </button>
                    <button
                        disabled={playerIndex !== 0}
                        className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={onRaise}
                    >
                        {raiseAmount === balance ? "All-IN" : `RAISE ${raiseAmount}`}
                    </button>
                </div>

                {/* Slider and Controls */}
                <div className="flex items-center space-x-4">
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] py-1 px-4 rounded-lg  border-[1px] border-gray-400"
                        onClick={() => handleRaiseChange(Math.max(raiseAmount - 1, 0))}
                    >
                        -
                    </button>
                    <input
                        type="range"
                        min="0"
                        max={balance}
                        value={raiseAmount}
                        onChange={e => handleRaiseChange(Number(e.target.value))}
                        className="flex-1"
                    />
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] py-1 px-4 rounded-lg  border-[1px] border-gray-400"
                        onClick={() => handleRaiseChange(raiseAmount + 1)}
                    >
                        +
                    </button>
                </div>

                {/* Additional Options */}
                <div className="flex justify-between gap-2">
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(balance / 4)}
                    >
                        1 / 4 Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(balance / 2)}
                    >
                        1 / 2 Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount((balance / 4) * 3)}
                    >
                        3 / 4 Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(lastPot + 1)}
                    >
                        Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(balance)}
                    >
                        ALL-IN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PokerActionPanel;
