import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import SolarDiagram from './SolarDiagram';


// Initial default params
const initialInputs = {
    area: 2.0,
    efficiency: 0.87,
    pumpPower: 50,
    hour: 0,
    minAmbientTemp: 60,
    maxAmbientTemp: 80,
    cloudCover: 0,
    specificHeat: 4186,
    fluidTemp: 68,
    transmittance: 0.95,
    absorptance: 0.95,
    tankVolume: 1000,
    tankTemp: 68,
    pumpEfficiency: 70,
    hydraulicHead: 5,
    U_L: 8,
    duration: 24,
    fixedTemp: 'None',
    density: 1000
};

const inputFields = {
    "Solar Panel": [
        {name: "area", label: "Panel Area (m²)"},
        {name: "efficiency", label: "Panel Efficiency (0-1)"},
        {name: "transmittance", label: "Glass Transmittance (0-1)"},
        {name: "absorptance", label: "Panel Absorptance (0-1)"},
        {name: "U_L", label: "Heat Loss Coefficient (W/m²·K)"}

    ],
    "Tank & Fluid": [
        {name: "tankVolume", label: "Tank Volume (L)"},
        {name: "tankTemp", label: "Initial Tank Temp (°F)"},
        {name: "specificHeat", label: "Fluid Specific Heat (J/kg·K)"},
        {name: "density", label: "Fluid Density (kg/m³)"},
        {name: "fluidTemp", label: "Initial Fluid Temp (°F)"}
    ],
    "Pump": [
        {name: "pumpPower", label: "Pump Power (W)"},
        {name: "pumpEfficiency", label: "Pump Efficiency (0-1)"},
        {name: "hydraulicHead", label: "Hydraulic Head (m)"}
    ],
    "Environment": [
        {name: "minAmbientTemp", label: "Min Ambient Temp (°F)"},
        {name: "maxAmbientTemp", label: "Max Ambient Temp (°F)"},
        {name: "fixedTemp", label: "Fixed Temp (°F, or 'None')"},
        {name: "cloudCover", label: "Cloud Cover (0-100%)"},
    ],
    "Simulation": [
        {name: "duration", label: "Duration (hours)"}
    ]
};

const restrictedFields = ['fluidTemp', 'tankTemp', 'tankVolume', 'area', 'duration', 'U_L', 'efficiency', 'transmittance', 'absorptance'];

function App() {
    const [inputs, setInputs] = useState(initialInputs);
    const [temperature, setTemperature] = useState([]);
    const [selectedHour, setSelectedHour] = useState(0);
    const [viewMode, setViewMode] = useState('timeline');
    const [inputChanges, setInputChanges] = useState({});
    const [changeLog, setChangeLog] = useState([]);
    const changeLogRef = useRef(null);

    // Keeps track of initial values
    const initialValuesRef = useRef(initialInputs);

    useEffect(() => {
        runSimulation(inputs, {});
    }, []);

    useEffect(() => {
        // Scroll to the bottom of the change log when a new entry is added
        if (changeLogRef.current) {
            changeLogRef.current.scrollTop = changeLogRef.current.scrollHeight;
        }
    }, [changeLog]);
    const handleInputChange = async (name, value) => {
        let parsedValue;
        const field = Object.values(inputFields).flat().find(f => f.name === name);
        
        if (name === 'fixedTemp' && value === 'None') {
            parsedValue = 'None';
        } else {
            parsedValue = parseFloat(value);
            
            if (isNaN(parsedValue)) {
                // If the value is NaN, keep it as is
                parsedValue = value;
            } else {
                // Applying value limits
                if (name.includes('Efficiency') || name === 'transmittance' || name === 'absorptance') {
                    if (!isNaN(parsedValue)) {
                        if (value === '0.' || (parsedValue >= 0 && parsedValue <= 1)) {
                            parsedValue = value;
                        } else {
                            parsedValue = Math.max(0, Math.min(1, parsedValue));
                        }
                    }
                } else if (name === 'cloudCover') {
                    parsedValue = Math.max(0, Math.min(100, parsedValue));
                } else if (name.includes('Temp')) {
                    // Negatives are allowed. Disallowing values over 100,000
                    parsedValue = Math.min(100000, parsedValue);
                } else {
                    // For all other numeric fields
                    parsedValue = Math.max(0, Math.min(100000, parsedValue));
                }
            }
        }

        const newParams = { ...inputs, [name]: parsedValue };
        setInputs(newParams);
    };

    // Handling when paramaters are changed in the before or during simulation
    const handleInputSubmit = (event, name) => {
        if (event.key === 'Enter' || event.type === 'blur') {
            let newValue;
            if (name === 'fixedTemp' && event.target.value === 'None') {
                newValue = 'None';
            } else {
                newValue = event.target.value === '' ? '' : parseFloat(event.target.value);
            }
            const initialValue = initialValuesRef.current[name];
            
            if (newValue !== initialValue && newValue !== '') {
                // Find the corresponding label for the input field
                const field = Object.values(inputFields).flat().find(f => f.name === name);
                const label = field ? field.label : name;

                // Add to change log with the label instead of the name
                setChangeLog(prevLog => [
                    ...prevLog,
                    `${label} changed from ${initialValue} to ${newValue} at hour ${selectedHour}`
                ]);

                // Check if all input values are valid (not empty)
                const updatedInputs = { 
                    ...inputs, 
                    [name]: newValue,
                    tankTemp: inputs.tankTemp,
                    fluidTemp: inputs.fluidTemp
                };

                if (Object.values(updatedInputs).every(value => value !== '')) {
                    // Prepare the updated changes for the current hour
                    const updatedChanges = {
                        ...inputChanges,
                        [selectedHour]: {
                            ...(inputChanges[selectedHour] || {}),
                            [name]: newValue
                        }
                    };

                    // Run the simulation with updated inputs and changes
                    runSimulation(updatedInputs, updatedChanges, selectedHour+1);
                }

                // Update the initial value for this input
                initialValuesRef.current = {
                    ...initialValuesRef.current,
                    [name]: newValue
                };
            }

            if (event.key === 'Enter') {
                // Prevent form submission if within a form
                event.preventDefault(); 
                
                // Remove 'editing' class and add 'submitted' class
                event.target.classList.remove('editing');
                event.target.classList.add('submitted');
                
            } else {
                // If it's a blur event, remove all classes
                event.target.classList.remove('editing', 'submitted');
            }
        }
    };

    // Running the simulation, sending the params to the backend
    const runSimulation = async (params, changes, startHour = 0) => {
        const filteredParams = Object.fromEntries(
            Object.entries(params).filter(([_, value]) => value !== '')
        );

        try {
            const response = await fetch('http://localhost:3001/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    ...filteredParams, 
                    inputChanges: changes,
                    startHour: startHour,
                    currentState: temperature[startHour] || null
                })
            });
            const data = await response.json();

            // Update the temperature array with the new simulation results
            setTemperature(prevTemperature => {
                const newTemperature = [...prevTemperature.slice(0, startHour), ...data.temperatures];
                return newTemperature;
            });
        } catch (error) {
            console.error('Error running simulation:', error);
        }
    };

    // Handling when the timeline slider is changed
    const handleTimelineChange = (event) => {
        const hour = parseInt(event.target.value);
        setSelectedHour(hour);
        
    };

    const renderInputGroup = (title, fields) => (
        <div className="input-group">
            <h3>{title}</h3>
            <div className="input-grid">
                {fields.map(field => (
                    <div key={field.name} className="input-item">
                        <label htmlFor={field.name}>
                            {field.label}
                        </label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                id={field.name}
                                name={field.name}
                                value={inputs[field.name]}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                onKeyDown={(e) => handleInputSubmit(e, field.name)}
                                onBlur={(e) => handleInputSubmit(e, field.name)}
                                disabled={selectedHour > 0 && restrictedFields.includes(field.name)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // For color coding the solar diagram
    const calculateMinMaxTemps = () => {
        if (temperature.length === 0) return { panel: {}, tank: {}, fluid: {}, ambient: {} };
        
        return {
            panel: {
                min: Math.min(...temperature.map(t => t.panelTemp)),
                max: Math.max(...temperature.map(t => t.panelTemp))
            },
            tank: {
                min: Math.min(...temperature.map(t => t.tankTemp)),
                max: Math.max(...temperature.map(t => t.tankTemp))
            },
            fluid: {
                min: Math.min(...temperature.map(t => t.fluidTemp)),
                max: Math.max(...temperature.map(t => t.fluidTemp))
            },
            ambient: {
                min: Math.min(...temperature.map(t => t.ambientTemp)),
                max: Math.max(...temperature.map(t => t.ambientTemp))
            }
        };
    };

    const renderChangeLog = () => (
        <div className="change-log-container">
            <h3 className="change-log-title">Change Log</h3>
            <div className="change-log" ref={changeLogRef}>
                <ul>
                    {changeLog.map((log, index) => (
                        <li key={index}>{log}</li>
                    ))}
                </ul>
            </div>
        </div>
    );

    const handleResetSimulation = () => {
        setInputs(initialInputs);
        setTemperature([]);
        setSelectedHour(0);
        setInputChanges({});
        setChangeLog([]);
        initialValuesRef.current = { ...initialInputs };
        runSimulation(initialInputs, {});
    };

    return (
        <div className="container">
            <h1 className="title">Solar Thermal Transfer Simulation</h1>

            {renderChangeLog()}
            <div className="compact-form">
                {Object.entries(inputFields).map(([groupName, fields]) => (
                    renderInputGroup(groupName, fields)
                ))}
            </div>
            <p className="input-note">**Changes made to inputs will affect the simulation from hour {selectedHour} onwards</p>
            <button className="reset-button" onClick={handleResetSimulation}>Reset Simulation</button>

            {temperature.length > 0 && (
                <div className="results">
                    <h2>Simulation Results</h2>
                    <div className="start-note-container">
                        {selectedHour === 0 ? (
                            <p className="start-note">Drag the slider to start the simulation</p>
                        ) : (
                            <div className="start-note-placeholder"></div>
                        )}
                    </div>
                    <div className="view-toggle">
                        <button 
                            className={viewMode === 'timeline' ? 'active' : ''}
                            onClick={() => setViewMode('timeline')}
                        >
                            Timeline View
                        </button>
                        <button 
                            className={viewMode === 'table' ? 'active' : ''}
                            onClick={() => setViewMode('table')}
                        >
                            Table View
                        </button>
                    </div>
                    {viewMode === 'timeline' ? (
                        <div className="timeline-view">
                            <input
                                type="range"
                                min={0}
                                max={inputs.duration-1}
                                value={selectedHour}
                                onChange={handleTimelineChange}
                                className="timeline-slider"
                            />
                            <p className="hour-display">Hour {selectedHour}</p>
                            <SolarDiagram
                                panelTemp={temperature[selectedHour]?.panelTemp}
                                tankTemp={(temperature[selectedHour]?.tankTemp)}
                                fluidTemp={temperature[selectedHour]?.fluidTemp}
                                ambientTemp={temperature[selectedHour]?.ambientTemp}
                                minMaxTemps={calculateMinMaxTemps()}
                                hour={(initialInputs.hour + selectedHour) % 24}
                            />
                        </div>
                    ) : (
                        <div className="table-view">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Hour</th>
                                        <th>Panel Temp (°F)</th>
                                        <th>Tank Temp (°F)</th>
                                        <th>Fluid Temp (°F)</th>
                                        <th>Ambient Temp (°F)</th>
                                        <th>Changes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {temperature.map((temp, index) => (
                                        <tr key={index}>
                                            <td>{temp.time}</td>
                                            <td>{temp.panelTemp.toFixed(2)}</td>
                                            <td>{temp.fluidTemp.toFixed(2)}</td>
                                            <td>{temp.tankTemp.toFixed(2)}</td>
                                            <td>{temp.ambientTemp.toFixed(2)}</td>
                                            <td>
                                                {changeLog
                                                    .filter(log => {
                                                        const logHour = parseInt(log.split(' at hour ')[1]);
                                                        return logHour === index && logHour <= selectedHour;
                                                    })
                                                    .map((log, logIndex) => {
                                                        const varChanged = log.split(' at hour')[0];
                                                        return <div key={logIndex}>{varChanged}</div>;
                                                    })
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;