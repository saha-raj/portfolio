import * as d3 from 'd3';
import { ClimateModel } from '../simulation/climate-model.js';

export class StandaloneTemperaturePlot {
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
        this.margins = { top: 40, right: 40, bottom: 60, left: 40 };

        // Get CSS variables
        const style = getComputedStyle(document.documentElement);
        this.DOT_RADIUS = style.getPropertyValue('--dot-radius');
        this.LINE_COLOR = style.getPropertyValue('--plot-line-color');
        this.LINE_WIDTH = style.getPropertyValue('--plot-line-width');
        this.TEXT_COLOR = style.getPropertyValue('--text-color');
        this.MAIN_FONT = style.getPropertyValue('--main-font');

        // Setup the plot
        this.setupPlot();
        
        // Draw the temperature evolution with fixed parameters
        this.drawTemperatureEvolution(
            config.params.T0 || 280,  // Initial temperature
            config.params.g || 0.4    // Greenhouse parameter
        );
    }

    setupPlot() {
        const width = 400;
        const height = width * 0.8;

        const svg = d3.select(this.element)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('display', 'block')  // Remove any default inline spacing
            .style('margin', 'auto');   // Center within container

        const plotArea = svg.append('g')
            .attr('transform', `translate(${this.margins.left},${this.margins.top})`);

        // Set up scales
        const plotWidth = width - this.margins.left - this.margins.right;
        const plotHeight = height - this.margins.top - this.margins.bottom;

        this.xScale = d3.scaleLinear()
            .domain([0, 20])  // Will adjust based on equilibrium time
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
    }

    drawTemperatureEvolution(T0, g) {
        const climateModel = new ClimateModel();
        const simulation = climateModel.simulateTemperature(
            T0, 
            g,
            1000,    // More timesteps
            100000   // dt
        );

        // Make equilibrium threshold more strict
        const TEMP_THRESHOLD = 0.01;  // Stricter threshold
        const equilibriumTemp = simulation.temperatures[simulation.temperatures.length - 1];
        const equilibriumIndex = simulation.temperatures.findIndex(temp => 
            Math.abs(temp - equilibriumTemp) < TEMP_THRESHOLD
        );
        const endIndex = equilibriumIndex !== -1 ? equilibriumIndex + 1 : simulation.temperatures.length;

        // Update x-scale to match actual time range (in timesteps)
        const maxTime = simulation.times[endIndex - 1];  // Keep in seconds
        this.xScale.domain([0, maxTime]);

        // Update x-axis with new scale
        this.plot.plotArea.select('.x-axis')
            .call(d3.axisBottom(this.xScale)
                .ticks(5)
                .tickFormat(d => Math.round(d/1000000)));  // Same format as solution plot

        // Create temperature line
        const tempLine = d3.line()
            .x((d, i) => this.xScale(simulation.times[i]))  // Use raw time values
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
    }
} 