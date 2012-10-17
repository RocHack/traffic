var WebSocketServer = require("websocket").server;
var express = require("express");
var redis = require("node-redis");

var app = express();
var db = redis.createClient();
var db_listen = redis.createClient();

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

// Helper function for generating UNIX timestamps
function timestamp() {
    return Math.round((new Date()).getTime() / 1000);
}

// Create a function to handle button pushes
function push_button() {
    // Increase the current counter in redis
    var now = parseInt(timestamp() / 10) * 10;
    db.incr("t_" + now, function(err, reply) {
        // If key == 1, then the key is new and we need to set
        // an expiration time
        if(reply == 1)
            db.expire("t_" + parseInt(timestamp() / 10) * 10, 60);
    });

    db.publish("push", "1");
}

// Handlers for both databases' errors
db.on("error", function(error) {
    console.log("Redis error: " + error);
});

db_listen.on("error", function(error) {
    console.log("Redis error: " + error);
});

// Handler called on every button push
db_listen.on("message", function(channel, message) {
    if(channel != "push")
        return;

    for(var i in connections) {
        connections[i].sendUTF(JSON.stringify({
            a: "push"
        }));
    }
});

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

// Subscribe to redis
db_listen.subscribe("push");

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
