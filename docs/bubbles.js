
function add_bubbles() {
	var error = arguments[0],
		data_all = arguments[1];
	
	var scaleFont = d3.scaleLinear()
			.domain([data_all.freq_min, data_all.freq_max])
			.range([16, 80]);
	var scaleRadius = d3.scaleLinear()
			.domain([data_all.freq_min, data_all.freq_max])
			.range([50, 200]);
	
	var counter = 0,
		freq_name = "freq_" + views[counter],
		header_name = view_names[counter],
		prev_button = d3.select("#prev_button button"),
		adv_button = d3.select("#adv_button button");
	
	var strength = -10;
	var strengthForce = d3.forceManyBody().strength(strength);
	var simulation = d3.forceSimulation()
		.force("center", d3.forceCenter(plotwidth / 2, plotheight / 2))
		.force("charge", strengthForce)
		.force('collision', d3.forceCollide().radius(function(d) {
			return scaleRadius(d[freq_name]);
		}))
		.alpha(1)
		.on("tick", ticked);

	var data = data_all[freq_name],
		count = 0,
		strength_tick = strength;

	simulation.nodes(data);
	update_bubbles(data, freq_name);

	// Use buttons
	d3.selectAll('#adv_button').on('click', function() {
		counter = counter + 1;
		freq_name = "freq_" + views[counter],
		header_name = view_names[counter];
		
		data = data_all[freq_name];
		count = 0;
		strength_tick = strength;

		update_bubbles(data, freq_name);
		buttonLogic(counter, prev_button, adv_button);
		
		simulation.nodes(data).alpha(1).restart();

		d3.select("#chart_heading")
			.text(header_name);
	});

	d3.selectAll('#prev_button').on('click', function() {
		counter = counter - 1;
		freq_name = "freq_" + views[counter],
		header_name = view_names[counter];
		
		data = data_all[freq_name];
		count = 0;
		strength_tick = strength;

		update_bubbles(data, freq_name);
		buttonLogic(counter, prev_button, adv_button);
		
		simulation.nodes(data).alpha(1).restart();

		d3.select("#chart_heading")
			.text(header_name);
	});

	// functions:
	
	function update_bubbles (data, freq_name) {

		var bubbles = plotarea
				.selectAll('.bubble')
				.data(data, function(d) { return d.word; }); // join data by key (rather than index)
		
		var bubbles_g = bubbles
				.enter()
				.append("g")
				.attr("class", "bubble");
		
		bubbles_g // enter circles
			.append("circle")
			.style("fill", "#68a0b0")
			.attr('r', 0)
			.call(d3.drag()
					.on("start", dragstarted)
					.on("drag", dragged)
					.on("end", dragended));

		bubbles_g // enter text
			.append("text")
			.text(function(d) { return d.word; })
			.attr("text-anchor", "middle")
			.attr("fill", "#fff")
			.attr('font-size', "0px")
			.call(d3.drag()
					.on("start", dragstarted)
					.on("drag", dragged)
					.on("end", dragended));

		bubbles_g = bubbles_g.merge(bubbles);

		bubbles_g.selectAll("circle")
			.data(data, function(d) { return d.word; })
			.transition().duration(1000)
			.attr('r', function(d) { return scaleRadius(d[freq_name]); });
		bubbles_g.selectAll("text")
			.data(data, function(d) { return d.word; })
			.transition().duration(1000)
			.attr("font-size", function(d) { return scaleFont(d[freq_name])+"px"; });

		// smooth exits
		bubbles
			.exit()
			.selectAll("circle")
			.transition().duration(1000)
			.attr('r', function(d) { return 0; })
			.remove();
		bubbles
			.exit()
			.selectAll("text")
			.transition().duration(1000)
			.attr("font-size", function(d) { return "0px"; })
			.remove();
		bubbles.exit()
			.transition().delay(1000)
			.remove();
	}

	function ticked() {
		count++;
		
		// switch strength between +/- for bounce effect
		if(count%50 == 0) { strength_tick = strength_tick * -1; }
		strengthForce.strength(strength_tick);
		
		plotarea
			.selectAll('.bubble circle')
			// .attr('cx', function(d) { return d.x })
			// .attr('cy', function(d) { return d.y });
			.attr('cx', function(d) { 
				var radius = scaleRadius(d[freq_name]);
				return d.x = Math.max(radius, Math.min(plotwidth - radius, d.x));
			})
			.attr('cy', function(d) { 
				var radius = scaleRadius(d[freq_name]);
				return d.y = Math.max(radius, Math.min(plotheight - radius, d.y)); 
			});
		// this uses the new d.y, and d.x calculated in cy/cx to stay inside the plot boundary
		plotarea
			.selectAll('.bubble text')
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
