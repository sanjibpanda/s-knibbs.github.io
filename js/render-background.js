'use strict';

/**
 * Implement the modulo operator since '%' is the remainder operator in JavaScript.
 */
Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
}

/**
 * Calculate the next population using the given rules.
 *
 * @param in_plane UInt8Array of the source population.
 * @param out_plane UInt8Array to store the resulting population.
 * @param rules Generation rules for the next population.
 * @param width Integer width of the grid.
 * @param height Integer height of the grid.
 */
function cellularAutomata(in_plane, out_plane, rules, width, height) {
    for (var x = 0; x < width; x++)
    {
        for (var y = 0; y < height; y++)
        {
            var neighbours = 0;
            for (var xn = -1; xn <= 1; xn++)
            {
                for (var yn = -1; yn <= 1; yn++)
                {
                    if (xn == 0 && yn == 0) continue;
                    neighbours += in_plane[(x + xn).mod(width) + width * (y + yn).mod(height)];
                }
            }
            out_plane[x + width * y] = rules[in_plane[x + width * y]][neighbours]
        }
    }
}

/**
 * Run conway's game of life for a given number of epochs.
 *
 * @param width Integer width of the grid.
 * @param height Integer height of the grid.
 * @param epochs Integer number of epochs to run for.
 *
 * @return Returns the generated population as a UInt8Array.
 */
function conwayGOL(width, height, epochs) {
    var length = width * height;
    var plane = new Uint8Array(length);
    var next_plane = new Uint8Array(length);
    var tmp;

    // Rules in the format [born, survives].
    var conway_rules = [[0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0, 0, 0, 0]];

    // Populate the plane randomly inititally, ~60% fill.
    for (var i = 0; i < length; i++)
    {
        if (Math.random() > 0.80)
        {
            plane[i] = 1;
        }
    }

    for (var i = 0; i < epochs; i++)
    {
        cellularAutomata(plane, next_plane, conway_rules, width, height);

        // Swap array references.
        tmp = next_plane;
        next_plane = plane;
        plane = tmp;
    }

    // Generate a border around all 'alive' cells.
    var dilate_rules = [[0, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1]];
    cellularAutomata(plane, next_plane, dilate_rules, width, height);

    for (var i = 0; i < length; i++)
    {
        plane[i] = plane[i] + next_plane[i];
    }

    return plane;
}

/**
 * Top level function. Draws the grid of cells onto an offscreen canvas
 * and applies the canvas image data to the background image.
 */
function drawGrid() {
  var canvas = document.getElementById('background-canvas');

  // Set the width and height of the banner image dimensions to match the canvas dimensions.
  // This assumes the canvas has no margin or padding.
  var banner_img = $('.banner-image');
  var style = getComputedStyle(banner_img[0]);
  var width = canvas.width = parseInt(style.width);
  var height = canvas.height = parseInt(style.height);

  if (canvas.getContext)
  {
    var ctx = canvas.getContext('2d');
    var radius = 13;
    var step = 30;

    var grid_width = parseInt(width / step);
    var grid_height = Math.ceil(height / step);
    var plane = conwayGOL(grid_width, grid_height, 4);

    // Fill styles for the different cell states
    var fill_styles = ["#f3f3f3", "#d6efe3", "#b4bade"];

    // xr and yr in canvas coordinates.
    for (var x = 0, xr = 0; x < grid_width; x++, xr += step)
    {
      for (var y = 0, yr = 0; y < grid_height; y++, yr += step)
      {

        ctx.fillStyle = fill_styles[plane[x + y * grid_width]];
        ctx.beginPath();
        ctx.moveTo(xr, yr);
        ctx.arc(xr - radius, yr, radius, 0, Math.PI * 2,true);
        ctx.fill();
      }
    }

    var gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#f3f3f3");
    gradient.addColorStop(0.4, "rgba(255,255,255,0)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0)");
    gradient.addColorStop(1, "#f3f3f3");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Set the background image of the
    var url = canvas.toDataURL();
    banner_img.css('background-image', 'url(' + url + ')');
  }
}

$(document).ready(drawGrid);

// Regenerate the background on window resize to avoid image resizing.
$(window).resize(drawGrid);
