//
// Grid
//

DC.Grid = function() {

    this.grid_size = Math.floor(DC.Node.SIZE / 2);
    this.min_w = this.grid_size;
    this.min_h = this.grid_size;
    this.max_w = $('#topology-box').width() - this.grid_size;
    this.max_h = $('#topology-box').height() - this.grid_size;

    this.grids = {
	quadrant1 : [],
	quadrant2 : [],
	quadrant3 : [],
	quadrant4 : [],
    };

    this.now_quadrant = 0;

    this.init();

};

DC.Grid.prototype = {
    
    constructor: DC.Grid,

    init: function() {

	var center_w = Math.floor(this.max_w / 2);
	var center_h = Math.floor(this.max_h / 2);

	for (var w = this.min_w; w < this.max_w; w += this.grid_size) {
	    for (var h = this.min_h; h <= this.max_h; h += this.grid_size) {

		var d = { use: false, x: w, y: h };
		if (w > center_w & h <= center_h) {
		    this.grids.quadrant1.push(d);
		} else if ( w <= center_w & h <= center_h) {
		    this.grids.quadrant2.push(d);
		} else if ( w <= center_w & h > center_h) {
		    this.grids.quadrant3.push(d);
		} else if ( w > center_w & h > center_h) {
		    this.grids.quadrant4.push(d);
		}
	    }
	}

	// for debug
//	var topo_w = $('#topology-box').width();
//	var topo_h = $('#topology-box').height();
//	var svg = '<svg width="' + topo_w + '" height="' + topo_h + '6">';
//	var color = "red";
//
//	$.each(this.grids, function(quad, array) {
//	    console.log("@@@ " + quad);
//	    if (quad === "quadrant1") {
//		color = "blue";
//	    } else if (quad === "quadrant2") {
//		color = "red";
//	    } else if (quad === "quadrant3") {
//		color = "green";
//	    } else if (quad === "quadrant4") {
//		color = "black";
//	    }
//	    $.each(array, function(i, data) {
//		svg += '<circle cx="' + data.x + '" cy="' + data.y +
//			    '" r="3" fill="' + color + '" />';
//	    });
//	});
//	svg += '</svg>';
//	$('#topology-box').append(svg);
    },

    getNextEmptyCell: function() {

	if (this.now_quadrant == 4) {
	    this.now_quadrant = 0;
	}
	this.now_quadrant += 1;

	var data;
	if (this.now_quadrant == 1) {
	    console.log("quadrant1");
	    data = this.findEmptyCell(this.grids.quadrant1);
	} else if (this.now_quadrant == 2) {
	    console.log("quadrant2");
	    data = this.findEmptyCell(this.grids.quadrant2);
	} else if (this.now_quadrant == 3) {
	    console.log("quadrant3");
	    data = this.findEmptyCell(this.grids.quadrant3);
	} else if (this.now_quadrant == 4) {
	    console.log("quadrant4");
	    data = this.findEmptyCell(this.grids.quadrant4);
	}
	return data;
    },

    findEmptyCell: function(quad) {

	var data = undefined;
	var count = 50;
	while (count--) {
	    var index = Math.floor(Math.random() * (quad.length - 1)) + 1;
	    if (index >= quad.length) continue;
	    data = quad[index];
	    if (data.use == false) {
		data.use = true;
		return data;
	    }
	}

	return data;
    },
};

