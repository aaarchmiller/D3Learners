var dims = {
	svg: {
		width: 900,
		height: 600
	},
	margin: {
		top: 20,
		bottom: 20,
		left: 10,
		right: 300
	}
};
dims['map'] = {
	width: dims.svg.width - dims.margin.left - dims.margin.right,
	height: dims.svg.height - dims.margin.top - dims.margin.bottom,
	xmin: dims.margin.left,
	xmax: dims.svg.width - dims.margin.right,
	ymin: dims.margin.top,
	ymax: dims.svg.height - dims.margin.bottom
};

var svg = d3.select("body").append("svg")
		.attr("id", "chart")
		.attr("width", dims.svg.width)
		.attr("height", dims.svg.height);
var map = svg.append('g')
	.classed('map', true);

// projection
var proj = d3.geoAlbers();
var path = d3.geoPath().projection(proj);

// scales
var colors = d3.scaleOrdinal(d3.schemeCategory20);

var plot = function(params) {
	
	console.log(params.counties);
	
	// update the projection for the new data
	proj.fitExtent([[dims.map.xmin, dims.map.ymin],[dims.map.xmax, dims.map.ymax]], params.counties[params.year]);

	// update the scales to reflect all unique county FIPS codes for this state (over all time)
	var county_fips = [];
	d3.keys(params.counties).map(function(k) {
		var x = params.counties[k].features.map(function(d) {
			return d.properties.COUNTYFP10;
		});
		county_fips = county_fips.concat(x);
	})
	// reduce to unique and sorted codes
	county_fips = d3.map(county_fips, function(d) { return d; }).values().sort();
	// now actually update the scale
	colors.domain(county_fips);
	
	// COUNTY BOUNDARIES
	// bind county data
	var paths = map.selectAll('path.county')
		.data(params.counties[params.year].features, function(d) { return d.properties.COUNTYFP10; } );
	// exit
	console.log('exiting:');
	console.log(paths.exit());
	paths.exit().remove();
	// enter
	paths = paths.enter()
		.append("path")
		.classed('county', true)
		.attr("d", path)
		.merge(paths);
	// update
	paths
		.transition()
		.delay(100)
		.attr("d", path)
		.style("fill", function(d,i) {
			return colors( d.properties.COUNTYFP10 );
		}	);
	
	console.log('data are plotted!');
};

var update = function(year) {
	d3.json("wateruse.json", function(error, wateruse) {
		if (error) throw error;
		console.log('loading data...');
		var q = d3.queue();
		q	.defer(d3.json, "04_1950.geojson")
			.defer(d3.json, "04_1980.geojson")
			.defer(d3.json, "04_2010.geojson")
			.awaitAll(function(error, counties) {
				if(error) throw error;
				console.log('data are loaded! plotting...');
				plot.call(svg, params={
					wateruse: wateruse,
					counties: {
						1950: counties[0],
						1980: counties[1],
						2010: counties[2]
					},
					year: year
				});
			});
	});
};

update(1950);
