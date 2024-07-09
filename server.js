const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Blockchain = require('./blockchain');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to handle CORS policy
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let rentalChain;

try {
    rentalChain = Blockchain.loadFromFile('blockchain.json');
    console.log('Blockchain loaded from file');
} catch (error) {
    console.log('Creating new blockchain');
    rentalChain = new Blockchain();
}

// Save the blockchain state periodically
setInterval(() => {
    rentalChain.saveToFile('blockchain.json');
    console.log('Blockchain saved to file');
}, 60000); // Save every minute


// API to add a farm vehicle
app.post('/api/addVehicle', (req, res) => {
    const { owner, vehicleName, vehicleType, make, model, year, description, condition, rentalRate } = req.body;
    if (!owner || !vehicleName || !vehicleType || !make || !model || !year || !description || !condition || !rentalRate) {
        return res.status(400).json({ message: 'Invalid input' });
    }
    try {
        rentalChain.addTransaction({ 
            owner, 
            vehicleName, 
            vehicleType, 
            make, 
            model, 
            year, 
            description, 
            condition: parseInt(condition), 
            rentalRate: parseFloat(rentalRate),
            type: 'vehicle_addition' 
        });
        rentalChain.minePendingTransactions(owner);
        res.json({ message: 'Farm vehicle added to the blockchain!' });
    } catch (error) {
        console.error("Error adding farm vehicle:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/rentVehicle', (req, res) => {
    const { owner, vehicleName, renter } = req.body;
    if (!owner || !vehicleName || !renter) {
        return res.status(400).json({ message: 'Invalid input' });
    }
    try {
        // Find the original vehicle
        const vehicleTransaction = rentalChain.chain
            .flatMap(block => block.data)
            .find(t => t.owner === owner && t.vehicleName === vehicleName && t.type === 'vehicle_addition');

        if (!vehicleTransaction) {
            return res.status(404).json({ message: 'Farm vehicle not found' });
        }

        // Create rental transaction with all vehicle details
        rentalChain.addTransaction({ 
            ...vehicleTransaction, // Spread all properties from the original vehicle
            renter, 
            type: 'vehicle_rental'
        });
        rentalChain.minePendingTransactions(renter);
        res.json({ message: 'Farm vehicle rented successfully!' });
    } catch (error) {
        console.error("Error renting farm vehicle:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// API to get rented vehicles for a specific renter
app.get('/api/rentedVehicles', (req, res) => {
    const renter = req.query.renter;
    if (!renter) {
        return res.status(400).json({ message: 'Renter not specified' });
    }
    try {
        const rentedVehicles = rentalChain.chain
            .flatMap(block => block.data)
            .filter(transaction => transaction.type === 'vehicle_rental' && transaction.renter === renter)
            .map(({ owner, vehicleName, vehicleType, make, model, year, description, condition, rentalRate }) => 
                ({ owner, vehicleName, vehicleType, make, model, year, description, condition, rentalRate }));
        res.json(rentedVehicles);
    } catch (error) {
        console.error("Error fetching rented vehicles:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// API to get all farm vehicles
app.get('/api/vehicles', (req, res) => {
    try {
        const vehicles = rentalChain.chain
            .flatMap(block => block.data)
            .filter(transaction => transaction.type === 'vehicle_addition')
            .map(({ owner, vehicleName, vehicleType, make, model, year, description, condition, rentalRate }) => 
                ({ owner, vehicleName, vehicleType, make, model, year, description, condition, rentalRate }));
        res.json(vehicles);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// API to get vehicles for a specific owner
app.get('/api/myVehicles', (req, res) => {
    const owner = req.query.owner;
    if (!owner) {
        return res.status(400).json({ message: 'Owner not specified' });
    }
    try {
        const vehicles = rentalChain.chain
            .flatMap(block => block.data)
            .filter(transaction => transaction.type === 'vehicle_addition' && transaction.owner === owner)
            .map(({ vehicleName, vehicleType, make, model, year, description, condition, rentalRate }) => 
                ({ vehicleName, vehicleType, make, model, year, description, condition, rentalRate }));
        res.json(vehicles);
    } catch (error) {
        console.error("Error fetching my vehicles:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// API to get reputation score of an address
app.get('/api/getReputationScore/:address', (req, res) => {
    const address = req.params.address;
    if (!address) {
        return res.status(400).json({ message: 'Address not specified' });
    }
    try {
        const score = rentalChain.calculateReputationScore(address);
        if (score === null) {
            return res.json({ message: 'Not enough data to calculate reputation score yet' });
        }
        res.json({ score });
    } catch (error) {
        console.error("Error fetching reputation score:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// API to submit feedback
app.post('/api/submitFeedback', (req, res) => {
    const { owner, vehicleName, rating, renter, onTime, fairPrice } = req.body;

    // Validate input
    if (!owner || !vehicleName || !rating || !renter) {
        console.error("Invalid input. Required fields are missing:", req.body);
        return res.status(400).json({ message: 'Invalid input. Please provide owner, vehicleName, rating, and renter.' });
    }

    try {
        // Check if the renter has actually rented the item
        const rentalTransaction = rentalChain.chain
            .flatMap(block => block.data)
            .find(t => t.owner === owner && t.vehicleName === vehicleName && t.renter === renter && t.type === 'vehicle_rental');

        if (!rentalTransaction) {
            console.error(`Rental transaction not found for ${owner}'s vehicle ${vehicleName} rented by ${renter}`);
            return res.status(403).json({ message: 'You have not rented this vehicle and cannot provide feedback.' });
        }

        // Add feedback transaction
        rentalChain.addTransaction({
            owner,
            vehicleName,
            renter,
            rating,
            onTime,
            fairPrice,
            type: 'feedback'
        });
        rentalChain.minePendingTransactions(renter);

        // Recalculate the reputation score
        const newScore = rentalChain.calculateReputationScore(owner);

        console.log(`Feedback submitted successfully for ${owner}'s vehicle ${vehicleName} by ${renter}. New score: ${newScore}`);

        res.json({ message: 'Feedback submitted successfully', newScore });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        res.status(500).json({ message: 'Internal Server Error: ' + error.message });
    }
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


