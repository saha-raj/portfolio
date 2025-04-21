/**
 * main.js
 * 
 * This is the main entry point for the Prisoner's Dilemma simulation application.
 * It initializes the application, sets up event listeners, and coordinates
 * the interaction between different modules.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const strategy1Select = document.getElementById('strategy1');
    const strategy2Select = document.getElementById('strategy2');
    const strategy1Color = document.querySelector('.strategy1-color');
    const strategy2Color = document.querySelector('.strategy2-color');
    const populationSizeInput = document.getElementById('population-size');
    const totalGamesInput = document.getElementById('total-games');
    const gamesPerPairingInput = document.getElementById('games-per-pairing');
    const startButton = document.getElementById('start-tournament');
    const stopButton = document.getElementById('stop-tournament');
    const resetButton = document.getElementById('reset-visualization');
    const runningIndicator = document.getElementById('running-indicator');
    
    // Proportion control elements
    const proportionSlider = document.getElementById('proportion-slider');
    const proportionLabelLeft = document.getElementById('proportion-label-left');
    const proportionLabelRight = document.getElementById('proportion-label-right');
    
    // Strategy colors
    const strategyColors = {
        'cooperator': '#06d6a0',
        'defector': '#ff9770',
        'tit-for-tat': '#168aad',
        'random': '#f72585',
        'grudger': '#9b5de5',
        'detective': '#565264',
        'pavlov': '#fcca46'
    };
    
    // Current proportion value (0.5 = 50% for each strategy)
    let currentProportion = 0.5;
    
    // Initialize proportion control
    updateProportionControl(currentProportion);
    
    // Add event listener for proportion slider
    proportionSlider.addEventListener('input', function() {
        // Calculate proportion directly from slider value
        currentProportion = this.value / 100;
        updateProportionControl(currentProportion);
        // Reset visualization if simulation exists and is complete
        if (simulation && simulation.isComplete) {
            visualizer.reset();
            simulation = null;
        }
    });
    
    // Function to update the proportion control UI
    function updateProportionControl(proportion) {
        // Update labels - directly use slider value for labels
        const sliderValue = proportionSlider.value;
        proportionLabelLeft.textContent = `${sliderValue}%`;
        proportionLabelRight.textContent = `${100 - sliderValue}%`;
        
        // Get current strategy colors
        const leftColor = strategy1Select.value ? strategyColors[strategy1Select.value] : '#ccc';
        const rightColor = strategy2Select.value ? strategyColors[strategy2Select.value] : '#ccc';
        
        // Update slider background to match button position exactly
        proportionSlider.style.background = `linear-gradient(to right, 
            ${leftColor} 0%, 
            ${leftColor} ${sliderValue}%, 
            ${rightColor} ${sliderValue}%, 
            ${rightColor} 100%)`;
    }
    
    // Strategy descriptions
    const strategyDescriptions = {
        'cooperator': 'Always cooperates regardless of opponent\'s moves.',
        'defector': 'Always defects regardless of opponent\'s moves.',
        'random': 'Randomly chooses to cooperate or defect with equal probability.',
        'tit-for-tat': 'Starts by cooperating, then copies opponent\'s previous move.',
        'grudger': 'Cooperates until the opponent defects, then always defects.',
        'detective': 'Starts with a specific sequence, then switches to Tit for Tat if the opponent ever defects, otherwise defects.',
        'pavlov': 'Starts by cooperating, then changes strategy only when receiving a low payoff.'
    };
    
    // Simulation and visualizer instances
    let simulation = null;
    let visualizer = null;
    let isRunning = false;
    let stopRequested = false;
    let nextGameTimeout = null;
    
    // Initialize the visualizer
    visualizer = new visualizationModule.SimulationVisualizer({
        agentPoolContainer: 'agent-pool-container',
        histogramContainer: 'histogram-container'
    });
    
    // Custom formatting for strategy selects to maintain format when selected
    function formatStrategySelects() {
        const formatSelect = (select) => {
            if (select.selectedIndex > 0) {
                const option = select.options[select.selectedIndex];
                const text = option.text;
                const parts = text.split(': ');
                
                if (parts.length === 2) {
                    const name = parts[0].trim();
                    const desc = parts[1].trim();
                    
                    // Apply the custom formatting - keep the height consistent
                    select.style.height = '62px';
                }
            }
        };
        
        // Format both strategy selects
        formatSelect(strategy1Select);
        formatSelect(strategy2Select);
    }
    
    // Initialize color indicators (with neutral colors since no strategies are selected initially)
    strategy1Color.style.backgroundColor = '#ccc';
    strategy2Color.style.backgroundColor = '#ccc';
    
    // Function to validate strategy selections and update start button state
    function updateStartButtonState() {
        const strategy1Selected = strategy1Select.value !== '';
        const strategy2Selected = strategy2Select.value !== '';
        startButton.disabled = !(strategy1Selected && strategy2Selected);
    }
    
    // Apply initial button state
    updateStartButtonState();
    
    // Function to update dropdown options
    function updateStrategyOptions(selectedStrategy, sourceSelect, targetSelect) {
        // Enable all options in the target select first
        Array.from(targetSelect.options).forEach(option => {
            option.disabled = false;
        });
        
        // If a strategy is selected, disable that option in the other dropdown
        if (selectedStrategy) {
            const matchingOption = Array.from(targetSelect.options).find(option => option.value === selectedStrategy);
            if (matchingOption) {
                matchingOption.disabled = true;
            }
        }
    }
    
    // Apply formatting when the selects change
    strategy1Select.addEventListener('change', function() {
        strategy1Color.style.backgroundColor = this.value ? strategyColors[this.value] : '#ccc';
        updateProportionControl(currentProportion); // Update slider colors
        formatStrategySelects(); // Apply custom formatting
        updateStartButtonState(); // Update start button state
        updateStrategyOptions(this.value, strategy1Select, strategy2Select); // Update strategy2 options
    });
    
    strategy2Select.addEventListener('change', function() {
        strategy2Color.style.backgroundColor = this.value ? strategyColors[this.value] : '#ccc';
        updateProportionControl(currentProportion); // Update slider colors
        formatStrategySelects(); // Apply custom formatting
        updateStartButtonState(); // Update start button state
        updateStrategyOptions(this.value, strategy2Select, strategy1Select); // Update strategy1 options
    });
    
    // Update slider values as they change
    populationSizeInput.addEventListener('input', function() {
        const populationSizeValue = document.querySelector('.param-group:nth-child(2) .slider-max');
        populationSizeValue.textContent = this.value;
        // Reset visualization if simulation exists and is complete
        if (simulation && simulation.isComplete) {
            visualizer.reset();
            simulation = null;
        }
    });
    
    totalGamesInput.addEventListener('input', function() {
        const totalGamesValue = document.querySelector('.param-group:nth-child(3) .slider-max');
        totalGamesValue.textContent = this.value;
        // Reset visualization if simulation exists and is complete
        if (simulation && simulation.isComplete) {
            visualizer.reset();
            simulation = null;
        }
    });
    
    gamesPerPairingInput.addEventListener('input', function() {
        const gamesPerPairingValue = document.querySelector('.param-group:nth-child(4) .slider-max');
        gamesPerPairingValue.textContent = this.value;
        // Reset visualization if simulation exists and is complete
        if (simulation && simulation.isComplete) {
            visualizer.reset();
            simulation = null;
        }
    });
    
    // Start tournament button click handler
    startButton.addEventListener('click', function() {
        if (isRunning) return;
        
        // Reset stop flag
        stopRequested = false;
        
        // Disable controls during simulation
        startButton.disabled = true;
        stopButton.disabled = false;
        strategy1Select.disabled = true;
        strategy2Select.disabled = true;
        populationSizeInput.disabled = true;
        totalGamesInput.disabled = true;
        gamesPerPairingInput.disabled = true;
        
        // Show running indicator
        runningIndicator.classList.remove('hidden');
        
        // Get selected strategies and parameters
        const strategy1 = strategy1Select.value;
        const strategy2 = strategy2Select.value;
        const populationSize = parseInt(populationSizeInput.value);
        const totalGames = parseInt(totalGamesInput.value);
        const gamesPerPairing = parseInt(gamesPerPairingInput.value);
        
        // Create simulation configuration
        const config = {
            strategies: {},
            proportion: currentProportion,
            populationSize: populationSize,
            totalGames: totalGames,
            gamesPerPairing: gamesPerPairing
        };
        
        // Set the strategies in the config
        config.strategies[strategy1] = 0;
        config.strategies[strategy2] = 0;
        
        // Initialize simulation
        simulation = new simulationModule.PopulationSimulation(config);
        
        // Set up simulation callbacks
        simulation.onGameComplete = function(gameResult) {
            // Update visualization
            visualizer.update(simulation.getStatistics());
            
            // If simulation is not complete and not stopped, run next game after a delay
            if (!simulation.isComplete && !stopRequested) {
                nextGameTimeout = setTimeout(() => {
                    simulation.runGame();
                }, 10); // Small delay between games for UI updates
            } else {
                // Simulation is complete or stopped
                simulationComplete();
            }
        };
        
        simulation.onProgressUpdate = function(stats) {
            // Update visualization periodically
            visualizer.update(stats);
        };
        
        simulation.onSimulationComplete = function(results) {
            // Final update when simulation is complete
            visualizer.update(simulation.getStatistics());
            simulationComplete();
        };
        
        // Function to handle simulation completion
        function simulationComplete() {
            // Display final stats
            displayFinalStats(simulation);
            
            // Re-enable controls
            startButton.disabled = false;
            stopButton.disabled = true;
            strategy1Select.disabled = false;
            strategy2Select.disabled = false;
            populationSizeInput.disabled = false;
            totalGamesInput.disabled = false;
            gamesPerPairingInput.disabled = false;
            
            // Hide running indicator
            runningIndicator.classList.add('hidden');
            
            isRunning = false;
        }
        
        // Initialize simulation and visualizer
        simulation.initialize();
        visualizer.initialize(simulation);
        
        // Display initial statistics
        const initialStats = simulation.getStatistics();
        visualizer.update(initialStats);
        
        // Start the simulation
        isRunning = true;
        setTimeout(() => {
            simulation.runGame();
        }, 100);
    });
    
    // Stop tournament button click handler
    stopButton.addEventListener('click', function() {
        if (!isRunning || !simulation) return;
        
        stopRequested = true;
        stopButton.disabled = true;
        
        // If there's a pending timeout, clear it
        if (nextGameTimeout) {
            clearTimeout(nextGameTimeout);
            nextGameTimeout = null;
        }
        
        // If simulation is running, mark it as complete
        if (isRunning) {
            // Display final stats
            displayFinalStats(simulation);
            
            // Re-enable controls
            startButton.disabled = false;
            stopButton.disabled = true;
            strategy1Select.disabled = false;
            strategy2Select.disabled = false;
            populationSizeInput.disabled = false;
            totalGamesInput.disabled = false;
            gamesPerPairingInput.disabled = false;
            
            // Hide running indicator
            runningIndicator.classList.add('hidden');
            
            isRunning = false;
        }
    });
    
    // Reset visualization button click handler
    resetButton.addEventListener('click', function() {
        if (visualizer) {
            visualizer.reset();
        }
    });
    
    // Function to display final statistics
    function displayFinalStats(simulation) {
        const stats = simulation.getStatistics();
        const strategy1 = strategy1Select.value;
        const strategy2 = strategy2Select.value;
        
        // Determine the winner
        const strategy1Avg = stats.strategyStats[strategy1].averageScore;
        const strategy2Avg = stats.strategyStats[strategy2].averageScore;
        
        // Display winner on the visualization
        if (strategy1Avg > strategy2Avg) {
            visualizer.displayWinner(strategy1);
        } else if (strategy2Avg > strategy1Avg) {
            visualizer.displayWinner(strategy2);
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (visualizer) {
            // The old tournament-container no longer exists
            // Use the agent-pool and histogram containers instead
            // Let the visualizer handle its own resize logic
            visualizer.handleResize();
            
            // Update the visualization if simulation exists
            if (simulation) {
                const stats = simulation.getStatistics();
                visualizer.update(stats);
            }
        }
    });
});