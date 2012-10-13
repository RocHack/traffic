var WebSocketServer = require("websocket").server;
var express = require("express");

var app = express();

/*
 * Set up HTML serving
 */
app.get("/", function(req, res) {
    res.render("index.ejs");
});
app.use(express.static(__dirname + '/public'));

var srv = app.listen(3000);

console.log("Ready!");

/*
 * Websocket time!
 */

// Initialize an array to hold all connections
var connections = [];

// Create the server
ws = new WebSocketServer({
    httpServer: srv,
});

// Create a function to handle button pushes
function push_button() {
    // Loop through each connection and send a push event
    for(var i in connections) {
        connections[i].sendUTF(JSON.stringify({
            a: "push"
        }));
    }
}

// Handle bar shifting
function shift_bars() {
    for(var i in connections) {
        connections[i].sendUTF(JSON.stringify({
            a: "shift"
        }));
    }
}

// Set an interval to shift bars every 10 seconds
setInterval(shift_bars, 10000);

ws.on("request", function(req) {
    // Accept the connection and push it to the connection array
    var conn = req.accept("traffic", req.origin);
    connections.push(conn);
    console.log(connections.length + " connections");

    conn.on("message", function(msg) {
        // TODO: Error handle this
        msg = JSON.parse(msg.utf8Data);

        if(msg.a == "push")
            push_button(connections);
    });

    conn.on("close", function(code, desc) {
        connections.splice(connections.indexOf(conn), 1);
    });
});
