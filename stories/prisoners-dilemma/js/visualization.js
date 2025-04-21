/**
 * visualization.js
 * 
 * This module handles the visualization of the Prisoner's Dilemma simulation
 * using D3.js. It creates visual representations of strategies, their interactions,
 * and score distributions.
 */

/**
 * SimulationVisualizer class to handle all visualization aspects
 */
class SimulationVisualizer {
    /**
     * Create a new simulation visualizer
     * @param {Object} options - Visualization options
     * @param {string} options.agentPoolContainer - ID of the container element for agent pool visualization
     * @param {string} options.histogramContainer - ID of the container element for histogram visualization 
     */
    constructor(options = {}) {
        this.agentPoolContainerId = options.agentPoolContainer || 'agent-pool-container';
        this.histogramContainerId = options.histogramContainer || 'histogram-container';
        
        // Get containers
        this.agentPoolContainer = d3.select(`#${this.agentPoolContainerId}`);
        this.histogramContainer = d3.select(`#${this.histogramContainerId}`);
        
        // Check if agent-pool-visualization exists, if not create it
        if (this.agentPoolContainer.select('.agent-pool-visualization').empty()) {
            this.agentPoolContainer.append('div')
                .attr('class', 'agent-pool-visualization');
        }
        
        // Get the agent pool visualization container
        this.agentPoolVisualization = this.agentPoolContainer.select('.agent-pool-visualization');
        
        // Get dimensions - use the visualization div for agent pool height
        this.agentPoolWidth = this.agentPoolContainer.node().clientWidth;
        this.agentPoolHeight = this.agentPoolVisualization.node().clientHeight || 440; // Slightly smaller to account for dropdown height
        
        this.histogramWidth = this.histogramContainer.node().clientWidth;
        this.histogramHeight = this.histogramContainer.node().clientHeight || 500;
        
        this.margin = options.margin || { top: 40, right: 40, bottom: 60, left: 60 };
        
        // Visualization parameters
        this.binWidth = 5; // Default bin width
        this.minScore = 0;  // Default min score for y-axis
        this.maxScore = 50; // Default max score for y-axis
        
        // Set up color scale for strategies
        this.colorScale = d3.scaleOrdinal()
            .domain([
                'Cooperator', 
                'Defector', 
                'Tit for Tat', 
                'Random', 
                'Grudger', 
                'Detective', 
                'Pavlov'
            ])
            .range([
                '#06d6a0', // Cooperator - specified
                '#ff9770', // Defector - specified
                '#168aad', // Tit for Tat - specified
                '#f72585', // Random - specified
                '#9b5de5', // Grudger - specified
                '#565264', // Detective - specified
                '#fcca46'  // Pavlov - specified
            ]);
        
        // Initialize the SVGs
        this.agentPoolSvg = this.agentPoolVisualization.append('svg')
            .attr('width', this.agentPoolWidth)
            .attr('height', this.agentPoolHeight)
            .style('background-color', '#fff');
            
        this.histogramSvg = this.histogramContainer.append('svg')
            .attr('width', this.histogramWidth)
            .attr('height', this.histogramHeight)
            .style('background-color', '#fff');
            
        // Create a group for the agent pool visualization - ADJUSTED POSITIONING WITH OFFSET
        this.agentPoolGroup = this.agentPoolSvg.append('g')
            .attr('class', 'agent-pool')
            .attr('transform', `translate(${this.agentPoolWidth / 2}, ${this.agentPoolHeight * 0.45})`);
            
        // Define the radius of the circular area - make it slightly smaller to ensure it fits
        this.areaRadius = Math.min(this.agentPoolWidth * 0.4, this.agentPoolHeight / 2) * 0.9;
            
        // Create a boundary circle
        this.agentPoolGroup.append('circle')
            .attr('class', 'boundary-circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', this.areaRadius)
            .attr('fill', 'none')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');
            
        // Create a group for the histogram 
        this.histogramGroup = this.histogramSvg.append('g')
            .attr('class', 'histogram')
            .attr('transform', `translate(${this.histogramWidth / 2}, ${this.histogramHeight / 2})`);
            
        // Create a legend group for each strategy (positioned above the histograms)
        this.leftLegendGroup = this.histogramGroup.append('g')
            .attr('class', 'left-legend')
            .attr('transform', `translate(${-this.histogramWidth * 0.25}, ${-this.histogramHeight * 0.45})`);
            
        this.rightLegendGroup = this.histogramGroup.append('g')
            .attr('class', 'right-legend')
            .attr('transform', `translate(${this.histogramWidth * 0.25}, ${-this.histogramHeight * 0.45})`);
            
        // Empty elements to prevent reference errors - Create proper mock objects that support chaining
        const createChainableMock = () => {
            const mock = {};
            mock.style = () => mock;
            mock.text = () => mock;
            mock.attr = () => mock;
            return mock;
        };
        
        this.leftStrategyNameLabel = createChainableMock();
        this.rightStrategyNameLabel = createChainableMock();
        
        // Add winner labels (will be shown only when there's a winner)
        this.leftWinnerLabel = this.histogramGroup.append('text')
            .attr('class', 'winner-label')
            .attr('x', -this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.52) // Position ABOVE strategy name
            .attr('text-anchor', 'middle')
            .style('opacity', 0);
        
        this.rightWinnerLabel = this.histogramGroup.append('text')
            .attr('class', 'winner-label')
            .attr('x', this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.52) // Position ABOVE strategy name
            .attr('text-anchor', 'middle')
            .style('opacity', 0);
        
        // Add total score displays - EXACTLY aligned with labels above
        this.leftTotalScore = this.histogramGroup.append('text')
            .attr('class', 'total-score')
            .attr('x', -this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.38)
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .style('opacity', 0)
            .text('');
            
        this.rightTotalScore = this.histogramGroup.append('text')
            .attr('class', 'total-score')
            .attr('x', this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.38)
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .style('opacity', 0)
            .text('');
            
        // Add average score displays - MOVED UP AND CLOSER
        this.leftAvgScore = this.histogramGroup.append('text')
            .attr('class', 'avg-score')
            .attr('x', -this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.30)
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .style('opacity', 0)
            .text('');
            
        this.rightAvgScore = this.histogramGroup.append('text')
            .attr('class', 'avg-score')
            .attr('x', this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.30)
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .style('opacity', 0)
            .text('');
            
        // Original strategy labels - Always centered and with consistent placement relative to other elements
        this.leftStrategyLabel = this.histogramGroup.append('text')
            .attr('class', 'strategy-label')
            .attr('x', -this.histogramWidth * 0.45)
            .attr('y', -this.histogramHeight * 0.45)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('opacity', 0);
            
        this.rightStrategyLabel = this.histogramGroup.append('text')
            .attr('class', 'strategy-label')
            .attr('x', this.histogramWidth * 0.45)
            .attr('y', -this.histogramHeight * 0.45)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('opacity', 0);
            
        // Create axes for histogram
        this.xAxisLeft = this.histogramGroup.append('g')
            .attr('class', 'x-axis-left')
            .style('opacity', 0);
            
        this.xAxisRight = this.histogramGroup.append('g')
            .attr('class', 'x-axis-right')
            .style('opacity', 0);
            
        this.yAxis = this.histogramGroup.append('g')
            .attr('class', 'y-axis')
            .style('opacity', 0);
            
        // Add axis label for histogram
        this.xAxisLabel = this.histogramGroup.append('text')
            .attr('class', 'x-axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', 0)
            .attr('y', this.histogramHeight * 0.42)
            .style('opacity', 0)
            .text('Number of Agents');
            
        // Set up scales for the population pyramid histogram
        this.setupHistogramScales();
        
        // Set up the force simulation for agent movement
        this.setupForceSimulation();
        
        // Initially hide the y-axis and grid lines until simulation starts
        this.histogramGroup.selectAll('.grid-line').remove();
        this.histogramGroup.selectAll('.left-y-label').remove();
        this.histogramGroup.selectAll('.right-y-label').remove();
        this.yAxis.selectAll('*').remove();
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Update dimensions
        this.agentPoolWidth = this.agentPoolContainer.node().clientWidth;
        this.agentPoolHeight = this.agentPoolVisualization.node().clientHeight || 440; // Slightly smaller to account for dropdown height
        
        this.histogramWidth = this.histogramContainer.node().clientWidth;
        this.histogramHeight = this.histogramContainer.node().clientHeight || 500;
        
        // Update SVG dimensions
        this.agentPoolSvg
            .attr('width', this.agentPoolWidth)
            .attr('height', this.agentPoolHeight);
            
        this.histogramSvg
            .attr('width', this.histogramWidth)
            .attr('height', this.histogramHeight);
            
        // Update group positions - ADJUSTED AGENT POOL POSITION WITH OFFSET
        this.agentPoolGroup
            .attr('transform', `translate(${this.agentPoolWidth / 2}, ${this.agentPoolHeight * 0.45})`);
            
        // Update the area radius and boundary circle
        this.areaRadius = Math.min(this.agentPoolWidth * 0.4, this.agentPoolHeight / 2) * 0.9;
        this.agentPoolGroup.select('.boundary-circle')
            .attr('r', this.areaRadius);
            
        this.histogramGroup
            .attr('transform', `translate(${this.histogramWidth / 2}, ${this.histogramHeight / 2})`);
            
        // Update legend group positions
        this.leftLegendGroup
            .attr('transform', `translate(${-this.histogramWidth * 0.25}, ${-this.histogramHeight * 0.45})`);
            
        this.rightLegendGroup
            .attr('transform', `translate(${this.histogramWidth * 0.25}, ${-this.histogramHeight * 0.45})`);
            
        // Update winner label positions
        this.leftWinnerLabel
            .attr('x', -this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.52);
            
        this.rightWinnerLabel
            .attr('x', this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.52);
            
        // Update original strategy label positions
        this.leftStrategyLabel
            .attr('x', -this.histogramWidth * 0.45)
            .attr('y', -this.histogramHeight * 0.45);
            
        this.rightStrategyLabel
            .attr('x', this.histogramWidth * 0.45)
            .attr('y', -this.histogramHeight * 0.45);
            
        // Update score label positions
        this.leftTotalScore
            .attr('x', -this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.38);
            
        this.rightTotalScore
            .attr('x', this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.38);
            
        this.leftAvgScore
            .attr('x', -this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.30);
            
        this.rightAvgScore
            .attr('x', this.histogramWidth * 0.25)
            .attr('y', -this.histogramHeight * 0.30);
        
        // Update the visualization
        if (this.simulation) {
            // Recalculate all the scales
            this.setupHistogramScales();
            
            // Update the visualization
            const stats = this.simulation.getStatistics();
            this.update(stats);
        }
    }
    
    /**
     * Add visualization controls (bin width, min/max score)
     */
    addControls() {
        // Create an empty container for the controls
        // We're removing the bin width slider and reset button as requested
        const controlsContainer = this.container.append('div')
            .attr('class', 'viz-controls')
            .style('margin-top', '10px')
            .style('text-align', 'center')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('align-items', 'center');
    }
    
    /**
     * Set up scales for the population pyramid histogram
     */
    setupHistogramScales() {
        // Set up scales for histogram x and y axes
        // We use separate left and right scales for the mirrored histograms
        
        // Width of the histogram (half of the full width for left/right)
        const histogramHalfWidth = this.histogramWidth * 0.40;
        
        // X scales for left and right histograms (starting from center)
        this.histogramXScaleLeft = d3.scaleLinear()
            .domain([0, 20])
            .range([0, -histogramHalfWidth]);
            
        this.histogramXScaleRight = d3.scaleLinear()
            .domain([0, 20])
            .range([0, histogramHalfWidth]);
            
        // Y scale for histogram (shared between left and right)
        this.histogramYScale = d3.scaleLinear()
            .domain([this.minScore, this.maxScore])
            .range([this.histogramHeight * 0.35, -this.histogramHeight * 0.15]);
            
        // Only add the center line if simulation is running
        if (this.simulation && this.simulation.isRunning) {
            this.histogramGroup.append('line')
                .attr('class', 'center-line')
                .attr('x1', 0)
                .attr('y1', this.histogramYScale(this.minScore))
                .attr('x2', 0)
                .attr('y2', this.histogramYScale(this.maxScore))
                .attr('stroke', '#ccc')
                .attr('stroke-width', 1);
                
            // Set up axes with initial values only if simulation is running
            const xAxisYPos = this.histogramYScale(Math.max(0, this.minScore)) + 5;
            
            const defaultMaxBinCount = 20;
            const leftTicks = [defaultMaxBinCount, defaultMaxBinCount / 2];
            const rightTicks = [defaultMaxBinCount / 2, defaultMaxBinCount];
            
            this.xAxisLeft
                .attr('transform', `translate(0, ${xAxisYPos})`)
                .call(d3.axisBottom(this.histogramXScaleLeft).tickValues(leftTicks))
                .call(g => g.select('.domain').remove()); // Remove axis line
                
            this.xAxisRight
                .attr('transform', `translate(0, ${xAxisYPos})`)
                .call(d3.axisBottom(this.histogramXScaleRight).tickValues(rightTicks))
                .call(g => g.select('.domain').remove()); // Remove axis line
        }
        
        // Initially hide all axes
        this.xAxisLeft.selectAll('*').remove();
        this.xAxisRight.selectAll('*').remove();
        this.yAxis.selectAll('*').remove();
    }
    
    /**
     * Set up the force simulation for agent movement
     */
    setupForceSimulation() {
        // Create a force simulation with balanced forces
        this.forceSimulation = d3.forceSimulation()
            // Light repulsion to prevent perfect overlap
            .force('charge', d3.forceManyBody().strength(-5).distanceMax(50))
            // Collision detection to prevent overlap
            .force('collision', d3.forceCollide().radius(d => d.radius * 1.1).strength(0.3))
            // Add a gentle center-directed force to keep agents from all migrating to the edge
            .force('center', d3.forceCenter(0, 0).strength(0.01))
            // Custom force for pairing - only applied when agentData exists
            .force('pairing', alpha => {
                if (!this.agentData) return; // Skip if agentData doesn't exist yet
                
                // Apply attraction force between paired agents
                for (let i = 0; i < this.agentData.length; i++) {
                    const agent = this.agentData[i];
                    if (!agent || !agent.isInPairing || agent.currentPairingId === null) continue;
                    
                    // Find the paired agent
                    const pairedAgent = this.agentData.find(a => a && a.id === agent.currentPairingId);
                    if (!pairedAgent) continue;
                    
                    // Calculate vector between agents considering periodic boundaries
                    const [dx, dy] = this.getPeriodicVector(agent, pairedAgent);
                    
                    // Skip if any values are NaN
                    if (isNaN(dx) || isNaN(dy)) continue;
                    
                    // Apply a stronger attraction force for paired agents
                    const strength = 0.2 * alpha;
                    agent.vx += dx * strength;
                    agent.vy += dy * strength;
                }
            })
            // Custom force for general agent movement - random walks within the space
            .force('random-walk', alpha => {
                if (!this.agentData) return;
                
                this.agentData.forEach(agent => {
                    if (!agent) return;
                    
                    // Add a small random movement to each agent
                    const randomAngle = Math.random() * 2 * Math.PI;
                    const randomStrength = 0.1 * alpha;
                    agent.vx += Math.cos(randomAngle) * randomStrength;
                    agent.vy += Math.sin(randomAngle) * randomStrength;
                    
                    // Add a small inward force for agents near the boundary
                    const dist = Math.sqrt(agent.x * agent.x + agent.y * agent.y);
                    if (dist > this.areaRadius * 0.8) {
                        const angle = Math.atan2(agent.y, agent.x);
                        const inwardStrength = 0.05 * alpha * (dist / this.areaRadius);
                        agent.vx -= Math.cos(angle) * inwardStrength;
                        agent.vy -= Math.sin(angle) * inwardStrength;
                    }
                });
            })
            // Moderate decay values for stability
            .alphaDecay(0.02)
            .velocityDecay(0.3);
    }
    
    /**
     * Calculate the vector between two agents considering periodic boundaries
     * @param {Object} agent1 - First agent
     * @param {Object} agent2 - Second agent
     * @returns {Array} [dx, dy] - The vector from agent1 to agent2
     */
    getPeriodicVector(agent1, agent2) {
        // Safety check
        if (!agent1 || !agent2) return [0, 0];
        if (isNaN(agent1.x) || isNaN(agent1.y) || isNaN(agent2.x) || isNaN(agent2.y)) return [0, 0];
        
        // Calculate direct vector
        let dx = agent2.x - agent1.x;
        let dy = agent2.y - agent1.y;
        
        // Calculate direct distance
        const directDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Only consider periodic boundaries if both agents are near the edge
        // and on opposite sides of the circle
        const r1 = Math.sqrt(agent1.x * agent1.x + agent1.y * agent1.y);
        const r2 = Math.sqrt(agent2.x * agent2.x + agent2.y * agent2.y);
        
        // Only consider periodic boundaries if both agents are near the edge
        if (r1 > this.areaRadius * 0.75 && r2 > this.areaRadius * 0.75) {
            // Calculate the angles of the agents
            const theta1 = Math.atan2(agent1.y, agent1.x);
            const theta2 = Math.atan2(agent2.y, agent2.x);
            
            // Calculate the angular difference
            let dTheta = Math.abs(theta1 - theta2);
            if (dTheta > Math.PI) dTheta = 2 * Math.PI - dTheta;
            
            // If the agents are on nearly opposite sides of the circle
            if (dTheta > Math.PI * 0.75) {
                // For visualization purposes, we'll still return the direct vector
                // but we'll mark this as a cross-boundary pairing in the updatePairingLines method
                agent1.crossBoundaryWith = agent2.id;
                agent2.crossBoundaryWith = agent1.id;
            } else {
                // Clear cross-boundary flag if it exists
                agent1.crossBoundaryWith = null;
                agent2.crossBoundaryWith = null;
            }
        } else {
            // Clear cross-boundary flag if it exists
            if (agent1.crossBoundaryWith === agent2.id) agent1.crossBoundaryWith = null;
            if (agent2.crossBoundaryWith === agent1.id) agent2.crossBoundaryWith = null;
        }
        
        return [dx, dy];
    }
    
    /**
     * Tick function for the force simulation
     * Handles agent movement and boundary constraints
     */
    tickFunction() {
        if (!this.agentData) return; // Safety check
        
        // Apply boundary constraints (not periodic boundaries)
        this.agentData.forEach(d => {
            // Safety check for NaN values
            if (isNaN(d.x) || isNaN(d.y)) {
                // Reset to a valid position if NaN is detected
                d.x = 0;
                d.y = 0;
                d.vx = 0;
                d.vy = 0;
                return;
            }
            
            // Calculate distance from center
            const dist = Math.sqrt(d.x * d.x + d.y * d.y);
            
            // If agent is beyond the boundary, gently push it back
            if (dist > this.areaRadius) {
                // Calculate angle
                const angle = Math.atan2(d.y, d.x);
                
                // Place agent just inside the boundary
                const newDist = this.areaRadius * 0.98;
                d.x = Math.cos(angle) * newDist;
                d.y = Math.sin(angle) * newDist;
                
                // Reduce velocity slightly to prevent bouncing
                d.vx *= 0.8;
                d.vy *= 0.8;
            }
        });
        
        // Update agent positions with safety checks
        this.agentNodes
            .attr('cx', d => isNaN(d.x) ? 0 : d.x)
            .attr('cy', d => isNaN(d.y) ? 0 : d.y);
            
        // Update pairing lines
        this.updatePairingLines();
    }
    
    /**
     * Update the pairing lines between agents
     */
    updatePairingLines() {
        if (!this.agentData || !this.pairingLinesGroup) return; // Safety check
        
        // Create array of active pairings
        const activePairings = [];
        
        // Only process each pairing once (by the lower ID agent)
        this.agentData.forEach(agent => {
            if (!agent || !agent.isInPairing || agent.currentPairingId === null || agent.id >= agent.currentPairingId) return;
            
            const pairedAgent = this.agentData.find(a => a && a.id === agent.currentPairingId);
            if (!pairedAgent) return;
            
            // Safety check for NaN values
            if (isNaN(agent.x) || isNaN(agent.y) || isNaN(pairedAgent.x) || isNaN(pairedAgent.y)) return;
            
            // Check if this is a cross-boundary pairing
            const isCrossBoundary = agent.crossBoundaryWith === pairedAgent.id;
            
            if (isCrossBoundary) {
                // For cross-boundary pairings, we'll draw a dotted line directly between them
                // This indicates that they're interacting across the boundary
                activePairings.push({
                    source: agent,
                    target: pairedAgent,
                    isCrossBoundary: true
                });
            } else {
                // Regular pairing line - direct connection
                activePairings.push({
                    source: agent,
                    target: pairedAgent,
                    isCrossBoundary: false
                });
            }
        });
        
        // Update pairing lines
        const lines = this.pairingLinesGroup.selectAll('.pairing-line')
            .data(activePairings);
            
        // Remove old lines
        lines.exit().remove();
        
        // Add new lines
        const enterLines = lines.enter()
            .append('line')
            .attr('class', 'pairing-line');
            
        // Update all lines (new and existing)
        enterLines.merge(lines)
            .attr('stroke', d => d.isCrossBoundary ? '#ff9900' : '#777')
            .attr('stroke-width', 0.8) // Thinner lines
            .attr('stroke-dasharray', d => d.isCrossBoundary ? '1,3' : '1,2') // Different pattern for cross-boundary
            .attr('opacity', 0.6) // Slightly more transparent
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
    }
    
    /**
     * Initialize the visualization with simulation data
     * @param {PopulationSimulation} simulation - The simulation instance
     */
    initialize(simulation) {
        // Reset any existing visualization first
        this.reset();
        
        this.simulation = simulation;
        this.updateLegend();
        
        // Create boundary circle if it doesn't exist
        if (this.agentPoolGroup.select('.boundary-circle').empty()) {
            this.agentPoolGroup.append('circle')
                .attr('class', 'boundary-circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', this.areaRadius)
                .attr('fill', 'none')
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3');
        }
        
        // Set strategy labels with actual strategy names right from the start
        if (this.simulation) {
            const strategies = Object.keys(this.simulation.config.strategies);
            if (strategies.length === 2) {
                const strategy1 = strategies[0];
                const strategy2 = strategies[1];
                
                // Update the strategy name labels with actual strategy names
                this.leftStrategyNameLabel
                    .text(strategiesModule.strategies[strategy1].name)
                    .style('fill', this.colorScale(strategiesModule.strategies[strategy1].name))
                    .style('opacity', 1);
                    
                this.rightStrategyNameLabel
                    .text(strategiesModule.strategies[strategy2].name)
                    .style('fill', this.colorScale(strategiesModule.strategies[strategy2].name))
                    .style('opacity', 1);
                    
                // Also update the original strategy labels (for consistency)
                this.leftStrategyLabel
                    .text(strategiesModule.strategies[strategy1].name)
                    .style('fill', this.colorScale(strategiesModule.strategies[strategy1].name))
                    .style('opacity', 1);
                    
                this.rightStrategyLabel
                    .text(strategiesModule.strategies[strategy2].name)
                    .style('fill', this.colorScale(strategiesModule.strategies[strategy2].name))
                    .style('opacity', 1);
            }
        }
        
        // Initialize agent pool visualization
        if (this.simulation && this.simulation.agents) {
            this.initializeAgentPool();
        }
    }
    
    /**
     * Reset the visualization by clearing all elements
     * This ensures a clean slate when starting a new simulation
     */
    reset() {
        // Reset the simulation
        this.simulation = null;
        
        // Store the boundary circle if it exists
        const boundaryCircle = this.agentPoolGroup.select('.boundary-circle');
        
        // Clear the agent pool except for the boundary circle
        this.agentPoolGroup.selectAll('*').remove();
        
        // Re-add the boundary circle if it existed
        if (!boundaryCircle.empty()) {
            this.agentPoolGroup.append('circle')
                .attr('class', 'boundary-circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', this.areaRadius)
                .attr('fill', 'none')
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3');
        }
        
        // Hide all text elements and clear their content
        this.leftTotalScore.style('opacity', 0).text('');
        this.rightTotalScore.style('opacity', 0).text('');
        this.leftAvgScore.style('opacity', 0).text('');
        this.rightAvgScore.style('opacity', 0).text('');
        this.leftStrategyLabel.style('opacity', 0);
        this.rightStrategyLabel.style('opacity', 0);
        this.leftStrategyNameLabel.style('opacity', 0);
        this.rightStrategyNameLabel.style('opacity', 0);
        
        // Hide axes and labels
        this.xAxisLeft.style('opacity', 0);
        this.xAxisRight.style('opacity', 0);
        this.yAxis.style('opacity', 0);
        this.xAxisLabel.style('opacity', 0);
        
        // Reset winner labels
        this.leftWinnerLabel.style('opacity', 0).text('');
        this.rightWinnerLabel.style('opacity', 0).text('');
        
        // Clear histogram elements
        this.histogramGroup.selectAll('.histogram-bar').remove();
        this.histogramGroup.selectAll('.grid-line').remove();
        this.histogramGroup.selectAll('.left-y-label').remove();
        this.histogramGroup.selectAll('.right-y-label').remove();
        
        // Reset the center line
        this.histogramGroup.select('.center-line').remove();
        
        // Clear legend elements
        this.leftLegendGroup.selectAll('*').remove();
        this.rightLegendGroup.selectAll('*').remove();
        
        // Clear agent data and force simulation
        this.agentData = null;
        if (this.forceSimulation) {
            this.forceSimulation.stop();
        }
        
        // Reset the last stats
        this.lastStats = null;
    }
    
    /**
     * Initialize the agent pool visualization
     */
    initializeAgentPool() {
        const agents = this.simulation.agents;
        
        // Create pairing lines container FIRST (so it appears below the agents)
        this.pairingLinesGroup = this.agentPoolGroup.append('g')
            .attr('class', 'pairing-lines');
        
        // Calculate baseline score for win-win cooperation
        // Each win-win gives 3 points per agent
        // Expected games per agent = games per pairing * total games / population size
        const populationSize = this.simulation.agents.length;
        const gamesPerPairing = this.simulation.config.gamesPerPairing;
        const totalGames = this.simulation.config.totalGames;
        
        // Calculate expected games per agent (approximately)
        const expectedGamesPerAgent = (gamesPerPairing * totalGames) / populationSize;
        
        // Baseline score if all games were win-win (3 points each)
        const baselineScore = expectedGamesPerAgent * 3;
        
        // Create agent data with random positions inside the circular area
        this.agentData = agents.map((agent, i) => {
            // Use true random positioning but with a better distribution
            // Generate random angle
            const angle = Math.random() * 2 * Math.PI;
            
            // Use square root of random value for distance to ensure uniform area distribution
            // (Without sqrt, points would cluster in the center)
            const distance = Math.sqrt(Math.random()) * this.areaRadius * 0.9;
            
            // Convert to cartesian coordinates
            const x = distance * Math.cos(angle);
            const y = distance * Math.sin(angle);
            
            return {
                id: agent.id,
                strategyId: agent.strategyId,
                score: baselineScore, // Start with baseline score instead of 0
                baselineScore: baselineScore, // Store the baseline for reference
                relativeScore: 0, // Track relative performance compared to baseline
                x: x,
                y: y,
                radius: 5,  // Start with medium-sized dots
                currentPairingId: null, // ID of current pairing partner
                playedWith: new Set(), // Set of agent IDs this agent has played with
                isInPairing: false, // Whether agent is currently in a pairing
                crossBoundaryWith: null // ID of agent this agent is paired with across boundary
            };
        });
        
        // Create agent circles AFTER the pairing lines (so they appear on top)
        this.agentNodes = this.agentPoolGroup.selectAll('.agent')
            .data(this.agentData, d => d.id)
            .enter()
            .append('circle')
            .attr('class', 'agent')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.radius)
            .attr('fill', d => this.colorScale(strategiesModule.strategies[d.strategyId].name))
            .attr('opacity', 0.8);
            
        // Start the simulation
        this.forceSimulation
            .nodes(this.agentData)
            .on('tick', () => this.tickFunction());
    }
    
    /**
     * Update the legend showing different strategies
     */
    updateLegend() {
        // Clear existing legend
        this.leftLegendGroup.selectAll('*').remove();
        this.rightLegendGroup.selectAll('*').remove();
        
        if (!this.simulation) return;
        
        // Get the two strategies
        const strategies = Object.keys(this.simulation.strategyStats);
        if (strategies.length < 2) return;
        
        // Get strategy names
        const leftStrategy = strategiesModule.strategies[strategies[0]].name;
        const rightStrategy = strategiesModule.strategies[strategies[1]].name;
        
        // Add strategy names, centered exactly like the total score labels
        this.leftLegendGroup.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text(leftStrategy)
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', this.colorScale(leftStrategy))
            .style('text-anchor', 'middle');
        
        this.rightLegendGroup.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text(rightStrategy)
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', this.colorScale(rightStrategy))
            .style('text-anchor', 'middle');
    }
    
    /**
     * Update the visualization with new simulation statistics
     * @param {Object} stats - Current simulation statistics
     */
    update(stats) {
        if (!stats) return;
        
        // Show all histogram elements when simulation starts
        this.leftStrategyLabel.style('opacity', 1);
        this.rightStrategyLabel.style('opacity', 1);
        this.leftTotalScore.style('opacity', 1);
        this.rightTotalScore.style('opacity', 1);
        this.leftStrategyNameLabel.style('opacity', 1);
        this.rightStrategyNameLabel.style('opacity', 1);
        this.leftAvgScore.style('opacity', 1);
        this.rightAvgScore.style('opacity', 1);
        this.xAxisLeft.style('opacity', 1);
        this.xAxisRight.style('opacity', 1);
        this.yAxis.style('opacity', 1);
        this.xAxisLabel.style('opacity', 1);
        
        // Update agent pairings if available
        if (stats.currentPairing) {
            this.updateAgentPairings(stats.currentPairing);
        }
        
        // Update histogram with score distributions
        if (stats.scoreDistributions && stats.strategyStats) {
            this.updateHistogram(stats.scoreDistributions, stats.strategyStats);
        }
        
        // Update agent pool
        this.updateAgentPool();
    }
    
    /**
     * Update agent pairings based on current pairing information
     * @param {Object} pairingInfo - Information about the current pairing
     */
    updateAgentPairings(pairingInfo) {
        if (!this.agentData || !this.simulation || !this.simulation.possiblePairings) return;
        
        // Reset pairing status if we're starting a new pairing
        if (pairingInfo.gamesPlayed === 0) {
            // Reset all agents' pairing status
            this.agentData.forEach(agent => {
                if (!agent) return;
                agent.isInPairing = false;
                agent.currentPairingId = null;
            });
            
            // Get the current pairing from the simulation
            const currentPairing = this.simulation.possiblePairings[pairingInfo.index];
            if (currentPairing) {
                // Find the agents in our data
                const agent1Index = currentPairing.agent1Index;
                const agent2Index = currentPairing.agent2Index;
                
                if (agent1Index < this.simulation.agents.length && 
                    agent2Index < this.simulation.agents.length) {
                    
                    const agent1Id = this.simulation.agents[agent1Index].id;
                    const agent2Id = this.simulation.agents[agent2Index].id;
                    
                    const agent1 = this.agentData.find(a => a && a.id === agent1Id);
                    const agent2 = this.agentData.find(a => a && a.id === agent2Id);
                    
                    if (agent1 && agent2) {
                        // Set up the new pairing
                        agent1.isInPairing = true;
                        agent1.currentPairingId = agent2.id;
                        agent1.playedWith.add(agent2.id);
                        
                        agent2.isInPairing = true;
                        agent2.currentPairingId = agent1.id;
                        agent2.playedWith.add(agent1.id);
                        
                        // Apply a gentle attraction force to bring them together
                        this.forceSimulation.alpha(0.3).restart();
                    }
                }
            }
        } else if (pairingInfo.gamesPlayed >= pairingInfo.totalGames) {
            // Pairing is complete, find new partners
            this.findNewPairings();
        }
    }
    
    /**
     * Find new pairings for agents after completing a round
     */
    findNewPairings() {
        if (!this.agentData) return;
        
        // First, reset all current pairings
        this.agentData.forEach(agent => {
            if (!agent) return;
            agent.isInPairing = false;
            agent.currentPairingId = null;
            agent.crossBoundaryWith = null; // Reset cross-boundary flag
        });
        
        // Create a copy of agents to work with
        const availableAgents = [...this.agentData].filter(a => a);
        
        // Shuffle to ensure random initial selection
        this.shuffleArray(availableAgents);
        
        // For each agent, find the closest unplayed partner
        while (availableAgents.length >= 2) {
            const agent = availableAgents.shift(); // Take the first agent
            
            // Find potential partners (agents that haven't played with this agent yet)
            const potentialPartners = availableAgents.filter(a => !agent.playedWith.has(a.id));
            
            if (potentialPartners.length === 0) {
                // No available partners, skip this agent
                continue;
            }
            
            // Sort potential partners by distance (considering direct distance only)
            potentialPartners.sort((a, b) => {
                const dxA = a.x - agent.x;
                const dyA = a.y - agent.y;
                const distA = Math.sqrt(dxA * dxA + dyA * dyA);
                
                const dxB = b.x - agent.x;
                const dyB = b.y - agent.y;
                const distB = Math.sqrt(dxB * dxB + dyB * dyB);
                
                return distA - distB;
            });
            
            // Select the closest partner
            const partner = potentialPartners[0];
            
            // Remove the partner from available agents
            const partnerIndex = availableAgents.indexOf(partner);
            if (partnerIndex !== -1) {
                availableAgents.splice(partnerIndex, 1);
                
                // Set up the new pairing
                agent.isInPairing = true;
                agent.currentPairingId = partner.id;
                agent.playedWith.add(partner.id);
                
                partner.isInPairing = true;
                partner.currentPairingId = agent.id;
                partner.playedWith.add(agent.id);
                
                // Check if this is a cross-boundary pairing
                const dx = partner.x - agent.x;
                const dy = partner.y - agent.y;
                const directDistance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate positions relative to center
                const r1 = Math.sqrt(agent.x * agent.x + agent.y * agent.y);
                const r2 = Math.sqrt(partner.x * partner.x + partner.y * partner.y);
                
                // Calculate angles
                const theta1 = Math.atan2(agent.y, agent.x);
                const theta2 = Math.atan2(partner.y, partner.x);
                
                // Calculate angular difference
                let dTheta = Math.abs(theta1 - theta2);
                if (dTheta > Math.PI) dTheta = 2 * Math.PI - dTheta;
                
                // If both agents are near the edge and on opposite sides
                if (r1 > this.areaRadius * 0.75 && r2 > this.areaRadius * 0.75 && dTheta > Math.PI * 0.75) {
                    agent.crossBoundaryWith = partner.id;
                    partner.crossBoundaryWith = agent.id;
                }
                
                // Move agents slightly toward each other to initiate pairing
                const moveStrength = 0.5;
                const distance = directDistance || 1; // Avoid division by zero
                
                agent.vx += (dx / distance) * moveStrength;
                agent.vy += (dy / distance) * moveStrength;
                partner.vx -= (dx / distance) * moveStrength;
                partner.vy -= (dy / distance) * moveStrength;
            }
        }
        
        // Apply a gentle attraction force to bring paired agents together
        this.forceSimulation.alpha(0.3).restart();
    }
    
    /**
     * Shuffle an array in place using Fisher-Yates algorithm
     * @param {Array} array - Array to shuffle
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /**
     * Update the agent pool visualization
     */
    updateAgentPool() {
        if (!this.simulation || !this.simulation.agents || !this.agentData) return;
        
        // Update agent data with current scores
        this.simulation.agents.forEach(agent => {
            const agentData = this.agentData.find(d => d && d.id === agent.id);
            if (agentData) {
                agentData.score = agent.score;
            }
        });
        
        // Group agents by strategy
        const strategiesData = {};
        const strategies = Object.keys(this.simulation.strategyStats);
        
        strategies.forEach(strategyId => {
            strategiesData[strategyId] = this.agentData.filter(d => d && d.strategyId === strategyId);
        });
        
        // Find max score overall for reference
        const maxScoreOverall = Math.max(1, d3.max(this.agentData, d => d.score));
        
        // Create size scales for each strategy based on their own score ranges
        const sizeScales = {};
        
        strategies.forEach(strategyId => {
            const strategyAgents = strategiesData[strategyId];
            if (strategyAgents.length === 0) return;
            
            // Find min and max scores for this strategy
            const minScore = d3.min(strategyAgents, d => d.score);
            const maxScore = d3.max(strategyAgents, d => d.score);
            
            // Create a linear scale for this strategy
            // Use a percentage of the overall max score to ensure proportional representation
            sizeScales[strategyId] = d3.scaleLinear()
                .domain([0, maxScoreOverall])  // Use overall max for consistent scaling
                .range([3, 12]);  // Size range from small to large
        });
        
        // Update agent circles
        this.agentNodes
            .data(this.agentData, d => d.id)
            .transition()
            .duration(200)
            .attr('r', d => {
                // Get the appropriate scale for this agent's strategy
                const scale = sizeScales[d.strategyId];
                if (!scale) return 3; // Fallback size
                
                // Scale the agent size based on its score
                const radius = scale(d.score);
                d.radius = radius;  // Update radius in data for collision detection
                return radius;
            })
            .attr('stroke', d => d.isInPairing ? '#fff' : 'none')
            .attr('stroke-width', d => d.isInPairing ? 1.5 : 0);
            
        // Update force simulation with new radii
        this.forceSimulation.force('collision', d3.forceCollide().radius(d => d.radius * 1.2).strength(0.5));
        
        // Gently restart the simulation
        this.forceSimulation.alpha(0.05).restart();
    }
    
    /**
     * Update the histogram visualization
     * @param {Object} scoreDistributions - Score distributions by strategy
     * @param {Object} strategyStats - Strategy statistics
     */
    updateHistogram(scoreDistributions, strategyStats) {
        if (!scoreDistributions || !strategyStats) return;
        
        // Get strategies
        const strategies = Object.keys(scoreDistributions);
        if (strategies.length === 0) return;
        
        // Update strategy labels with actual strategy names
        if (strategies.length === 2) {
            const strategy1 = strategies[0];
            const strategy2 = strategies[1];
            
            // Set the strategy name labels with actual strategy names
            this.leftStrategyNameLabel
                .text(strategiesModule.strategies[strategy1].name)
                .style('fill', this.colorScale(strategiesModule.strategies[strategy1].name))
                .style('opacity', 1);
                
            this.rightStrategyNameLabel
                .text(strategiesModule.strategies[strategy2].name)
                .style('fill', this.colorScale(strategiesModule.strategies[strategy2].name))
                .style('opacity', 1);
                
            // Ensure original strategy labels remain centered and hidden
            this.leftStrategyLabel.style('display', 'none');
            this.rightStrategyLabel.style('display', 'none');
        }
        
        // Determine the max score from the data
        let maxScore = this.minScore;
        strategies.forEach(strategyId => {
            const stats = strategyStats[strategyId];
            if (stats && stats.maxScore > maxScore) {
                maxScore = stats.maxScore;
            }
        });
        
        // Round up to the nearest 10 for cleaner y-axis
        maxScore = Math.ceil(maxScore / 10) * 10;
        
        // Safety check: ensure maxScore is reasonable
        if (maxScore <= this.minScore) {
            maxScore = this.minScore + 10;
        }
        
        // Calculate bin width dynamically as 1/10 of the maximum score
        const binWidth = Math.max(1, Math.ceil(maxScore / 10));
        
        // Update the y scale with the new max score
        this.histogramYScale = d3.scaleLinear()
            .domain([this.minScore, maxScore])
            .range([this.histogramHeight * 0.35, -this.histogramHeight * 0.15]);
        
        // Update the center line
        this.histogramGroup.select('.center-line')
            .attr('y1', this.histogramYScale(this.minScore))
            .attr('y2', this.histogramYScale(maxScore));
        
        // Create bins for each strategy
        const strategyBins = {};
        const totalScores = {};
        let maxBinCount = 0;
        
        strategies.forEach(strategyId => {
            // Calculate number of bins with safety check
            const numBins = Math.min(1000, Math.ceil((maxScore - this.minScore) / binWidth));
            
            // Safety check: ensure numBins is positive and reasonable
            if (numBins <= 0 || numBins > 1000) {
                strategyBins[strategyId] = [];
                totalScores[strategyId] = 0;
                return;
            }
            
            // Initialize bins for this strategy
            strategyBins[strategyId] = Array.from({ length: numBins }, (_, i) => ({
                score: this.minScore + i * binWidth,
                count: 0
            }));
            
            // Initialize total score
            totalScores[strategyId] = 0;
            
            // Fill bins with data
            Object.entries(scoreDistributions[strategyId]).forEach(([score, count]) => {
                const numScore = parseFloat(score);
                
                // Only include scores within our range
                if (numScore >= this.minScore && numScore <= maxScore) {
                    const binIndex = Math.floor((numScore - this.minScore) / binWidth);
                    if (binIndex >= 0 && binIndex < strategyBins[strategyId].length) {
                        strategyBins[strategyId][binIndex].count += count;
                        // Update max bin count if needed
                        maxBinCount = Math.max(maxBinCount, strategyBins[strategyId][binIndex].count);
                    }
                    
                    // Add to total score
                    totalScores[strategyId] += numScore * count;
                }
            });
        });
        
        // Ensure we have a reasonable max count (at least 5)
        maxBinCount = Math.max(5, maxBinCount);
        
        // Round up to a nice number for the x-axis
        maxBinCount = Math.ceil(maxBinCount / 5) * 5;
        
        // Update x scales with the new dynamic max
        this.histogramXScaleLeft = d3.scaleLinear()
            .domain([maxBinCount, 0])  // Dynamic limit based on data
            .range([-this.histogramWidth * 0.35, 0]);  // INCREASED from 0.25 to 0.35 to use more space
            
        this.histogramXScaleRight = d3.scaleLinear()
            .domain([0, maxBinCount])  // Dynamic limit based on data
            .range([0, this.histogramWidth * 0.35]);  // INCREASED from 0.25 to 0.35 to use more space
        
        // Update total score displays with fixed positions and consistent anchoring
        if (strategies.length === 2) {
            const strategy1 = strategies[0];
            const strategy2 = strategies[1];
            
            this.leftTotalScore
                .text(`Total: ${Math.round(totalScores[strategy1]).toLocaleString()}`)
                .style('fill', this.colorScale(strategiesModule.strategies[strategy1].name))
                .style('opacity', 1)
                .attr('text-anchor', 'middle');
                
            this.rightTotalScore
                .text(`Total: ${Math.round(totalScores[strategy2]).toLocaleString()}`)
                .style('fill', this.colorScale(strategiesModule.strategies[strategy2].name))
                .style('opacity', 1)
                .attr('text-anchor', 'middle');
                
            // Update average score displays with consistent anchoring
            const strategy1Count = Object.values(scoreDistributions[strategy1]).reduce((a, b) => a + b, 0);
            const strategy2Count = Object.values(scoreDistributions[strategy2]).reduce((a, b) => a + b, 0);
            
            const strategy1Avg = strategy1Count > 0 ? totalScores[strategy1] / strategy1Count : 0;
            const strategy2Avg = strategy2Count > 0 ? totalScores[strategy2] / strategy2Count : 0;
            
            this.leftAvgScore
                .text(`Avg: ${strategy1Avg.toFixed(1)}`)
                .style('fill', this.colorScale(strategiesModule.strategies[strategy1].name))
                .style('opacity', 1)
                .attr('text-anchor', 'middle');
                
            this.rightAvgScore
                .text(`Avg: ${strategy2Avg.toFixed(1)}`)
                .style('fill', this.colorScale(strategiesModule.strategies[strategy2].name))
                .style('opacity', 1)
                .attr('text-anchor', 'middle');
        }
        
        // Update x-axis positions
        const xAxisYPos = this.histogramYScale(this.minScore);
        
        // Create custom tick values for left and right axes (only max and half-max)
        const leftTicks = [maxBinCount, maxBinCount / 2];
        const rightTicks = [maxBinCount / 2, maxBinCount];
        
        this.xAxisLeft
            .attr('transform', `translate(0, ${xAxisYPos})`)
            .call(d3.axisBottom(this.histogramXScaleLeft).tickValues(leftTicks))
            .call(g => g.select('.domain').remove()); // Remove axis line
            
        this.xAxisRight
            .attr('transform', `translate(0, ${xAxisYPos})`)
            .call(d3.axisBottom(this.histogramXScaleRight).tickValues(rightTicks))
            .call(g => g.select('.domain').remove()); // Remove axis line
        
        // Clear existing grid lines and labels
        this.histogramGroup.selectAll('.grid-line').remove();
        this.histogramGroup.selectAll('.left-y-label').remove();
        this.histogramGroup.selectAll('.right-y-label').remove();
        
        // Create nice round tick values for y-axis
        // Calculate interval based on score range, minimum 10 points between ticks
        const tickSpacing = Math.ceil((maxScore - this.minScore) / 5 / 10) * 10;
        const yTickInterval = Math.max(10, tickSpacing);
        
        // Generate tick values
        const yTicks = [];
        for (let i = this.minScore; i <= maxScore; i += yTickInterval) {
            yTicks.push(i);
        }
        
        // Add grid lines
        this.histogramGroup.selectAll('.grid-line')
            .data(yTicks)
            .enter()
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', -this.histogramWidth * 0.42) // Adjusted to be slightly less wide
            .attr('x2', this.histogramWidth * 0.42)  // Adjusted to be slightly less wide
            .attr('y1', d => this.histogramYScale(d))
            .attr('y2', d => this.histogramYScale(d))
            .attr('stroke', '#eee')
            .attr('stroke-width', 1);
        
        // Add left side labels
        this.histogramGroup.selectAll('.left-y-label')
            .data(yTicks)
            .enter()
            .append('text')
            .attr('class', 'left-y-label')
            .attr('x', -this.histogramWidth * 0.42 - 8) // Positioned at the end of grid lines
            .attr('y', d => this.histogramYScale(d))
            .attr('dy', '0.32em')
            .attr('text-anchor', 'end')
            .text(d => d)
            .style('font-size', '10px')
            .style('fill', '#777');
        
        // Add right side labels
        this.histogramGroup.selectAll('.right-y-label')
            .data(yTicks)
            .enter()
            .append('text')
            .attr('class', 'right-y-label')
            .attr('x', this.histogramWidth * 0.42 + 8) // Positioned at the end of grid lines
            .attr('y', d => this.histogramYScale(d))
            .attr('dy', '0.32em')
            .attr('text-anchor', 'start')
            .text(d => d)
            .style('font-size', '10px')
            .style('fill', '#777');
        
        // Remove the y-axis
        this.yAxis.selectAll('*').remove();
        
        // Clear existing histogram elements
        this.histogramGroup.selectAll('.histogram-bar').remove();
        
        // Create bars for each strategy
        strategies.forEach((strategyId, index) => {
            const bins = strategyBins[strategyId];
            if (!bins || bins.length === 0) return;
            
            const isFirstStrategy = index === 0;
            
            // Filter bins to only include bins with counts
            const visibleBins = bins.filter(bin => bin.count > 0);
            
            // Create bars
            this.histogramGroup.selectAll(`.histogram-bar-${index}`)
                .data(visibleBins)
                .enter()
                .append('rect')
                .attr('class', 'histogram-bar')
                .attr('x', d => {
                    // Position bars directly against the center line
                    if (isFirstStrategy) {
                        // For left side, x is the negative value from the scale
                        return this.histogramXScaleLeft(d.count);
                    } else {
                        // For right side, x is 0 (center line)
                        return 0;
                    }
                })
                .attr('y', d => this.histogramYScale(d.score + binWidth))
                .attr('width', d => {
                    // Calculate width as the absolute distance from the center
                    if (isFirstStrategy) {
                        return Math.abs(this.histogramXScaleLeft(d.count));
                    } else {
                        return this.histogramXScaleRight(d.count);
                    }
                })
                .attr('height', d => Math.abs(this.histogramYScale(d.score) - this.histogramYScale(d.score + binWidth)) - 1)
                .attr('fill', d => this.colorScale(strategiesModule.strategies[strategyId].name))
                .attr('opacity', 0.8);
        });
    }
    
    /**
     * Update the statistics display
     * @param {Object} stats - Simulation statistics
     */
    updateStats(stats) {
        // Get the stats container
        const statsContainer = d3.select('#stats-container');
        
        // Clear existing content
        statsContainer.html('');
        
        // Add simulation progress
        statsContainer.append('div')
            .attr('class', 'stat-item')
            .html(`<strong>Progress:</strong> ${stats.gamesPlayed} / ${stats.totalGames} games (${Math.round(stats.progress)}%)`);
            
        // Add strategy statistics
        const scoresDiv = statsContainer.append('div')
            .attr('class', 'stat-item strategy-scores');
            
        scoresDiv.append('div')
            .html('<strong>Strategy Statistics:</strong>');
            
        const scoresList = scoresDiv.append('ul');
        
        // Sort strategies by average score (highest first)
        const sortedStats = Object.entries(stats.strategyStats)
            .map(([strategyId, stratStats]) => ({
                strategyId,
                name: strategiesModule.strategies[strategyId].name,
                stats: stratStats
            }))
            .sort((a, b) => b.stats.averageScore - a.stats.averageScore);
            
        sortedStats.forEach(strategy => {
            const stats = strategy.stats;
            scoresList.append('li')
                .style('color', this.colorScale(strategy.name))
                .html(`${strategy.name}: ${stats.count} agents, Avg: ${stats.averageScore.toFixed(2)} points, Min: ${stats.minScore}, Max: ${stats.maxScore}`);
        });
        
        // Add simulation status
        if (stats.isComplete) {
            statsContainer.append('div')
                .attr('class', 'stat-item simulation-complete')
                .html('<strong>Simulation Complete!</strong>');
                
            // Show the winner
            if (sortedStats.length > 0) {
                const winner = sortedStats[0];
                
                statsContainer.append('div')
                    .attr('class', 'stat-item simulation-winner')
                    .style('color', this.colorScale(winner.name))
                    .html(`<strong>Winner:</strong> ${winner.name} (${winner.stats.averageScore.toFixed(2)} points average)`);
            }
        }
    }
    
    /**
     * Display the winner of the simulation
     * @param {string} winnerStrategyId - ID of the winning strategy
     */
    displayWinner(winnerStrategyId) {
        if (!winnerStrategyId || !this.simulation) return;
        
        // Get the strategies
        const strategies = Object.keys(this.simulation.strategyStats);
        if (strategies.length !== 2) return;
        
        // Determine which side won
        const isLeftWinner = strategies[0] === winnerStrategyId;
        const isRightWinner = strategies[1] === winnerStrategyId;
        
        // Show the appropriate winner label
        if (isLeftWinner) {
            this.leftWinnerLabel
                .style('opacity', 1)
                .style('font-size', '16px') // INCREASED from 14px
                .style('fill', '#4CAF50');
            this.rightWinnerLabel.style('opacity', 0);
            console.log("Left side wins:", winnerStrategyId);
        } else if (isRightWinner) {
            this.leftWinnerLabel.style('opacity', 0);
            this.rightWinnerLabel
                .style('opacity', 1)
                .style('font-size', '16px') // INCREASED from 14px
                .style('fill', '#4CAF50');
            console.log("Right side wins:", winnerStrategyId);
        } else {
            // It's a tie or unknown winner
            this.leftWinnerLabel.style('opacity', 0);
            this.rightWinnerLabel.style('opacity', 0);
            console.log("No winner determined");
        }
    }
}

// Create a global visualizationModule object
window.visualizationModule = {
    SimulationVisualizer
}; 