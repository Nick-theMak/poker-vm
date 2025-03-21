
import { Block } from "../models/block";
import { BlockchainManagement, getBlockchainInstance } from "../state/blockchainManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";

export class GetBlocksCommand implements ISignedCommand<Block[]> {
    private readonly blockchainManagement: BlockchainManagement;
    private readonly transactionManagement: TransactionManagement;

    constructor(
        private readonly count: number = 100,
        private readonly privateKey: string
    ) {
        this.blockchainManagement = getBlockchainInstance();
        this.transactionManagement = getTransactionInstance();
    }

    public async execute(): Promise<ISignedResponse<Block[]>> {
        const blocks: Block[] = await this.blockchainManagement.getBlocks(this.count);

        const transactions = [];

        for (const block of blocks) {
            const blockTransactions = await this.transactionManagement.getTransactions(block.hash);
            transactions.push(...blockTransactions);
        }

        return signResult(blocks, this.privateKey);
    }
}   