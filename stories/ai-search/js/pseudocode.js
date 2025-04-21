/**
 * pseudocode.js - Simplified version
 */

class PseudocodeDisplay {
    constructor() {
        this.pseudocodeContainer = document.getElementById('pseudocode-container');
        this.explanationContainer = document.getElementById('explanation-container');
        this.algorithmSelect = document.getElementById('pseudocode-algorithm');
        
        this.currentAlgorithm = this.algorithmSelect.value;
        
        this.initEventListeners();
        this.displayPseudocode(this.currentAlgorithm);
    }
    
    initEventListeners() {
        this.algorithmSelect.addEventListener('change', () => {
            this.currentAlgorithm = this.algorithmSelect.value;
            this.displayPseudocode(this.currentAlgorithm);
        });
    }
    
    displayPseudocode(algorithm) {
        // Clear containers
        this.pseudocodeContainer.innerHTML = '';
        this.resetExplanation();
        
        // Get pseudocode for selected algorithm
        const pseudocode = this.getPseudocode(algorithm);
        
        // Create container for each block
        pseudocode.forEach(block => {
            // Add block title
            const titleElement = document.createElement('h4');
            titleElement.textContent = block.title;
            this.pseudocodeContainer.appendChild(titleElement);
            
            // Create a simple pre element
            const preElement = document.createElement('pre');
            preElement.style.fontFamily = 'JetBrains Mono, monospace';
            preElement.style.fontSize = '14px';
            preElement.style.lineHeight = '1.6';
            preElement.style.backgroundColor = '#fafafa';
            preElement.style.padding = '10px';
            preElement.style.borderRadius = '6px';
            preElement.style.border = '1px solid #e0e0e0';
            preElement.style.overflow = 'auto';
            
            // Add each line with line numbers
            block.code.forEach((line, index) => {
                const lineDiv = document.createElement('div');
                lineDiv.className = 'code-line';
                lineDiv.style.display = 'flex';
                lineDiv.style.padding = '2px 0';
                lineDiv.style.cursor = 'pointer';
                
                // Add hover effect
                lineDiv.addEventListener('mouseover', () => {
                    lineDiv.style.backgroundColor = 'rgba(0,0,0,0.05)';
                });
                
                lineDiv.addEventListener('mouseout', () => {
                    lineDiv.style.backgroundColor = 'transparent';
                });
                
                // Line number
                const lineNumber = document.createElement('span');
                lineNumber.style.color = '#999';
                lineNumber.style.textAlign = 'right';
                lineNumber.style.paddingRight = '15px';
                lineNumber.style.userSelect = 'none';
                lineNumber.style.minWidth = '30px';
                lineNumber.style.opacity = '0.6';
                lineNumber.textContent = (index + 1).toString();
                
                // Line content with simple syntax highlighting
                const lineContent = document.createElement('span');
                lineContent.style.flex = '1';
                lineContent.style.color = '#707F99';
                
                // Apply very basic syntax highlighting
                let codeText = line.code;
                
                // Highlight keywords
                const keywords = ['def', 'if', 'else', 'elif', 'for', 'while', 'return', 'in', 'not', 'and', 'or', 'True', 'False', 'None'];
                keywords.forEach(keyword => {
                    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                    codeText = codeText.replace(regex, `<span style="color:#5C9AFF;font-weight:500;">${keyword}</span>`);
                });
                
                lineContent.innerHTML = codeText;
                
                // Add event listeners for explanation
                if (line.explanation) {
                    lineDiv.addEventListener('mouseenter', (event) => {
                        this.showExplanation(line.explanation, event);
                    });
                    
                    lineDiv.addEventListener('mouseleave', () => {
                        this.resetExplanation();
                    });
                }
                
                lineDiv.appendChild(lineNumber);
                lineDiv.appendChild(lineContent);
                preElement.appendChild(lineDiv);
            });
            
            this.pseudocodeContainer.appendChild(preElement);
        });
    }
    
    showExplanation(explanation, event) {
        // Get the position of the hovered line
        const hoveredLine = event.currentTarget;
        const hoveredRect = hoveredLine.getBoundingClientRect();
        
        // Get the code block container
        const codeBlock = hoveredLine.closest('pre');
        const codeBlockRect = codeBlock.getBoundingClientRect();
        
        // Get the pseudocode container (parent of all code blocks)
        const pseudocodeContainer = document.querySelector('.pseudocode-visualization-column');
        const containerRect = pseudocodeContainer.getBoundingClientRect();
        
        // Create the explanation element
        this.explanationContainer.innerHTML = '';
        
        const explanationElement = document.createElement('div');
        explanationElement.className = 'explanation';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'explanation-title';
        titleElement.textContent = explanation.title || 'Explanation';
        
        const textElement = document.createElement('div');
        textElement.className = 'explanation-text';
        textElement.textContent = explanation.text;
        
        explanationElement.appendChild(titleElement);
        explanationElement.appendChild(textElement);
        
        this.explanationContainer.appendChild(explanationElement);
        
        // Position the explanation relative to the pseudocode container
        // This ensures it works even when container height changes
        let topPosition = hoveredRect.top - containerRect.top;
        
        // Apply the position
        explanationElement.style.position = 'absolute';
        explanationElement.style.top = `${topPosition}px`;
        explanationElement.style.width = 'calc(100% - 30px)';
        
        // Get the explanation height after it's been added to the DOM
        const explanationRect = explanationElement.getBoundingClientRect();
        
        // Make sure the explanation doesn't go below the container
        const maxTop = containerRect.height - explanationRect.height;
        if (topPosition > maxTop) {
            topPosition = maxTop;
            explanationElement.style.top = `${topPosition}px`;
        }
    }
    
    resetExplanation() {
        this.explanationContainer.innerHTML = '';
    }
    
    getPseudocode(algorithm) {
        switch (algorithm) {
            case 'bfs':
                return this.getBFSPseudocode();
            case 'dfs':
                return this.getDFSPseudocode();
            case 'astar':
                return this.getAStarPseudocode();
            case 'greedy':
                return this.getGreedyPseudocode();
            case 'dijkstra':
                return this.getDijkstraPseudocode();
            default:
                return [];
        }
    }
    
    getPlaceholderPseudocode(algorithm) {
        const algorithmNames = {
            'astar': 'A* Search',
            'greedy': 'Greedy Best-First Search',
            'dijkstra': 'Dijkstra\'s Algorithm'
        };
        
        return [
            {
                title: `${algorithmNames[algorithm]} Algorithm`,
                code: [
                    {
                        code: `# ${algorithmNames[algorithm]} pseudocode will be added soon`,
                        explanation: {
                            title: "Coming Soon",
                            text: `The detailed pseudocode for ${algorithmNames[algorithm]} will be available in a future update.`
                        }
                    }
                ]
            }
        ];
    }
    
    getBFSPseudocode() {
        return [
            {
                title: "Breadth-First Search Algorithm",
                code: [
                    {
                        code: "def breadth_first_search(grid, start, goal):",
                        explanation: {
                            title: "Function Definition",
                            text: "This function implements the Breadth-First Search algorithm, which explores all neighbors at the current depth before moving deeper."
                        }
                    },
                    {
                        code: "    queue = [start]",
                        explanation: {
                            title: "Queue Initialization",
                            text: "BFS uses a First-In-First-Out (FIFO) queue to track nodes to visit. We start with just the start node in the queue."
                        }
                    },
                    {
                        code: "    visited = {start}",
                        explanation: {
                            title: "Visited Set",
                            text: "We use a set to keep track of nodes we've already visited to avoid cycles and repeated work."
                        }
                    },
                    {
                        code: "    parent = {}",
                        explanation: {
                            title: "Parent Dictionary",
                            text: "This dictionary maps each node to the node that discovered it, allowing us to reconstruct the path once we reach the goal."
                        }
                    },
                    {
                        code: "    while queue:",
                        explanation: {
                            title: "Main Loop",
                            text: "We process nodes in the queue until it's empty, which means we've either found the goal or explored all reachable nodes."
                        }
                    },
                    {
                        code: "        current = queue.pop(0)",
                        explanation: {
                            title: "Node Dequeuing",
                            text: "In BFS, we always take the first node from the queue (the oldest one), which ensures we explore all nodes at the current depth before moving deeper."
                        }
                    },
                    {
                        code: "        if current == goal:",
                        explanation: {
                            title: "Goal Check",
                            text: "After dequeuing a node, we first check if it's the goal node."
                        }
                    },
                    {
                        code: "            return reconstruct_path(parent, start, goal)",
                        explanation: {
                            title: "Path Reconstruction",
                            text: "When the goal is found, we use the parent dictionary to trace back the path from the goal to the start."
                        }
                    },
                    {
                        code: "        for neighbor in get_neighbors(grid, current):",
                        explanation: {
                            title: "Neighbor Exploration",
                            text: "We iterate through all valid neighbors of the current node (typically up, down, left, right in a grid)."
                        }
                    },
                    {
                        code: "            if neighbor in visited:",
                        explanation: {
                            title: "Visited Check",
                            text: "We skip neighbors that we've already visited to avoid cycles and redundant work."
                        }
                    },
                    {
                        code: "                continue",
                        explanation: {
                            title: "Skip Visited",
                            text: "If we've already visited this neighbor, we skip it and move to the next one."
                        }
                    },
                    {
                        code: "            visited.add(neighbor)",
                        explanation: {
                            title: "Mark Visited",
                            text: "We add the neighbor to the visited set to avoid processing it again in the future."
                        }
                    },
                    {
                        code: "            queue.append(neighbor)",
                        explanation: {
                            title: "Queue Addition",
                            text: "We add the neighbor to the end of the queue, ensuring it will be processed after all nodes at the current depth."
                        }
                    },
                    {
                        code: "            parent[neighbor] = current",
                        explanation: {
                            title: "Parent Recording",
                            text: "We record that this neighbor was discovered from the current node, which will help us reconstruct the path later."
                        }
                    },
                    {
                        code: "    return None",
                        explanation: {
                            title: "No Path Case",
                            text: "If we've exhausted the queue without finding the goal, there is no path from start to goal."
                        }
                    }
                ]
            }
        ];
    }
    
    getDFSPseudocode() {
        return [
            {
                title: "Depth-First Search Algorithm",
                code: [
                    {
                        code: "def depth_first_search(grid, start, goal):",
                        explanation: {
                            title: "Function Definition",
                            text: "This function implements the Depth-First Search algorithm, which explores as far as possible along each branch before backtracking."
                        }
                    },
                    {
                        code: "    stack = [start]",
                        explanation: {
                            title: "Stack Initialization",
                            text: "DFS uses a Last-In-First-Out (LIFO) stack to track nodes to visit. We start with just the start node in the stack."
                        }
                    },
                    {
                        code: "    visited = {start}",
                        explanation: {
                            title: "Visited Set",
                            text: "We use a set to keep track of nodes we've already visited to avoid cycles and repeated work."
                        }
                    },
                    {
                        code: "    parent = {}",
                        explanation: {
                            title: "Parent Dictionary",
                            text: "This dictionary maps each node to the node that discovered it, allowing us to reconstruct the path once we reach the goal."
                        }
                    },
                    {
                        code: "    while stack:",
                        explanation: {
                            title: "Main Loop",
                            text: "We process nodes in the stack until it's empty, which means we've either found the goal or explored all reachable nodes."
                        }
                    },
                    {
                        code: "        current = stack.pop()",
                        explanation: {
                            title: "Node Popping",
                            text: "In DFS, we always take the last node from the stack (the newest one), which ensures we explore deeply along a single path before backtracking."
                        }
                    },
                    {
                        code: "        if current == goal:",
                        explanation: {
                            title: "Goal Check",
                            text: "After popping a node, we first check if it's the goal node."
                        }
                    },
                    {
                        code: "            return reconstruct_path(parent, start, goal)",
                        explanation: {
                            title: "Path Reconstruction",
                            text: "When the goal is found, we use the parent dictionary to trace back the path from the goal to the start."
                        }
                    },
                    {
                        code: "        for neighbor in get_neighbors(grid, current):",
                        explanation: {
                            title: "Neighbor Exploration",
                            text: "We iterate through all valid neighbors of the current node (typically up, down, left, right in a grid)."
                        }
                    },
                    {
                        code: "            if neighbor in visited:",
                        explanation: {
                            title: "Visited Check",
                            text: "We skip neighbors that we've already visited to avoid cycles and redundant work."
                        }
                    },
                    {
                        code: "                continue",
                        explanation: {
                            title: "Skip Visited",
                            text: "If we've already visited this neighbor, we skip it and move to the next one."
                        }
                    },
                    {
                        code: "            visited.add(neighbor)",
                        explanation: {
                            title: "Mark Visited",
                            text: "We add the neighbor to the visited set to avoid processing it again in the future."
                        }
                    },
                    {
                        code: "            stack.append(neighbor)",
                        explanation: {
                            title: "Stack Addition",
                            text: "We add the neighbor to the top of the stack, ensuring it will be processed before nodes added earlier. This is what gives DFS its depth-first behavior."
                        }
                    },
                    {
                        code: "            parent[neighbor] = current",
                        explanation: {
                            title: "Parent Recording",
                            text: "We record that this neighbor was discovered from the current node, which will help us reconstruct the path later."
                        }
                    },
                    {
                        code: "    return None",
                        explanation: {
                            title: "No Path Case",
                            text: "If we've exhausted the stack without finding the goal, there is no path from start to goal."
                        }
                    }
                ]
            }
        ];
    }
    
    getAStarPseudocode() {
        return [
            {
                title: "A* Search Algorithm",
                code: [
                    {
                        code: "def a_star_search(grid, start, goal):",
                        explanation: {
                            title: "Function Definition",
                            text: "A* Search combines the advantages of Dijkstra's Algorithm and Greedy Best-First Search by using both path cost and heuristic distance."
                        }
                    },
                    {
                        code: "    open_set = [start]",
                        explanation: {
                            title: "Open Set Initialization",
                            text: "The open set contains nodes that need to be evaluated. We start with just the start node."
                        }
                    },
                    {
                        code: "    closed_set = set()",
                        explanation: {
                            title: "Closed Set Initialization",
                            text: "The closed set contains nodes that have already been evaluated."
                        }
                    },
                    {
                        code: "    g_score = {start: 0}",
                        explanation: {
                            title: "G-Score Dictionary",
                            text: "The g_score maps each node to the cost of the cheapest path from start to that node. Initially, only the start node has a g_score of 0."
                        }
                    },
                    {
                        code: "    f_score = {start: heuristic(start, goal)}",
                        explanation: {
                            title: "F-Score Dictionary",
                            text: "The f_score is the sum of g_score and the heuristic estimate. It represents our current best guess for how cheap a path could be from start to goal if it goes through this node."
                        }
                    },
                    {
                        code: "    parent = {}",
                        explanation: {
                            title: "Parent Dictionary",
                            text: "Maps each node to the node that discovered it, allowing us to reconstruct the path once we reach the goal."
                        }
                    },
                    {
                        code: "    while open_set:",
                        explanation: {
                            title: "Main Loop",
                            text: "We process nodes in the open set until it's empty or we find the goal."
                        }
                    },
                    {
                        code: "        current = min(open_set, key=lambda x: f_score.get(x, float('inf')))",
                        explanation: {
                            title: "Current Node Selection",
                            text: "A* always selects the node in the open set with the lowest f_score, which is the most promising node to explore next."
                        }
                    },
                    {
                        code: "        if current == goal:",
                        explanation: {
                            title: "Goal Check",
                            text: "If the current node is the goal, we've found the optimal path."
                        }
                    },
                    {
                        code: "            return reconstruct_path(parent, start, goal)",
                        explanation: {
                            title: "Path Reconstruction",
                            text: "When the goal is found, we use the parent dictionary to trace back the path from the goal to the start."
                        }
                    },
                    {
                        code: "        open_set.remove(current)",
                        explanation: {
                            title: "Remove from Open Set",
                            text: "We remove the current node from the open set as we're about to evaluate it."
                        }
                    },
                    {
                        code: "        closed_set.add(current)",
                        explanation: {
                            title: "Add to Closed Set",
                            text: "We add the current node to the closed set to mark it as evaluated."
                        }
                    },
                    {
                        code: "        for neighbor in get_neighbors(grid, current):",
                        explanation: {
                            title: "Neighbor Exploration",
                            text: "We iterate through all valid neighbors of the current node."
                        }
                    },
                    {
                        code: "            if neighbor in closed_set:",
                        explanation: {
                            title: "Skip Evaluated Nodes",
                            text: "If we've already evaluated this neighbor, we skip it."
                        }
                    },
                    {
                        code: "                continue",
                        explanation: {
                            title: "Continue to Next Neighbor",
                            text: "Skip to the next neighbor in the loop."
                        }
                    },
                    {
                        code: "            tentative_g_score = g_score[current] + 1",
                        explanation: {
                            title: "Tentative G-Score Calculation",
                            text: "Calculate the potential g_score for this neighbor if we were to reach it from the current node. The +1 represents the cost of moving from current to neighbor."
                        }
                    },
                    {
                        code: "            if neighbor not in open_set:",
                        explanation: {
                            title: "New Node Check",
                            text: "If this neighbor hasn't been discovered yet, add it to the open set."
                        }
                    },
                    {
                        code: "                open_set.append(neighbor)",
                        explanation: {
                            title: "Add to Open Set",
                            text: "Add the newly discovered neighbor to the open set for future evaluation."
                        }
                    },
                    {
                        code: "            elif tentative_g_score >= g_score.get(neighbor, float('inf')):",
                        explanation: {
                            title: "Path Comparison",
                            text: "If the tentative g_score is not better than the current best known path to this neighbor, skip it."
                        }
                    },
                    {
                        code: "                continue",
                        explanation: {
                            title: "Skip Suboptimal Path",
                            text: "We already know a better path to this neighbor, so we skip updating its scores."
                        }
                    },
                    {
                        code: "            parent[neighbor] = current",
                        explanation: {
                            title: "Update Parent",
                            text: "Record that the best known path to this neighbor is now through the current node."
                        }
                    },
                    {
                        code: "            g_score[neighbor] = tentative_g_score",
                        explanation: {
                            title: "Update G-Score",
                            text: "Update the g_score for this neighbor with the new better path cost."
                        }
                    },
                    {
                        code: "            f_score[neighbor] = g_score[neighbor] + heuristic(neighbor, goal)",
                        explanation: {
                            title: "Update F-Score",
                            text: "Update the f_score, which is the sum of the g_score and the heuristic estimate to the goal."
                        }
                    },
                    {
                        code: "    return None",
                        explanation: {
                            title: "No Path Case",
                            text: "If we've exhausted the open set without finding the goal, there is no path from start to goal."
                        }
                    }
                ]
            }
        ];
    }
    
    getGreedyPseudocode() {
        return [
            {
                title: "Greedy Best-First Search Algorithm",
                code: [
                    {
                        code: "def greedy_best_first_search(grid, start, goal):",
                        explanation: {
                            title: "Function Definition",
                            text: "Greedy Best-First Search always expands the node that appears closest to the goal according to a heuristic function."
                        }
                    },
                    {
                        code: "    open_set = [start]",
                        explanation: {
                            title: "Open Set Initialization",
                            text: "The open set contains nodes that need to be evaluated. We start with just the start node."
                        }
                    },
                    {
                        code: "    visited = {start}",
                        explanation: {
                            title: "Visited Set",
                            text: "We use a set to keep track of nodes we've already visited to avoid cycles."
                        }
                    },
                    {
                        code: "    parent = {}",
                        explanation: {
                            title: "Parent Dictionary",
                            text: "Maps each node to the node that discovered it, allowing us to reconstruct the path once we reach the goal."
                        }
                    },
                    {
                        code: "    while open_set:",
                        explanation: {
                            title: "Main Loop",
                            text: "We process nodes in the open set until it's empty or we find the goal."
                        }
                    },
                    {
                        code: "        current = min(open_set, key=lambda x: heuristic(x, goal))",
                        explanation: {
                            title: "Current Node Selection",
                            text: "Greedy Best-First Search always selects the node in the open set that appears closest to the goal according to the heuristic function."
                        }
                    },
                    {
                        code: "        if current == goal:",
                        explanation: {
                            title: "Goal Check",
                            text: "If the current node is the goal, we've found a path (not necessarily the shortest)."
                        }
                    },
                    {
                        code: "            return reconstruct_path(parent, start, goal)",
                        explanation: {
                            title: "Path Reconstruction",
                            text: "When the goal is found, we use the parent dictionary to trace back the path from the goal to the start."
                        }
                    },
                    {
                        code: "        open_set.remove(current)",
                        explanation: {
                            title: "Remove from Open Set",
                            text: "We remove the current node from the open set as we're about to process it."
                        }
                    },
                    {
                        code: "        for neighbor in get_neighbors(grid, current):",
                        explanation: {
                            title: "Neighbor Exploration",
                            text: "We iterate through all valid neighbors of the current node."
                        }
                    },
                    {
                        code: "            if neighbor in visited:",
                        explanation: {
                            title: "Skip Visited Nodes",
                            text: "If we've already visited this neighbor, we skip it to avoid cycles."
                        }
                    },
                    {
                        code: "                continue",
                        explanation: {
                            title: "Continue to Next Neighbor",
                            text: "Skip to the next neighbor in the loop."
                        }
                    },
                    {
                        code: "            visited.add(neighbor)",
                        explanation: {
                            title: "Mark as Visited",
                            text: "We add the neighbor to the visited set to avoid processing it again."
                        }
                    },
                    {
                        code: "            open_set.append(neighbor)",
                        explanation: {
                            title: "Add to Open Set",
                            text: "Add the neighbor to the open set for future evaluation."
                        }
                    },
                    {
                        code: "            parent[neighbor] = current",
                        explanation: {
                            title: "Record Parent",
                            text: "Record that this neighbor was discovered from the current node, which will help us reconstruct the path later."
                        }
                    },
                    {
                        code: "    return None",
                        explanation: {
                            title: "No Path Case",
                            text: "If we've exhausted the open set without finding the goal, there is no path from start to goal."
                        }
                    }
                ]
            }
        ];
    }
    
    getDijkstraPseudocode() {
        return [
            {
                title: "Dijkstra's Algorithm",
                code: [
                    {
                        code: "def dijkstra(grid, start, goal):",
                        explanation: {
                            title: "Function Definition",
                            text: "Dijkstra's Algorithm finds the shortest path from the start node to all other nodes in the graph, including the goal."
                        }
                    },
                    {
                        code: "    open_set = [start]",
                        explanation: {
                            title: "Open Set Initialization",
                            text: "The open set contains nodes that need to be evaluated. We start with just the start node."
                        }
                    },
                    {
                        code: "    visited = set()",
                        explanation: {
                            title: "Visited Set",
                            text: "We use a set to keep track of nodes we've already fully processed."
                        }
                    },
                    {
                        code: "    distance = {start: 0}",
                        explanation: {
                            title: "Distance Dictionary",
                            text: "Maps each node to its shortest known distance from the start. Initially, only the start node has a distance of 0."
                        }
                    },
                    {
                        code: "    parent = {}",
                        explanation: {
                            title: "Parent Dictionary",
                            text: "Maps each node to the node that discovered it, allowing us to reconstruct the path once we reach the goal."
                        }
                    },
                    {
                        code: "    while open_set:",
                        explanation: {
                            title: "Main Loop",
                            text: "We process nodes in the open set until it's empty or we find the goal."
                        }
                    },
                    {
                        code: "        current = min(open_set, key=lambda x: distance.get(x, float('inf')))",
                        explanation: {
                            title: "Current Node Selection",
                            text: "Dijkstra's Algorithm always selects the node in the open set with the smallest known distance from the start."
                        }
                    },
                    {
                        code: "        if current == goal:",
                        explanation: {
                            title: "Goal Check",
                            text: "If the current node is the goal, we've found the shortest path."
                        }
                    },
                    {
                        code: "            return reconstruct_path(parent, start, goal)",
                        explanation: {
                            title: "Path Reconstruction",
                            text: "When the goal is found, we use the parent dictionary to trace back the path from the goal to the start."
                        }
                    },
                    {
                        code: "        open_set.remove(current)",
                        explanation: {
                            title: "Remove from Open Set",
                            text: "We remove the current node from the open set as we're about to process it."
                        }
                    },
                    {
                        code: "        visited.add(current)",
                        explanation: {
                            title: "Mark as Visited",
                            text: "We add the current node to the visited set to mark it as fully processed."
                        }
                    },
                    {
                        code: "        for neighbor in get_neighbors(grid, current):",
                        explanation: {
                            title: "Neighbor Exploration",
                            text: "We iterate through all valid neighbors of the current node."
                        }
                    },
                    {
                        code: "            if neighbor in visited:",
                        explanation: {
                            title: "Skip Processed Nodes",
                            text: "If we've already fully processed this neighbor, we skip it."
                        }
                    },
                    {
                        code: "                continue",
                        explanation: {
                            title: "Continue to Next Neighbor",
                            text: "Skip to the next neighbor in the loop."
                        }
                    },
                    {
                        code: "            tentative_distance = distance[current] + 1",
                        explanation: {
                            title: "Tentative Distance Calculation",
                            text: "Calculate the potential distance to this neighbor if we were to reach it from the current node. The +1 represents the cost of moving from current to neighbor."
                        }
                    },
                    {
                        code: "            if neighbor not in open_set:",
                        explanation: {
                            title: "New Node Check",
                            text: "If this neighbor hasn't been discovered yet, add it to the open set."
                        }
                    },
                    {
                        code: "                open_set.append(neighbor)",
                        explanation: {
                            title: "Add to Open Set",
                            text: "Add the newly discovered neighbor to the open set for future evaluation."
                        }
                    },
                    {
                        code: "            elif tentative_distance >= distance.get(neighbor, float('inf')):",
                        explanation: {
                            title: "Path Comparison",
                            text: "If the tentative distance is not better than the current best known distance to this neighbor, skip it."
                        }
                    },
                    {
                        code: "                continue",
                        explanation: {
                            title: "Skip Suboptimal Path",
                            text: "We already know a better path to this neighbor, so we skip updating its distance."
                        }
                    },
                    {
                        code: "            parent[neighbor] = current",
                        explanation: {
                            title: "Update Parent",
                            text: "Record that the best known path to this neighbor is now through the current node."
                        }
                    },
                    {
                        code: "            distance[neighbor] = tentative_distance",
                        explanation: {
                            title: "Update Distance",
                            text: "Update the distance for this neighbor with the new better path cost."
                        }
                    },
                    {
                        code: "    return None",
                        explanation: {
                            title: "No Path Case",
                            text: "If we've exhausted the open set without finding the goal, there is no path from start to goal."
                        }
                    }
                ]
            }
        ];
    }
}

// Initialize the pseudocode display when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const pseudocodeDisplay = new PseudocodeDisplay();
}); 