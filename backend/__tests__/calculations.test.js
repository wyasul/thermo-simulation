const { 
  getSolarIrradiance, 
  calculatePanelUsefulEnergyGain, 
  calculateHeatTransferToFluid,
  calculateHeatTransferToTank,
  simulateTemperature,
} = require('../calculations');

describe('Solar Irradiance Calculations', () => {
  test('getSolarIrradiance returns 0 before sunrise', () => {
    expect(getSolarIrradiance(5)).toBe(0);
  });

  test('getSolarIrradiance returns 0 after sunset', () => {
    expect(getSolarIrradiance(19)).toBe(0);
  });

  test('getSolarIrradiance is reduced by cloud cover', () => {
    const clearSky = getSolarIrradiance(12, 0);
    const cloudySky = getSolarIrradiance(12, 50);
    expect(cloudySky).toBe(clearSky * 0.5);
  });

  test('getSolarIrradiance peaks at noon', () => {
    const morningIrradiance = getSolarIrradiance(9);
    const noonIrradiance = getSolarIrradiance(12);
    const afternoonIrradiance = getSolarIrradiance(15);
    expect(noonIrradiance).toBeGreaterThan(morningIrradiance);
    expect(noonIrradiance).toBeGreaterThan(afternoonIrradiance);
  });
});

describe('Panel Useful Energy Gain Calculations', () => {
  test('calculatePanelUsefulEnergyGain matches textbook example', () => {
    const highEfficiencyParams = {
      hour: 11,
      area: 2,
      efficiency: 0.841,
      cloudCover: 0,
      specificHeat: 4186,
      T_ambient: null,
      T_plate: 40,
      transmittance: 1,
      absorptance: 1,
      U_L: 8,
      pumpPower: 50,
      hydraulicHead: 10,
      pumpEfficiency: 0.8,
      mass_flow_rate: 0.03,
      testAmbient: 2
    };
    const result = calculatePanelUsefulEnergyGain(...Object.values(highEfficiencyParams));
    
    // Expecting F_prime_prime to be around 0.948
    expect(result.F_prime_prime).toBeGreaterThanOrEqual(0.94); 
    expect(result.F_prime_prime).toBeLessThanOrEqual(0.95);

    // Expecting F_R to be around 0.797
    expect(result.F_R).toBeGreaterThanOrEqual(0.79);
    expect(result.F_R).toBeLessThanOrEqual(0.8);

    // Expecting q_u to be around 1.76
    expect(result.q_u).toBeGreaterThanOrEqual(1.75);
    expect(result.q_u).toBeLessThanOrEqual(1.85);
  });

  test('calculatePanelUsefulEnergyGain returns expected values for low efficiency', () => {
    const lowEfficiencyParams = {
      hour: 12,
      area: 1,
      efficiency: 0.5,
      cloudCover: 20,
      specificHeat: 4186,
      T_ambient: 25,
      T_plate: 50,
      transmittance: 0.9,
      absorptance: 0.95,
      U_L: 5,
      pumpPower: 30,
      hydraulicHead: 5,
      pumpEfficiency: 0.7,
      mass_flow_rate: null,
      testAmbient: null
    };
    const lowEfficiencyResult = calculatePanelUsefulEnergyGain(...Object.values(lowEfficiencyParams));

    const highEfficiencyParams = {
        ...lowEfficiencyParams,
        efficiency: 0.9
    }
    const highEfficiencyResult = calculatePanelUsefulEnergyGain(...Object.values(highEfficiencyParams));

    // Higher efficiency should result in higher useful energy gain
    expect(highEfficiencyResult.q_u).toBeGreaterThan(lowEfficiencyResult.q_u);
  });
});

describe('Heat Transfer to Fluid Calculations', () => {
  test('calculateHeatTransferToFluid returns expected values when F_R is 0', () => {
    const solarPanelVars = { q_u: 0.5, F_R: 0, F_prime_prime: 0 };
    const result = calculateHeatTransferToFluid(solarPanelVars, 20, 8);
    expect(result.T_fluid).toBe(20);
    expect(result.T_plate).toBe(20.0625);
  });

  test('calculateHeatTransferToFluid returns expected values when F_R is not 0', () => {
    const solarPanelVars = { q_u: 1, F_R: 0.8, F_prime_prime: 0.9 };
    const result = calculateHeatTransferToFluid(solarPanelVars, 25, 5);
    expect(result.T_fluid).toBeGreaterThan(25);
    expect(result.T_plate).toBeGreaterThan(result.T_fluid);
  });

  test('calculateHeatTransferToFluid matches textbook example', () => {
    const solarPanelVars = {
      q_u: 1.42,
      F_R: 0.797,
      F_prime_prime: 0.948
    };
    const currentFluidTemp = 40;
    const U_L = 8.0;

    const result = calculateHeatTransferToFluid(solarPanelVars, currentFluidTemp, U_L);

    expect(result.T_fluid).toBeCloseTo(43, 0); // Expecting 43°C, allowing some rounding error
    expect(result.T_plate).toBeCloseTo(53, 0); // Expecting 53°C, allowing some rounding error
  });
});

describe('Heat Transfer to Tank Calculations', () => {
  test('calculateHeatTransferToTank returns unchanged temperature when fluid and tank are equal', () => {
    const result = calculateHeatTransferToTank(40, 40, 1, 4186, 3600, 50, 5, 0.8);
    expect(result).toBeCloseTo(40, 4);
  });

  test('calculateHeatTransferToTank is affected by pump power', () => {
    const resultLowPower = calculateHeatTransferToTank(50, 40, 1, 4186, 3600, 25, 5, 0.8);
    const resultHighPower = calculateHeatTransferToTank(50, 40, 1, 4186, 3600, 100, 5, 0.8);
    expect(resultHighPower).toBeGreaterThan(resultLowPower);
  });

  test('calculateHeatTransferToTank is affected by tank volume', () => {
    const resultSmallTank = calculateHeatTransferToTank(50, 40, 0.5, 4186, 3600, 50, 5, 0.8);
    const resultLargeTank = calculateHeatTransferToTank(50, 40, 2, 4186, 3600, 50, 5, 0.8);
    expect(resultSmallTank).toBeGreaterThan(resultLargeTank);
  });

  test('calculateHeatTransferToTank is affected by time step', () => {
    const resultShortStep = calculateHeatTransferToTank(50, 40, 1, 4186, 1800, 50, 5, 0.8);
    const resultLongStep = calculateHeatTransferToTank(50, 40, 1, 4186, 7200, 50, 5, 0.8);
    expect(resultLongStep).toBeGreaterThan(resultShortStep);
  });
});

describe('Temperature Simulation', () => {
  test('simulateTemperature returns expected number of data points', () => {
    const initialParams = {
      area: 2,
      efficiency: 0.8,
      hour: 0,
      duration: 24,
      timeStep: 3600,
      minAmbientTemp: 15,
      maxAmbientTemp: 25,
      cloudCover: 0,
      specificHeat: 4186,
      pumpPower: 50,
      fluidTemp: 20,
      transmittance: 0.9,
      absorptance: 0.95,
      tankVolume: 1,
      tankTemp: 20,
      U_L: 5,
      hydraulicHead: 5,
      pumpEfficiency: 0.8,
      fixedTemp: null
    };
    const inputChanges = {};
    const result = simulateTemperature(initialParams, inputChanges);
    expect(result.length).toBe(24);
  });

  test('simulateTemperature handles input changes correctly', () => {
    const initialParams = {
      area: 2,
      efficiency: 0.8,
      hour: 0,
      duration: 48,
      timeStep: 3600,
      minAmbientTemp: 15,
      maxAmbientTemp: 25,
      cloudCover: 0,
      specificHeat: 4186,
      pumpPower: 50,
      fluidTemp: 20,
      transmittance: 0.9,
      absorptance: 0.95,
      tankVolume: 1,
      tankTemp: 20,
      U_L: 5,
      hydraulicHead: 5,
      pumpEfficiency: 0.8,
      fixedTemp: null
    };
    const inputChanges = {
      12: { cloudCover: 50 }
    };
    const result = simulateTemperature(initialParams, inputChanges);
    expect(result.length).toBe(48);
    expect(result[12].ambientTemp) < (result[11].ambientTemp);
  });

  test('simulateTemperature final tank temperature increases with higher efficiency', () => {
    const baseParams = {
      area: 2.0,
      efficiency: 0.7,
      hour: 0,
      duration: 24,
      timeStep: 3600,
      minAmbientTemp: 15.56,
      maxAmbientTemp: 26.67,
      cloudCover: 0,
      specificHeat: 4186,
      pumpPower: 50,
      fluidTemp: 20, 
      transmittance: 0.95,
      absorptance: 0.95,
      tankVolume: 1000,
      tankTemp: 20,
      U_L: 8,
      hydraulicHead: 5,
      pumpEfficiency: 0.7,
      fixedTemp: null
    };

    const lowEfficiencyResult = simulateTemperature(baseParams, {});
    const highEfficiencyResult = simulateTemperature({ ...baseParams, efficiency: 0.9 }, {});
    console.log(lowEfficiencyResult)

    expect(highEfficiencyResult[23].tankTemp).toBeGreaterThan(lowEfficiencyResult[23].tankTemp);
  });

  test('simulateTemperature final tank temperature is lower with higher cloud cover', () => {
    const baseParams = {
        area: 2.0,
        efficiency: 0.7,
        hour: 0,
        duration: 24,
        timeStep: 3600,
        minAmbientTemp: 15.56,
        maxAmbientTemp: 26.67,
        cloudCover: 0,
        specificHeat: 4186,
        pumpPower: 50,
        fluidTemp: 20, 
        transmittance: 0.95,
        absorptance: 0.95,
        tankVolume: 1000,
        tankTemp: 20,
        U_L: 8,
        hydraulicHead: 5,
        pumpEfficiency: 0.7,
        fixedTemp: null
      };

    const clearSkyResult = simulateTemperature(baseParams, {});
    const cloudySkyResult = simulateTemperature({ ...baseParams, cloudCover: 50 }, {});

    expect(cloudySkyResult[23].tankTemp).toBeLessThan(clearSkyResult[23].tankTemp);
  });

  test('simulateTemperature final tank temperature is higher with larger panel area', () => {
    const baseParams = {
        area: 2.0,
        efficiency: 0.7,
        hour: 0,
        duration: 24,
        timeStep: 3600,
        minAmbientTemp: 15.56,
        maxAmbientTemp: 26.67,
        cloudCover: 0,
        specificHeat: 4186,
        pumpPower: 50,
        fluidTemp: 20, 
        transmittance: 0.95,
        absorptance: 0.95,
        tankVolume: 1000,
        tankTemp: 20,
        U_L: 8,
        hydraulicHead: 5,
        pumpEfficiency: 0.7, // 70% converted to decimal
        fixedTemp: null
      };

    const smallAreaResult = simulateTemperature(baseParams, {});
    const largeAreaResult = simulateTemperature({ ...baseParams, area: 4 }, {});

    expect(largeAreaResult[23].tankTemp).toBeGreaterThan(smallAreaResult[23].tankTemp);
  });

  test('simulateTemperature final tank temperature is lower with larger tank volume', () => {
    const baseParams = {
        area: 2.0,
        efficiency: 0.7,
        hour: 0,
        duration: 24,
        timeStep: 3600,
        minAmbientTemp: 15.56,
        maxAmbientTemp: 26.67,
        cloudCover: 0,
        specificHeat: 4186,
        pumpPower: 50,
        fluidTemp: 20, 
        transmittance: 0.95,
        absorptance: 0.95,
        tankVolume: 1,
        tankTemp: 20,
        U_L: 8,
        hydraulicHead: 5,
        pumpEfficiency: 0.7,
        fixedTemp: null
      };

    const smallTankResult = simulateTemperature(baseParams, {});
    const largeTankResult = simulateTemperature({ ...baseParams, tankVolume: 2 }, {});

    expect(largeTankResult[23].tankTemp).toBeLessThan(smallTankResult[23].tankTemp);
  });

  test('simulateTemperature handles mid-simulation cloud cover change', () => {
    const baseParams = {
        area: 2.0,
        efficiency: 0.7,
        hour: 0,
        duration: 24,
        timeStep: 3600,
        minAmbientTemp: 15.56,
        maxAmbientTemp: 26.67,
        cloudCover: 0,
        specificHeat: 4186,
        pumpPower: 50,
        fluidTemp: 20, 
        transmittance: 0.95,
        absorptance: 0.95,
        tankVolume: 1000,
        tankTemp: 20,
        U_L: 8,
        hydraulicHead: 5,
        pumpEfficiency: 0.7,
        fixedTemp: null
      };

    const noCloudChangeResult = simulateTemperature(baseParams, {});
    
    const cloudChangeParams = {
      ...baseParams,
      cloudCover: 0
    };
    const cloudChangeInputs = {
      12: { cloudCover: 50 }
    };
    const cloudChangeResult = simulateTemperature(cloudChangeParams, cloudChangeInputs);

    // Check that temperatures are the same before cloud cover change
    expect(cloudChangeResult[11].tankTemp).toBeCloseTo(noCloudChangeResult[11].tankTemp);

    // Check that temperatures diverge after cloud cover change
    expect(cloudChangeResult[23].tankTemp).toBeLessThan(noCloudChangeResult[23].tankTemp);
  });

  test('simulateTemperature compares different mid-simulation cloud cover changes', () => {
    const baseParams = {
        area: 2.0,
        efficiency: 0.7,
        hour: 0,
        duration: 24,
        timeStep: 3600,
        minAmbientTemp: 15.56,
        maxAmbientTemp: 26.67,
        cloudCover: 0,
        specificHeat: 4186,
        pumpPower: 50,
        fluidTemp: 20, 
        transmittance: 0.95,
        absorptance: 0.95,
        tankVolume: 1000,
        tankTemp: 20,
        U_L: 8,
        hydraulicHead: 5,
        pumpEfficiency: 0.7,
        fixedTemp: null
      };

    const smallCloudChangeInputs = {
      12: { cloudCover: 25 }
    };
    const smallCloudChangeResult = simulateTemperature(baseParams, smallCloudChangeInputs);

    const largeCloudChangeInputs = {
      12: { cloudCover: 75 }
    };
    const largeCloudChangeResult = simulateTemperature(baseParams, largeCloudChangeInputs);

    // Checking that temperatures are the same before cloud cover change
    expect(smallCloudChangeResult[11].tankTemp).toBeCloseTo(largeCloudChangeResult[11].tankTemp);

    // Checking that temperatures diverge after cloud cover change
    expect(largeCloudChangeResult[23].tankTemp).toBeLessThan(smallCloudChangeResult[23].tankTemp);
  });

});