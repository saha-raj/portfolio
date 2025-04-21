import * as d3 from 'd3';
import { MODEL_PARAMS } from '../simulation/constants.js';

export class SolutionPlot {
    constructor(config) {
        // Create container element first
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

        // Initialize data array for time series with config temperature
        const initialTemp = config.params?.T0 || 292;  // Use config value or fallback
        this.timeSeriesData = [{ time: 0, temp: initialTemp }];

        // Setup the plot in the element
        this.setupPlot(this.element);
    }

    setupPlot(container) {
        const width = 400;
        const height = width * 0.8;

        const svg = d3.select(container)
            // .append('svg')
            // .attr('width', width)
            // .attr('height', height);
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('display', 'block')  // Remove any default inline spacing
            .style('margin', 'auto');   // Center within container

        const plotArea = svg.append('g')
            .attr('transform', `translate(${this.margins.left},${this.margins.top})`);

        // Set up initial scales
        const plotWidth = width - this.margins.left - this.margins.right;
        const plotHeight = height - this.margins.top - this.margins.bottom;

        // Initialize scales with default ranges
        this.xScale = d3.scaleLinear()
            .domain([0, 20])
            .range([0, plotWidth]);

        this.yScale = d3.scaleLinear()
            .domain([220, 320])
            .range([plotHeight, 0]);

        // Add freezing point reference line
        plotArea.append('line')
            .attr('class', 'freezing-line')
            .style('stroke', '#8ecae6')  // Light blue color
            .style('stroke-width', '1px')
            .style('stroke-dasharray', '4,4')  // Create dashed line
            .attr('x1', 0)
            .attr('x2', plotWidth)
            .attr('y1', this.yScale(273))  // Now yScale is defined
            .attr('y2', this.yScale(273));

        // Add axes
        plotArea.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height - this.margins.top - this.margins.bottom})`);
        
        plotArea.append('g')
            .attr('class', 'y-axis');

        // Add labels
        svg.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', width/2)
            .attr('y', height - 10)
            .text('Time Steps');

        svg.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'start')  // Left align
            .attr('x', this.margins.left)  // Align with y-axis position
            .attr('y', 25)  // Position at top
            .style('font-size', '0.9rem')
            .style('font-weight', '500')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR)
            .text('Temperature (K)');

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

        // Style axes
        plotArea.select('.x-axis')
            .style('font-size', '0.8rem')
            .style('font-family', this.MAIN_FONT)
            .style('color', this.TEXT_COLOR);

        plotArea.select('.y-axis')
            .style('font-size', '0.8rem')
            .style('font-family', this.MAIN_FONT)
            .style('color', this.TEXT_COLOR);

        // Style labels
        svg.selectAll('.x-label, .y-label')
            .style('font-size', '0.9rem')
            .style('font-weight', '500')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR);

        // Add initial point
        this.timeSeriesData = [{ time: 0, temp: 292 }];
        
        plotArea.selectAll('.initial-point').remove();
        plotArea.append('circle')
            .attr('class', 'initial-point')
            .attr('cx', this.xScale(0))
            .attr('cy', this.yScale(292));

        this.plot = { svg, plotArea, width, height };
    }

    initializeAxesAndPoint(initialTemp) {
        const { plotArea, width, height } = this.plot;
        const plotWidth = width - this.margins.left - this.margins.right;
        const plotHeight = height - this.margins.top - this.margins.bottom;

        // Set up initial scales
        const x = d3.scaleLinear()
            .domain([0, 20])
            .range([0, plotWidth]);

        const y = d3.scaleLinear()
            .domain([220, 320])
            .range([plotHeight, 0]);

        // Store scales for later use
        this.xScale = x;
        this.yScale = y;

        // Draw initial axes
        plotArea.select('.x-axis')
            .call(d3.axisBottom(x)
                .ticks(5)
                .tickFormat(d => Math.round(d)));
        
        plotArea.select('.y-axis')
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickFormat(d => Math.round(d)));

        // Add initial point
        this.timeSeriesData = [{ time: 0, temp: initialTemp }];
        
        plotArea.selectAll('.initial-point').remove();
        plotArea.append('circle')
            .attr('class', 'initial-point')
            .attr('cx', x(0))
            .attr('cy', y(initialTemp));
    }

    updatePlot(solutionData) {
        if (!solutionData || !solutionData.times || !solutionData.temperatures) return;
        
        // Remove tracking dot during slider changes
        this.removeTrackingDot();
        
        const { plotArea } = this.plot;
        const plotWidth = this.plot.width - this.margins.left - this.margins.right;
        const plotHeight = this.plot.height - this.margins.top - this.margins.bottom;

        // Update scales with actual data range
        const x = d3.scaleLinear()
            .domain([0, d3.max(solutionData.times)])
            .range([0, plotWidth]);

        const y = d3.scaleLinear()
            .domain([220, 320])
            .range([plotHeight, 0]);

        this.xScale = x;
        this.yScale = y;

        // Update axes with nice tick values
        plotArea.select('.x-axis')
            .call(d3.axisBottom(x)
                .ticks(5)
                .tickFormat(d => Math.round(d/1000000))); // Convert to thousands for readability

        plotArea.select('.y-axis')
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickFormat(d => Math.round(d)));

        // Create solution line
        const solutionLine = d3.line()
            .x((d, i) => x(solutionData.times[i]))
            .y(d => y(d));

        // Update the solution curve
        plotArea.selectAll('.solution-line').remove();
        plotArea.append('path')
            .datum(solutionData.temperatures)
            .attr('class', 'solution-line')
            .attr('stroke', this.LINE_COLOR)
            .attr('stroke-width', this.LINE_WIDTH)
            .attr('stroke-linecap', 'round')
            .attr('fill', 'none')
            .attr('d', solutionLine);

        // Update initial point position
        plotArea.selectAll('.initial-point')
            .attr('cx', this.xScale(solutionData.times[0]))
            .attr('cy', this.yScale(solutionData.temperatures[0]));

        // Update freezing point line position with new scale
        this.plot.plotArea.select('.freezing-line')
            .attr('x2', plotWidth)
            .attr('y1', y(273))
            .attr('y2', y(273));
    }

    animateToEquilibrium(solutionData, callback) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const { plotArea } = this.plot;
        const totalPoints = solutionData.temperatures.length;
        let currentPoint = 0;

        const animate = () => {
            if (currentPoint >= totalPoints || !this.isAnimating) {
                this.isAnimating = false;
                if (callback) callback();
                return;
            }

            // Update current point position
            plotArea.select('.initial-point')
                .attr('cx', this.xScale(solutionData.times[currentPoint]))
                .attr('cy', this.yScale(solutionData.temperatures[currentPoint]));

            // Update line up to current point
            const currentLine = d3.line()
                .x((d, i) => this.xScale(solutionData.times[i]))
                .y(d => this.yScale(d));

            plotArea.selectAll('.solution-line').remove();
            plotArea.append('path')
                .datum(solutionData.temperatures.slice(0, currentPoint + 1))
                .attr('class', 'solution-line')
                .attr('stroke', this.LINE_COLOR)
                .attr('stroke-width', this.LINE_WIDTH)
                .attr('stroke-linecap', 'round')
                .attr('d', currentLine);

            currentPoint++;
            requestAnimationFrame(animate);
        };

        animate();
    }

    stopAnimation() {
        this.isAnimating = false;
    }

    reset() {
        const { plotArea } = this.plot;
        this.stopAnimation();
        this.timeSeriesData = [];
        plotArea.selectAll('.solution-line').remove();
        
        // Reset to initial state
        const initialTemp = this.timeSeriesData[0]?.temp || 292;
        this.initializeAxesAndPoint(initialTemp);
    }

    initTrackingDot(time, temp) {
        this.removeTrackingDot();
        
        // Add new tracking dot
        this.trackingDot = this.plot.plotArea.append('circle')
            .attr('class', 'tracking-dot')
            .attr('cx', this.xScale(time))
            .attr('cy', this.yScale(temp));
    }

    updateTrackingDot(time, temp) {
        if (this.trackingDot) {
            this.trackingDot
                .attr('cx', this.xScale(time))
                .attr('cy', this.yScale(temp));
        }
    }

    removeTrackingDot() {
        if (this.trackingDot) {
            this.trackingDot.remove();
            this.trackingDot = null;
        }
    }

    startAnimation(simulation) {
        // Clear previous animation state
        this.removeTrackingDot();
        
        // Initialize tracking dot at start position
        this.initTrackingDot(simulation.times[0], simulation.temperatures[0]);
        
        // Store simulation data for animation
        this.animationData = simulation;
        this.currentIndex = 0;
    }

    animateToPoint(time, temp) {
        if (!this.animationData) return;
        
        this.currentIndex++;
        
        // Just update the tracking dot position
        this.updateTrackingDot(time, temp);
    }

    finishAnimation() {
        // Clean up animation state
        this.animationData = null;
        this.currentIndex = 0;
    }
}