/**
 * maze-search.js
 * 
 * This module implements a maze generation and search algorithm visualization
 * based on breadth-first and depth-first search algorithms.
 */

class MazeSearch {
    /**
     * Create a new maze search visualization
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // DOM element references
        this.mazeContainer = document.getElementById('maze-container');
        this.gridSizeSlider = document.getElementById('grid-size');
        this.gridSizeValue = document.getElementById('grid-size-value');
        this.obstacleDensitySlider = document.getElementById('obstacle-density');
        this.obstacleDensityValue = document.getElementById('obstacle-density-value');
        this.searchAlgorithmSelect = document.getElementById('search-algorithm');
        this.algorithmDescription = document.getElementById('algorithm-description');
        this.generateMazeButton = document.getElementById('generate-maze');
        this.solveMazeButton = document.getElementById('solve-maze');
        this.stepSolveButton = document.getElementById('step-solve');
        this.resetMazeButton = document.getElementById('reset-maze');
        this.nodesVisitedElement = document.getElementById('nodes-visited');
        this.pathLengthElement = document.getElementById('path-length');
        this.searchStatusElement = document.getElementById('search-status');
        this.showBranchingCheckbox = document.getElementById('show-branching');
        
        // Maze parameters
        this.gridSize = parseInt(this.gridSizeSlider.value);
        this.obstacleDensity = parseInt(this.obstacleDensitySlider.value);
        this.searchAlgorithm = this.searchAlgorithmSelect.value;
        
        // Maze state
        this.grid = [];
        this.obstacles = new Set();
        this.start = [0, 0];
        this.goal = [this.gridSize - 1, this.gridSize - 1];
        this.path = [];
        this.visitedNodes = new Set();
        this.frontier = [];
        this.currentNode = null;
        this.isRunning = false;
        this.isSolved = false;
        this.animationSpeed = 100; // ms between steps
        this.animationTimeout = null;
        
        // Cell size for rendering
        this.cellSize = 0;
        this.calculateCellSize();
        
        // Colors
        this.colors = {
            empty: '#ffffff',
            obstacle: '#333333',
            start: '#4CAF50',
            goal: '#F44336',
            visited: '#E1F5FE',
            frontier: '#81D4FA',
            path: '#FFC107',
            current: '#2196F3'
        };
        
        // Show branching checkbox
        this.showBranching = this.showBranchingCheckbox.checked;
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Generate initial maze
        this.generateMaze();
    }
    
    /**
     * Initialize event listeners for UI controls
     */
    initEventListeners() {
        // Grid size slider
        this.gridSizeSlider.addEventListener('input', () => {
            this.gridSize = parseInt(this.gridSizeSlider.value);
            this.gridSizeValue.textContent = `${this.gridSize} x ${this.gridSize}`;
            this.calculateCellSize();
        });
        
        // Obstacle density slider
        this.obstacleDensitySlider.addEventListener('input', () => {
            this.obstacleDensity = parseInt(this.obstacleDensitySlider.value);
            this.obstacleDensityValue.textContent = `${this.obstacleDensity}%`;
        });
        
        // Search algorithm select
        this.searchAlgorithmSelect.addEventListener('change', () => {
            this.searchAlgorithm = this.searchAlgorithmSelect.value;
            this.updateAlgorithmDescription();
        });
        
        // Generate maze button
        this.generateMazeButton.addEventListener('click', () => {
            this.generateMaze();
        });
        
        // Solve maze button
        this.solveMazeButton.addEventListener('click', () => {
            this.solveMaze();
        });
        
        // Step solve button
        this.stepSolveButton.addEventListener('click', () => {
            this.stepSolve();
        });
        
        // Reset maze button
        this.resetMazeButton.addEventListener('click', () => {
            this.resetMaze();
        });
        
        // Show branching checkbox
        this.showBranchingCheckbox.addEventListener('change', () => {
            this.showBranching = this.showBranchingCheckbox.checked;
            this.renderMaze();
        });
        
        // Update algorithm description initially
        this.updateAlgorithmDescription();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.calculateCellSize();
            this.renderMaze();
        });
    }
    
    /**
     * Update the algorithm description based on the selected algorithm
     */
    updateAlgorithmDescription() {
        switch(this.searchAlgorithm) {
            case 'bfs':
                this.algorithmDescription.textContent = 'Explores all neighbors at the current depth before moving deeper. Guarantees shortest path.';
                break;
            case 'dfs':
                this.algorithmDescription.textContent = 'Explores as far as possible along each branch before backtracking. Memory efficient but may not find shortest path.';
                break;
            case 'astar':
                this.algorithmDescription.textContent = 'Uses a heuristic to guide search toward the goal while considering path cost. Efficient and guarantees shortest path.';
                break;
            case 'greedy':
                this.algorithmDescription.textContent = 'Always moves toward the goal using a heuristic. Fast but may not find shortest path.';
                break;
            case 'dijkstra':
                this.algorithmDescription.textContent = 'Explores nodes based on distance from start. Guarantees shortest path but less efficient than A*.';
                break;
        }
    }
    
    /**
     * Calculate the cell size based on the container size and grid size
     */
    calculateCellSize() {
        const containerWidth = this.mazeContainer.clientWidth;
        const containerHeight = this.mazeContainer.clientHeight || 500; // Default height if not set
        
        // Calculate cell size to fit the container
        this.cellSize = Math.floor(Math.min(
            containerWidth / this.gridSize,
            containerHeight / this.gridSize
        ));
        
        // Ensure minimum cell size
        this.cellSize = Math.max(this.cellSize, 15);
    }
    
    /**
     * Generate a new maze with random obstacles
     */
    generateMaze() {
        // Reset state
        this.resetState();
        
        // Create empty grid
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        
        // Set start and goal positions
        this.start = [0, 0];
        this.goal = [this.gridSize - 1, this.gridSize - 1];
        
        // Generate obstacles
        this.obstacles = new Set();
        const totalCells = this.gridSize * this.gridSize;
        const numObstacles = Math.floor(totalCells * (this.obstacleDensity / 100));
        
        while (this.obstacles.size < numObstacles) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            
            // Don't place obstacles at start or goal
            if ((x === this.start[0] && y === this.start[1]) || 
                (x === this.goal[0] && y === this.goal[1])) {
                continue;
            }
            
            const key = `${x},${y}`;
            this.obstacles.add(key);
            this.grid[x][y] = 1; // 1 represents an obstacle
        }
        
        // Render the maze
        this.renderMaze();
        
        // Enable solve button
        this.solveMazeButton.disabled = false;
        this.stepSolveButton.disabled = false;
        
        // Update status
        this.searchStatusElement.textContent = 'Ready';
    }
    
    /**
     * Reset the maze state for a new search
     */
    resetMaze() {
        // Stop any running animation
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
        
        // Reset search state but keep the maze
        this.visitedNodes = new Set();
        this.frontier = [];
        this.path = [];
        this.currentNode = null;
        this.isRunning = false;
        this.isSolved = false;
        this.parentMap = new Map(); // Clear the parent map to remove branches
        
        // Reset statistics
        this.nodesVisitedElement.textContent = '0';
        this.pathLengthElement.textContent = '0';
        this.searchStatusElement.textContent = 'Ready';
        
        // Enable buttons
        this.solveMazeButton.disabled = false;
        this.stepSolveButton.disabled = false;
        
        // Re-render the maze
        this.renderMaze();
    }
    
    /**
     * Reset the entire state (used when generating a new maze)
     */
    resetState() {
        // Stop any running animation
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
        
        // Reset everything
        this.grid = [];
        this.obstacles = new Set();
        this.visitedNodes = new Set();
        this.frontier = [];
        this.path = [];
        this.currentNode = null;
        this.isRunning = false;
        this.isSolved = false;
        
        // Reset statistics
        this.nodesVisitedElement.textContent = '0';
        this.pathLengthElement.textContent = '0';
        this.searchStatusElement.textContent = 'Generating maze...';
    }
    
    /**
     * Render the maze using SVG
     */
    renderMaze() {
        // Clear the container
        this.mazeContainer.innerHTML = '';
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const width = this.cellSize * this.gridSize;
        const height = this.cellSize * this.gridSize;
        
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.style.display = 'block';
        svg.style.margin = '0 auto';
        
        // Create groups for different elements (layering)
        const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Draw the grid cells
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                cell.setAttribute('x', x * this.cellSize);
                cell.setAttribute('y', y * this.cellSize);
                cell.setAttribute('width', this.cellSize);
                cell.setAttribute('height', this.cellSize);
                cell.setAttribute('stroke', '#ccc');
                cell.setAttribute('stroke-width', '1');
                
                // Set fill color based on cell type
                const key = `${x},${y}`;
                
                if (x === this.start[0] && y === this.start[1]) {
                    // Start cell
                    cell.setAttribute('fill', this.colors.start);
                } else if (x === this.goal[0] && y === this.goal[1]) {
                    // Goal cell
                    cell.setAttribute('fill', this.colors.goal);
                } else if (this.obstacles.has(key)) {
                    // Obstacle
                    cell.setAttribute('fill', this.colors.obstacle);
                } else if (this.isNodeInPath(x, y)) {
                    // Path
                    cell.setAttribute('fill', this.colors.path);
                } else if (this.currentNode && this.currentNode[0] === x && this.currentNode[1] === y) {
                    // Current node being explored
                    cell.setAttribute('fill', this.colors.current);
                } else if (this.isNodeInFrontier(x, y)) {
                    // Frontier node
                    cell.setAttribute('fill', this.colors.frontier);
                } else if (this.visitedNodes.has(key)) {
                    // Visited node
                    cell.setAttribute('fill', this.colors.visited);
                } else {
                    // Empty cell
                    cell.setAttribute('fill', this.colors.empty);
                }
                
                gridGroup.appendChild(cell);
            }
        }
        
        // Draw the branching connections if enabled
        if (this.showBranching && this.parentMap && this.parentMap.size > 0) {
            this.drawBranchingConnections(connectionsGroup);
        }
        
        // Draw node circles for visited nodes if branching is enabled
        if (this.showBranching && this.visitedNodes.size > 0) {
            this.drawNodeCircles(nodesGroup);
        }
        
        // Add labels for start and goal
        this.addLabel(gridGroup, this.start[0], this.start[1], 'S');
        this.addLabel(gridGroup, this.goal[0], this.goal[1], 'G');
        
        // Add the groups to the SVG in the correct order (bottom to top)
        svg.appendChild(gridGroup);      // Grid cells at the bottom
        svg.appendChild(connectionsGroup); // Connections in the middle
        svg.appendChild(nodesGroup);     // Node circles on top
        
        // Add the SVG to the container
        this.mazeContainer.appendChild(svg);
    }
    
    /**
     * Draw branching connections between nodes
     */
    drawBranchingConnections(group) {
        // Iterate through the parent map to draw connections
        this.parentMap.forEach((parentNode, childKey) => {
            const [childX, childY] = childKey.split(',').map(Number);
            const [parentX, parentY] = parentNode;
            
            // Calculate center points
            const childCenterX = childX * this.cellSize + this.cellSize / 2;
            const childCenterY = childY * this.cellSize + this.cellSize / 2;
            const parentCenterX = parentX * this.cellSize + this.cellSize / 2;
            const parentCenterY = parentY * this.cellSize + this.cellSize / 2;
            
            // Create a line connecting parent to child
            const connection = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            connection.setAttribute('x1', parentCenterX);
            connection.setAttribute('y1', parentCenterY);
            connection.setAttribute('x2', childCenterX);
            connection.setAttribute('y2', childCenterY);
            connection.setAttribute('stroke', '#aaa');
            connection.setAttribute('stroke-width', '1.5');
            connection.setAttribute('stroke-opacity', '0.6');
            
            group.appendChild(connection);
        });
    }
    
    /**
     * Draw small circles at the center of visited nodes
     */
    drawNodeCircles(group) {
        // Add a circle for the start node
        this.addNodeCircle(group, this.start[0], this.start[1], '#4CAF50');
        
        // Add circles for all visited nodes
        this.visitedNodes.forEach(nodeKey => {
            const [x, y] = nodeKey.split(',').map(Number);
            
            // Skip start and goal nodes (they already have markers)
            if ((x === this.start[0] && y === this.start[1]) || 
                (x === this.goal[0] && y === this.goal[1])) {
                return;
            }
            
            // Determine color based on node type
            let color = '#888';
            
            if (this.isNodeInPath(x, y)) {
                // Path node
                color = '#FFC107';
            } else if (this.currentNode && this.currentNode[0] === x && this.currentNode[1] === y) {
                // Current node
                color = '#2196F3';
            } else if (this.isNodeInFrontier(x, y)) {
                // Frontier node
                color = '#81D4FA';
            }
            
            this.addNodeCircle(group, x, y, color);
        });
        
        // Add a circle for the goal node if it's been visited
        if (this.visitedNodes.has(`${this.goal[0]},${this.goal[1]}`)) {
            this.addNodeCircle(group, this.goal[0], this.goal[1], '#F44336');
        }
    }
    
    /**
     * Add a circle at the center of a node
     */
    addNodeCircle(group, x, y, color) {
        const centerX = x * this.cellSize + this.cellSize / 2;
        const centerY = y * this.cellSize + this.cellSize / 2;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', centerX);
        circle.setAttribute('cy', centerY);
        circle.setAttribute('r', Math.max(3, this.cellSize / 10));
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '1');
        
        group.appendChild(circle);
    }
    
    /**
     * Add a text label to a cell
     */
    addLabel(group, x, y, text) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x * this.cellSize + this.cellSize / 2);
        label.setAttribute('y', y * this.cellSize + this.cellSize / 2);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('font-size', Math.max(12, this.cellSize / 2));
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', '#fff');
        label.textContent = text;
        group.appendChild(label);
    }
    
    /**
     * Check if a node is in the current path
     */
    isNodeInPath(x, y) {
        return this.path.some(node => node[0] === x && node[1] === y);
    }
    
    /**
     * Check if a node is in the frontier
     */
    isNodeInFrontier(x, y) {
        if (this.searchAlgorithm === 'bfs' || this.searchAlgorithm === 'dfs') {
            // For BFS and DFS, frontier is an array of nodes
            return this.frontier.some(node => node[0] === x && node[1] === y);
        } else {
            // For informed search algorithms, frontier is an array of [node, priority, cost]
            return this.frontier.some(item => item[0][0] === x && item[0][1] === y);
        }
    }
    
    /**
     * Get valid neighbors of a node
     */
    getNeighbors(node) {
        const [x, y] = node;
        const neighbors = [];
        
        // Check all 4 adjacent cells (no diagonals)
        const directions = [
            [0, 1],  // right
            [1, 0],  // down
            [0, -1], // left
            [-1, 0]  // up
        ];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Check if the neighbor is within bounds
            if (nx < 0 || nx >= this.gridSize || ny < 0 || ny >= this.gridSize) {
                continue;
            }
            
            // Check if the neighbor is not an obstacle
            const key = `${nx},${ny}`;
            if (this.obstacles.has(key)) {
                continue;
            }
            
            neighbors.push([nx, ny]);
        }
        
        return neighbors;
    }
    
    /**
     * Calculate Manhattan distance heuristic between two points
     */
    calculateHeuristic(node, goal) {
        return Math.abs(node[0] - goal[0]) + Math.abs(node[1] - goal[1]);
    }
    
    /**
     * Initialize the search algorithm
     */
    initializeSearch() {
        // Reset search state
        this.visitedNodes = new Set();
        this.frontier = [];
        this.path = [];
        this.currentNode = null;
        
        // Initialize based on algorithm type
        switch(this.searchAlgorithm) {
            case 'bfs':
                // For BFS, use a queue (FIFO)
                this.frontier = [this.start];
                break;
            case 'dfs':
                // For DFS, use a stack (LIFO)
                this.frontier = [this.start];
                break;
            case 'astar':
            case 'greedy':
            case 'dijkstra':
                // For informed search algorithms, use a priority queue
                // Store [node, priority, cost] where priority is used for sorting
                const startHeuristic = this.calculateHeuristic(this.start, this.goal);
                this.frontier = [[this.start, startHeuristic, 0]];
                // Keep track of costs to reach each node
                this.costSoFar = new Map();
                this.costSoFar.set(`${this.start[0]},${this.start[1]}`, 0);
                break;
        }
        
        // Mark start as visited
        this.visitedNodes.add(`${this.start[0]},${this.start[1]}`);
        
        // Initialize parent map for path reconstruction
        this.parentMap = new Map();
        
        // Update statistics
        this.nodesVisitedElement.textContent = '1'; // Start node
        this.pathLengthElement.textContent = '0';
        this.searchStatusElement.textContent = 'Searching...';
        
        // Set running state
        this.isRunning = true;
        this.isSolved = false;
    }
    
    /**
     * Perform one step of the search algorithm
     */
    stepSolve() {
        // Initialize search if not already running
        if (!this.isRunning) {
            this.initializeSearch();
        }
        
        // Check if frontier is empty
        if (this.frontier.length === 0) {
            this.searchStatusElement.textContent = 'No path found';
            this.isRunning = false;
            return false;
        }
        
        // Get the next node from the frontier based on algorithm
        switch(this.searchAlgorithm) {
            case 'bfs':
                // For BFS, take from the front (queue)
                this.currentNode = this.frontier.shift();
                break;
            case 'dfs':
                // For DFS, take from the end (stack)
                this.currentNode = this.frontier.pop();
                break;
            case 'astar':
            case 'greedy':
            case 'dijkstra':
                // For informed search, sort by priority and take the lowest
                this.frontier.sort((a, b) => a[1] - b[1]);
                const [node, _, cost] = this.frontier.shift();
                this.currentNode = node;
                break;
        }
        
        const [x, y] = this.currentNode;
        const currentKey = `${x},${y}`;
        
        // Check if we've reached the goal
        if (x === this.goal[0] && y === this.goal[1]) {
            // Reconstruct the path
            this.reconstructPath();
            this.searchStatusElement.textContent = 'Path found!';
            this.isRunning = false;
            this.isSolved = true;
            return false;
        }
        
        // Get neighbors
        const neighbors = this.getNeighbors(this.currentNode);
        
        // Process each neighbor
        for (const neighbor of neighbors) {
            const [nx, ny] = neighbor;
            const neighborKey = `${nx},${ny}`;
            
            // Skip if already visited (except for informed search algorithms)
            if (this.searchAlgorithm === 'bfs' || this.searchAlgorithm === 'dfs') {
                if (this.visitedNodes.has(neighborKey)) {
                    continue;
                }
                
                // Add to frontier and mark as visited
                this.frontier.push(neighbor);
                this.visitedNodes.add(neighborKey);
                
                // Update parent map for path reconstruction
                this.parentMap.set(neighborKey, this.currentNode);
            } else {
                // For informed search algorithms (A*, Greedy, Dijkstra)
                // Calculate new cost to reach this neighbor
                const newCost = (this.costSoFar.get(currentKey) || 0) + 1; // Assuming uniform cost of 1
                
                // Skip if we've found a better path already
                if (this.costSoFar.has(neighborKey) && newCost >= this.costSoFar.get(neighborKey)) {
                    continue;
                }
                
                // Update cost and parent
                this.costSoFar.set(neighborKey, newCost);
                this.parentMap.set(neighborKey, this.currentNode);
                
                // Calculate priority based on algorithm
                let priority;
                switch(this.searchAlgorithm) {
                    case 'astar':
                        // A* uses cost so far + heuristic
                        priority = newCost + this.calculateHeuristic(neighbor, this.goal);
                        break;
                    case 'greedy':
                        // Greedy only uses heuristic
                        priority = this.calculateHeuristic(neighbor, this.goal);
                        break;
                    case 'dijkstra':
                        // Dijkstra only uses cost so far
                        priority = newCost;
                        break;
                }
                
                // Add to frontier with priority
                this.frontier.push([neighbor, priority, newCost]);
                this.visitedNodes.add(neighborKey);
            }
        }
        
        // Update statistics
        this.nodesVisitedElement.textContent = this.visitedNodes.size;
        
        // Render the updated state
        this.renderMaze();
        
        return true;
    }
    
    /**
     * Reconstruct the path from start to goal
     */
    reconstructPath() {
        this.path = [];
        let current = this.goal;
        
        while (current[0] !== this.start[0] || current[1] !== this.start[1]) {
            this.path.push(current);
            const key = `${current[0]},${current[1]}`;
            current = this.parentMap.get(key);
            
            // Safety check
            if (!current) break;
        }
        
        // Add the start node
        this.path.push(this.start);
        
        // Reverse to get path from start to goal
        this.path.reverse();
        
        // Update path length
        this.pathLengthElement.textContent = this.path.length - 1; // -1 because we don't count the start node
        
        // Render the path
        this.renderMaze();
    }
    
    /**
     * Solve the maze automatically with animation
     */
    solveMaze() {
        // Disable buttons during animation
        this.solveMazeButton.disabled = true;
        this.stepSolveButton.disabled = true;
        
        // Initialize search if not already running
        if (!this.isRunning) {
            this.initializeSearch();
        }
        
        // Define the animation step function
        const animateStep = () => {
            const continueSearch = this.stepSolve();
            
            if (continueSearch) {
                // Schedule the next step
                this.animationTimeout = setTimeout(animateStep, this.animationSpeed);
            } else {
                // Enable step button when animation is done
                this.stepSolveButton.disabled = false;
                
                // Only re-enable solve button if not solved
                if (!this.isSolved) {
                    this.solveMazeButton.disabled = false;
                }
            }
        };
        
        // Start the animation
        animateStep();
    }
}

// Initialize the maze search visualization when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mazeSearch = new MazeSearch();
}); 