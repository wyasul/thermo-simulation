# thermo-simulation

This project is a solar thermal energy transfer simulation with a React/HTML/CSS frontend and Node.js/Express backend. This software runs locally, and is intended to simulate a solar collector connected to a water tank by pipes powered by a pump. The simulation allows many different configurations, giving the user freedom to tamper with parameters such as the specific heat capacity of the fluid, solar panel efficiency and size, cloud cover, ambient temperatures, starting temperatures of the tank and fluid, etc. The user set these parameters at the beginning of the simulation and/or change them as time goes on throughout the simulation, allowing for dynamic analysis. 

## Prerequisites

- Node.js (v14 or later)
- npm (usually comes with Node.js)

## Getting Started

1. Clone or download the repository:
   ```
   git clone https://github.com/wyasul/thermo-simulation.git
   cd thermo-simulation
   ```
   or download at: https://github.com/wyasul/thermo-simulation

2. Install dependencies for the backend and frontend (make sure you're in root directory):
   ```
   npm install
   ```

## Running the Application

1. In the project root directory, run:
   ```
   npm start
   ```
   This will start both the backend server (on http://localhost:3001) and the frontend development server (on http://localhost:3000)

2. Open your browser and navigate to http://localhost:3000 to view the application.

## Running the Tests

To run all tests:
```
npm test
```
This will run backend tests. 

The tests are designed to thoroughly evaluate each thermodynamics function within the file calculations.js. There are 5 functions:

1. `getSolarIrradiance`: Calculates the solar irradiance based on the time of day and cloud cover, using a simplified model involving a cosine wave with fixed sunrise and sunset times.
2. `calculatePanelUsefulEnergyGain`: Determines the useful energy gain of a solar panel using the Hottel-Whillier-Bliss equation, considering factors like solar irradiance, panel efficiency, and heat loss.
3. `calculateHeatTransferToFluid`: Computes the heat transfer to the fluid and the resulting temperatures in the solar panel.
4. `calculateHeatTransferToTank`: Calculates the heat transfer from the solar panel fluid to the storage tank and updates the tank temperature, considering pump power and fluid properties.
5. `simulateTemperature`: The main simulation function that uses the above functions to calculate temperature changes in a solar panel system over a specified duration, accounting for various input parameters and changes over time.

Each of these functions is tested with various input parameters. Some tests reproduce changes to the variables over time and compare simulation results. There are also a couple 
tests that reproduce situations found in the Beckham and Duffie textbook, acting as a sort of 'ground truth'.

## Project Structure

- `backend/`: Contains the Express server and simulation logic
- `frontend/`: Contains the React application
- `backend/__tests__/`: Contains backend tests

## Additional Notes

- The backend runs on port 3001 by default
- The frontend runs on port 3000 by default
- Make sure both ports are available on your machine

## Troubleshooting

If you encounter any issues while setting up or running the application, please check the following:

1. Ensure you have the correct versions of Node.js and npm installed.
2. Make sure all dependencies are properly installed by running `npm install` in the root directory
3. Check that ports 3000 and 3001 are not being used by other applications on your machine.

If problems persist, please email wyattsullivan02@gmail.com, or text 307-699-2974.

## Acknowlegements

* The logic behind the thermodynamics code is drawn from Beckham & Duffie's "Solar Engineering of Thermal Processes" textbook. All thermal equations used can be found in Chapter 6, particularly sections 6.7 and 6.9