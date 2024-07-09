const crypto = require('crypto');
const fs = require('fs');

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return crypto.createHash('sha256').update(
            this.index +
            this.previousHash +
            this.timestamp +
            JSON.stringify(this.data) +
            this.nonce
        ).digest('hex');
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined: " + this.hash); 
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock() {
        return new Block(0, "01/01/2024", "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        const rewardTx = { 
            owner: null, 
            renter: miningRewardAddress, 
            tool: 'Mining Reward', 
            condition: 10, 
            conditionAccuracy: 100,
            onTimeDelivery: true,
            pricingFairness: 100
        };
        this.pendingTransactions.push(rewardTx);

        let block = new Block(this.chain.length, Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);

        this.pendingTransactions = [];
    }

    addTransaction(transaction) {
        if (!transaction.owner || !transaction.vehicleName) {
            console.log(transaction);
            throw new Error('Transaction must include owner and vehicle name');
        }
        if (transaction.type === 'vehicle_addition' && typeof transaction.condition !== 'number') {
            throw new Error('Vehicle addition transaction must include condition');
        }
        if (transaction.type === 'feedback' && (typeof transaction.rating !== 'number' || !transaction.renter)) {
            throw new Error('Feedback transaction must include rating and renter');
        }
        this.pendingTransactions.push(transaction);
    }
    
    getBalanceOfAddress(address) {
        let balance = 0;
        for (const block of this.chain) {
            for (const trans of block.data) {
                if (trans.owner === address) {
                    balance -= trans.condition;
                }
                if (trans.renter === address) {
                    balance += trans.condition;
                }
            }
        }
        return balance;
    }

    calculateReputationScore(address) {
        let totalTransactions = 0;
        let conditionAccuracySum = 0;
        let onTimeDeliveryCount = 0;
        let pricingFairnessSum = 0;

        for (const block of this.chain) {
            for (const trans of block.data) {
                if (trans.owner === address && trans.type === 'vehicle_addition') {
                    totalTransactions++;
                    conditionAccuracySum += trans.conditionAccuracy || 0;
                    onTimeDeliveryCount += trans.onTimeDelivery ? 1 : 0;
                    pricingFairnessSum += trans.pricingFairness || 0;
                }
            }
        }

        console.log(`Calculating reputation for ${address}. Total transactions: ${totalTransactions}`);

        if (totalTransactions === 0) {
            console.log('Not enough transactions to calculate reputation');
            return null;
        }

        const conditionAccuracyScore = conditionAccuracySum / totalTransactions;
        const onTimeDeliveryScore = (onTimeDeliveryCount / totalTransactions) * 100;
        const pricingFairnessScore = pricingFairnessSum / totalTransactions;

        console.log(`Scores - Condition: ${conditionAccuracyScore}, Delivery: ${onTimeDeliveryScore}, Pricing: ${pricingFairnessScore}`);

        const customerFeedbackScore = (conditionAccuracyScore + onTimeDeliveryScore + pricingFairnessScore) / 3;
        const otherFactorsScore = this.calculateOtherFactors(address);

        const overallScore = (customerFeedbackScore * 0.6) + (otherFactorsScore * 0.4);

        console.log(`Final reputation score: ${Math.round(overallScore)}`);

        return Math.round(overallScore);
    }

    calculateOtherFactors(address) {
        const transactionCount = this.getTransactionCount(address);
        const seasonalRelevance = this.calculateSeasonalRelevance();

        const transactionScore = Math.min(transactionCount * 10, 100); // 10 points per transaction, max 100

        // Adjust weights: 60% transaction count, 40% seasonal relevance
        return (transactionScore * 0.6) + (seasonalRelevance * 0.4);
    }

    calculateSeasonalRelevance() {
        const currentMonth = new Date().getMonth();
        let baseScore;

        if (currentMonth >= 2 && currentMonth <= 4) {
            baseScore = 90; // Spring
        } else if (currentMonth >= 5 && currentMonth <= 7) {
            baseScore = 80; // Summer
        } else if (currentMonth >= 8 && currentMonth <= 10) {
            baseScore = 100; // Fall
        } else {
            baseScore = 60; // Winter
        }

        const randomFactor = Math.floor(Math.random() * 11) - 5; // -5 to +5
        return Math.max(0, Math.min(100, baseScore + randomFactor));
    }

    getTransactionCount(address) {
        return this.chain
            .flatMap(block => block.data)
            .filter(trans => trans.owner === address && trans.type === 'vehicle_addition')
            .length;
    }

    saveToFile(filename) {
        const data = JSON.stringify(this, null, 2);
        fs.writeFileSync(filename, data);
    }

    static loadFromFile(filename) {
        const data = fs.readFileSync(filename, 'utf8');
        const blockchainData = JSON.parse(data);
        const blockchain = new Blockchain();
        blockchain.chain = blockchainData.chain.map(blockData => {
            const block = new Block(blockData.index, blockData.timestamp, blockData.data, blockData.previousHash);
            block.hash = blockData.hash;
            block.nonce = blockData.nonce;
            return block;
        });
        blockchain.difficulty = blockchainData.difficulty;
        blockchain.pendingTransactions = blockchainData.pendingTransactions;
        blockchain.miningReward = blockchainData.miningReward;
        return blockchain;
    }
}

module.exports = Blockchain;
