import * as d3 from 'd3';
import { ClimateModel } from '../simulation/climate-model.js';

export class StandaloneAlbedoPlot {
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
        this.margins = { top: 40, right: 60, bottom: 60, left: 60 };

        // Get CSS variables
        const style = getComputedStyle(document.documentElement);
        this.DOT_RADIUS = style.getPropertyValue('--dot-radius');
        this.LINE_COLOR = style.getPropertyValue('--plot-line-color');
        this.LINE_WIDTH = style.getPropertyValue('--plot-line-width');
        this.TEXT_COLOR = style.getPropertyValue('--text-color');
        this.MAIN_FONT = style.getPropertyValue('--main-font');

        // Setup the plot
        this.setupPlot();
        
        // Draw the albedo curve
        this.drawAlbedoCurve();
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
            .domain([220, 320])  // Same temperature range as other plots
            .range([0, plotWidth]);

        this.yScale = d3.scaleLinear()
            .domain([0, 1])  // Change y-axis range to [0,1]
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
            .call(d3.axisLeft(this.yScale)
                .ticks(5)
                .tickFormat(d => d.toFixed(1)));

        // Add labels
        svg.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', width/2)
            .attr('y', height - 10)
            .text('Temperature (K)');

        svg.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'start')
            .attr('x', this.margins.left)
            .attr('y', 25)
            .style('font-size', '0.9rem')
            .style('font-weight', '500')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR)
            .text('Average Planetary Albedo');

        // Add freezing point reference line
        plotArea.append('line')
            .attr('class', 'freezing-line')
            .style('stroke', '#8ecae6')
            .style('stroke-width', '1px')
            .style('stroke-dasharray', '4,4')
            .attr('x1', this.xScale(273))
            .attr('x2', this.xScale(273))
            .attr('y1', 0)
            .attr('y2', plotHeight);

        // Draw the line
        const climateModel = new ClimateModel();
        const temps = climateModel.generateTempRange();
        const albedoValues = temps.map(T => climateModel.calculateAlbedo(T));

        // Add end labels for albedo values
        const firstAlbedo = albedoValues[0];
        const lastAlbedo = albedoValues[albedoValues.length - 1];

        // Add text for start value
        plotArea.append('text')
            .attr('class', 'albedo-label')
            .attr('x', this.xScale(temps[0]) - 5)
            .attr('y', this.yScale(firstAlbedo) + 5)
            .attr('text-anchor', 'end')
            .style('font-size', '0.8rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR)
            .text(`α = ${firstAlbedo.toFixed(2)}`);

        // Add text for end value
        plotArea.append('text')
            .attr('class', 'albedo-label')
            .attr('x', this.xScale(temps[temps.length - 1]) + 5)
            .attr('y', this.yScale(lastAlbedo) +5)
            .attr('text-anchor', 'start')
            .style('font-size', '0.8rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR)
            .text(`α = ${lastAlbedo.toFixed(2)}`);

        this.plot = { svg, plotArea, width, height };
    }

    drawAlbedoCurve() {
        const climateModel = new ClimateModel();
        const temps = climateModel.generateTempRange();
        const albedoValues = temps.map(T => climateModel.calculateAlbedo(T));

        // Create albedo line
        const albedoLine = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]));

        // Draw the line
        this.plot.plotArea.append('path')
            .datum(temps.map((t, i) => [t, albedoValues[i]]))
            .attr('class', 'potential-line')  // Reuse the same styling
            .attr('fill', 'none')
            .attr('stroke', this.LINE_COLOR)
            .attr('stroke-width', this.LINE_WIDTH)
            .attr('d', albedoLine);
    }
} 