var w = 940;
var h = 400;
var margin = {
	top: 20,
	right: 50,
	bottom: 60,
	left: 80
};
var chartWidth = w - margin.left - margin.right;
var chartHeight = h - margin.top - margin.bottom;
var color = d3.scaleOrdinal()
	.range(["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"]);

var svg = d3.select('#figure')
	.append('svg')
	.attr('id', 'barchart')
	.attr('width', w)
	.attr('height', h);

var chart = svg.append('g')
	.classed('display', true)
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

//Get JSON Data
d3.json('json/stats.json', function(error, data){
	
	if(error){
		console.log(error);
	}
	
	//Fill in Select
	d3.select('#weeks')
		.on('change', updateBars)
		.selectAll('option')
		.data(d3.keys(data))
		.enter()
		.append('option')
		.attr('value', function(d){
			return d;
		})
		.text(function(d){
			return d;
		});
	
	//Create Scales
	var xScale = d3.scaleBand()
		.domain( data["Week One"].map(function(d){ 
			return d.teamname; 
		}))
    	.range([ 0, chartWidth ])
    	.paddingInner( 0.10 )
		.paddingOuter( 0.10 );
	
	var yScale = d3.scaleLinear()
		.domain([0, 3600])
		.range([chartHeight, 0]);
	
	//Create Gridlines
	function makeYGridlines(){
		return d3.axisLeft(yScale);
	}
	
	chart.append('g')
		.classed('gridlines', true)
		.call(makeYGridlines()
			.ticks(12)
			.tickSize(-chartWidth)
			.tickFormat("")
		)
		.attr('transform', 'translate(0,0)');
		
	//Create Axes
	var xAxis = d3.axisBottom(xScale);
	
	chart.append('g')
		.classed('xAxis', true)
		.attr('transform', 'translate(0,' + chartHeight + ')')
		.call(xAxis)
		.selectAll('text')
		.attr('transform', 'rotate(20)')
		.style("text-anchor", "start");
	
	var yAxis = d3.axisLeft(yScale)
		.tickValues([0, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600]);
	
	chart.append('g')
		.classed('yAxis', true)
		.attr('transform', 'translate(0,0)')
		.call(yAxis);
	
	chart.append('g')
		.classed('yLabel', true)
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', 0 - margin.left + 30)
		.attr('x', 0 - chartHeight + 35)
		.text('Team Scratch Totals by Week')
		
	
	//Create Bars
	chart.selectAll('rect')
		.data(data["Week One"])
		.enter()
		.append('rect')
		.attr('x', function(d, i){
			return xScale(d.teamname);
		})
		.attr('y', function(d){
			return yScale(d.scratchTotal);
		})
		.attr( 'width', xScale.bandwidth() )
		.attr( 'height', function(d){
			return chartHeight - yScale(d.scratchTotal);
		})
		.attr('fill', function(d, i){
			return color(i);
		});
		
	
	//Create Labels
	chart.append('g')
		.classed('barLabels', true)
		.selectAll('text')
		.data(data["Week One"])
		.enter()
		.append('text')
		.text(function(d){
			return d.scratchTotal;
		})
		.attr('x', function(d, i){
			return xScale(d.teamname) + 28;
		})
		.attr('y', function(d){
			return yScale(d.scratchTotal) - 5;
		})
		.attr('font-size', 14)
		.attr('fill', "#000")
		.attr('font-weight', 'bold')
		.attr('text-anchor', 'middle');
		
	
	function updateBars(){
		var selectValue = d3.select('select').property('value');
		var newData = data[selectValue];
		chart.selectAll('rect')
			.data(newData)
			.transition()
			.duration(1000)
			.ease(d3.easeElasticOut)
			.attr('x', function(d){
				return xScale(d.teamname);
			})
			.attr('y', function(d){
				return yScale(d.scratchTotal);
			})
			.attr( 'width', xScale.bandwidth() )
			.attr( 'height', function(d){
				return chartHeight - yScale(d.scratchTotal);
			})
			.attr('fill', function(d, i){
				return color(i);
			});	
		
		chart.selectAll('g.barLabels text')
			.data(newData)
			.transition()
			.duration(1000)
			.ease(d3.easeElasticOut)
			.text(function(d){
				return d.scratchTotal;
			})
			.attr('x', function(d, i){
				return xScale(d.teamname) + 28;
			})
			.attr('y', function(d){
				return yScale(d.scratchTotal) - 5;
			});	
	}
	
});





