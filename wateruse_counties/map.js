var dims = {
	svg: {
		width: 600,
		height: 400,
		viewBox: "-150 -150 600 400" // min-x, min-y, width, height
	},
	margin: {
		top: 20,
		bottom: 20,
		left: 10,
		right: 10
	},
	map: {
		xmin: -150,
		xmax: -80,
		ymin: 30,
		ymax: 50
	}
};
//dims.push({})

var proj = d3.geoAlbers()
	.scale( 3000 )
	.rotate( [110,0] )
	.center( [0,34] )
	.translate( [dims.svg.width/2, dims.svg.height/2] );
var path = d3.geoPath()
	.projection(proj);

var svg = d3.select("body")
	.append("svg")
		.attr("width", dims.svg.width)
		.attr("height", dims.svg.height);

var plot = function(params) {
	var labels = this.selectAll('.county.name')
		.data(params.counties[1].features)
		.enter()
		.append("text")
		.classed("county", true)
		.classed("name", true)
		.attr("y", function(d, i) {
			return 65 + i * 20;
		})
		.text(function(d) {
			return d.properties.NAME.toLowerCase();
		})
		//.style("stroke", "#108EBC")
		.style("fill", "#108EBC")
		.style("shape-rendering", "crispEdges");
	var paths = this.selectAll('.county.path')
		.data(params.counties[1].features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("stroke", "black")
		.style("stroke-width", "2px")
		.style("fill", "none")
		.style("shape-rendering", "crispEdges");
};

var az3 = {},
	wu = {};

d3.json("wateruse.json", function(error, wateruse) {
	if (error) throw error;

	d3.json("AZ_1.geojson", function(error, AZ_1) {
		if(error) throw error;
	d3.json("AZ_2.geojson", function(error, AZ_2) {
		if(error) throw error;
	d3.json("AZ_3.geojson", function(error, AZ_3) {
		if(error) throw error;
		
		az3 = AZ_3;
		wu = wateruse;
		
		d3.json("shpdict.json", function(error, shpdict) {
			if(error) throw error;
			
			plot.call(svg, params={
				wateruse: wateruse,
				counties: [ AZ_1, AZ_2, AZ_3 ],
				shpdict: shpdict
			});
		});
	});
	});
	});
});

//d3.json("https://d3js.org/us-10m.v1.json", function(error, us) {
//  if (error) throw error;

//  svg.append("g")
//      .attr("class", "counties")
//    .selectAll("path")
//    .data(topojson.feature(us, us.objects.counties).features)
//    .enter().append("path")
//      .attr("d", path);

//  svg.append("path")
//      .attr("class", "county-borders")
//      .attr("d", path(topojson.mesh(us, us.objects.counties, function(a, b) { return a !== b; })));
//});
