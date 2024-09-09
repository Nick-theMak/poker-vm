const Transaction = require("./models/transaction");
const TxPool = require("./core/txpool");
const AccountState = require("./vm/account_state");
const Block = require("./models/block");
const Blockchain = require("./vm/blockchain");
const crypto = require("crypto");

// this shouldnt be public
const Blocks = require("./schemas/block");

const ethers = require("ethers");
const dotenv = require("dotenv");

dotenv.config();

class Server {
  constructor(private_key) {
    this.mempool = new TxPool();
    this.account_state = new AccountState();
    this.version = 1;
    this.private_key = private_key;

    // get public key from private key
    const wallet = new ethers.Wallet(this.private_key);
    this.validator = wallet.address;
  }

  async processMessage(message) {
    try {
      // if transaction, process transaction
      // if block, process block

      let { method, params, id, data, signature, nonce } = message;

      if (!method) {
        throw new Error("Method is required");
      }

      console.log(`Processing message: ${method}`);

      if (method === "get_version") {
        return this.version;
      }

      if (method === "get_height") {
        return this.validator;
      }

      if (method === "get_balance") {
        const balance = await this.account_state.getBalance(params[0]);
        return balance;
      }

      if (method === "get_tx") {
        return await this.getTx(params[0]);
      }

      if (method === "get_account") {
        return await this.getAccount(params[0]);
      }

      if (method === "get_block") {
        const block = await Blocks.findOne({ hash: params[0] });
        return block;
      }

      if (method === "get_mempool") {
        const txs = await this.getMempool();

        // TODO: RESHAPE

        return txs;
      }

      if (method === "get_random") {
        const buffer = crypto.randomBytes(32);
        return buffer.toString("hex");
      }

      if (method === "mine") {
        const blockchain = new Blockchain();
        const txs = this.mempool.getTransactions();
        const block = await blockchain.newBlock(txs);

        // notify all the other nodes via web sockets

        return block;
      }

      if (method === "mint") {
        if (params.length < 2) {
          throw new Error("Invalid parameters for mint");
        }

        // Get signature
        const to = params[0];
        const value = params[1];

        const tx = new Transaction(to, data, value, "", signature, nonce);
        return await this.mint(tx);
      }

      // use recover public key to get the public key
      const from = data;

      if (!nonce) {
        nonce = await this.account_state.nonce(from);
      } else {
        // check if the nonce is valid
        const account = await this.account_state.getAccount(from);
        if (account.nonce !== parseInt(nonce)) {
          throw new Error("Invalid nonce");
        }
      }

      if (method === "send_transaction") {
        const to = params[0];
        const value = params[1];

        const tx = new Transaction(to, data, value, "", signature, nonce);
        return await this.processTransaction(tx);
      }

      return null;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getMempool() {
    const txs = this.mempool.getTransactions();
    return txs;
  }

  // if someone sends us a block, we need to process it and add to the chain
  processBlock(block) {
    // check if the block is valid
    // if valid, add to the chain
    // if invalid, discard
  }

  async mint(tx) {
    // write transactions
    if (this.mempool.contains(tx)) {
      throw new Error(`Transaction ${tx.hash} already in mempool`);
    }
    // mint new coins
    if (tx.verify()) {
      this.mempool.add(tx);
      return tx.hash;
    }

    throw new Error("Transaction is invalid");
  }

  async processTransaction(tx) {
    // write transactions
    if (this.mempool.contains(tx)) {
      throw new Error(`Transaction ${tx.hash} already in mempool`);
    }

    if (!tx.verify()) {
      throw new Error("Transaction is invalid");
    }

    this.mempool.add(tx);
    return tx.hash;
  }

  bootstrapNetwork() {
    // connect to other validators
    // get the latest block
    // get the latest state

    // verify the block

    console.log("Bootstrapping network ...");
  }

  genesisBlock() {
    // load the genesis block with the initial state
  }

  async validatorLoop() {
    // while (true) {
    const ticker = new Date().getTime();
    console.log(`Starting validator loop at ${ticker} ...`);

    const block = await this.createNewBlock();
    this.processBlock(block);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    // }
  }
}

let server;

const getServer = (private_key) => {
  if (!server) {
    server = new Server(private_key);
  }

  return server;
};

module.exports = { getServer, Server };
