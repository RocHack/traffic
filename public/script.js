/*
 * Small extension to the Array object. Thanks to Crescent Fresh
 * from Stackoverflow:
 * http://stackoverflow.com/a/1379556/29291
 */
Array.max = function( array ){
    return Math.max.apply( Math, array );
};

var Traffic = (function() {
    // Some globals we'll need
    var canvas, ctx, ws;

    // Set some constants
    var CLR_PINK = "rgb(237,20,111)";
    var BAR_SIZE = 15;
    var BAR_PADDING = 0;
    var bars = [0,0,0,0,0,0];
    var current = 0;

    /*
     * Run when the window is ready
     */
    var onLoad = function() {
        // Setup the canvas
        canvas = document.getElementById("graph");
        ctx = canvas.getContext("2d");

        // Setup the callback on the button
        var button = document.getElementById("button");
        button.onclick = pressButton;

        // Setup the WebSocket connection
        ws = new WebSocket("ws://"+document.domain+":"+window.location.port+"/", "traffic");
        ws.onmessage = recvPush;
    }

    /*
     * Shifts all bars to the left. Should be called every 10 seconds
     * by the server
     */
    var moveLeft = function() {
        // Shift the array
        bars.pop();
        bars.unshift(0);
        
        // Re-render the histogram
        renderBars();

        // Update current
        var now = parseInt(timestamp() / 10) * 10;
        current = now;
    }

    /*
     * Just a shorthand for generating UNIX timestamps
     */
    var timestamp = function() {
        return Math.round((new Date()).getTime() / 1000);
    }

    /*
     * Generates a bar on the canvas.
     * x is NOT in pixels, it's in bar units.
     * height IS in pixels.
     */
    var generateBar = function(x, height) {
        var x_pos = canvas.width - ((x + 1) * BAR_SIZE - (x !=0 ? x * BAR_PADDING : 0));

        ctx.fillStyle = CLR_PINK;
        ctx.fillRect(x_pos, canvas.height - height, BAR_SIZE, height);
    }

    /*
     * Clears the canvas (hurr)
     */
    var clearCanvas = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    var renderBars = function() {
        var max, height;
        clearCanvas();
        // Find the maximum value
        max = Array.max(bars);

        for(var i in bars) {
            // If the max is greater than 100, map all
            // other values relative to max
            if(max > 100)
                height = 100 * (bars[i] / max);
            else
                height = bars[i];

            generateBar(parseInt(i), height);
        }
    }

    /*
     * Callback function for when the button has been pressed
     */
    var pressButton = function() {
        ws.send(JSON.stringify({
            a: "push"
        }));
    }

    /*
     * Run every time the server sends a new click
     */
    var newClick = function() {
        var now = parseInt(timestamp() / 10) * 10;

        bars[0] += 1;

        renderBars();
    }

    /*
     * Callback when the websocket receives 
     */
    var recvPush = function(msg) {
        var data = JSON.parse(msg.data);

        if(data.a == "push") newClick();
        else if(data.a == "shift") moveLeft();
    }

    return {
        onLoad: onLoad,
    }
})();

window.onload = Traffic.onLoad;
