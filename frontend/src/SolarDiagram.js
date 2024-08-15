import React from 'react';

const SolarDiagram = ({ panelTemp, tankTemp, fluidTemp, ambientTemp, minMaxTemps }) => {
    const getColor = (temp, min, max) => {
        const normalizedTemp = Math.max(0, Math.min((temp - min) / (max - min), 1));
        return `rgb(${Math.round(normalizedTemp * 255)}, 0, ${Math.round((1 - normalizedTemp) * 255)})`;
    };

    return (
        <svg width="100%" height="200" viewBox="0 0 600 200">
            {/* Solar Panel */}
            <rect x="10" y="10" width="180" height="100" 
                fill={getColor(panelTemp, minMaxTemps.panel.min, minMaxTemps.panel.max)} 
                stroke="black" rx="10" ry="10" />
            <text x="100" y="55" textAnchor="middle" fill="white">Panel</text>
            <text x="100" y="85" textAnchor="middle" fill="white">{panelTemp.toFixed(2)}°F</text>

            {/* Pipes */}
            <path d="M190 60 H270 V110 H410" 
                stroke={getColor(fluidTemp, minMaxTemps.fluid.min, minMaxTemps.fluid.max)} 
                strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M410 70 H270 V20 H190" 
                stroke={getColor(fluidTemp, minMaxTemps.fluid.min, minMaxTemps.fluid.max)} 
                strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Fluid Temperature */}
            <rect x="260" y="50" width="80" height="40" fill="white" stroke="black" rx="5" ry="5" />
            <text x="300" y="70" textAnchor="middle" fill="black">Fluid</text>
            <text x="300" y="85" textAnchor="middle" fill="black">{fluidTemp.toFixed(2)}°F</text>



            {/* Storage Tank */}
            <rect x="410" y="40" width="180" height="120" 
                fill={getColor(tankTemp, minMaxTemps.tank.min, minMaxTemps.tank.max)} 
                stroke="black" rx="10" ry="10" />
            <text x="500" y="90" textAnchor="middle" fill="white">Tank</text>
            <text x="500" y="120" textAnchor="middle" fill="white">{tankTemp.toFixed(2)}°F</text>

            {/* Ambient Temperature */}
            <text x="300" y="180" textAnchor="middle" fill="black">Ambient: {ambientTemp.toFixed(2)}°F</text>
        </svg>
    );
};

export default SolarDiagram;