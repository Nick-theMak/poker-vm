import { AccountManagement, getAccountManagementInstance } from "../state/accountManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class BalanceCommand implements ISignedCommand<BigInt> {
    private readonly accountManagement: AccountManagement;
    private readonly address: string;

    constructor(address: string, private readonly privateKey: string) {
        this.accountManagement = getAccountManagementInstance();
        this.address = address;
        this.privateKey = privateKey;
    }

    public async execute(): Promise<ISignedResponse<BigInt>> {
        const account = await this.accountManagement.getAccount(this.address);
        return signResult(account.balance, this.privateKey);
    }
}
