
function add_bubbles() {
	var error = arguments[0],
		data = arguments[1],
		node_data = data.children;
	
	var scaleFont = d3.scaleLinear()
			.domain([3, 30])
			.range([15, 80]);

	var simulation = d3.forceSimulation()
		.force("center", d3.forceCenter(plotwidth / 2, plotheight / 2))
		.force("charge", d3.forceManyBody().strength(20))
		.force('collision', d3.forceCollide().radius(function(d) {
			return d.freq * 10;
		}))
		.on("tick", ticked);
	
	var bubbles = plotarea
			.selectAll('.bubble')
			.data(node_data)
			.enter()
			.append("g")
			.attr("class", "bubble");
	
	var counter = 0,
		data_name = "prob_" + views[counter],
		header_name = view_names[counter],
		prev_button = d3.select("#prev_button button"),
		adv_button = d3.select("#adv_button button");
	
	setup_bubbles(node_data, data_name);

	// Use buttons
	d3.selectAll('#adv_button').on('click', function() {
		counter = counter + 1;
		data_name = "prob_" + views[counter];
		header_name = view_names[counter];
		
		update_bubbles(node_data, data_name, header_name);
		buttonLogic(counter, prev_button, adv_button);	

	});

	d3.selectAll('#prev_button').on('click', function() {
		counter = counter - 1;
		data_name = "prob_" + views[counter];
		header_name = view_names[counter];
		
		update_bubbles(node_data, data_name, header_name);
		buttonLogic(counter, prev_button, adv_button);

	});

	// functions:

	function setup_bubbles(data, data_name) {
		simulation.nodes(data);
		bubbles.append("circle")
			.attr('r', function(d) { return d.freq*10; })
			.merge(bubbles)
			.style("fill", function(d) {
				return switchColor(d[data_name]);
			});
			// .call(d3.drag()
			// 		.on("start", dragstarted)
			// 		.on("drag", dragged)
			// 		.on("end", dragended));

		bubbles.append("text")
			.text(function(d) { return d.word; })
			.attr("font-size", function(d) { return scaleFont(d.freq)+"px"; })
			.attr("text-anchor", "middle")
			.attr("fill", "#fff");
			// .call(d3.drag()
			// 		.on("start", dragstarted)
			// 		.on("drag", dragged)
			// 		.on("end", dragended));
		
		bubbles.exit().remove();
	}

	function update_bubbles(data, data_name, header_name) {
		
		// bubbles = bubbles.data(data);
		// bubbles.exit().remove();
		// bubbles = bubbles.enter();
		// setup_bubbles(data, data_name);
		// simulation.nodes(data);
		// simulation.restart();

		d3.selectAll(".bubble circle")
			.transition().duration(1000)
			.style("fill", function(d) {
				return switchColor(d[data_name]);
			});
		
		d3.select("#chart_heading")
			.text(header_name);

	}

	function ticked() {
		bubbles.selectAll("circle")
			.attr('cx', function(d) { return d.x })
			.attr('cy', function(d) { return d.y });
		bubbles.selectAll("text")
			.attr('x', function(d) { return d.x })
			.attr('y', function(d) { return d.y });
		bubbles.exit().remove();
	}

	function dragstarted(d) {
		if (!d3.event.active) simulation.alphaTarget(0.3).restart()
		d.fx = d.x;
		d.fy = d.y;
	  }
	  
	  function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	  }
	  
	  function dragended(d) {
		  if (!d3.event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	  }
}

function switchColor(p) {
	if (p < 0) { 
		// unlikely
		return "#c99553";
	} else if (p > 1) { 
		// likely
		return "#68a0b0";
	} else {
		// equal
		return "#bfbfbf";
	}
}

function buttonLogic(counter, prev_button, adv_button) {
	
	// previous button
	if (counter <= 0) {
		prev_button
			.classed("enabled", false)
			.classed("disabled", true);
	} else {
		prev_button
			.classed("enabled", true)
			.classed("disabled", false);
	}

	// advance button
	if (counter < (views.length-1)) {
		adv_button
			.classed("enabled", true)
			.classed("disabled", false);
	} else {
		adv_button
			.classed("enabled", false)
			.classed("disabled", true);
	}

}
