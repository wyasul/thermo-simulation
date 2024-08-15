import React from 'react';

const SolarDiagram = ({ panelTemp, tankTemp, fluidTemp, ambientTemp, minMaxTemps, hour }) => {
    const getColor = (temp, min, max) => {
        const normalizedTemp = Math.max(0, Math.min((temp - min) / (max - min), 1));
        return `rgb(${Math.round(normalizedTemp * 255)}, 0, ${Math.round((1 - normalizedTemp) * 255)})`;
    };

    const getSunMoonPosition = (hour) => {
        let angle;
        if (hour >= 6 && hour < 18) {
            // Daytime: 6 AM to 6 PM
            angle = (18 - hour) * 15;
        } else {
            // Nighttime: 6 PM to 6 AM
            angle = (6 - (hour < 6 ? hour + 24 : hour)) * 15;
        }
        const radiusX = 290;
        const radiusY = 90;
        const centerX = 300;
        const centerY = 70;
        const x = centerX + radiusX * Math.cos(angle * Math.PI / 180);
        const y = centerY - radiusY * Math.sin(angle * Math.PI / 180);
        return { x, y };
    };

    const { x, y } = getSunMoonPosition(hour);
    const isDay = hour >= 6 && hour < 18;

    return (
        <svg width="100%" height="300" viewBox="0 -100 600 300">
            {/* Sun or Moon */}
            {isDay ? (
                <circle cx={x} cy={y - 50} r="15" fill="yellow" stroke="black" />
            ) : (
                <circle cx={x} cy={y - 50} r="10" fill="white" stroke="gray" />
            )}

            {/* Solar Panel */}
            <rect x="10" y="20" width="180" height="100" 
                fill={getColor(panelTemp, minMaxTemps.panel.min, minMaxTemps.panel.max)} 
                stroke="black" rx="10" ry="10" />
            <text x="100" y="65" textAnchor="middle" fill="white">Panel</text>
            <text x="100" y="95" textAnchor="middle" fill="white">{panelTemp.toFixed(2)}°F</text>

            {/* Pipes */}
            <path d="M190 70 H270 V120 H410" 
                stroke={getColor(fluidTemp, minMaxTemps.fluid.min, minMaxTemps.fluid.max)} 
                strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M410 80 H270 V30 H190" 
                stroke={getColor(fluidTemp, minMaxTemps.fluid.min, minMaxTemps.fluid.max)} 
                strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Fluid Temperature */}
            <rect x="260" y="60" width="80" height="40" fill="white" stroke="black" rx="5" ry="5" />
            <text x="300" y="80" textAnchor="middle" fill="black">Fluid</text>
            <text x="300" y="95" textAnchor="middle" fill="black">{fluidTemp.toFixed(2)}°F</text>

            {/* Storage Tank */}
            <rect x="410" y="50" width="180" height="120" 
                fill={getColor(tankTemp, minMaxTemps.tank.min, minMaxTemps.tank.max)} 
                stroke="black" rx="10" ry="10" />
            <text x="500" y="100" textAnchor="middle" fill="white">Tank</text>
            <text x="500" y="130" textAnchor="middle" fill="white">{tankTemp.toFixed(2)}°F</text>

            {/* Ambient Temperature */}
            <text x="300" y="-20" textAnchor="middle" fill="black">Ambient: {ambientTemp.toFixed(2)}°F</text>
        </svg>
    );
};

export default SolarDiagram;