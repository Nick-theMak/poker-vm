// RPC Class
export type RPCRequest = {
    id: bigint;
    method: RPCMethods;
    params: RPCRequestParams[RPCMethods];
    data: string;
};

export type RPCResponse = {
    id: bigint;
    result: any;
    error?: string;
};

export enum RPCMethods {
    GET_ACCOUNT = "get_account",
    GET_MEMPOOL = "get_mempool",
    MINT = "mint",
    TRANSFER = "transfer",
    GET_BLOCK = "get_block",
    GET_LAST_BLOCK = "get_last_block",
    MINE = "mine",
}

export type RPCRequestParams = {
    [RPCMethods.GET_ACCOUNT]: [string]; // [address]
    [RPCMethods.GET_MEMPOOL]: []; // No parameters
    [RPCMethods.MINT]: [string, bigint, string]; // [address, amount, transactionId]
    [RPCMethods.TRANSFER]: [string, string, bigint]; // [from, to, amount]
    [RPCMethods.GET_BLOCK]: [bigint]; // [index]
    [RPCMethods.GET_LAST_BLOCK]: []; // No parameters
    [RPCMethods.MINE]: []; // No parameters
}

export const READ_METHODS = [
    RPCMethods.GET_ACCOUNT,
    RPCMethods.GET_MEMPOOL,
    RPCMethods.GET_BLOCK,
    RPCMethods.GET_LAST_BLOCK,
];

export const WRITE_METHODS = [
    RPCMethods.MINT,
    RPCMethods.TRANSFER,
];
