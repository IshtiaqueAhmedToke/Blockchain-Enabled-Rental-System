# Blockchain-Enabled-Rental-System

This project is a demonstration of a blockchain-based agricultural tool rental system. It allows users to rent tools securely using blockchain technology to ensure trustability and reputation scoring.

![BlockchainRental](https://github.com/user-attachments/assets/13779bf6-8f0d-464c-a6de-9f59dc01bf96)

## Features

- **Blockchain Implementation**: Uses a custom-built blockchain for storing rental transactions and calculating reputation scores.
- **Owner and Customer Interfaces**: Separate interfaces for owners to manage tools and view customer reputation scores, and for customers to browse available tools.
- **Feedback system**: This sytem introduces a feedback system on the customer side home page which controls the toold owner reputation mechanism. 

## Getting Started

To get a local copy up and running, follow these steps:

### Prerequisites

- Node.js and npm installed
- Modern web browser


### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/blockchain-rental-system.git
   cd blockchain-rental-system
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the server:
   ```sh
   node server.js
   ```
4. Open `login.html` and select the owner page to add to the blockchain and customer page to rent the equipment and provide feedback which will calculate the tool owners reputation score.

### Usage

- **Owner Interface (`owner.html`)**:
  - View transactions and reputation scores of customers.
  - Add new tools to the rental system.
  
- **Customer Interface (`customer.html`)**:
  - Browse available tools for rent.
  - Submit rental requests.

Project Link: [https://github.com/yourusername/blockchain-rental-system](https://github.com/yourusername/blockchain-rental-system)
```

### Notes:
- There is an issue with the customer-side UI refreshing. This version does not have a database connected for simplicity in testing and development. The core functionality of the paper is okay.
- Replace `yourusername` with your actual GitHub username and adjust URLs accordingly.
- Ensure to include a `LICENSE` file in your project directory if not already present, specifying the license used for your project.

