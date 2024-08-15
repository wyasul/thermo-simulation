# thermo-simulation

This project is a solar thermal energy transfer simulation with a React frontend and Express backend.

## Prerequisites

- Node.js (v14 or later)
- npm (usually comes with Node.js)

## Setup Instructions

1. Clone or download the repository:
   ```
   git clone https://github.com/wyasul/thermo-simulation.git
   cd thermo-simulation

   or download at: https://github.com/wyasul/thermo-simulation
   ```

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

## Running Tests

To run all tests:
    ```
    npm test
    ```
    This will run both backend and frontend tests.

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
2. Make sure all dependencies are properly installed by running `npm install` in both the root directory and the `frontend/` directory.
3. Check that ports 3000 and 3001 are not being used by other applications on your machine.

If problems persist, please open an issue in the GitHub repository with a detailed description of the error and the steps to reproduce it.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.