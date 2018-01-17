var width = 767;
var height = 400;

//Projection
var projection = d3.geoAlbers()
	.translate([0,0]);

//Path
var path = d3.geoPath(projection);


var svg = d3.select('#map')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

d3.select('#legend')
	.append('p').text('Batting Averages by Stadium');

var legendSVG = d3.select('#legend')
	.append('svg')
	.attr('width', 400)
	.attr('height', 40);

var legendSquareSize = 80;

var zoom_map = d3.zoom()
	.scaleExtent([1, 5.0])
	.translateExtent([
		[-400, -400], //top left corner
		[400, 400] //bottom right corner
	])
	.on('zoom', function(){
	
		var offset = [
			d3.event.transform.x, 
			d3.event.transform.y
		];

		var scale = d3.event.transform.k * 850;

		projection.translate(offset)
			.scale(scale);

		svg.selectAll('path')
			.attr('d', path);

		svg.selectAll('circle')
			.attr('cx', function(d){
				return projection([d.lon, d.lat])[0];
			})
			.attr('cy', function(d){
				return projection([d.lon, d.lat])[1];
			});
});

var map = svg.append('g')
	.attr('id', 'map')
	.call(zoom_map)
	.call(
		zoom_map.transform,
		d3.zoomIdentity
			.translate(width / 2, height /2)
			.scale(1)
	);

map.append('rect')
	.attr('x', 0)
	.attr('y', 0)
	.attr('width', width)
	.attr('height', height)
	.attr('opacity', 0);

var color = d3.scaleLinear()
	.domain([5, 10, 20, 30, 40])
	.range(["#0454AE", "#15ABDD", "#5BA049", "#FF8833", "#D6202A"])

d3.json('json/map.json', function(mapError, mapData){
	
	if(mapError){
		console.log(mapError);
	}
	
	d3.json('json/app.json', function(appError, appData){
		
		if(appError){
			console.log(appError);
		}
		
		var stadiums = appData.stadiums;
		
		//Loop through array of stadiums
		$.each(stadiums, function(key, info){
			
			//Fill in year selection with options
			d3.select('#yearSelect')
				.on('change', updatePlayers)
				.selectAll('option')
				.data(d3.keys(info.years).reverse())
				.enter()
				.append('option')
				.attr('value', function(d){
					return d;
				})
				.text(function(d){
					return d;
				});

			var yearSelectValue = d3.select('#yearSelect').property('value');

			//Fill in player select with options
			d3.select('#playerSelect')
				.on('change', updatePlayers)
				.selectAll('option')
				.data(d3.keys(info.years[yearSelectValue]))
				.enter()
				.append('option')
				.attr('value', function(d){
					return d;
				})
				.text(function(d){
					return d;
				});

			var playerSelectValue = d3.select('#playerSelect').property('value');
			
			//Create Map
			map.selectAll('path')
				.data(mapData.features)
				.enter()
				.append('path')
				.attr('d', path)
				.attr('fill', '#eef0ef')
				.attr('stroke', 'rgb(190,190,190)')
				.attr('stroke-width', 1);
			
			//Draw Cities
			map.selectAll('circle')
				.data(appData.stadiums)
				.enter()
				.append('circle')
				.classed('stadium', true)
				.attr('cx', function(d){
					return projection([d.lon, d.lat])[0];
				})
				.attr('cy', function(d){
					return projection([d.lon, d.lat])[1];
				})
				.attr('r', function(d){
					var radius = d.years[yearSelectValue][playerSelectValue] * 100;
					return findRadius(radius);
				})
				.style('fill', function(d){
					var radius = d.years[yearSelectValue][playerSelectValue] * 100;
					return color(findRadius(radius));
				})
				.style('opacity', 0.8)
				.style('cursor', 'pointer')
				.text(function(d){
					return d.years[yearSelectValue][playerSelectValue];
				})
				.attr('font-size', '14px')
				.attr('font-weight', 'bold')
				.attr('fill', '#000')
				.on('mouseover', function(d){
				
					//set stadium name
					d3.select('.mapTooltip h3').text(function(){
						return d.name;
					});

					//set location
					d3.select('.mapTooltip .location').text(function(){
						return d.location;
					});

					//set teamname
					d3.select('.mapTooltip .teamName').text(function(){
						return d.teamName;
					});

					//set capacity
					d3.select('.mapTooltip .capacity').text(function(){
						return d.capicity;
					});
				
					//Set batting Average
					d3.select('.mapTooltip .battingAverage').text(function(){
						return setbattingAverage(d);
					});

					d3.select(".mapTooltip")
						.style("display", "block")
						.style("left", function() { // stop tooltip from being cutoff at right of page
						  var right_edge = d3.event.pageX + this.offsetWidth; //this.offsetWidth == width of tooltip
						  if (right_edge > width) {
							return (d3.event.pageX - this.offsetWidth)+"px";
						  }
						  return (d3.event.pageX)+"px";
						})
						.style("top", function() { // stop tooltip from being cutoff at bottom of page
						  var bottom_edge = d3.event.pageY + this.offsetHeight; //this.offsetHeight == height of tooltip
						  if (bottom_edge > height) {
							return (d3.event.pageY - this.offsetHeight)+"px";
						  }
						  return (d3.event.pageY)+"px";
						});
			})
			.on("mouseout", function() {
			  d3.select(".mapTooltip").style("display", "none");
			});
			
			//Create Legend
			var legend = legendSVG.selectAll('.legendKey')
				.data(color.domain())
				.enter()
				.append('g')
				.classed('legendKey', true)
				.attr('transform', function(d, i){
					var width = legendSquareSize;
					var horz = i * width;
					return 'translate(' + horz + ',5)';
				});
				
			legend.append('rect')
				.attr('width', legendSquareSize)
				.attr('height', 10)
				.style('fill', color);
			
			legend.append('text')
				.attr('x', 20)
				.attr('y', 25)
				.style("text-align", "center")
				.style("font-size", ".8em")
				.text(function(d){
					if(d === 5){
						return '< .250'
					}
					if(d === 10){
						return '< .300'
					}
					if(d === 20){
						return '< .400'
					}
					if(d === 30){
						return '< .700'
					}
					if(d === 40){
						return '> .700'
					}
				});
			
			function findRadius(radius){
				if(radius >= 0 && radius < 25){
					return 5;
				}else if(radius >= 25 && radius < 30){
					return 10;	 
				}else if(radius >= 30 && radius < 40){
					return 20;
				}else if(radius >= 40 && radius < 70){
					return 30;
				}else{
					return 40;
				}
			}
			
			function setbattingAverage(d){
				var newYearSelection = d3.select('#yearSelect').property('value');
				var newPlayerSeelction = d3.select('#playerSelect').property('value');
				return d.years[newYearSelection][newPlayerSeelction];
			}

			function playerInfo(player){

				//Set Image
				var playerImage = player.split(' ')[1] + '.png';
				$('#playerPicture > img').remove();
				$('#playerPicture').append('<img src="img/' + playerImage + '"/>');

				//Set playerInfo Name
				d3.select('#playerInfo .name').text(function(){
					return player;
				});

				//Set Player Age
				var age = appData.players[player].age;
				$('#playerInfo .age').text(age);

				//Set Player Number
				var number = appData.players[player].number;
				$('#playerInfo .number').text(number);

				//Set Player Position
				var position = appData.players[player].position;
				$('#playerInfo .position').text(position);

				//Set Players Bats
				var bats = appData.players[player].bats;
				$('#playerInfo .bats').text(bats);

				//Set Players Throws
				var throws = appData.players[player].throws;
				$('#playerInfo .throws').text(throws);

				//Set Players Height
				var height = appData.players[player].height;
				$('#playerInfo .height').text(height);

				//Set Players Weight
				var weight = appData.players[player].weight;
				$('#playerInfo .weight').text(weight);
			}

			//Fill out PlayerInfo Area
			playerInfo(playerSelectValue);	

			//Updates the playerInfo area when playerSelectValue has changed
			function updatePlayers(){

				//Find out new player selected
				var newPlayerSelectValue = d3.select('#playerSelect').property('value');
				var newYearSelectValue = d3.select('#yearSelect').property('value');
				
				//Update Stadium Circles
				map.selectAll('circle')
					.transition()
					.duration(1000)
					.ease(d3.easeQuad)
					.attr('r', function(d){
						var radius = d.years[newYearSelectValue][newPlayerSelectValue] * 100;
						return findRadius(radius);
					})
					.style('fill', function(d){
						var radius = d.years[newYearSelectValue][newPlayerSelectValue] * 100;
						return color(findRadius(radius));
					});

				//Update PlayerInfo Area
				playerInfo(newPlayerSelectValue);	
			}
			
		});//Each ending
		
	});//App JSON
		
});//Map JSON

d3.selectAll('#zoomButtons button.zoom').on('click', function(){
	
	var scale = 1;
	var direction = d3.select(this).attr('class').replace('zoom ', '');
	
	if(direction === "in"){
		scale = 1.25;
	}else if( direction === "out"){
		scale = 0.75;
	}
	
	map.transition()
		.call(zoom_map.scaleBy, scale);
	
});




