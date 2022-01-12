// load up the express framework and body-parser helper
const express = require("express");
const bodyParser = require("body-parser");
const cors = require( "cors" );

// create an instance of express to serve our end points
const app = express();
const port = 3001;

// we'll load up node's built in file system helper library here
// (we'll be using this later to serve our JSON files
const fs = require("fs");
app.use( cors() );
app.use(bodyParser.json({limit: "5mb"}));
app.use(bodyParser.urlencoded({limit: "5mb", extended: true}));

// this is where we'll handle our various routes from
require("./Routes/data.routes")(app, fs);
app.get("/", (req, res) => {
  console.log("start");
  res.send("welcome to the development api-server");
});
app.use(express.json({limit: "5mb"}));
app.use(express.urlencoded({limit: "5mb"}));
// error handler
app.use(function(err, req, res, next) {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});


// finally, launch our server on port 3001.
app.listen(port, () => {
  console.log("Server is running on", port);
});

//exports.app = functions.https.onRequest(app);
