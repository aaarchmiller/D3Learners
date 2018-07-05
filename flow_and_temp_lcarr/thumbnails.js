//this program takes an svg figure and creates appropriately sized thumbnails for various social media platforms

//to use it, first define filepaths to local assets, enter the path to the css file, and set up the figure generation
//in the headless browser. Then run the program using 'node thumbnails.js <optional flag for external styling:
// -css (path to css)>

var fs = require('fs');
var jsdom = require('jsdom/lib/old-api.js');
var svg2png = require('svg2png');

var style_ext = null;
var args = process.argv.splice(process.execArgv.length + 2);

var css_path;

if (args.length > 2) {
    console.log('\nUsage: node thumbnail.js ' +
        '\n\nOptional flag: -css path/to/css/file.css\n');
    process.exit();
} else {
    if (args[0]) {
        if (args[0] === '-css') {
            try {
                style_ext = fs.readFileSync(args[1], 'utf8');
            } catch(error) {
                console.log('\nError: external css file path not found. - Using only default style.\n\n' + error);
                style_ext = null;
            }
        } else {
            console.log('\nUnrecognized argument: ' + args[0]);
            console.log('\nUsage: node thumbnail.js ' +
                '\n\nOptional flag: -css path/to/css/file.css\n');
            process.exit();
        }
    }
}

jsdom.env(

    // create DOM hook
    "<html><body><div id='svg'></div>" +
    "</body></html>",

    [
        './abc.js',
        'https://d3js.org/d3.v4.min.js'
    ],

    css_path = './dynamic.css',


    function (err, window) {

        //TODO
        //set up the figure as it is done in the viz
        var figure = window.fig(
            {

            }
        );
        convert(figure, window, css_path);
}
);

function convert(figure, window, css_path) {


    var svg_string = null;

    //TODO
    //if we have set up a figure, use it to generate thumbnails
        var style_ext = null;
        svg_string = null;
        //grab the svg from the figure here
        //var svg = figure.get_svg_elem().node();
        window.fig();
        var svg = window.get_svg_elem().node();
        var style_default = fs.readFileSync(css_path, 'utf8');
        //initialize the figure here
        //figure.init();
        svg_string = inject_style(style_default, style_ext, svg, window);


    //otherwise use default data


    svg2png(svg_string, {height: 512, width: 1024})
        .then(buffer => fs.writeFile('./twitter.png', buffer))
        .then(console.log('\nTwitter thumbnail created. \n'))
        .catch(e => console.error(e));

    svg2png(svg_string, {height: 628, width: 1200})
        .then(buffer => fs.writeFile('./facebook.png', buffer))
        .then(console.log('\nFacebook thumbnail created. \n'))
        .catch(e => console.error(e));

    svg2png(svg_string, {height: 1080, width: 1080})
        .then(buffer => fs.writeFile('./default.png', buffer))
        .then(console.log('\nDefault thhumbnail created. \n'))
        .catch(e => console.error(e));
}

function inject_style(style_string, ext_style, svgDomElement, window) {
    var s = window.document.createElement('style');
    s.setAttribute('type', 'text/css');
    s.innerHTML = "<![CDATA[\n" + style_string + ext_style + "\n]]>";
    var defs = window.document.createElement('defs');
    defs.appendChild(s);
    svgDomElement.insertBefore(defs, svgDomElement.firstChild);
    return svgDomElement.parentElement.innerHTML;
}