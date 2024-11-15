import { PlayerAction } from "@bitcoinbrisbane/block52";
import { IUpdate, Move, Player, PlayerId, PlayerStatus, StageType, TexasHoldemGameState, TexasHoldemJoinState, ValidMove } from "../models/game";
import { Card, Deck, DeckType } from "../models/deck";
import AllInAction from "./actions/allInAction";
import BaseAction from "./actions/baseAction";
import BetAction from "./actions/betAction";
import BigBlindAction from "./actions/bigBlindAction";
import CallAction from "./actions/callAction";
import CheckAction from "./actions/checkAction";
import FoldAction from "./actions/foldAction";
import RaiseAction from "./actions/raiseAction";
import SmallBlindAction from "./actions/smallBlindAction";
// @ts-ignore
import PokerSolver from "pokersolver";

type Stage = {
    moves: Move[];
}

class TexasHoldemGame {
    private readonly _update: IUpdate
    private _players: Player[];
    private _stages: Stage[];
    private _currentStage: StageType;
    private _currentPlayer: number;
    private _deck: Deck;
    private _communityCards: Card[];
    private _sidePots: Map<PlayerId, number>;
    private _actions: BaseAction[];

    constructor(private _address: string, private _smallBlind: number, private _bigBlind: number, private _buttonPosition: number = 0) {
        this._players = [];
        this._stages = [{ moves: [] }];
        this._currentStage = StageType.JOIN;
        this._currentPlayer = 0;
        this._buttonPosition = 0;
        this._deck = new Deck(DeckType.STANDARD_52);
        this._communityCards = [];
        this._sidePots = new Map<PlayerId, number>();

        this._update = new class implements IUpdate {
            constructor(public game: TexasHoldemGame) { }
            addMove(move: Move): void {
                this.game._stages[this.game._currentStage].moves.push(move);
                if (![PlayerAction.SMALL_BLIND, PlayerAction.BIG_BLIND].includes(move.action))
                    this.game.nextPlayer();
            }
        }(this);
        this._actions = [
            new FoldAction(this, this._update),
            new CheckAction(this, this._update),
            new BetAction(this, this._update),
            new CallAction(this, this._update),
            new RaiseAction(this, this._update),
            new AllInAction(this, this._update)
        ];
    }

    get players() { return [...this._players]; }
    get bigBlind() { return this._bigBlind; }
    get smallBlind() { return this._smallBlind; }
    get bigBlindPosition() { return (this._buttonPosition + 2) % this._players.length; }
    get smallBlindPosition() { return (this._buttonPosition + 1) % this._players.length; }
    get currentPlayerId() { return this._players[this._currentPlayer].id; }
    get currentStage() { return this._currentStage; }
    get pot() { return this.getStartingPot() + this.getTotalStake(); }
    get state() {
        return this.currentStage == StageType.JOIN ?
            new TexasHoldemJoinState(this._players.map(p => p.id)) :
            new TexasHoldemGameState(this._address,
                this._smallBlind,
                this._bigBlind,
                this._players.map((p, i) => p.getPlayerState(this, i)),
                this._communityCards,
                this.pot,
                this.getMaxStake(),
                this._currentStage);
    }

    nextGame() {
        if (![StageType.JOIN, StageType.SHOWDOWN].includes(this.currentStage))
            throw new Error("Game currently in progress.");
        this.start(this._update);
    }

    join(player: Player) {
        if (this.currentStage != StageType.JOIN)
            throw new Error("Cannot join once game started.");
        this._players.push(player);
    }

    getValidActions(playerId: string): ValidMove[] {
        const player = this.getPlayer(playerId);
        return this._actions.map(verifyAction).filter(a => a) as ValidMove[];

        function verifyAction(action: BaseAction) {
            try {
                const range = action.verify(player);
                return { action: action.type, ...range ? { minAmount: range.minAmount, maxAmount: range.maxAmount } : {} };
            } catch {
                return null;
            }
        }
    }

    getLastAction(playerId: string): Move | undefined {
        const player = this.getPlayer(playerId);
        return this.getPlayerMoves(player).at(-1);
    }

    performAction(playerId: string, action: PlayerAction, amount?: number) {
        if (this.currentStage == StageType.JOIN)
            throw new Error(`Cannot perform ${action} until game started.`)
        return this._actions.find(a => a.type == action)?.execute(this.getPlayer(playerId), amount);
    }

    getPlayer(playerId: string): Player {
        const player = this._players.find(p => p.id === playerId);
        if (!player)
            throw new Error("Player not found.");
        return player;
    }

    getPlayerStatus(player: Player): PlayerStatus {
        for (let stage = StageType.PRE_FLOP; stage <= this._currentStage; stage++) {
            const moves = this.getPlayerMoves(player, stage);
            if (moves.some(m => m.action == PlayerAction.FOLD))
                return PlayerStatus.FOLD;
            if (moves.some(m => m.action == PlayerAction.ALL_IN))
                return PlayerStatus.ALL_IN;
        }
        return PlayerStatus.ACTIVE;
    }

    getStakes(stage: StageType = this._currentStage): Map<string, number> {
        return this._stages[stage].moves.reduce(
            (acc, v) => { acc.set(v.playerId, (acc.get(v.playerId) ?? 0) + (v.amount ?? 0)); return acc; },
            new Map<string, number>());
    }

    getPlayerStake(player: Player, stakes = this.getStakes()): number {
        return stakes.get(player.id) ?? 0;
    }

    getMaxStake(stakes = this.getStakes()): number {
        return stakes.size ? Math.max(...stakes.values()) : 0;
    }

    getTotalStake(stakes = this.getStakes()): number {
        return Array.from(stakes.values()).reduce((acc, v) => acc + v, 0);
    }

    private getStartingPot(): number {
        let pot = 0;
        for (let stage = StageType.PRE_FLOP; stage < this._currentStage; stage++)
            pot += this.getTotalStake(this.getStakes(stage));
        return pot;
    }

    private start(update: IUpdate) {
        this._deck.shuffle();
        this._players.forEach(p => p.holeCards = this._deck.deal(2) as [Card, Card]);
        this._currentStage = StageType.PRE_FLOP;
        this._currentPlayer = (this._buttonPosition + 3) % this._players.length;
        new BigBlindAction(this, update).execute(this._players[this.bigBlindPosition]);
        new SmallBlindAction(this, update).execute(this._players[this.smallBlindPosition]);
    }

    private getPlayerMoves(player: Player, stage: StageType = this._currentStage) {
        return this._stages[stage].moves.filter(m => m.playerId == player.id);
    }

    private nextPlayer() {
        const active = [...Array(this._players.length).keys()].reduce((acc, i) => {
            const index = (this._currentPlayer + 1 + i) % this._players.length;
            return this.getPlayerStatus(this._players[index]) === PlayerStatus.ACTIVE ? [...acc, index] : acc;
        }, [] as Array<number>);
        const stakes = this.getStakes();
        const maxStakes = this.getMaxStake(stakes);
        const isPlayerTurnFinished = (p: Player) => this.getPlayerMoves(p).filter(m => m.action != PlayerAction.BIG_BLIND).length &&
            (this.getPlayerStake(p, stakes) == maxStakes);
        if ((active.length <= 1) || active.map(i => this._players[i]).every(isPlayerTurnFinished))
            this.nextStage();
        else
            this._currentPlayer = active[0];
    }

    private nextStage() {
        this.calculateSidePots();
        this._stages.push({ moves: [] });
        if (this._currentStage < StageType.SHOWDOWN)
            this._currentStage++;
        if (this._currentStage != StageType.SHOWDOWN) {
            if (this._currentStage == StageType.FLOP)
                this._communityCards.push(...this._deck.deal(3));
            else if ((this._currentStage == StageType.TURN) || (this._currentStage == StageType.RIVER))
                this._communityCards.push(...this._deck.deal(1));
            this._currentPlayer = this._buttonPosition;
            this.nextPlayer();
        }
        else
            this.calculateWinner();
    }

    private calculateSidePots() {
        const startingPot = this.getStartingPot();
        const numActive = this._players.filter(p => this.getPlayerStatus(p) == PlayerStatus.ACTIVE).length;
        // TODO: Check this will work in all cases when multiple side pots in same round
        this._players
            .filter(p => (this.getPlayerStatus(p) == PlayerStatus.ALL_IN) && !this._sidePots.has(p.id))
            .forEach(p => this._sidePots.set(p.id, startingPot + this.getPlayerStake(p) * (1 + numActive)));
    }

    private calculateWinner() {
        const hands = new Map<PlayerId, any>(this._players.map(p => [p.id, PokerSolver.Hand.solve(this._communityCards.concat(p.holeCards!).map(toPokerSolverMnemonic))]));
        const active = this._players.filter(p => this.getPlayerStatus(p) == PlayerStatus.ACTIVE);
        const orderedPots = Array.from(this._sidePots.entries()).sort(([_k1, v1], [_k2, v2]) => v1 - v2);
        let pot = this.getStartingPot();
        let winningHands = PokerSolver.Hand.winners(active.map(a => hands.get(a.id)));
        let winningPlayers = this._players.filter(p => winningHands.includes(hands.get(p.id)));
        while (orderedPots.length) {
            const [playerId, sidePot] = orderedPots[0];
            const remainder = pot - sidePot;
            winningPlayers.forEach(p => p.chips += remainder / winningPlayers.length);
            winningHands = PokerSolver.Hand.winners(winningHands.concat(hands.get(playerId)));
            winningPlayers = this._players.filter(p => winningHands.includes(hands.get(p.id)));
            pot = sidePot;
            orderedPots.shift();
        }
        winningPlayers.forEach(p => p.chips += pot / winningPlayers.length);

        function toPokerSolverMnemonic(card: Card) {
            return card.mnemonic.replace("10", "T");
        }
    }
}

export default TexasHoldemGame;