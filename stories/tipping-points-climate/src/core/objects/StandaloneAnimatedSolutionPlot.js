import * as d3 from 'd3';
import { ClimateModel } from '../simulation/climate-model.js';

export class StandaloneAnimatedSolutionPlot {
    constructor(config) {
        // Create container element
        this.element = document.createElement('div');
        this.element.className = 'plot-area';
        this.element.style.position = 'absolute';
        
        // Set position if provided
        if (config.position) {
            this.element.style.left = `${config.position.x}%`;
            this.element.style.top = `${config.position.y}%`;
        }
        
        // Store config and set margins
        this.config = config;
        this.margins = { top: 40, right: 50, bottom: 60, left: 50 };

        // Get CSS variables
        const style = getComputedStyle(document.documentElement);
        this.DOT_RADIUS = style.getPropertyValue('--dot-radius');
        this.LINE_COLOR = style.getPropertyValue('--plot-line-color');
        this.LINE_WIDTH = style.getPropertyValue('--plot-line-width');
        this.TEXT_COLOR = style.getPropertyValue('--text-color');
        this.MAIN_FONT = style.getPropertyValue('--main-font');

        // Setup the plot
        this.setupPlot();
        
        // Bind the animate method to this instance
        this.animate = this.animate.bind(this);
        
        // Initialize animation
        this.animationStartTime = null;
        this.isAnimating = false;
        this.climateModel = new ClimateModel();
        this.frameRate = 60; // frames per second
        this.startAnimation();
    }

    setupPlot() {
        const width = 400;
        const height = width * 0.8;

        const svg = d3.select(this.element)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('display', 'block')
            .style('margin', 'auto');

        const plotArea = svg.append('g')
            .attr('transform', `translate(${this.margins.left},${this.margins.top})`);

        // Set up scales
        const plotWidth = width - this.margins.left - this.margins.right;
        const plotHeight = height - this.margins.top - this.margins.bottom;

        this.xScale = d3.scaleLinear()
            .domain([0, 300])  // Show 0-300 time steps
            .range([0, plotWidth]);

        this.yScale = d3.scaleLinear()
            .domain([220, 320])
            .range([plotHeight, 0]);

        // Add axes
        plotArea.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${plotHeight})`)
            .call(d3.axisBottom(this.xScale)
                .ticks(5)
                .tickFormat(d => Math.round(d)));

        plotArea.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(this.yScale));

        // Add labels
        svg.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', width/2)
            .attr('y', height - 10)
            .text('Time Steps');

        svg.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'start')
            .attr('x', this.margins.left)
            .attr('y', 25)
            .style('font-size', '0.9rem')
            .style('font-weight', '500')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR)
            .text('Temperature (K)');

        // Add freezing point reference line
        plotArea.append('line')
            .attr('class', 'freezing-line')
            .style('stroke', '#8ecae6')
            .style('stroke-width', '1px')
            .style('stroke-dasharray', '4,4')
            .attr('x1', 0)
            .attr('x2', plotWidth)
            .attr('y1', this.yScale(273))
            .attr('y2', this.yScale(273));

        // Add freezing point labels
        plotArea.append('text')
            .attr('class', 'freezing-label-1')
            .attr('text-anchor', 'end')  // Right align
            .attr('x', plotWidth - 2)  // 5px from right edge
            .attr('y', this.yScale(273) - 7)  // Slightly above line
            .style('font-size', '0.7rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', '#8ecae6')
            .text('Freezing');

        plotArea.append('text')
            .attr('class', 'freezing-label-2')
            .attr('text-anchor', 'end')  // Right align
            .attr('x', plotWidth - 2)  // 5px from right edge
            .attr('y', this.yScale(273) + 14)  // Slightly below line
            .style('font-size', '0.7rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', '#8ecae6')
            .text('Point');

        this.plot = { svg, plotArea, width, height };
        
        // Initialize path
        this.path = plotArea.append('path')
            .attr('class', 'solution-line')
            .attr('fill', 'none')
            .attr('stroke', this.LINE_COLOR)
            .attr('stroke-width', this.LINE_WIDTH);
    }

    drawTemperatureEvolution(T0, g) {
        // Remove previous path, point, and g-label
        this.plot.plotArea.selectAll('.solution-line, .initial-point, .g-label').remove();

        const simulation = this.climateModel.simulateTemperature(
            T0, 
            g,
            300,     
            100000   
        );

        // Use findStableEquilibrium to get the equilibrium temperature
        const equilibriumTemp = this.climateModel.findStableEquilibrium(g);
        if (!equilibriumTemp) {
            console.error('No stable equilibrium found');
            return;
        }

        // Find where we get close to equilibrium
        const TEMP_THRESHOLD = 0.00001;
        const equilibriumIndex = simulation.temperatures.findIndex(temp => 
            Math.abs(temp - equilibriumTemp) < TEMP_THRESHOLD
        );
        const endIndex = equilibriumIndex !== -1 ? equilibriumIndex + 1 : simulation.temperatures.length;

        const tempLine = d3.line()
            .x((d, i) => this.xScale(i))
            .y(d => this.yScale(d));

        // Draw the line
        this.plot.plotArea.append('path')
            .datum(simulation.temperatures.slice(0, endIndex))
            .attr('class', 'solution-line')
            .attr('fill', 'none')
            .attr('stroke', this.LINE_COLOR)
            .attr('stroke-width', this.LINE_WIDTH)
            .attr('d', tempLine);

        // Add initial temperature point
        this.plot.plotArea.append('circle')
            .attr('class', 'initial-point')
            .attr('cx', this.xScale(0))
            .attr('cy', this.yScale(T0));

        // Add g value label at end of line
        const lastTemp = simulation.temperatures[endIndex - 1];
        // console.log('g value:', g, 'formatted:', g.toFixed(3)); // Debug log
        this.plot.plotArea.append('text')
            .attr('class', 'g-label')
            .attr('x', this.xScale(endIndex - 1) + 5)
            .attr('y', this.yScale(lastTemp)+4)
            .attr('text-anchor', 'start')
            .style('font-size', '0.8rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR)
            .text(`g = ${g.toFixed(2)}`);
    }

    startAnimation() {
        this.isAnimating = true;
        this.animationStartTime = null;
        this.lastFrameTime = 0;
        requestAnimationFrame(this.animate);
    }

    stopAnimation() {
        this.isAnimating = false;
    }

    animate(timestamp) {
        if (!this.isAnimating) return;
        
        if (!this.animationStartTime) {
            this.animationStartTime = timestamp;
            this.lastFrameTime = timestamp;
        }

        // Control frame rate
        const frameInterval = 1000 / this.frameRate;
        const elapsed = timestamp - this.lastFrameTime;
        
        if (elapsed < frameInterval) {
            requestAnimationFrame(this.animate);
            return;
        }
        
        const progress = (timestamp - this.animationStartTime) / this.config.params.cycle_duration;
        
        // Stop at end of cycle
        if (progress >= 1) {
            this.isAnimating = false;
            return;
        }
        
        const g = this.interpolateG(progress);
        
        if (g < 0 || g > 1 || isNaN(g)) {
            console.error('Invalid g value:', g, 'from progress:', progress);
            return;
        }
        
        this.drawTemperatureEvolution(this.config.params.T0, g);
        
        this.lastFrameTime = timestamp;
        requestAnimationFrame(this.animate);
    }

    interpolateG(progress) {
        const { g_start, g_end } = this.config.params;
        return g_start + (g_end - g_start) * progress;  // Linear interpolation
    }
} 