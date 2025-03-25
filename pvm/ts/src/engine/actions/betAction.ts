import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { Range } from "../types";

class BetAction extends BaseAction {
    get type(): PlayerActionType {
        return PlayerActionType.BET;
    }

    verify(player: Player): Range | undefined {
        // Can never check if you haven't matched the largest bet of the round
        const largestBet = this.getLargestBet();
        const sumBets = this.getSumBets(player.address);

        if (largestBet > sumBets && (largestBet !== 0n && sumBets !== 0n)) {
            throw new Error("Player must call or raise.");
        }

        // If we're in preflop and players have made equal bets (both at big blind level),
        // this means someone has called - betting is no longer valid, only check or raise
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            // Get all bets in the current round
            const roundBets = this.game.getBets(this.game.currentRound);
            const allBetsEqual = Array.from(roundBets.values()).every(bet => bet === largestBet);
            
            // If all bets are equal and we're beyond the blind postings (2+ players acted),
            // then we should not allow betting - only checking or raising
            if (allBetsEqual && roundBets.size >= 2 && largestBet === this.game.bigBlind) {
                throw new Error("Cannot bet after call in preflop - use check or raise instead.");
            }
        }

        super.verify(player);

        if (player.chips < this.game.bigBlind) {
            return { minAmount: player.chips, maxAmount: player.chips };
        }

        return { minAmount: this.game.bigBlind, maxAmount: player.chips };
    }
}

export default BetAction;
