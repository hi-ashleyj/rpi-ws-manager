let os = require("os");
let fsSync = require("fs");
let fs = fsSync.promises;
let path = require("path");
let url = require("url");
let http = require("http");
let child_process = require("child_process");
const { parse } = require("path");

let r403 = function(res) {
    res.writeHead(403, http.STATUS_CODES[403]);
    res.end();
};

let networkingPort = 80;

let Manager = {};
Manager.servers = {};

/**
 * servers: {
 *      id: "",
 *      alias: "",
 *      port: "",
 *      runatboot: (true|false),
 *      runfile: "app.js" (or similar array of path)
 * }
 */

Manager.runningServers = {
    1212: "boi"
};

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
        Manager.servers = JSON.parse(data);
    });
}

Manager.save = async function() {
    try {
        await fs.writeFile(path.resolve(documentsFolder, "servers.json"), JSON.stringify(Manager.servers));
    } catch (err) {
        
    }
    
};

Manager.spawnServer = function(id) {
    
};

Manager.newServer = async function(payload) {
    // payload is a server payload lol

    if (payload && payload.id && payload.alias && payload.port) {
        let config = {
            id: payload.id,
            alias: payload.alias,
            port: payload.port,
            runatboot: (payload.runatboot) ? true : false,
            runfile: (payload.runfile) ? payload.runfile : "app.js"
        }

        Manager.servers[id] = config;

        Manager.save();
        await fs.mkdir(path.resolve(documentsFolder, id));

        return config;
    } else {
        return null;
    }
};

Manager.updateServer = function(payload) {
    if (payload && payload.id && Manager.servers[id]) {
        Object.assign(Manager.servers[id], payload);
        return Manager.servers[id];
    } else {
        return null;
    }
};

Manager.listFiles = function(id, path) {

};

Manager.getServer = function(id) {
    if (id) {
        let work = Manager.servers[id];
        work.running = (Object.keys(Manager.runningServers).includes(id)) ? true : false;
        return work;
    } else {
        return null;
    }
};

Manager.listServers = function() {
    return Manager.servers;
};

// --- HTTP STUFF --- //

let Requests = {};

Requests.path = function(req, res) {
    // This handles sending the pages required.
    let parseIt = url.parse(req.url, true);
    let pathed = path.parse(req.url);
    let needsIndex = (pathed.base) ? "" : "index.html";
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
        // Test if this should be a redirect endpoint
        let id;
        for (var i in servers) {
            if (parseIt.pathname == ("/" + servers[i].alias)) {
                id = i;
                break;
            }
        }

        if (id) { // If it is
            res.setHeader("Location", "http://" + req.headers.host + ":" + servers[id].port + "/");
            res.writeHead(301, http.STATUS_CODES[301]);
            res.end();
        } else { // If it isn't
            res.writeHead(404, http.STATUS_CODES[404]);
            res.end();
        }
    }
};

Requests.listServers = function(_req, res, _data) {
    res.end(JSON.stringify(Manager.listServers()));
};

Requests.getServer = function(_req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    res.end(JSON.stringify(Manager.getServer(body.id)));
}

Requests.newServer = function(_req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    let resss = Manager.newServer(body);

    if (resss) {
        res.end(JSON.stringify(resss));
    } else {
        r403(res);
    }
}

Requests.updateServer = function(req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    let resss = Manager.updateServer(body);

    if (resss) {
        res.end(JSON.stringify(resss));
    } else {
        r403(res);
    }

};









let requestHandler = async function(req, res) {
    let parseIt = url.parse(req.url, true);

    let type = "400";
    let callback;

    if (req.method == "GET" && !parseIt.search) {
        type = "page";
        Requests.path(req, res);
    } else if (parseIt.query !== null && typeof parseIt.query == "object" && Object.keys(parseIt.query).length > 0) {
        // This is a server method
        type = "501";
        let method = parseIt.query.method;

        if (req.method == "POST") {
            // Always use post for server functions
            if (method == "newserver") {
                type = "newserver";
                callback = Requests.newServer;
            } else if (method == "getserver") {
                type = "getserver";
                callback = Requests.getServer;
            } else if (method == "list") {
                type = "list";
                callback = Requests.listServers;
            } 
        }

        if (type !== "501") {
            let buffer = Buffer.from([]);
            req.on("data", (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
            });
            req.on("end", (e) => {
                callback(req, res, buffer);
            });
        }
    } 
    
    if (type == "400") {
        res.writeHead(400, http.STATUS_CODES[400]);
        console.log("ERR|UNK: MALFORMED");
        res.end();
    }

    if (type == "501") {
        res.writeHead(501, http.STATUS_CODES[501]);
        console.log("ERR|UNK: IDK REQ");
        res.end();
    }
};

let serverboi = http.createServer(requestHandler);

serverboi.listen({
    port: networkingPort
}, () => {console.log("Listening on port " + networkingPort)});