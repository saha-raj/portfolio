import * as d3 from 'd3';
import { MODEL_PARAMS } from '../simulation/constants.js';

export class PotentialPlot {
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

        // Setup the plot in the element
        this.setupPlot(this.element);

        // Debug check
        // console.log('Created element:', this.element instanceof Node);
    }

    setupPlot(container) {
        const width = 400;
        const height = width * 0.8;
        const plotWidth = width - this.margins.left - this.margins.right;
        const plotHeight = height - this.margins.top - this.margins.bottom;

        // Define xScale at class level first
        this.xScale = d3.scaleLinear()
            .domain([220, 320])
            .range([0, plotWidth]);

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
            .text('Climate Potential');

        
        
        // Update styling for axes
        plotArea.select('.x-axis')
            .style('font-size', '0.8rem')
            .style('font-family', this.MAIN_FONT)
            .style('color', this.TEXT_COLOR);

        plotArea.select('.y-axis')
            .style('display', 'none'); // Hide y-axis per CSS

        // Update labels with correct styling
        svg.select('.x-label')
            .style('font-size', '0.9rem')
            .style('font-weight', '500')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR);

        svg.select('.y-label')
            .style('font-size', '0.9rem')
            .style('font-weight', '500')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR);

        // Add freezing point reference line FIRST
        plotArea.append('line')
            .attr('class', 'freezing-line')
            .style('stroke', '#8ecae6')
            .style('stroke-width', '1px')
            .style('stroke-dasharray', '4,4')
            .attr('x1', this.xScale(273))
            .attr('x2', this.xScale(273))
            .attr('y1', 0)
            .attr('y2', plotHeight);

        // Then add the labels
        plotArea.append('text')
            .attr('class', 'freezing-label-1')
            .attr('text-anchor', 'start')
            .attr('transform', `rotate(-90, ${this.xScale(273)}, ${plotHeight/4})`)
            .attr('x', this.xScale(273)+14)
            .attr('y', plotHeight/4 - 7)
            .style('font-size', '0.7rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', '#8ecae6')
            .text('Freezing');

        plotArea.append('text')
            .attr('class', 'freezing-label-2')
            .attr('text-anchor', 'start')
            .attr('transform', `rotate(-90, ${this.xScale(273)}, ${plotHeight/4 + 40})`)
            .attr('x', this.xScale(273) + 70)
            .attr('y', plotHeight/4 + 54)
            .style('font-size', '0.7rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', '#8ecae6')
            .text('Point');

        this.plot = { svg, plotArea, width, height };
    }

    updatePlot(potentialData, equilibriumTemp) {
        const { svg, plotArea, width, height } = this.plot;
        const plotWidth = width - this.margins.left - this.margins.right;
        const plotHeight = height - this.margins.top - this.margins.bottom;

        const x = d3.scaleLinear()
            .domain([220, 320])
            .range([0, plotWidth]);

        const y = d3.scaleLinear()
            .domain(d3.extent(potentialData.values))
            .range([plotHeight, 0]);

        // Store scales for use in tracking dot
        this.xScale = x;
        this.yScale = y;

        // Update axes
        plotArea.select('.x-axis')
            .call(d3.axisBottom(x)
                .ticks(5)
                .tickFormat(d => Math.round(d)));
        
        plotArea.select('.y-axis')
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickFormat(d => Math.round(d)));

        // Create potential line
        const potentialLine = d3.line()
            .x((d, i) => x(potentialData.temps[i]))
            .y(d => y(d));

        // Update the potential curve
        plotArea.selectAll('.potential-line').remove();
        plotArea.append('path')
            .datum(potentialData.values)
            .attr('class', 'potential-line')
            .attr('stroke', this.LINE_COLOR)
            .attr('stroke-width', this.LINE_WIDTH)
            .attr('stroke-linecap', 'round')
            .attr('d', potentialLine);

        // Add equilibrium point - remove both classes first
        const eqIndex = d3.bisector(d => d).left(potentialData.temps, equilibriumTemp);
        const eqPotential = potentialData.values[eqIndex];
        plotArea.selectAll('.equilibrium-point-hot, .equilibrium-point-ice').remove();
        plotArea.append('circle')
            .attr('class', equilibriumTemp > 273 ? 'equilibrium-point-hot' : 'equilibrium-point-ice')
            .attr('cx', x(equilibriumTemp))
            .attr('cy', y(eqPotential));

        // Add initial point
        const initialIndex = d3.bisector(d => d).left(potentialData.temps, potentialData.initialTemp);
        const initialPotential = potentialData.values[initialIndex];
        plotArea.selectAll('.initial-point').remove();
        plotArea.append('circle')
            .attr('class', 'initial-point')
            .attr('cx', x(potentialData.initialTemp))
            .attr('cy', y(initialPotential));

        // Add arrow functionality
        this.addArrow(plotArea, potentialData, equilibriumTemp, x, y);

        // Remove tracking dot during slider changes
        this.removeTrackingDot();

        // Update tracking dot if it exists
        if (this.trackingDot) {
            const currentTemp = parseFloat(this.trackingDot.attr('cx')) / x.range()[1] * (x.domain()[1] - x.domain()[0]) + x.domain()[0];
            const dotIndex = d3.bisector(d => d).left(potentialData.temps, currentTemp);
            const newPotential = potentialData.values[dotIndex];
            this.trackingDot
                .attr('cx', x(currentTemp))
                .attr('cy', y(newPotential));
        }

        // Create the line generator
        const line = d3.line()
            .x(d => x(d.temp))
            .y(d => y(d.potential));
    }

    addArrow(plotArea, potentialData, equilibriumTemp, x, y) {
        // skip drawing for now
        return;

        // Add arrow marker definition
        plotArea.selectAll('defs').remove();
        const defs = plotArea.append('defs');
        defs.append('marker')
            .attr('id', 'curved-arrow')
            .attr('markerUnits', 'strokeWidth')
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 8)
            .attr('refY', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,1 L6,5 L0,9')
            .attr('fill', 'none')
            .attr('stroke', '#666')
            .attr('stroke-width', 1.5);

        // Find indices for points
        const startIndex = d3.bisector(d => d).left(potentialData.temps, potentialData.initialTemp);
        const endIndex = d3.bisector(d => d).left(potentialData.temps, equilibriumTemp);
        
        // Extract segment values
        const segmentTemps = potentialData.temps.slice(
            Math.min(startIndex, endIndex), 
            Math.max(startIndex, endIndex) + 1
        );
        const segmentValues = potentialData.values.slice(
            Math.min(startIndex, endIndex), 
            Math.max(startIndex, endIndex) + 1
        );

        if (startIndex > endIndex) {
            segmentTemps.reverse();
            segmentValues.reverse();
        }

        const segmentLine = d3.line()
            .x((d, i) => x(segmentTemps[i]))
            .y(d => y(d));

        // Calculate path length and trim end
        const tempPath = plotArea.append('path')
            .attr('d', segmentLine(segmentValues))
            .style('display', 'none');
        
        const pathLength = tempPath.node().getTotalLength();
        const trimmedLength = pathLength - this.DOT_RADIUS * 3;
        tempPath.remove();

        // Add the curved arrow path
        plotArea.selectAll('.trajectory-arrow').remove();
        plotArea.append('path')
            .attr('class', 'trajectory-arrow')
            .datum(segmentValues)
            .attr('d', segmentLine)
            .attr('fill', 'none')
            .attr('stroke', '#666')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#curved-arrow)')
            .style('stroke-dasharray', `${trimmedLength} ${pathLength}`);
    }

    updateInitialTemp(newTemp) {
        const plotWidth = this.plot.width - this.margins.left - this.margins.right;
        const plotHeight = this.plot.height - this.margins.top - this.margins.bottom;

        const x = d3.scaleLinear()
            .domain([220, 320])
            .range([0, plotWidth]);

        // Update only the initial point position
        this.plot.plotArea.select('.initial-point')
            .attr('cx', x(newTemp));
    }

    initTrackingDot(temp, potential) {
        this.removeTrackingDot();
        
        // Add new tracking dot
        this.trackingDot = this.plot.plotArea.append('circle')
            .attr('class', 'tracking-dot')
            .attr('cx', this.xScale(temp))
            .attr('cy', this.yScale(potential));
    }

    updateTrackingDot(temp, potential) {
        if (this.trackingDot) {
            this.trackingDot
                .attr('cx', this.xScale(temp))
                .attr('cy', this.yScale(potential));
        }
    }

    removeTrackingDot() {
        if (this.trackingDot) {
            this.trackingDot.remove();
            this.trackingDot = null;
        }
    }
} 