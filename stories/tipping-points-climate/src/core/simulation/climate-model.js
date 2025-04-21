import { PHYSICAL_CONSTANTS, MODEL_PARAMS, SIMULATION_PARAMS } from './constants.js';

export class ClimateModel {
    constructor() {
        const { SOLAR_CONSTANT, STEFAN_BOLTZMANN, EARTH_RADIUS } = PHYSICAL_CONSTANTS;
        this.S0 = SOLAR_CONSTANT;
        this.sigma = STEFAN_BOLTZMANN;
        this.R = EARTH_RADIUS;
    }

    calculateAlbedo(temperature) {
        const { A1, A2, T_CRIT, DELTA_T } = MODEL_PARAMS;
        return A1 - 0.5 * A2 * (1 + Math.tanh((temperature - T_CRIT) / DELTA_T));
    }

    energyIn(temperature) {
        const albedo = this.calculateAlbedo(temperature);
        return (this.S0/4) * (1 - albedo);  // Divide S0 by 4 for global average
    }

    energyOut(temperature, greenhouse) {
        return this.sigma * temperature**4 * (1-greenhouse);
    }

    calculateDeltaT(temperature, greenhouse) {
        const ein = this.energyIn(temperature);
        const eout = this.energyOut(temperature, greenhouse);
        return (ein - eout) / MODEL_PARAMS.HEAT_CAPACITY;  // K/s
    }

    simulateTemperature(initialTemp, greenhouse, timeSteps = 1000, dt = 100) {
        const temps = [initialTemp];
        const times = [0];
        const rates = [this.calculateDeltaT(initialTemp, greenhouse)];
        
        for (let i = 1; i < timeSteps; i++) {
            // RK4 integration
            const k1 = this.calculateDeltaT(temps[i-1], greenhouse);
            const k2 = this.calculateDeltaT(temps[i-1] + 0.5*dt*k1, greenhouse);
            const k3 = this.calculateDeltaT(temps[i-1] + 0.5*dt*k2, greenhouse);
            const k4 = this.calculateDeltaT(temps[i-1] + dt*k3, greenhouse);
            
            const newTemp = temps[i-1] + (dt/6)*(k1 + 2*k2 + 2*k3 + k4);
            
            temps.push(newTemp);
            times.push(i * dt);
            rates.push(k1);  // Store initial rate for phase space
        }
        
        return {
            times, 
            temperatures: temps, 
            rates
        };
    }

    

    findEquilibrium(albedo, greenhouse) {
        const tempRange = this.generateTempRange();
        const deltaTs = tempRange.map(t => this.calculateDeltaT(t, greenhouse));
        
        // Find zero crossings (equilibrium points)
        const equilibria = [];
        for (let i = 0; i < deltaTs.length - 1; i++) {
            if (deltaTs[i] * deltaTs[i + 1] <= 0) {
                equilibria.push(tempRange[i]);
            }
        }
        
        return equilibria;
    }

    calculatePotential(temperature, greenhouse) {
        // V(T) = -∫(Ein - Eout)dT
        // We'll use a simple numerical integration from a reference temperature
        const deltaT = 0.1; // Small temperature step for integration
        let potential = 0;
        
        // Start integration from MIN_TEMP
        for (let t = MODEL_PARAMS.MIN_TEMP; t <= temperature; t += deltaT) {
            const deltaE = this.calculateDeltaT(t, greenhouse);
            potential -= deltaE * deltaT; // Negative integral of energy imbalance
        }
        
        return potential;
    }

    generateTempRange() {
        const { MIN_TEMP, MAX_TEMP } = MODEL_PARAMS;
        const { TEMP_RESOLUTION } = SIMULATION_PARAMS;
        const temps = [];
        for (let i = 0; i < TEMP_RESOLUTION; i++) {
            temps.push(MIN_TEMP + (MAX_TEMP - MIN_TEMP) * i / (TEMP_RESOLUTION - 1));
        }
        return temps;
    }

    findStableEquilibrium(greenhouse) {
        const temps = this.generateTempRange();
        const rates = temps.map(t => this.calculateDeltaT(t, greenhouse));
        
        // Find zero crossings with negative slope (stable equilibria)
        for (let i = 0; i < rates.length - 1; i++) {
            if (rates[i] * rates[i + 1] <= 0 && 
                (rates[i+1] - rates[i]) / (temps[i+1] - temps[i]) < 0) {
                return temps[i];
            }
        }
        
        return null;
    }
}
