import TexasHoldemGame from "../engine/texasHoldem";
import { StateManager } from "./stateManager";
import GameState from "../schema/gameState";
import { TexasHoldemGameState } from "../models/game";

export class GameManagement extends StateManager {
    // private static _game: Map<string, TexasHoldemGame> = new Map<string, TexasHoldemGame>();

    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
    }

    // join(gameAddress: string, playerAddress: string) {
    //     let game = GameManagement._game.get(gameAddress);

    //     if (!game) {
    //         game = new TexasHoldemGame(gameAddress, 10, 30);
    //         GameManagement._game.set(gameAddress, game);
    //     }

    //     game.join(new Player(playerAddress, 100));
    //     console.log(`Player ${playerAddress} joining ${gameAddress}`);
    //     if (game.deal.length === 3)
    //         game.deal();
    // }

    async get(address: string): Promise<TexasHoldemGameState> {
        //  return GameManagement._game.get(address);

        const gameState = await GameState.findOne({
            address
        });

        if (!gameState) {
            throw new Error("Game not found");
        }

        const json = gameState.state.toJSON();

        const texasHoldemGameState = TexasHoldemGameState.fromJson(json);
        return texasHoldemGameState;
    }

    async save(gameState: TexasHoldemGameState): Promise<void> {
        const game = new GameState(gameState.toJson());
        await game.save();
    }
}

//     async getGameState(address: string): Promise<GameState> {
//         const account = await this._getAccount(address);

//         if (!account) {
//             return new Account(address, 0n);
//         }

//         return Account.fromDocument(account);
//     }
// }

export default GameManagement;