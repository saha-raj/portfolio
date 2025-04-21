export const PHYSICAL_CONSTANTS = {
    SOLAR_CONSTANT: 1361,  // S0: Solar constant in W/m²
    STEFAN_BOLTZMANN: 5.67e-8,  // σ: Stefan-Boltzmann constant in W/(m²⋅K⁴)
    EARTH_RADIUS: 6.371e6,  // R: Earth's radius in meters
    
    // Atmospheric heat capacity parameters
    ATMOSPHERE_HEIGHT: 1e4,  // h: height of atmosphere in m
    ATMOSPHERE_DENSITY: 1,   // ρₐ: mean density of atmosphere in kg/m³
    SPECIFIC_HEAT: 1e3,     // cₚ: specific heat capacity in J/(kg·K)
    
    // Total heat capacity
    HEAT_CAPACITY: 1e7,     // C = h·ρₐ·cₚ = 10⁷ J/(m²·K)
}

// Calculate total heat capacity C = h · ρₐ · cₚ
const C = PHYSICAL_CONSTANTS.ATMOSPHERE_HEIGHT * 
         PHYSICAL_CONSTANTS.ATMOSPHERE_DENSITY * 
         PHYSICAL_CONSTANTS.SPECIFIC_HEAT;  // = 10⁷ J/(m²·K)

export const MODEL_PARAMS = {
    HEAT_CAPACITY: C,  // C = 10⁷ J/(m²·K)
    // Albedo parameters
    A1: 0.58,  // a₁: maximum albedo
    A2: 0.47,  // a₂: albedo parameter
    T_CRIT: 283,  // T*: critical temperature (K)
    DELTA_T: 18,  // ΔT: temperature range for transition (K)
    
    DEFAULT_GREENHOUSE: 0.4,  // g = 1-γ: greenhouse gas concentration parameter
    MIN_TEMP: 273-50,  // Minimum temperature for calculations (K)
    MAX_TEMP: 273+50,  // Maximum temperature for calculations (K)
    DEFAULT_TEMP: 288,  // Default starting temperature (K)
}

export const SIMULATION_PARAMS = {
    TIME_STEP: 0.1,  // dt: Time step for integration (years)
    MAX_TIME: 10,  // Maximum simulation time (years)
    TEMP_RESOLUTION: 100,  // Number of points for temperature calculations
    ALBEDO_RESOLUTION: 100,  // Number of points for albedo sweep
}
