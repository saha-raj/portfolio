import * as d3 from 'd3';
import { ClimateModel } from '../simulation/climate-model.js';

export class StandalonePotentialPlot {
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

        // Store config and set margins (same as other plots)
        this.config = config;
        // this.margins = { top: 40, right: 40, bottom: 60, left: 60 };
        this.margins = { top: 40, right: 40, bottom: 60, left: 40 };

        // Get CSS variables (same as other plots)
        const style = getComputedStyle(document.documentElement);
        this.DOT_RADIUS = style.getPropertyValue('--dot-radius');
        this.LINE_COLOR = style.getPropertyValue('--plot-line-color');
        this.LINE_WIDTH = style.getPropertyValue('--plot-line-width');
        this.TEXT_COLOR = style.getPropertyValue('--text-color');
        this.MAIN_FONT = style.getPropertyValue('--main-font');

        // Setup the plot
        this.setupPlot();
        
        // Draw the potential curve with fixed g value
        this.drawPotentialCurve(config.params.g || 0.4);
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
            .domain([220, 320])
            .range([0, plotWidth]);

        this.yScale = d3.scaleLinear()
            .domain([-100, 100])  // Adjust based on potential values
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
            .text('Temperature (K)');

        // Add new top-aligned label
        svg.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'start')  // Left align
            .attr('x', this.margins.left)  // Align with y-axis position
            .attr('y', 25)  // Position at top
            .style('font-size', '0.9rem')
            .style('font-weight', '500')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR)
            .text('Climate Potential');

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

        plotArea.append('text')
            .attr('class', 'freezing-label-1')
            .attr('text-anchor', 'start')  // Bottom of rotated text
            .attr('transform', `rotate(-90, ${this.xScale(273)}, ${plotHeight/4})`)  // Rotate around point
            .attr('x', this.xScale(273)+14)
            .attr('y', plotHeight/4 - 7)  // Position in top quarter
            .style('font-size', '0.7rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', '#8ecae6')
            .text('Freezing');

        plotArea.append('text')
            .attr('class', 'freezing-label-2')
            .attr('text-anchor', 'start')  // Bottom of rotated text
            .attr('transform', `rotate(-90, ${this.xScale(273)}, ${plotHeight/4 + 40})`)  // 40px below first text
            .attr('x', this.xScale(273) + 70)
            .attr('y', plotHeight/4 + 54)
            .style('font-size', '0.7rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', '#8ecae6')
            .text('Point');

        this.plot = { svg, plotArea, width, height };
    }

    drawPotentialCurve(g) {
        const climateModel = new ClimateModel();
        const temps = climateModel.generateTempRange();
        const potentialValues = temps.map(T => climateModel.calculatePotential(T, g));

        // Calculate y-domain based on actual potential values
        const yMin = Math.min(...potentialValues);
        const yMax = Math.max(...potentialValues);
        const yPadding = (yMax - yMin) * 0.1;  // Add 10% padding
        
        // Update y scale with actual range
        this.yScale.domain([yMin - yPadding, yMax + yPadding]);

        // Update y-axis with new scale
        this.plot.plotArea.select('.y-axis')
            .call(d3.axisLeft(this.yScale));

        // Create potential line
        const potentialLine = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]));

        // Draw the line
        this.plot.plotArea.append('path')
            .datum(temps.map((t, i) => [t, potentialValues[i]]))
            .attr('class', 'potential-line')
            .attr('fill', 'none')
            .attr('stroke', this.LINE_COLOR)
            .attr('stroke-width', this.LINE_WIDTH)
            .attr('d', potentialLine);

        // Find and mark equilibrium points
        const equilibria = climateModel.findEquilibrium(null, g);
        const rates = temps.map(t => climateModel.calculateDeltaT(t, g));

        // Add equilibrium points
        equilibria.forEach(temp => {
            const potential = climateModel.calculatePotential(temp, g);
            
            // Find index of closest temperature in the array
            const i = temps.findIndex(t => Math.abs(t - temp) < 0.1);
            
            // Calculate slope of rate at equilibrium point
            const slope = (rates[i+1] - rates[i]) / (temps[i+1] - temps[i]);
            const isStable = slope < 0;  // Stable if rate decreases with temperature

            let className;
            if (!isStable) {
                className = 'equilibrium-point-unstable';
            } else {
                // For stable points, classify as hot or ice based on temperature
                className = temp > 273 ? 'equilibrium-point-hot' : 'equilibrium-point-ice';
            }

            this.plot.plotArea.append('circle')
                .attr('class', className)
                .attr('cx', this.xScale(temp))
                .attr('cy', this.yScale(potential));
        });

        this.plot.plotArea.select('.x-axis')
            .call(d3.axisBottom(this.xScale)
                .ticks(5)
                .tickFormat(d => Math.round(d)));
    }
} 