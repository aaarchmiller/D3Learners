
function add_bubbles() {
	var error = arguments[0],
		data_all = arguments[1];
	
	var scaleFont = d3.scaleLinear()
			.domain([data_all.freq_min, data_all.freq_max])
			.range([6, 80]);
	var scaleRadius = d3.scaleLinear()
			.domain([data_all.freq_min, data_all.freq_max])
			.range([10, 200]);
	
	var counter = 0,
		freq_name = "freq_" + views[counter],
		header_name = view_names[counter],
		prev_button = d3.select("#prev_button button"),
		adv_button = d3.select("#adv_button button");
	
	var strength = -1;
	var strengthForce = d3.forceManyBody().strength(strength);
	var simulation = d3.forceSimulation()
		.force("center", d3.forceCenter(plotwidth / 2, plotheight / 2))
		.force("charge", strengthForce)
		.force('collision', d3.forceCollide().radius(function(d) {
			return scaleRadius(d[freq_name]);
		}))
		.alpha(3)
		.on("tick", ticked);
	
	// var data = data_all[freq_name];
	// var bubbles = plotarea
	// 		.selectAll('.bubble')
			// .data(data)
			// .enter()
			// .append("g")
			// .attr("class", "bubble");
	
	var data = data_all[freq_name];
	var bubbles = plotarea
			.selectAll('.bubble')
			.data(data)
			.enter()
			.append("g")
			.attr("class", "bubble");
	setup_bubbles(data, freq_name);

	// Use buttons
	d3.selectAll('#adv_button').on('click', function() {
		counter = counter + 1;
		freq_name = "freq_" + views[counter],
		header_name = view_names[counter];
		
		update_bubbles(data_all, header_name, freq_name);
		buttonLogic(counter, prev_button, adv_button);	

	});

	d3.selectAll('#prev_button').on('click', function() {
		counter = counter - 1;
		freq_name = "freq_" + views[counter],
		header_name = view_names[counter];
		
		update_bubbles(data_all, header_name, freq_name);
		buttonLogic(counter, prev_button, adv_button);

	});

	// functions:

	function setup_bubbles(data, freq_name) {
		
		simulation.nodes(data);

		bubbles.append("circle")
			.attr('r', function(d) { return scaleRadius(d[freq_name]); })
			.style("fill", "#68a0b0")
			.call(d3.drag()
					.on("start", dragstarted)
					.on("drag", dragged)
					.on("end", dragended));

		bubbles.append("text")
			.text(function(d) { return d.word; })
			.attr("font-size", function(d) { return scaleFont(d[freq_name])+"px"; })
			.attr("text-anchor", "middle")
			.attr("fill", "#fff")
			.call(d3.drag()
					.on("start", dragstarted)
					.on("drag", dragged)
					.on("end", dragended));

	}

	function update_bubbles(data_all, header_name, freq_name) {
		
		var data = data_all[freq_name];
		
		bubbles.data(data);

		simulation.nodes(data);
		
		bubbles.select("circle")
			.transition().duration(1000)
			.style("fill", "#68a0b0")
			.attr('r', function(d) { return scaleRadius(d[freq_name]); });
		
		bubbles.select("text")
			.text(function(d) { return d.word; })
			.transition().duration(1000)
			.attr("font-size", function(d) { return scaleFont(d[freq_name])+"px"; });
		
		d3.select("#chart_heading")
			.text(header_name);

		bubbles.exit().remove();
	}

	var count = 0;
	function ticked() {
		count++;

		// switch strength between +/- for bounce effect
		if(count%50 == 0) { strength = strength * -1; }
		strengthForce.strength(strength);

		bubbles.selectAll("circle")
			.attr('cx', function(d) { return d.x })
			.attr('cy', function(d) { return d.y });
		bubbles.selectAll("text")
			.attr('x', function(d) { return d.x })
			.attr('y', function(d) { return d.y });
		
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
		// off
		prev_button
			.attr("disabled", true)
			.classed("on", false)
			.classed("off", true);
	} else {
		// on
		prev_button
			.attr("disabled", null)
			.classed("on", true)
			.classed("off", false);
	}

	// advance button
	if (counter < (views.length-1)) {
		// on
		adv_button
			.attr("disabled", null)
			.classed("on", true)
			.classed("off", false);
	} else {
		// off
		adv_button
			.attr("disabled", true)
			.classed("on", false)
			.classed("off", true);
	}

}
