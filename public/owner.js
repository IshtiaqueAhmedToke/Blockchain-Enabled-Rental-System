const apiUrl = "http://localhost:3000/api";

document.addEventListener('DOMContentLoaded', () => {
    const ownerInput = document.getElementById('owner');
    const userName = localStorage.getItem('userName');
    if (!userName) {
        window.location.href = 'login.html';
    } else {
        ownerInput.value = userName;
    }

    document.getElementById('addVehicleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const owner = ownerInput.value;
        const vehicleName = document.getElementById('vehicleName').value;
        const vehicleType = document.getElementById('vehicleType').value;
        const make = document.getElementById('make').value;
        const model = document.getElementById('model').value;
        const year = document.getElementById('year').value;
        const description = document.getElementById('description').value;
        const condition = document.getElementById('condition').value;
        const rentalRate = document.getElementById('rentalRate').value;
    
        try {
            const response = await fetch(`${apiUrl}/addVehicle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    owner,
                    vehicleName,
                    vehicleType,
                    make,
                    model,
                    year: parseInt(year),
                    description,
                    condition: parseInt(condition),
                    rentalRate: parseFloat(rentalRate)
                }),
            });


            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            alert(result.message);
            fetchMyVehicles();
            fetchReputationScore();
        } catch (error) {
            console.error("Error adding vehicle:", error);
        }
    });

    async function fetchMyVehicles() {
        const owner = ownerInput.value;
        try {
            const response = await fetch(`${apiUrl}/myVehicles?owner=${owner}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const vehicles = await response.json();
            const myVehiclesDiv = document.getElementById("myVehicles");
            myVehiclesDiv.innerHTML = "";
            vehicles.forEach((vehicle) => {
                const vehicleDiv = document.createElement("div");
                vehicleDiv.classList.add("vehicle-item", "glass-effect");
                vehicleDiv.innerHTML = `
                    <h3>${vehicle.vehicleName}</h3>
                    <p>Type: ${vehicle.vehicleType}</p>
                    <p>Make: ${vehicle.make}</p>
                    <p>Model: ${vehicle.model}</p>
                    <p>Year: ${vehicle.year}</p>
                    <p>Description: ${vehicle.description}</p>
                    <p>Condition: ${vehicle.condition}/10</p>
                    <p>Rental Rate: $${vehicle.rentalRate}/day</p>
                `;
                myVehiclesDiv.appendChild(vehicleDiv);
            });
        } catch (error) {
            console.error("Error fetching my vehicles:", error);
        }
    }

    async function fetchReputationScore() {
        const owner = ownerInput.value;
        try {
            const response = await fetch(`${apiUrl}/getReputationScore/${owner}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const reputationDiv = document.getElementById("reputationScore");
            if (data.score !== undefined) {
                reputationDiv.innerHTML = `Your Reputation Score: ${data.score}`;
            } else {
                reputationDiv.innerHTML = data.message;
            }
        } catch (error) {
            console.error("Error fetching reputation score:", error);
        }
    }

    fetchMyVehicles();
    fetchReputationScore();
});
