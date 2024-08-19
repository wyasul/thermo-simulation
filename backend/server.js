const express = require('express');
const cors = require('cors');
const { simulateTemperature } = require('./calculations');
const { fahrenheitToCelsius, celsiusToFahrenheit } = require('./utils');

const app = express();

// Backend server port
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint for running the simulation
app.post('/simulate', (req, res) => {
    const initialParams = {
        area: req.body.area !== undefined ? parseFloat(req.body.area) : 2.0,
        efficiency: req.body.efficiency !== undefined ? parseFloat(req.body.efficiency) : 0.15,
        pumpPower: req.body.pumpPower !== undefined ? parseFloat(req.body.pumpPower) : 50,
        hour: req.body.hour !== undefined ? parseFloat(req.body.hour) : 0,
        duration: parseFloat(req.body.duration) || 24,
        timeStep: 3600,
        minAmbientTemp: req.body.minAmbientTemp !== null ? fahrenheitToCelsius(parseFloat(req.body.minAmbientTemp)) : 10,
        maxAmbientTemp: req.body.maxAmbientTemp !== null ? fahrenheitToCelsius(parseFloat(req.body.maxAmbientTemp)) : 20,
        cloudCover: req.body.cloudCover !== null ? parseFloat(req.body.cloudCover) : 0,
        specificHeat: req.body.specificHeat !== undefined ? parseFloat(req.body.specificHeat) : 4186,
        fluidTemp: req.body.fluidTemp !== undefined ? fahrenheitToCelsius(parseFloat(req.body.fluidTemp)) : 20,
        transmittance: req.body.transmittance !== undefined ? parseFloat(req.body.transmittance) : 0.9,
        absorptance: req.body.absorptance !== undefined ? parseFloat(req.body.absorptance) : 0.95,
        tankVolume: parseFloat(req.body.tankVolume) || 1000,
        tankTemp: req.body.tankTemp !== null ? fahrenheitToCelsius(parseFloat(req.body.tankTemp)) : 20,
        pumpEfficiency: req.body.pumpEfficiency !== undefined ? parseFloat(req.body.pumpEfficiency) : 0.7,
        hydraulicHead: parseFloat(req.body.hydraulicHead) || 5,
        U_L: parseFloat(req.body.U_L) || 8,
        currentState: req.body.currentState || null,
        fixedTemp: req.body.fixedTemp === 'None' ? null : (parseFloat(req.body.fixedTemp)),
        density: parseFloat(req.body.density) || 1000
        };

    const inputChanges = req.body.inputChanges || {};
    const startStep = req.body.startHour || 0;

    // Convert input changes temperatures to Celsius for processing
    for (const hour in inputChanges) {
        if (inputChanges[hour].minAmbientTemp !== undefined) {
            inputChanges[hour].minAmbientTemp = fahrenheitToCelsius(inputChanges[hour].minAmbientTemp);
        }
        if (inputChanges[hour].maxAmbientTemp !== undefined) {
            inputChanges[hour].maxAmbientTemp = fahrenheitToCelsius(inputChanges[hour].maxAmbientTemp);
        }
        if (inputChanges[hour].fluidTemp !== undefined ) {
            inputChanges[hour].fluidTemp = fahrenheitToCelsius(inputChanges[hour].fluidTemp);
        }
        if (inputChanges[hour].tankTemp !== undefined) {
            inputChanges[hour].tankTemp = fahrenheitToCelsius(inputChanges[hour].tankTemp);
        }
    }

    // Temperatures from the simulation are converted to Fahrenheit
    const temperatures = simulateTemperature(initialParams, inputChanges, startStep).map(temp => (
        {
            time: temp.time,
            fluidTemp: celsiusToFahrenheit(temp.fluidTemp),
            panelTemp: celsiusToFahrenheit(temp.panelTemp),
            tankTemp: celsiusToFahrenheit(temp.tankTemp),
            ambientTemp: celsiusToFahrenheit(temp.ambientTemp)
    }));
    res.json({ temperatures });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});