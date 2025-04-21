import * as d3 from 'd3';

function createFeedbackDiagram(container, globalConfig) {
    const diagram = {
        width: globalConfig.width || 600,
        height: globalConfig.height || 600,
        svg: null,
        simulation: null,
        nodes: [],
        links: [],

        init: function() {
            console.log('Initializing diagram...', container);
            this.svg = d3.select(container)
                .append("svg")
                .attr("width", this.width)
                .attr("height", this.height)
                .style("border", "1px solid red"); // Debug border

            // Define arrowhead marker with better positioning
            this.svg.append("defs")
                .append("marker")
                .attr("id", "arrowhead")
                .attr("viewBox", "-10 -10 20 20")
                .attr("refX", 15)  // Adjust this to position the arrowhead
                .attr("refY", 0)
                .attr("markerWidth", 10)
                .attr("markerHeight", 10)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M-6.75,-6.75 L 0,0 L -6.75,6.75")
                .attr("fill", "none")
                .attr("stroke", globalConfig.linkColor || "#999");

            console.log('SVG created:', this.svg.node());
            return this;
        },

        load: async function() {
            console.log('Loading data from:', globalConfig.dataPath);
            try {
                const data = await d3.json(globalConfig.dataPath || "d3_data.json");
                console.log('Loaded data:', data);
                this.nodes = data.nodes;
                this.links = data.links;
                return this;
            } catch (error) {
                console.error('Error loading data:', error);
                throw error;
            }
        },

        setup: function() {
            console.log('Setting up with nodes:', this.nodes.length, 'links:', this.links.length);
            
            // Fix initial positions
            this.nodes.forEach(node => {
                node.fx = node.x;
                node.fy = node.y;
            });

            // Draw links with curved paths and arrowheads
            const links = this.svg.append("g")
                .selectAll("path")
                .data(this.links)
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("d", d => d.path)
                .attr("marker-end", "url(#arrowhead)")
                .style("stroke", globalConfig.linkColor || "#999")
                .style("stroke-width", globalConfig.linkWidth || 1)
                .style("fill", "none");

            // Create node groups
            const nodeGroups = this.svg.append("g")
                .selectAll("g")
                .data(this.nodes)
                .enter()
                .append("g")
                .attr("transform", d => `translate(${d.x}, ${d.y})`);

            // Add text labels
            nodeGroups.append("text")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("class", d => d.class)
                .style("font-size", globalConfig.fontSize || "12px")
                .style("fill", globalConfig.textColor || "#000")
                .text(d => d.text || d.id);  // Use text property if available, fallback to id

            // Optional: Add small circles behind text for debugging
            if (globalConfig.showNodeCircles) {
                nodeGroups.append("circle")
                    .attr("r", 3)
                    .style("fill", "#ff0000")
                    .style("opacity", 0.5);
            }

            return this;
        },

        update: function(config) {
            Object.assign(globalConfig, config);
            return this;
        },

        destroy: function() {
            if (this.simulation) {
                this.simulation.stop();
            }
            if (this.svg) {
                this.svg.remove();
            }
        },

        getPathEndpoint: function(pathData) {
            try {
                // Handle cubic bezier curves (C command)
                const matches = pathData.match(/[Cc][\s]*([\d.-]+)[\s]*,[\s]*([\d.-]+)/g);
                if (matches) {
                    const lastMatch = matches[matches.length - 1];
                    const coords = lastMatch.replace(/[Cc]/, '').split(',').map(n => parseFloat(n.trim()));
                    return { x: coords[0], y: coords[1] };
                }

                // Handle move commands (M command)
                const moveMatches = pathData.match(/M[\s]*([\d.-]+)[\s]*,[\s]*([\d.-]+)/);
                if (moveMatches) {
                    return {
                        x: parseFloat(moveMatches[1]),
                        y: parseFloat(moveMatches[2])
                    };
                }
            } catch (e) {
                console.error('Error parsing path:', pathData, e);
            }
            
            return null;
        },

        getPathAngle: function(pathData) {
            try {
                const endpoint = this.getPathEndpoint(pathData);
                const prevPoint = this.getPathPrevPoint(pathData);
                
                if (endpoint && prevPoint) {
                    return Math.atan2(endpoint.y - prevPoint.y, endpoint.x - prevPoint.x) * 180 / Math.PI;
                }
            } catch (e) {
                console.error('Error calculating angle:', e);
            }
            
            return 0;
        },

        getPathPrevPoint: function(pathData) {
            try {
                const matches = pathData.match(/[MCc][\s]*([\d.-]+)[\s]*,[\s]*([\d.-]+)/g);
                if (matches && matches.length > 1) {
                    const prevMatch = matches[matches.length - 2];
                    const coords = prevMatch.replace(/[MCc]/, '').split(',').map(n => parseFloat(n.trim()));
                    return { x: coords[0], y: coords[1] };
                }
            } catch (e) {
                console.error('Error getting previous point:', e);
            }
            
            return null;
        },

        createArrowhead: function(x, y, angle, size = 10) {
            if (isNaN(x) || isNaN(y) || isNaN(angle)) {
                console.error('Invalid coordinates or angle:', { x, y, angle });
                return '';
            }

            // Calculate arrowhead points
            const points = [
                [x - size, y - size/2],
                [x, y],
                [x - size, y + size/2]
            ];
            
            // Create path data
            const path = d3.path();
            path.moveTo(points[0][0], points[0][1]);
            path.lineTo(points[1][0], points[1][1]);
            path.lineTo(points[2][0], points[2][1]);
            
            return `translate(${x},${y}) rotate(${angle}) translate(${-x},${-y}) ${path.toString()}`;
        }
    };

    return diagram;
}

document.addEventListener('DOMContentLoaded', () => {
    const globalConfig = {
        width: 800,
        height: 600,
        dataPath: "./d3_data.json",
        linkColor: "#999",
        linkWidth: 2,
        fontSize: "14px",
        textColor: "#000",
        showNodeCircles: true  // Set to false in production
    };

    const diagram = createFeedbackDiagram("#container", globalConfig)
        .init()
        .load()
        .then(diagram => diagram.setup());
});

