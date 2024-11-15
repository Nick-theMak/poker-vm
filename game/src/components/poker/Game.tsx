import { useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { useWallet } from "@/hooks/useWallet";
import PlayerList from "./PlayerList";
import PlayerMoves from "./PlayerMoves";
import CardSet from "./CardSet";

export default function Game() {
    const { gameId } = useParams();
    const { address } = useWallet();
    const { state, join, performAction } = useGame(gameId);

    if (!state)
        return (<div><button onClick={() => join?.(address)}>Join</button></div>);

    const you = state.players.find(p => p.address === address)!;

    return (<div>
        <PlayerList players={state.players} you={you} />
        <CardSet name="community" cards={[...state.flop, state.turn, state.river]} >
            <div className="flex justify-between m-6 mt-0">
                <div className="text-start">
                    <div>Pot: ${state.pot}</div>
                    <div>Current Bet: ${state.currentBet}</div>
                </div>
                <div>{state.round.toUpperCase()}</div>
                <div className="text-end">
                    <div>Big Blind: ${state.bigBlind}</div>
                    <div>Small Blind: ${state.smallBlind}</div>
                </div>
            </div>
        </CardSet>
        <CardSet name="hole" cards={you.holeCards || []} />
        {you.isTurn && <PlayerMoves moves={you.validMoves} performAction={performAction} />}
    </div>);
}
