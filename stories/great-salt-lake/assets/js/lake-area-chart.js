document.addEventListener('DOMContentLoaded', function () {
  d3.csv('assets/data/lake_area.csv').then(function (data) {
    data.forEach(d => {
      d.Year = +d.Year;
      d.Area_percent = +d.Area_percent;
    });

    data.sort((a, b) => a.Year - b.Year);

    const margin = { top: 40, right: 40, bottom: 60, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select('#lake-area-chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get min and max years with padding
    const yearExtent = d3.extent(data, d => d.Year);
    const yearPadding = (yearExtent[1] - yearExtent[0]) * 0.05; // 5% padding

    const x = d3.scaleLinear()
      .domain([yearExtent[0], yearExtent[1] + yearPadding]) // Add padding to the right
      .range([0, width]);

    const y = d3.scaleLinear().domain([-40, 5]).range([height, 0]);

    const xAxis = d3.axisBottom(x).tickFormat(d3.format('d')).ticks(5);
    const yAxis = d3.axisLeft(y).tickValues([-40, -30, -20, -10, 0]);

    svg.append('g').attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    svg.append('text')
      .attr('class', 'x-label').attr('text-anchor', 'middle')
      .attr('x', width / 2).attr('y', height + margin.bottom - 10)
      .text('Year').style('font-size', '16px').style('fill', '#666');

    svg.append('g').attr('class', 'y-axis').call(yAxis);

    svg.select('.y-axis path').remove(); // Remove vertical line

    svg.append('text')
      .attr('class', 'y-label')
      .attr('x', -margin.left)
      .attr('y', -20)
      .text('Change in area of the Great Salt Lake (%) since 1984')
      .style('font-family', 'var(--ui-font)')
      .style('font-size', '18px')
      .style('fill', '#666');

    // First, add the grid lines (before the line)
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat('').tickValues([-40, -30, -20, -10, 0, 10]))
      .attr('transform', 'translate(0,0)')
      .select('.domain')
      .remove();

    // Style the grid lines
    svg.select('.grid')
      .selectAll('line')
      .style('stroke', '#ddd')
      .style('stroke-width', 1);

    // Then create the line generator
    const line = d3.line()
      .x(d => x(d.Year))
      .y(d => y(d.Area_percent))
      .curve(d3.curveMonotoneX);

    // Create a group for the line to make it easier to update
    const lineGroup = svg.append('g').attr('class', 'line-group');
    
    // Draw the line
    lineGroup.append('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', '#444')
      .attr('stroke-width', 3)
      .attr('d', line(data));

    function resizeChart() {
      const containerWidth = document.getElementById('lake-area-chart').clientWidth;
      const newWidth = Math.min(containerWidth, 800) - margin.left - margin.right;
      const newHeight = Math.min(containerWidth * 0.75, 600) - margin.top - margin.bottom;

      d3.select('#lake-area-chart svg')
        .attr('width', newWidth + margin.left + margin.right)
        .attr('height', newHeight + margin.top + margin.bottom);

      // Update the x scale with padding
      const yearPadding = (yearExtent[1] - yearExtent[0]) * 0.05;
      x.domain([yearExtent[0], yearExtent[1] + yearPadding])
       .range([0, newWidth]);
      
      y.range([newHeight, 0]);

      // Update axes
      svg.select('.x-axis').attr('transform', `translate(0,${newHeight})`).call(xAxis);
      svg.select('.y-axis').call(yAxis);
      svg.select('.y-axis path').remove();

      // Update grid
      svg.select('.grid')
        .call(d3.axisLeft(y).tickSize(-newWidth).tickFormat('').tickValues([-40, -30, -20, -10, 0, 10]))
        .attr('transform', 'translate(0,0)')
        .select('.domain')
        .remove();

      // Update line
      lineGroup.select('.line')
        .attr('d', line(data));

      svg.select('.x-label')
        .attr('x', newWidth / 2)
        .attr('y', newHeight + margin.bottom - 10);
    }

    resizeChart();
    window.addEventListener('resize', debounce(resizeChart, 250));

    function debounce(func, wait) {
      let timeout;
      return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(), wait);
      };
    }

  }).catch(function (error) {
    console.error('Error loading the CSV file:', error);
  });
});
