import { ethers, JsonRpcProvider, Contract } from "ethers";
import { TransferCommand } from "./transferCommand";
import { getMempoolInstance } from "../core/mempool";
import { getTransactionInstance } from "../state/transactionManagement";
import { Transaction } from "../models/transaction";
import { NativeToken } from "../models/nativeToken";

// Mock external dependencies
jest.mock("ethers");
jest.mock("../core/mempool");
jest.mock("../state/transactionManagement");
jest.mock("../models/transaction");
jest.mock("../core/provider");

describe.only("TransferCommand", () => {
    // Test constants
    const MOCK_GAME_ADDRESS = "0x97942a9dC3f8468EF12F375a94F93014B77dFeD6";
    const MOCK_FROM = "0x97f7f0D8792a4BedD830F65B533846437F5f3c32";

    // Mock instances
    let mockMempool: jest.Mocked<any>;
    let mockTransactionManagement: jest.Mocked<any>;
    // let mockWallet: jest.Mocked<any>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock mempool
        mockMempool = {
            add: jest.fn()
        };
        (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);

        // Setup mock transaction management
        mockTransactionManagement = {
            getTransactionByData: jest.fn()
        };
        (getTransactionInstance as jest.Mock).mockReturnValue(mockTransactionManagement);
    });

    // describe.only("constructor", () => {
    //     it("should throw error when deposit index is not provided", () => {
    //         expect(() => new TransferCommand()).toThrow("Deposit index must be provided");
    //     });

    //     it("should throw error when private key is not provided", () => {
    //         expect(() => new MintCommand(VALID_DEPOSIT_INDEX, VALID_HASH, "")).toThrow("Private key must be provided");
    //     });

    //     it("should initialize successfully with valid parameters", () => {
    //         const command = new MintCommand(VALID_DEPOSIT_INDEX, VALID_HASH, VALID_PRIVATE_KEY);
    //         expect(command).toBeDefined();
    //     });
    // });

    describe("execute", () => {
        // let command: TransferCommand;

        // beforeEach(() => {
        //     command = new TransferCommand(MOCK_FROM, MOCK_GAME_ADDRESS, 1000000n, "data", "privateKey");
        // });

        // it.skip("should throw error if transaction already exists", async () => {
        //     mockTransactionManagement.getTransactionByData.mockResolvedValue({ exists: true });

        //     await expect(command.execute()).rejects.toThrow("Transaction already in blockchain");
        // });

        it.only("should successfully create and add transfer transaction to mempool", async () => {
            let command: TransferCommand = new TransferCommand(MOCK_FROM, MOCK_GAME_ADDRESS, 1000000n, "data", "privateKey");
            const tx = new Transaction(
                MOCK_GAME_ADDRESS,
                MOCK_FROM,
                1000000n,
                ethers.ZeroHash,
                "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb",
                1000,
                1,
                undefined,
                undefined
            );

            // Execute command
            await command.execute();

            // Verify transaction creation
            expect(Transaction.create).toHaveBeenCalledWith(
                MOCK_GAME_ADDRESS,
                MOCK_FROM,
                expect.any(BigInt),
                BigInt(0),
                "privateKey",
                "data"
            );

            // Verify mempool addition
            expect(mockMempool.add).toHaveBeenCalledWith(tx);
            
        });

        it.skip("should successfully create and add transaction to mempool", async () => {
            // Mock successful scenario
            mockTransactionManagement.getTransactionByData.mockResolvedValue(null);

            const tx = new Transaction(
                "to",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb",
                1000,
                1,
                undefined,
                "data"
            );
            (Transaction.create as jest.Mock).mockResolvedValue(tx);

            // Execute command
            // await command.execute();

            // // Verify transaction creation
            // expect(Transaction.create).toHaveBeenCalledWith(
            //     MOCK_RECEIVER,
            //     MOCK_PUBLIC_KEY,
            //     expect.any(BigInt),
            //     BigInt(VALID_DEPOSIT_INDEX),
            //     VALID_PRIVATE_KEY,
            //     MOCK_DATA
            // );

            // Verify mempool addition
            expect(mockMempool.add).toHaveBeenCalledWith(tx);
        });
    });
});
