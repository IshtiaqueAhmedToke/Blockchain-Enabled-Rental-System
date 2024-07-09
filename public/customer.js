const apiUrl = "http://localhost:3000/api";
let currentUser;

async function fetchVehicles() {
    try {
        const response = await fetch(`${apiUrl}/vehicles`);
        const vehicles = await response.json();

        const rentedResponse = await fetch(`${apiUrl}/rentedVehicles?renter=${currentUser}`);
        const rentedVehicles = await rentedResponse.json();

        const itemsContainer = document.getElementById("itemsContainer");
        itemsContainer.innerHTML = "";

        // Rented Vehicles Card
        const rentedCard = document.createElement("div");
        rentedCard.classList.add("owner-card", "glass-effect");
        rentedCard.innerHTML = `
            <h2>Your Rented Vehicles</h2>
            <div class="vehicle-grid"></div>
        `;

        const rentedVehicleGrid = rentedCard.querySelector('.vehicle-grid');

        rentedVehicles.forEach((vehicle) => {
            const vehicleElement = document.createElement("div");
            vehicleElement.classList.add("vehicle-item", "glass-effect");
            vehicleElement.innerHTML = `
                <h3>${vehicle.vehicleName}</h3>
                <p><strong>Owner:</strong> ${vehicle.owner}</p>
                <p><strong>Description:</strong> ${vehicle.description || 'N/A'}</p>
                <p><strong>Vehicle Type:</strong> ${vehicle.vehicleType || 'N/A'}</p>
                <p><strong>Make:</strong> ${vehicle.make || 'N/A'}</p>
                <p><strong>Model:</strong> ${vehicle.model || 'N/A'}</p>
                <p><strong>Year:</strong> ${vehicle.year || 'N/A'}</p>
                <p><strong>Condition:</strong> ${vehicle.condition}/10</p>
                <p><strong>Rental Rate:</strong> $${vehicle.rentalRate}/day</p>
                <button onclick="openFeedbackModal('${vehicle.owner}', '${vehicle.vehicleName}')">Provide Feedback</button>
            `;
            rentedVehicleGrid.appendChild(vehicleElement);
        });

        itemsContainer.appendChild(rentedCard);

        // Available Vehicles
        const vehiclesByOwner = vehicles.reduce((acc, vehicle) => {
            if (!acc[vehicle.owner]) {
                acc[vehicle.owner] = [];
            }
            acc[vehicle.owner].push(vehicle);
            return acc;
        }, {});

        for (const [owner, ownerVehicles] of Object.entries(vehiclesByOwner)) {
            const ownerCard = document.createElement("div");
            ownerCard.classList.add("owner-card", "glass-effect");
            ownerCard.innerHTML = `
                <h2>${owner}'s Vehicles</h2>
                <button onclick="viewReputation('${owner}')">View Owner's Reputation</button>
                <div id="reputation-${owner}" class="reputation"></div>
                <div class="vehicle-grid"></div>
            `;

            const vehicleGrid = ownerCard.querySelector('.vehicle-grid');

            ownerVehicles.forEach((vehicle) => {
                const vehicleElement = document.createElement("div");
                vehicleElement.classList.add("vehicle-item", "glass-effect");
                vehicleElement.innerHTML = `
                    <h3>${vehicle.vehicleName}</h3>
                    <p><strong>Description:</strong> ${vehicle.description}</p>
                    <p><strong>Vehicle Type:</strong> ${vehicle.vehicleType}</p>
                    <p><strong>Make:</strong> ${vehicle.make}</p>
                    <p><strong>Model:</strong> ${vehicle.model}</p>
                    <p><strong>Year:</strong> ${vehicle.year}</p>
                    <p><strong>Condition:</strong> ${vehicle.condition}/10</p>
                    <p><strong>Rental Rate:</strong> $${vehicle.rentalRate}/day</p>
                    <button onclick="rentVehicle('${vehicle.owner}', '${vehicle.vehicleName}')">Rent Vehicle</button>
                `;
                vehicleGrid.appendChild(vehicleElement);
            });

            itemsContainer.appendChild(ownerCard);
        }
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        alert("Failed to load vehicles. Please try again later.");
    }
}

async function rentVehicle(owner, vehicleName) {
    try {
        const response = await fetch(`${apiUrl}/rentVehicle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ owner, vehicleName, renter: currentUser }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        alert(result.message);
        fetchVehicles(); // Refresh the vehicles list
    } catch (error) {
        console.error("Error renting vehicle:", error);
        alert(`Error renting vehicle: ${error.message}`);
    }
}

async function viewReputation(owner) {
    try {
        const response = await fetch(`${apiUrl}/getReputationScore/${owner}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const reputationElement = document.getElementById(`reputation-${owner}`);
        if (data.score !== undefined) {
            reputationElement.innerHTML = `<p>Reputation Score: ${data.score}</p>`;
        } else {
            reputationElement.innerHTML = `<p>${data.message}</p>`;
        }
    } catch (error) {
        console.error("Error fetching reputation score:", error);
        alert("Failed to load reputation score. Please try again later.");
    }
}

function openFeedbackModal(owner, vehicleName) {
    document.getElementById('feedbackOwner').value = owner;
    document.getElementById('feedbackVehicle').value = vehicleName;
    document.getElementById('feedbackModal').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    currentUser = localStorage.getItem('userName');
    if (!currentUser) {
        window.location.href = 'login.html';
    } else {
        document.querySelector('h1').textContent += ` - Welcome, ${currentUser}!`;
    }

    const stars = document.querySelectorAll('.stars .material-icons');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = star.getAttribute('data-value');
            document.getElementById('ratingValue').value = value;
            stars.forEach(s => {
                s.textContent = parseInt(s.getAttribute('data-value')) <= parseInt(value) ? 'star' : 'star_border';
            });
        });
    });

    document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const feedback = {
            owner: document.getElementById('feedbackOwner').value,
            vehicleName: document.getElementById('feedbackVehicle').value,
            rating: parseInt(document.getElementById('ratingValue').value),
            renter: currentUser,
            onTime: formData.get('onTime') === 'yes',
            fairPrice: formData.get('fairPrice') === 'yes'
        };
        
        try {
            const response = await fetch(`${apiUrl}/submitFeedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback),
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            
            alert(`${result.message} New reputation score: ${result.newScore}`);
            document.getElementById('feedbackForm').reset();
            document.getElementById('feedbackModal').style.display = 'none';
            fetchVehicles(); // Refresh the vehicles list to show updated reputation
        } catch (error) {
            console.error("Error submitting feedback:", error);
            alert(`Failed to submit feedback: ${error.message}`);
        }
    });

    fetchVehicles(); // Fetch vehicles on page load
});
