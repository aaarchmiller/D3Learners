var svg = d3.select('body')
	.append('svg')
	.attr('width', '800px')
	.attr('height', '400px');

var colors = d3.scaleOrdinal( d3.schemeCategory10 );

var filterToYear = function(year) {
	var oneyear = {
		nodes: [],
		links: []
	};
	for(i=0; i<data.nodes.length; i++){
		if(data.nodes[i].year===year) {
			oneyear.nodes.push(data.nodes[i]);
		}
	};
	for(i=0; i<data.links.length; i++){
		var link = data.links[i];
		link.target--;
		link.source--;
		if(link.year===year) {
			oneyear.links.push(link);
		}
	};
	return oneyear;
};

var simulation = d3.forceSimulation()
	.force('charge', d3.forceManyBody().strength(-10))
	.force('link',d3.forceLink().distance(200))
	.force('center',d3.forceCenter().x(400).y(200))
	.alphaTarget(0.2);

plot = function(year) {
	// subset data to year
	var oneyear = filterToYear(year);

	// update scales
	colors.domain( d3.range(oneyear.length));
	
	// transition
	var t = d3.transition()
		.duration(750);
	
	// LINES
	// data join
	var lines = svg.selectAll('.edge')
		.data(oneyear.links, function(d) { return d.source + "-" + d.target; });
	// exit
	lines.exit()
		.transition(t)
		.remove();
	// enter + merge
	lines = lines.enter()
		.append('line')
		.classed('edge', true)
		.style('stroke','black')
		.style('stroke-width', 2)
		.merge(lines);
	
	// NODES
	// data join
	var nodes = svg.selectAll('.node')
		.data(oneyear.nodes, function(d) { return d.org; });
	// exit
	nodes.exit()
		.transition(t)
		.attr('r', 1e-6)
		.remove();
	// enter + merge
	nodes = nodes.enter()
		.append('circle')
		.classed('node', true)
		.style('fill', function(d,i){
			return colors(i);
		})
		.attr('r', function(d,i){
			return d.size * 15;
		})
		.merge(nodes);
	// update
	nodes
		.transition(t)
		.attr('r', function(d,i){
			return d.size * 15;
		})
	
	// TEXT
	// functions
	var calcDy = function(d){
		return d.size * 4;
	};
	var calcFontSize = function(d){
		return d.size * 8;
	};
	// data join
	var text = svg.selectAll('.label')
		.data(oneyear.nodes, function(d) { return d.org; });
	// exit
	text.exit().remove();
	// enter + merge
	text = text.enter()
		.append('text')
		.classed('label', true)
		.text(function(d) {
			return d.org;
		})
		.style('fill', 'black')
		.style('text-anchor', 'middle')
		.style('font-size', calcFontSize)
		.attr('dy', calcDy)
		.merge(text);
	// update merged
	text
		.on('mouseover', function(){
			d3.select(this)
				.text(function(d) {
					return d.name;
				})
				.style('font-size', 24)
				.attr('dy', 12);
		})
		.on('mouseout', function(){
			d3.select(this)
				.text(function(d) {
					return d.org;
				})
				.style('font-size', calcFontSize)
				.attr('dy', calcDy);
		})
		.text(function(d) {
			return d.org;
		});
	
	// ticks
	var ticked = function(){
		// update merged lines, nodes, text
		lines
			.attr('x1', function(d){ return d.source.x; })
			.attr('y1', function(d){ return d.source.y; })
			.attr('x2', function(d){ return d.target.x; })
			.attr('y2', function(d){ return d.target.y; });
		nodes
			.attr('cx', function(d){ return d.x; })
			.attr('cy', function(d){ return d.y; });
		text
			.attr('x', function(d){ return d.x; })
			.attr('y', function(d){ return d.y; });
	};
	
	// update force
	simulation
		.on('tick', ticked)
		.nodes( oneyear.nodes )
		.force('link')
			.links( oneyear.links );
	simulation.restart();
};

plot(1950);
