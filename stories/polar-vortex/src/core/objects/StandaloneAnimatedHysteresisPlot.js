import * as d3 from 'd3';
import { ClimateModel } from '../simulation/climate-model.js';

export class StandaloneAnimatedHysteresisPlot {
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
        
        // Bind the animate method to this instance
        this.animate = this.animate.bind(this);
        
        // Initialize animation
        this.isAnimating = false;
        this.animationStartTime = null;
        this.climateModel = new ClimateModel();
        this.frameRate = 60;
        this.currentTemp = config.params.T0 || 230;
        this.g_start = config.params.g_start || 0.3;
        this.g_end = config.params.g_end || 0.45;
        
        // Add visibility observer
        this.setupVisibilityObserver();

        // Add fade duration parameter
        this.fadeDuration = 10000; // milliseconds for line segments to fade out
        this.lineSegments = []; // Store line segments with their creation times

        // Add direction tracking
        this.direction = 1; // 1 for forward, -1 for backward
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
            .domain([0.3, 0.45])  // g range
            .range([0, plotWidth]);

        this.yScale = d3.scaleLinear()
            .domain([220, 320])   // Temperature range
            .range([plotHeight, 0]);

        // Add axes
        plotArea.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${plotHeight})`)
            .call(d3.axisBottom(this.xScale)
                .ticks(5)
                .tickFormat(d => d.toFixed(2)));

        plotArea.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(this.yScale));

        // Add labels
        svg.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', width/2)
            .attr('y', height - 10)
            .text('Greenhouse Gas Parameter (g)');

        svg.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'start')
            .attr('x', this.margins.left)
            .attr('y', 25)
            .style('font-size', '0.9rem')
            .style('font-weight', '500')
            .style('font-family', this.MAIN_FONT)
            .style('fill', this.TEXT_COLOR)
            .text('Temperature (K) Evolution with Slowly Varying g');

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
            .attr('text-anchor', 'end')
            .attr('x', plotWidth - 2)
            .attr('y', this.yScale(273) - 7)
            .style('font-size', '0.7rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', '#8ecae6')
            .text('Freezing');

        plotArea.append('text')
            .attr('class', 'freezing-label-2')
            .attr('text-anchor', 'end')
            .attr('x', plotWidth - 2)
            .attr('y', this.yScale(273) + 14)
            .style('font-size', '0.7rem')
            .style('font-family', this.MAIN_FONT)
            .style('fill', '#8ecae6')
            .text('Point');

        this.plot = { svg, plotArea, width, height };
        
        // Initialize path for the equilibrium curve
        this.path = plotArea.append('path')
            .attr('class', 'equilibrium-line')
            .attr('fill', 'none')
            .attr('stroke', this.LINE_COLOR)
            .attr('stroke-width', this.LINE_WIDTH);
    }

    findNextStableEquilibrium(g, prevTemp) {
        // If no previous temperature, use full range
        if (!prevTemp) {
            return this.climateModel.findStableEquilibrium(g);
        }

        // Define search range around previous equilibrium
        const rangeSize = 50; // Kelvin
        const minTemp = Math.max(220, prevTemp - rangeSize);
        const maxTemp = Math.min(320, prevTemp + rangeSize);
        const stepSize = 0.1; // Smaller steps for more precision

        // Generate temperature range centered on previous equilibrium
        const temps = [];
        for (let T = minTemp; T <= maxTemp; T += stepSize) {
            temps.push(T);
        }

        // Find all stable equilibria within this range
        const stablePoints = [];
        
        temps.forEach((T, i) => {
            if (i > 0 && i < temps.length - 1) {
                const rate = this.climateModel.calculateDeltaT(T, g);
                const prevRate = this.climateModel.calculateDeltaT(temps[i-1], g);
                const nextRate = this.climateModel.calculateDeltaT(temps[i+1], g);
                
                // Check if this is a zero crossing
                if ((prevRate * rate <= 0 || rate * nextRate <= 0) && Math.abs(rate) < 0.1) {
                    // Check stability by looking at slope
                    const slope = (nextRate - prevRate) / (temps[i+1] - temps[i-1]);
                    if (slope < 0) {
                        stablePoints.push({
                            temp: T,
                            distance: Math.abs(T - prevTemp)
                        });
                    }
                }
            }
        });

        // If we found stable points, return the nearest one
        if (stablePoints.length > 0) {
            stablePoints.sort((a, b) => a.distance - b.distance);
            return stablePoints[0].temp;
        }

        // If no stable equilibrium found in range, fall back to full range
        return this.climateModel.findStableEquilibrium(g);
    }

    drawEquilibriumPoint(g, T) {
        const equilibriumTemp = this.findNextStableEquilibrium(g, this.currentTemp);
        if (!equilibriumTemp) {
            console.error('No stable equilibrium found for g:', g, 'T:', T);
            return null;
        }

        // Store the point in our points array with timestamp
        const currentTime = Date.now();
        this.points.push({
            point: [g, equilibriumTemp],
            timestamp: currentTime
        });

        // Remove old points based on fade duration
        const cutoffTime = currentTime - this.fadeDuration;
        this.points = this.points.filter(p => p.timestamp >= cutoffTime);

        // Clear existing elements
        this.plot.plotArea.selectAll('.equilibrium-point, .equilibrium-line, .tracking-dot').remove();

        // Draw line segments with opacity based on age
        this.points.forEach((point, i) => {
            if (i > 0) {
                const prevPoint = this.points[i - 1];
                const age = currentTime - point.timestamp;
                const opacity = Math.max(0, 1 - age / this.fadeDuration);

                this.plot.plotArea.append('path')
                    .attr('class', 'equilibrium-line')
                    .attr('d', d3.line()([
                        [this.xScale(prevPoint.point[0]), this.yScale(prevPoint.point[1])],
                        [this.xScale(point.point[0]), this.yScale(point.point[1])]
                    ]))
                    .attr('fill', 'none')
                    .attr('stroke', this.LINE_COLOR)
                    .attr('stroke-width', this.LINE_WIDTH)
                    .style('opacity', opacity);
            }
        });

        // Draw points with fading
        this.points.forEach(({point, timestamp}) => {
            const age = currentTime - timestamp;
            const opacity = Math.max(0, 1 - age / this.fadeDuration);

            this.plot.plotArea.append('circle')
                .attr('class', 'equilibrium-point')
                .attr('cx', this.xScale(point[0]))
                .attr('cy', this.yScale(point[1]))
                .attr('r', 2)
                .style('fill', this.LINE_COLOR)
                .style('opacity', opacity);
        });

        // Add tracking dot at current point
        this.plot.plotArea.append('circle')
            .attr('class', 'tracking-dot')
            .attr('cx', this.xScale(g))
            .attr('cy', this.yScale(equilibriumTemp));

        return equilibriumTemp;
    }

    setupVisibilityObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.resetAndStartAnimation();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(this.element);
    }

    resetAndStartAnimation() {
        this.animationStartTime = null;
        this.lastFrameTime = 0;
        this.isAnimating = true;
        this.currentTemp = this.config.params.T0;
        this.points = [];  // Initialize empty points array
        this.plot.plotArea.selectAll('.equilibrium-point, .equilibrium-line, .tracking-dot').remove();
        requestAnimationFrame(this.animate);
    }

    animate(timestamp) {
        if (!this.isAnimating) return;
        
        if (!this.animationStartTime) {
            this.animationStartTime = timestamp;
            this.lastFrameTime = timestamp;
        }

        const frameInterval = 1000 / this.frameRate;
        const elapsed = timestamp - this.lastFrameTime;
        
        if (elapsed < frameInterval) {
            requestAnimationFrame(this.animate);
            return;
        }
        
        const progress = (timestamp - this.animationStartTime) / this.config.params.cycle_duration;
        
        // Calculate g based on direction
        let g;
        if (this.direction === 1) {
            g = this.g_start + (this.g_end - this.g_start) * progress;
            if (progress >= 1) {
                // Switch direction and reset animation time
                this.direction = -1;
                this.animationStartTime = timestamp;
                g = this.g_end; // Ensure we hit the exact end value
            }
        } else {
            g = this.g_end - (this.g_end - this.g_start) * progress;
            if (progress >= 1) {
                // Switch direction and reset animation time
                this.direction = 1;
                this.animationStartTime = timestamp;
                g = this.g_start; // Ensure we hit the exact start value
            }
        }

        const gRounded = Math.round(g * 10000) / 10000;
        
        const newTemp = this.drawEquilibriumPoint(gRounded, this.currentTemp);
        if (newTemp) {
            this.currentTemp = newTemp;
        }
        
        this.lastFrameTime = timestamp;
        requestAnimationFrame(this.animate);
    }
} 