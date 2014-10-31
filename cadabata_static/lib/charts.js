(function($, block) {


/**
 * Check if we should show a specific series belonging to a block
 * based on the checked status of a checkbox.
 * @param string    the jQuery identifier as given to the block() function
 * @param string    the identifier of the series as passed to block()
 * @return boolean  whether to show the series or not
 */
function show_series(blck, series) {
    var el = '#'+blck+'_'+series+':checkbox';
    if ($(el).length == 0) {
        console.log('Error! Checkbox for block '+blck+' with series '+series+' doesn\'t exist.');
        return true;
    }
    return $(el)[0].checked
}


// a rolling chart with memory. This isn't simple anymore: it's adapted to our needs.
block.fn.rolling_chart = function(config) {

    // combine default configuration with user configuration
    var options = $.extend({
        memory: 100,
        debug: false,
        ignoreIrrelevantTweets: false,
	// required!!
        series: {
            'default': {data: []}
        },
	// flot initialization options
        options: {
            xaxis: {
                mode: 'time'//show: false/*iiupdate:timeaxis*/
            }
        }
    }, config);
    
    // block id
    var eid = this.$element.attr('id');

    // maintain state for this block
    var data = {};
    for(var k in options.series) {
        data[k] = (options.series[k].data || []).slice();
    }

    // function to project our state to something the library understands
    var prepare_data = function() {
        var result = [];

        // process each series
        for(var k in data) {
            var series = data[k];
            var points = [];
            
            // continue if the user doesn't want to show the series.
            if (!show_series(eid, k)) { continue; }

            // create point pairs and gap values
            for(var i in series) {
                points.push(series[i]); // format of series[i]: [timestamp, value]
            }

            // combine state data with series configuration by user
            result.push($.extend(options.series[k], {data: points}));
        }

        return result;
    };
    
    // function to update the plot (used in several places in this file)
    var updatePlot = function() {
        plot.setData(prepare_data());
        plot.setupGrid();
        plot.draw();
    };
    
    // Build checkboxes for choices.
    if (options.$choices) {
    
        for (var k in options.series) {
            var id = eid + '_' + k;
            options.$choices.find('div')
              .prepend('<br />')
              .prepend(
                $('<label />',{
                  'for': id})
                  .append(
                    $('<input />',{
                      type: 'checkbox',
                      name: id,
                      id: id,
                      checked: 'checked'}))
                    .click(updatePlot)
                  .append(' '+options.series[k].label));
        }
    }

    // initial setup of library state (also builds necessary HTML)
    var plot = $.plot(this.$element, prepare_data(), options.options);


    // register actions for this block
    this.actions({
        'add': function(e, message) {
        
            // Break if not the right series (if wanted)
            if (options.ignoreIrrelevantTweets) {
                var stay = false;
                for (var k in options.series) {
                    if (message.series == k) stay = true;
                }
                if (!stay) return;
            }
            
            message.values = {};
            var newdata = {};
            for (var k in options.series) {
                message.values[k] = message.series == k ? message.value : 0;
            }
            
            if (options.debug) { console.log("\n",message.values); }
            
            // update all series
            for(var k in options.series) {
                // roll memory
                if(data[k].length > options.memory) {
                    data[k] = data[k].slice(1);
                }
                
                var previous_point = data[k][data[k].length-1];
                var previous_value = previous_point == null ? null : previous_point[1];
                
                newdata[k] = previous_value + message.values[k];
                var p = message.values['positive'],
                    n = message.values['negative'],
                    a = message.values['alert'];
                // overwrite newdata[k] if we're dealing with an exceptional series
                if (k == 'pos_neg') {
                    newdata[k] =  p - n + previous_value;
                }
                if (k == 'pos_neg_alr') {
                    newdata[k] = p - n - a + previous_value;
                }
                
                if (options.debug) { console.log(k,data[k],previous_point,message.values[k],newdata[k]); }
                
                // insert value or gap
                var timestamp = (new Date(message.time)).getTime();
                data[k].push(newdata[k] != null ? [timestamp, newdata[k]] : null);
            }
            
            //if (options.debug) { console.log(message.values); }
            
            // update HTML
            updatePlot();
        }
    });

    // return element to allow further work
    return this.$element;
}







// We didn't modify anything below this line.




//
//
//

// a simple linechart example
block.fn.linechart = function(config) {
    var options = $.extend({
	// required
        series : {default:{}},
	// flot initialization options
        options : {}
    }, config);

    // create empty linechart with parameter options
    var plot = $.plot(this.$element, [],options.options);

    // dict containing the labels and values
    var linedata_series = {};
    var linedata_first;

    var initline = function(series) {
	linedata_first = undefined;
	for(var k in series) {
	   var si = series[k];
	   si.data = [];
	   linedata_series[k] = si;
	   if ( linedata_first == undefined )
	       linedata_first = si;
	}
    }

    initline(options.series);

    var addline = function(label, values) {
    	var data;

	if (linedata_series.hasOwnProperty(label))
		data = linedata_series[label].data;
	else
		data = linedata_first.data;
	for(var v in values) {
		data.push(values[v]);
	}
	redraw();
    }

    var setline = function(label, values) {
	if (linedata_series.hasOwnProperty(label))
		linedata_series[label].data = values;
	else
		linedata_first.data = values;
	redraw();
    }

    var redraw = function() {
        var result = [];
    	for(var k in linedata_series) {
	    if (linedata_series.hasOwnProperty(k)) {
	    	var line_serie = linedata_series[k];

 		result.push({label:k,data:line_serie.data});
	    }
	}
        plot.setData(result);
	plot.setupGrid();
        plot.draw();
    }

    var reset = function() {
	initline(options.series);
    }

    this.actions({
        'set': function(e, message) {
	    setline(message.series, message.value);
        },
        'add': function(e, message) {
	    addline(message.series, message.value);
        },
        'reset': function(e, message) {
	    reset();
	}
    });
    // return element to allow further work
    return this.$element;
}

//
//
//

// a simple barchart example
block.fn.barchart = function(config) {
    var options = $.extend({
        filter_function : function(category,val,max) { return true; },
	// required
    	series : { "default":{
        	data: {},
        	label: "default",
        	bars: {
                	show: true,
                	barWidth: 0.2,
                	align: "left"
            	}
       	 
    	} },
	// flot initialization options
	options: { xaxis: {
                mode: "categories",
                tickLength: 0
            }}

    }, config);

    var bardata_series = options.series;
    var bardata_first;

    for (bardata_first in bardata_series) break;

    var translate_bar = function() {
        var result = [];
        for(var k in bardata_series) {
            if (bardata_series.hasOwnProperty(k)) {
                var newserie = jQuery.extend({}, bardata_series[k]);
                var newdata = [];
                var data = newserie.data;
                var max = 0;

                for(var l in data) {
                    if (data.hasOwnProperty(l)) {
                        max = Math.max(max, data[l]);
                    }
                }

                for(var l in data) {
                    if (data.hasOwnProperty(l)) {
                        if ( options.filter_function(l,data[l],max) )
                            newdata.push([l,data[l]]);
                    }
                }
                newserie.data = newdata;
                result.push(newserie);
            }
        }
        return result;
    }

    var plot = $.plot(this.$element, translate_bar(), options.options);

    var addbar = function(serie_label, category, value) {
    	var data;

        if ( serie_label == undefined )
            data = bardata_series[bardata_first].data;
        else 
            data = bardata_series[serie_label].data;
        if (data.hasOwnProperty(category))
            data[category] = (data[category] + value);
        else
            data[category] = value;
        redraw();
    }

    var setbar = function(serie_label, category, value) {
    	var data;

    	if ( serie_label == undefined )
            data = bardata_series[bardata_first].data;
        else 
            data = bardata_series[serie_label].data;
        data[category] = value;
        redraw();
    }

    var redraw = function() {
        plot.setData(translate_bar());
        plot.setupGrid();
        plot.draw();
    }

    var reset = function() {
        for(var k in bardata_series) {
            if (bardata_series.hasOwnProperty(k)) {
            bardata_series[k].data = {};
            }
        }
    }

    this.actions({
        'set': function(e, message) {
            setbar(message.series,message.value[0],message.value[1]);
        },
        'add': function(e, message) {
            addbar(message.series,message.value[0],message.value[1]);
        },
        'reset': function(e, message) {
            reset();
        }
    });
    // return element to allow further work
    return this.$element;
}

//
//
//

// a simple piechart example
block.fn.piechart = function(config) {
    var options = $.extend({
    	// see: http://www.flotcharts.org/flot/examples/series-pie/
        filter_function : function(category,val,max) { return true; },
        options : {
		series: {	
			pie: {
                		show: true
        		}
    		},
		// demo crashes with this option
		// legend: { show: false }
    }}, config);

    // create empty piechart with parameter options
    var plot = $.plot(this.$element, [],options.options);

    // dict containing the labels and values
    var piedata_dict = {};

    var addpie = function(label, value) {
	if (piedata_dict.hasOwnProperty(label))
		piedata_dict[label] = (piedata_dict[label] + value);
	else
		piedata_dict[label] = value;
	redraw();
    }

    var setpie = function(label, value) {
	piedata_dict[label] = value;
	redraw();
    }

    var redraw = function() {
        var result = [];
	var max = 0;

	for(var k in piedata_dict) {
	    if (piedata_dict.hasOwnProperty(k)) {
                max = Math.max(max, piedata_dict[k]);
	    }
	}
	for(var k in piedata_dict) {
	    if (piedata_dict.hasOwnProperty(k)) {
		if ( options.filter_function(k,piedata_dict[k],max) )
 		    result.push({label:k,data:piedata_dict[k]});
	    }
	}
        plot.setData(result);
        plot.draw();
    }

    var reset = function() {
	piedata_dict = {};
    }

    this.actions({
        'set': function(e, message) {
	    setpie(message.value[0],message.value[1]);
        },
        'add': function(e, message) {
	    addpie(message.value[0],message.value[1]);
        },
        'reset': function(e, message) {
	    reset();
	}
    });
    // return element to allow further work
    return this.$element;
}

})(jQuery, block);
