export enum PlayerActionType {
    SMALL_BLIND = "post small blind",
    BIG_BLIND = "post big blind",
    FOLD = "fold",
    CHECK = "check",
    BET = "bet",
    CALL = "call",
    RAISE = "raise",
    ALL_IN = "all-in",
    MUCK = "muck",
    JOIN = "join"
}

export enum PlayerStatus {
    NOT_ACTED = "not-acted",
    TURN = "turn",
    ACTIVE = "active",
    FOLDED = "folded",
    ALL_IN = "all-in",
    SITTING_OUT = "sitting-out"
}

export enum TexasHoldemRound {
    ANTE = "ante",
    PREFLOP = "preflop",
    FLOP = "flop",
    TURN = "turn",
    RIVER = "river",
    SHOWDOWN = "showdown"
}

/// This is the type of the last action of a player
export type ActionDTO = {
    action: PlayerActionType;
    amount: string;
};

export type LegalActionDTO = {
    action: PlayerActionType;
    min: string | undefined;
    max: string | undefined;
};

export type WinnerDTO = {
    address: string;
    amount: number;
};

export type PlayerDTO = {
    address: string;
    seat: number; // change to position
    stack: string; // BigNumber
    isSmallBlind: boolean,
    isBigBlind: boolean,
    isDealer: boolean,
    holeCards: number[] | undefined;
    status: PlayerStatus;
    lastAction: ActionDTO | undefined;
    actions: LegalActionDTO[];
    timeout: number;
    signature: string;
};


export type TexasHoldemStateDTO = {
    type: "cash";
    address: string;
    smallBlind: string;
    bigBlind: string;
    smallBlindPosition: number;
    bigBlindPosition: number;
    dealer: number;
    players: PlayerDTO[];
    communityCards: number[];
    pots: string[];
    nextToAct: number;
    round: TexasHoldemRound;
    winners: WinnerDTO[];
    signature: string;
};
