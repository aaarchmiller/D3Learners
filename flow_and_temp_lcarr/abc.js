var fig = function(options) {
// setup
    var h = 500;
    var w = 800;
    var margin = {
        top: 60,
        bottom: 80,
        left: 80,
        right: 80
    };
    var plotwidth = w - margin.left - margin.right;
    var plotheight = h - margin.top - margin.bottom;

// create an svg element
    var svg = d3.select("body")
        .append("svg")
        .attr("id", "plotarea") // id == #plot in css, class == .plot in css
        .attr("width", w)
        .attr("height", h);

    var plotarea = svg.append("g")
        .classed("plot", true)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    function plot(params) {

        // remove existing axes and plot elements before adding to the making the new plot
        var plotDetails = this.selectAll("#axesDetails, #hydrographLine, #allFlowPoints");
        plotDetails.remove();

        if (d3.select("#wtemp_checkbox").property("checked")) {
            plotData = filterData(params.data, "Wtemp");
            y_axis_label = "Water temperature, deg C";
            dataName = "Water temp";
            dataUnits = "deg C";
        } else {
            plotData = filterData(params.data, "Flow");
            y_axis_label = "Flow, cfs";
            dataName = "Flow";
            dataUnits = "cfs";
        }

        // setup x and y scales/axes fxns
        var extent_q = d3.extent(plotData, function (d) {
            return d.dataCol;
        })
        var extent_date = d3.extent(plotData, function (d) {
            return d.Date;
        })

        var xScale = d3.scaleTime()
            .domain(extent_date)
            .range([0, plotwidth]);
        var yScale = d3.scaleLinear()
            .domain(extent_q)
            .range([plotheight, 0]);

        var xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat("%m/%d"));
        var yAxis = d3.axisLeft(yScale);

        var drawLine = d3.line()
            .x(function (d) {
                return xScale(d.Date);
            })
            .y(function (d) {
                return yScale(d.dataCol);
            })
            .curve(d3.curveCardinal);

        // add axes
        var axesDetails = this.append("g")
            .attr("id", "axesDetails");
        axesDetails.append("g")
            .attr("id", "xAxis")
            .attr("transform", "translate(" + 0 + "," + plotheight + ")")
            .classed("axis", true)
            .call(xAxis);
        axesDetails.append("text")
            .attr("transform", "translate(" + 0 + "," + (plotheight + 50) + ")")
            .attr("x", plotwidth / 2)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .text("Date");
        axesDetails.append("g")
            .attr("id", "yAxis")
            .classed("axis", true)
            .call(yAxis);
        axesDetails.append("text")
            .attr("transform", "translate(" + -50 + "," + plotheight / 2 + ")" + "rotate(270)")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .text(y_axis_label);

        // add hydrograph line
        var hydrographLine = this.append("g")
            .attr("id", "hydrographLine");
        hydrographLine.append("path")
            .datum(plotData) // don't need .enter() b/c binding data to one element
            .attr("d", drawLine)
            .classed("flowLine", true);

        // add points for tooltips
        // create group for points
        var flowPoint_g = this.append("g")
            .attr("id", "allFlowPoints");

        // add points to the group
        flowPoint_g.selectAll("flowPoint")
            .data(plotData)
            .enter()
            .append("circle")
            .classed("flowPoint", true)
            .attr("cx", function (d) {
                return xScale(d.Date);
            })
            .attr("cy", function (d) {
                return yScale(d.dataCol);
            })
            .attr("r", 3);

        // add transparent points to make radius where cursor initiates tooltip larger
        flowPoint_g.selectAll("flowPointMouse")
            .data(plotData)
            .enter()
            .append("circle")
            .classed("flowPointMouse", true)
            .attr("cx", function (d) {
                return xScale(d.Date);
            })
            .attr("cy", function (d) {
                return yScale(d.dataCol);
            })
            .attr("r", 10)
            .attr("fill", "transparent");

        // add tools tips for points
        flowPoint_g.selectAll(".flowPointMouse")
            .on("mouseover", function (d) {

                // determine location of mouse
                var x_val = d3.event.pageX; //xScale(d.Date); //
                var y_val = d3.event.pageY; //yScale(d.Flow); //

                // add text element
                d3.select("#tooltip")
                    .style("display", "block")
                    .style("left", x_val + "px")
                    .style("top", y_val + "px")
                    .select("#dataValue").text(d.dataCol);
                d3.select("#tooltip")
                    .select("#dataName").text(dataName);
                d3.select("#tooltip")
                    .select("#dataUnits").text(dataUnits);
            })
            .on("mouseout", function (d, i) {
                d3.selectAll("#tooltip").style("display", "none");//.remove();
            });

    }

    function filterData(data, data_col) {
        var new_data = data.map(function (d) {
            return {
                Date: d.Date,
                dataCol: d[[data_col]]
            };
        });
        return new_data;
    }

    d3.csv("flow_temp.csv", function (site_data) {
        site_data.forEach(function (d) {
            d.Flow = +d.Flow;
            d.Wtemp = +d.Wtemp;
            d.Date = d3.timeParse("%Y-%m-%d %H:%M:%S")(d.dateTime);
        });
        //var site_data_selected = filterData(site_data, "Flow");
        //console.log(site_data_selected);
        plot.call(plotarea,
            {
                data: site_data
            });
        d3.select("#wtemp_checkbox").on("change", function (d) {
            plot.call(plotarea,
                {
                    data: site_data
                });
        });
    })

};

self.get_svg_elem = function () {
    return d3.select("plotarea");
};
fig();

