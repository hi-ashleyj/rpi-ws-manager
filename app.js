let os = require("os");
let fsSync = require("fs");
let fs = fsSync.promises;
let path = require("path");
let url = require("url");
let http = require("http");

let networkingPort = 80;

let documentsFolder = path.resolve(os.homedir(), "rpi-ws-manager");

if (!fsSync.existsSync(documentsFolder)) { // Create folders and default users
    try {
        fs.mkdir(documentsFolder).then(async function() {
            await fs.writeFile(path.resolve(documentsFolder, "servers.json"), "{}");
        });
    } catch (_err) {

    }
}


var handleAllRequests = function(req, res) {
    let parseIt = url.parse(req.url, true);
    let pathed = path.parse(req.url);

    let needsIndex = (pathed.base) ? "" : "index.html";


    if (req.method == "GET" && !parseIt.search) {
        // This handles sending the pages required.
        var pathpath = __dirname + "/remote" + parseIt.pathname + needsIndex;

        if (fsSync.existsSync(pathpath)) {
            if (pathed.ext == ".html") {
                res.setHeader("Content-Type", "text/html");
            } else if (pathed.ext == ".js") {
                res.setHeader("Content-Type", "application/js");
            } else if (pathed.ext == ".css") {
                res.setHeader("Content-Type", "text/css");
            } else if (pathed.ext == ".png") {
                res.setHeader("Content-Type", "image/png");
            } else if (pathed.ext == ".svg") {
                res.setHeader("Content-Type", "image/svg+xml");
            } else if (pathed.ext == ".ttf") {
                res.setHeader("Content-Type", "application/font");
            }

            let stream = fsSync.createReadStream(pathpath);
            stream.on("open", () => {
                stream.pipe(res);
            });

            stream.on("error", () => {
                res.statusCode = 404;
                console.log("ERR|UNK: HSRV 404");
                res.end("Not Found");
            });
            
        } else {
            res.writeHead(404, http.STATUS_CODES[404]);
            res.end();
        }
    } else if (req.method == "GET" && parseIt.query !== null && typeof parseIt.query == "object" && Object.keys(parseIt.query).length > 0) {
        // Handle sending the required data for the resources and stuff
        var method = parseIt.query.method;
        if (method) {
            res.writeHead(501, http.STATUS_CODES[501]);
            res.end();
            console.error("ERR|UNK: GET REQ");
        }
    } else if (req.method == "POST" && parseIt.query !== null && typeof parseIt.query == "object" && Object.keys(parseIt.query).length > 0) {
        // Handle receiving the face of the cheese burgers.
        var method = parseIt.query.method;
        if (method) {
            res.writeHead(501, http.STATUS_CODES[501]);
            console.log("ERR|UNK: POST REQ");
            res.end();
        }

    } else {
        res.writeHead(400, http.STATUS_CODES[400]);
        console.log("ERR|UNK: MALFORMED");
        res.end();
    }
};

let serverboi = http.createServer(handleAllRequests);

serverboi.listen({
    port: networkingPort
}, () => {console.log("Listening on port " + networkingPort)});