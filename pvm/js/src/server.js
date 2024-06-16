const Transaction = require("./models/transaction");
const TxPool = require("./txpool");
const AccountState = require("./vm/account_state");
const Block = require("./models/block");
const Blocks = require("./schemas/blocks");

class Server {
  constructor() {
    this.validator = ""; // validator public key
    this.mempool = new TxPool();
    this.account_state = new AccountState();
    this.version = 1;
  }

  async processMessage(message) {
    // if transaction, process transaction
    // if block, process block

    const { method, params, id, data, signature } = message;
    const to = params[0];
    const value = params[1];
    const nonce = 0;

    const tx = new Transaction(to, data, value, "", signature, nonce);

    return await this.processTransaction(tx);
  }

  async createNewBlock() {
    const header = "";

    const txs = this.mempool.getTransactions();

    // get the last block
    const lastBlock = await Blocks.findOne().sort({ index: -1 });
    const index = lastBlock.index + 1;
    const timestamp = new Date().getTime();

    const block = new Block(index, lastBlock.hash, timestamp, this.validator);
    block.addTxs(txs);

    // sign the block
    block.sign("795844fd4b531b9d764cfa2bf618de808fe048cdec9e030ee49df1e464bddc68");

    // clear the mempool
    this.mempool.clear();

    // save the block to the database
    const blockToAdd = new Blocks({
      index,
      version: this.version,
      hash: block.hash,
      merkle_root: "",
      previous_block_hash: lastBlock.previous_block_hash,
      timestamp,
      validator: block.validator,
      signature: block.signature,
      txs: txs,
    });

    await blockToAdd.save();
    return block;
  }

  // if someone sends us a block, we need to process it and add to the chain
  processBlock(block) {
    // check if the block is valid
    // if valid, add to the chain
    // if invalid, discard
  }

  async processTransaction(tx) {
    if (tx.method === "get_balance") {
      const balance = await this.account_state.getBalance(tx.to);
      return { response: balance };
    }

    // write transactions
    if (this.mempool.contains(tx)) {
      return { error: "Transaction already in mempool" };
    }

    if (tx.verify()) {
      this.mempool.add(tx);
      return { response: "Transaction added to mempool" };
    }

    return { error: "Transaction failed verification" };
  }

  bootstrapNetwork() {

  }

  genesisBlock() {
    // load the genesis block with the initial state
  }

  async validatorLoop() {
    while (true) {
      const ticker = new Date().getTime();
      console.log(`Starting validator loop at ${ticker} ...`);

      const block = this.createNewBlock();
      this.processBlock(block);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

let server;

const getServer = () => {
  if (!server) {
    server = new Server();
  }

  return server;
};

module.exports = { getServer, Server };
