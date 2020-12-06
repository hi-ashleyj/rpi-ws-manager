let os = require("os");
let fsSync = require("fs");
let fs = fsSync.promises;
let path = require("path");
let url = require("url");
let http = require("http");
let child_process = require("child_process");
let ws = require("ws");
const { parse } = require("path");
let ownLogs = [];
let criticalException = false;

let logxtra = function(...line) {
    for (let lx of line) {
        ownLogs.push({type: "log", data: lx});
    }
    while (ownLogs.length > 100) {
        ownLogs.shift();
    }
    console.log(...line);
};

let r403 = function(res) {
    res.writeHead(403, http.STATUS_CODES[403]);
    res.end();
};

let networkingPort = 80;
let remoteServer;

let remoteSend = async function(cl, type, data) {
    let msg = JSON.stringify({ type, data });
    if (cl) {
        cl.send(msg);
    } else {
        remoteServer.clients.forEach(function each(client) {
            if (client.readyState === ws.OPEN) {
                client.send(msg);
            }
        });
    }
};

let Manager = {};
Manager.servers = {};
Manager.autoStartOnce = false;
Manager.autoStart;
Manager.broadcast;
Manager.listServers;
Manager.getServer;

/**
 * servers: {
 *      id: "",
 *      alias: "",
 *      port: "",
 *      runatboot: (true|false),
 *      runfile: "app.js" (or similar array of path)
 * }
 */

Manager.runningServers = {};

let SpawnedServer = function(id, process, silent) {
    this.id = id;
    this.log = [];
    this.running = true;
    this.process = process;
    this.events = [];

    this.on = function(type, call) {
        this.events.push({ type, call });
    }

    this.fire = function(type, data) {
        for (e of this.events) {
            if (e.type == type) {
                e.call(data);
            }
        }
    };

    let u = this;

    this.process.stdout.on("data", (chunk) => {
        let entry = { type: "log", data: chunk.toString() };
        u.log.push(entry);
        if (!silent) {
            Manager.broadcast("log", u.id, entry);
        }
        
        while (u.log.length > 100) {
            u.log.shift();
        }
    });

    this.process.stderr.on("data", (chunk) => {
        let entry = { type: "err", data: chunk.toString() };
        u.log.push(entry);
        if (!silent) {
            Manager.broadcast("log", u.id, entry);
        }

        while (u.log.length > 100) {
            u.log.shift();
        }
    });

    this.process.on("exit", (code, signal) => {
        if (typeof code == "number") {
            // Exited itself
            u.log.push({type: "log", data: "Exited by itself" + ((code == 0) ? "" : " (code " + code + "). Error Information may be available above.")});
            u.fire("exit", code);
        } else if (typeof signal == "string") {
            u.log.push({type: "log", data: "Terminated by signal: " + signal});
            u.fire("stop", (typeof signal == "string"));
        }

        u.running = false;
        if (!silent) {
            Manager.broadcast("stop", u.id);
        }
    });

    this.process.on("error", (...args) => {
        console.error(...args);
    });

    this.stop = function() {
        u.process.kill();
    };

    return this;
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
        if (typeof Manager.autoStart == "function") {
            Manager.autoStart();
        }
    });
}

Manager.save = async function() {
    try {
        await fs.writeFile(path.resolve(documentsFolder, "servers.json"), JSON.stringify(Manager.servers));
    } catch (err) {
        
    }
    
}; 

Manager.broadcast = function(type, ...data) {
    let output = { servers: Manager.listServers() };

    if (type == "start" || type == "stop") {
        output.target = data[0];
    } else if (type == "log") {
        output.target = data[0];
        output.message = data[1];
    } else if (type == "script-complete") {
        Object.assign(output, data[0]);
    }

    remoteSend(null, type, output);
};

Manager.stopServer = function(id) {
    return new Promise(async (resolve, _reject) => {
        if (Manager.runningServers[id]) {
            if (Manager.runningServers[id].running) {
                Manager.runningServers[id].on("stop", (_stopped) => {
                    resolve();
                });

                Manager.runningServers[id].stop();
            } else {
                resolve();
            }
        } else {
            resolve();
        }
    })
};

Manager.spawnServer = function(id) {
    if (Manager.servers[id].runfile.length == 0) {
        return;
    }
    let options = {};
    let args = [];

    args.push(Manager.servers[id].runfile);
    args.push("port:" + Manager.servers[id].port);

    options.cwd = path.resolve(documentsFolder, "" + id);

    let process = child_process.spawn("node", args, options);

    Manager.runningServers[id] = new SpawnedServer(id, process);
    Manager.broadcast("start", id);
};

Manager.autoStart = function() {
    if (Manager.autoStartOnce) {
        logxtra("Autostart stopped");
        return;
    } else {
        logxtra("Autostarting " + Object.keys(Manager.servers).length + " server" + ((Object.keys(Manager.servers).length !== 1) ? "s" : ""));
        Manager.autoStartOnce = true;

        for (let id in Manager.servers) {
            if (Manager.servers[id].runonboot) {
                Manager.spawnServer(id);
                logxtra("Starting server " + id);
            } else {
                logxtra("Didn't start server " + id);
            } 
        }
    }
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

        Manager.servers[config.id] = config;

        await Manager.save();
        await fs.mkdir(path.resolve(documentsFolder, config.id));

        return config;
    } else {
        return null;
    }
};

Manager.updateServer = async function(payload) {
    if (payload && payload.id && Manager.servers[payload.id]) {
        Object.assign(Manager.servers[payload.id], payload);

        await Manager.save();
        return Manager.servers[payload.id];
    } else {
        return null;
    }
};

Manager.listFiles = async function(id, loc) {
    try {
        let sevn = await fs.readdir(path.resolve(documentsFolder, id, ...loc), { encoding: "utf8", withFileTypes: true });
        let output = { id: id, path: loc, files: []};
    
        for (let dirent of sevn) {
            let work = {};
            if (dirent.isFile()) {
                work.type = "file";
            }
            if (dirent.isDirectory()) {
                work.type = "folder";
            }
            if (work.type) {
                work.name = dirent.name;
                work.path = [].concat(loc, dirent.name);
                output.files.push(work);
            }
        }
    
        return output;
    } catch (err) {
        return null;
    }
};

Manager.storeFile = async function(id, loc, dataBase64) {
    try {
        if (dataBase64 == "folder") {
            await fs.mkdir(path.resolve(documentsFolder, id, ...loc));
        } else {
            await fs.writeFile(path.resolve(documentsFolder, id, ...loc), dataBase64, "base64");
        }

        return await Manager.listFiles(id, loc.slice(0, -1));
    } catch (err) {
        return null;
    }
};

Manager.removeFile = async function(id, loc) {
    try {
        let stat = await fs.stat(path.resolve(documentsFolder, id, ...loc));
        if (stat.isDirectory()) {
            await fs.rmdir(path.resolve(documentsFolder, id, ...loc), {recursive: true});
        } else if (stat.isFile()) {
            await fs.unlink(path.resolve(documentsFolder, id, ...loc));
        } else {
            throw "ERR|RMF: Fuck.";
        }

        return await Manager.listFiles(id, loc.slice(0, -1));
    } catch (err) {
        return null;
    }
    
};

Manager.getServer = function(id) {
    if (id) {
        let work = Object.assign({}, Manager.servers[id]);
        work.running = (Object.keys(Manager.runningServers).includes(id) && Manager.runningServers[id].running);
        return work;
    } else {
        return null;
    }
};

Manager.listServers = function() {
    let work = JSON.parse(JSON.stringify(Manager.servers));
    for (let id in work) {
        work[id].running = (Object.keys(Manager.runningServers).includes(id) && Manager.runningServers[id].running);
    }
    return work;
};

Manager.getLogfile = function(id) {
    if (Manager.runningServers[id]) {
        return Manager.runningServers[id].log;
    }
    return [];
};

Manager.runNPM = function(id, args) {
    return new Promise(async (resolve, reject) => {
        if (args.length > 0) {
            let options = {};
        
            options.cwd = path.resolve(documentsFolder, "" + id);

            let npmLoc = (os.platform == "win32" || process.platform == "win32") ? "npm.cmd" : "npm";
        
            let process = child_process.spawn(npmLoc, args, options);

            let instance = new SpawnedServer(id, process);

            instance.on("stop", (code) => {
                let logs = instance.log;

                let res = { id: id, logs: logs, root: "npm" };
                Manager.broadcast("script-complete", res);
                resolve(res);
            });

            instance.on("exit", (code) => {
                let logs = instance.log;

                let res = { id: id, logs: logs, root: "npm" };
                Manager.broadcast("script-complete", res);
                resolve(res);
            });
        } else {
            resolve(null);
        }
    }); 
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
        try {
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
                logxtra("ERR|UNK: HSRV 404");
                res.end("Not Found");
            });
        } catch {
            res.statusCode = 404;
            logxtra("ERR|UNK: HSRV 404");
            res.end("Not Found");
        }
        
        
    } else {
        // Test if this should be a redirect endpoint
        let id;
        for (var i in Manager.servers) {
            if (parseIt.pathname == ("/" + Manager.servers[i].alias)) {
                id = i;
                break;
            }
        }

        if (id) { // If it is
            res.setHeader("Location", "http://" + req.headers.host + ":" + Manager.servers[id].port + "/");
            res.writeHead(307, http.STATUS_CODES[307]);
            res.end();
        } else { // If it isn't
            res.writeHead(404, http.STATUS_CODES[404]);
            res.end();
        }
    }
};

Requests.startServer = function(_req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    if (body.id) {
        Manager.spawnServer(body.id);
        res.writeHead(200, http.STATUS_CODES[200]); 
        res.end();
    } else {
        res.writeHead(404, http.STATUS_CODES[404]);
        res.end();
    }
};

Requests.stopServer = function(_req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    if (body.id) {
        Manager.stopServer(body.id).then(() => { 
            res.writeHead(200, http.STATUS_CODES[200]); 
            res.end(); 
        });
    } else {
        res.writeHead(404, http.STATUS_CODES[404]);
        res.end();
    }
};

Requests.restartServer = function(_req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    if (body.id) {
        Manager.stopServer(body.id).then(() => { 
            setTimeout(() => {
                Manager.spawnServer(body.id);
                res.writeHead(200, http.STATUS_CODES[200]); 
                res.end(); 
            }, 750);
        });
    } else {
        res.writeHead(404, http.STATUS_CODES[404]);
        res.end();
    }
};

Requests.getLogs = function(_req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    if (body.id) {
        let logs = Manager.getLogfile(body.id);
        
        res.writeHead(200, http.STATUS_CODES[200]); 
        res.end(JSON.stringify(logs)); 
    } else {
        res.writeHead(404, http.STATUS_CODES[404]);
        res.end();
    }
}

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

Requests.updateServer = async function(req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    let resss = await Manager.updateServer(body);

    if (resss) {
        res.end(JSON.stringify(resss));
    } else {
        r403(res);
    }
};

Requests.listFiles = async function(req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    let resss = await Manager.listFiles(body.id, body.path);

    if (resss) {
        res.end(JSON.stringify(resss));
    } else {
        r403(res);
    }
};

Requests.uploadFile = async function(req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    let resss = await Manager.storeFile(body.id, body.path, body.dataBase64);

    if (resss) {
        res.end(JSON.stringify(resss));
    } else {
        r403(res);
    }
};

Requests.deleteFile = async function(req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    let resss = await Manager.removeFile(body.id, body.path);

    if (resss) {
        res.end(JSON.stringify(resss));
    } else {
        r403(res);
    }
};

Requests.runNPM = async function(req, res, data) {
    let body = JSON.parse(data.toString("utf8"));
    let resss = await Manager.runNPM(body.id, body.args);

    if (resss) {
        res.end(JSON.stringify(resss));
    } else {
        r403(res);
    }
};

Requests.selfLogs = function(_req, res, _data) {
    res.end(JSON.stringify(ownLogs));
}

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
            if (method == "ownlogs") {
                type = method;
                callback = Requests.selfLogs;
            } else if (criticalException) {
                type = "except";
                callback = () => {};
                res.writeHead(418, http.STATUS_CODES[418]);
                res.end(JSON.stringify({ error: "ERR|CRT", message: "Main Process encountered a critical exception", logs: ownLogs }));
            } else if (method == "newserver") {
                type = method;
                callback = Requests.newServer;
            } else if (method == "getserver") {
                type = method;
                callback = Requests.getServer;
            } else if (method == "list") {
                type = method;
                callback = Requests.listServers;
            } else if (method == "new") {
                type = method;
                callback = Requests.newServer;
            } else if (method == "update") {
                type = method;
                callback = Requests.updateServer;
            } else if (method == "listfiles") {
                type = method;
                callback = Requests.listFiles;
            } else if (method == "uploadfile") {
                type = method;
                callback = Requests.uploadFile;
            } else if (method == "deletefile") {
                type = method;
                callback = Requests.deleteFile;
            } else if (method == "start") {
                type = method;
                callback = Requests.startServer;
            } else if (method == "stop") {
                type = method;
                callback = Requests.stopServer;
            } else if (method == "restart") {
                type = method;
                callback = Requests.restartServer;
            } else if (method == "serverlog") {
                type = method;
                callback = Requests.getLogs;
            } else if (method == "runnpm") {
                type = method;
                callback = Requests.runNPM;
            } else if (method == "throwerror") {
                res.end();
                throw new Error("This is a test error.");
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
        logxtra("ERR|UNK: MALFORMED");
        res.end();
    }

    if (type == "501") {
        res.writeHead(501, http.STATUS_CODES[501]);
        logxtra("ERR|UNK: IDK REQ");
        res.end();
    }
};

let serverboi = http.createServer(requestHandler);

let handleWSRequest = async function(cl, msg) {
    let { type, data } = msg;

    if (type == "hello") {
        remoteSend(cl, "hello", "hi");
    }
};

remoteServer = new ws.Server({server: serverboi});

remoteServer.on('connection', function (cl) {
    cl.on('message', function (msg) {
        handleWSRequest(cl, JSON.parse(msg));
    });
});

serverboi.listen({
    port: networkingPort
}, () => {logxtra("Listening on port " + networkingPort + " (http://localhost" + ((networkingPort == 80) ? "" : ":" + networkingPort) + ")")});

if (Object.keys(Manager.servers).length > 0) {
    Manager.autoStart();
}

process.on("uncaughtException", (err) => {
    ownLogs.push({ type: "err", data: err.name });
    ownLogs.push({ type: "err", data: err.message });
    criticalException = true;
    console.error(err);
});