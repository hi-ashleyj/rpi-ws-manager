let os = require("os");
let fsSync = require("fs");
let fs = fsSync.promises;
let path = require("path");
let url = require("url");
let http = require("http");
let child_process = require("child_process");

let networkingPort = 80;
let servers = {};

/**
 * servers: {
 *      id: "",
 *      alias: "",
 *      port: "",
 *      runatboot: (true|false),
 *      runfile: [app.js] (or similar array of path)
 * }
 */

let runningServers = {};

let documentsFolder = path.resolve(os.homedir(), "rpi-ws-manager");

if (!fsSync.existsSync(documentsFolder)) { // Create folders and default users
    try {
        fs.mkdir(documentsFolder).then(async function() {
            await fs.writeFile(path.resolve(documentsFolder, "servers.json"), "{}");
        });
    } catch (_err) {

    }
} else {
    fs.readFile(path.resolve(documentsFolder, "servers.json"), {encoding: "utf8"}).then((data) => {
        servers = JSON.parse(data);
    });
}

let save = async function() {
    try {
        await fs.writeFile(path.resolve(documentsFolder, "servers.json"), JSON.stringify(servers));
    } catch (err) {
        
    }
    
};

let spawnServer = function(id) {
    
};

let newServer = async function(payload) {
    // payload is a server payload lol

    if (payload && payload.id && payload.alias && payload.port) {
        let config = {
            id: payload.id,
            alias: payload.alias,
            port: payload.port,
            runatboot: (payload.runatboot) ? true : false,
            runfile: (payload.runfile) ? payload.runfile : "app.js"
        }

        servers[id] = config;

        save();
        await fs.mkdir(path.resolve(documentsFolder, id));

        return config;
    } else {
        return null;
    }
};

let listFiles = function(id, path) {

}

let getServer = function(id) {
    return (id) ? servers[id] : null;
};

let listServers = function() {
    return servers;
};

let handleAllRequests = function(req, res) {
    let parseIt = url.parse(req.url, true);
    let pathed = path.parse(req.url);

    let needsIndex = (pathed.base) ? "" : "index.html";


    if (req.method == "GET" && !parseIt.search) {
        // This handles sending the pages required.
        let pathpath = __dirname + "/remote" + parseIt.pathname + needsIndex;

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
            let id;
            for (var i in servers) {
                if (parseIt.pathname == ("/" + servers[i].alias)) {
                    id = i;
                    break;
                }
            }

            if (id) {
                res.setHeader("Location", "http://" + req.headers.host + ":" + servers[id].port + "/");
                res.writeHead(301, http.STATUS_CODES[301]);
                res.end();
            } else {
                res.writeHead(404, http.STATUS_CODES[404]);
                res.end();
            }
        }
    } else if (req.method == "GET" && parseIt.query !== null && typeof parseIt.query == "object" && Object.keys(parseIt.query).length > 0) {
        // Handle sending the required data for the resources and stuff
        var method = parseIt.query.method;
        if (method == "list") {
            res.end(JSON.stringify(listServers()));
        } else if (method == "getserver") {
            res.end(JSON.stringify(getServer(parseIt.query.id)));
        } else {
            res.writeHead(501, http.STATUS_CODES[501]);
            res.end();
            console.error("ERR|UNK: GET REQ");
        }
    } else if (req.method == "POST" && parseIt.query !== null && typeof parseIt.query == "object" && Object.keys(parseIt.query).length > 0) {
        // Handle receiving the face of the cheese burgers.
        var method = parseIt.query.method;
        if (method == "newserver") {
            let resss = newServer({
                id: parse.query.id,
                alias: parse.query.id,
                port: parse.query.id,
                id: parse.query.id,
            });

            if (resss) {
                res.end(JSON.stringify(resss));
            }
        } else {
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