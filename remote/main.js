let Home = {};
Home.servers = {};
Home.files = {};
Home.self = {};
Home.script = {};

Home.servers.list = async function() {
    return new Promise(async (resolve, reject) => {
        try {
            let servers = JSON.parse(await Comms.post("list", {}));
            resolve(servers);
        } catch (err) {
            resolve(null);
        }
    });
};

Home.servers.get = async function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let servers = JSON.parse(await Comms.post("getserver", JSON.stringify({id: id})));
            resolve(servers);
        } catch (err) {
            resolve(null);
        }
    });
};

Home.servers.update = async function(payload) {
    return new Promise(async (resolve, reject) => {
        try {
            let servers = JSON.parse(await Comms.post("update", JSON.stringify(payload)));
            resolve(servers);
        } catch (err) {
            resolve(null);
        }
    });
};

Home.servers.new = async function(payload) {
    return new Promise(async (resolve, reject) => {
        try {
            let servers = JSON.parse(await Comms.post("new", JSON.stringify(payload)));
            resolve(servers);
        } catch (err) {
            resolve(null);
        }
    });
};

Home.servers.start = async function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            await Comms.post("start", JSON.stringify({ id: id }));
            resolve(true);
        } catch (err) {
            resolve(false);
        }
    });
};

Home.servers.stop = async function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            await Comms.post("stop", JSON.stringify({ id: id }));
            resolve(true);
        } catch (err) {
            resolve(false);
        }
    });
};

Home.servers.restart = async function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            await Comms.post("restart", JSON.stringify({ id: id }));
            resolve(true);
        } catch (err) {
            resolve(false);
        }
    });
}

Home.servers.logs = async function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let logs = JSON.parse(await Comms.post("serverlog", JSON.stringify({ id: id })));
            resolve(logs);
        } catch (err) {
            resolve([]);
        }
    });
};

Home.script.npm = async function(id, args) {
    return new Promise(async (resolve, reject) => {
        try {
            let logs = JSON.parse(await Comms.post("runnpm", JSON.stringify({ id: id, args: args })));
            resolve(logs);
        } catch (err) {
            resolve([]);
        }
    });
};

Home.self.logs = async function() {
    return new Promise(async (resolve, reject) => {
        try {
            let logs = JSON.parse(await Comms.post("ownlogs", ""));
            resolve(logs);
        } catch (err) {
            resolve([]);
        }
    });
};

Home.files.list = async function(id, path) {
    return new Promise(async (resolve, reject) => {
        try {
            let obj = JSON.parse(await Comms.post("listfiles", JSON.stringify({id: id, path: path})));
            resolve(obj.files);
        } catch (err) {
            resolve(null);
        }
    });
};

Home.files.upload = async function(id, path, dataBase64) {
    return new Promise(async (resolve, reject) => {
        try {
            let obj = JSON.parse(await Comms.post("uploadfile", JSON.stringify({id: id, path: path, dataBase64: dataBase64})));
            resolve(obj.files); 
        } catch (err) {
            resolve(null);
        }
    });
};

Home.files.delete = async function(id, path) {
    return new Promise(async (resolve, reject) => {
        try {
            let obj = JSON.parse(await Comms.post("deletefile", JSON.stringify({id: id, path: path})));
            resolve(obj.files);
        } catch (err) {
            resolve(null);
        }
    });
};

let UI = {};
UI.events = [];
UI.editing;
UI.Presets = {};
UI.edit = {};
UI.files = {};
UI.fileicons = ["folder","html", "js", "css", "jpg", "png", "svg", "ttf", "woff", "woff2", "json", "txt"];

UI.broken = false;

UI.breakIt = function() {
    document.body.attr("data-mode", "broken");
    find("button.button.self-logs-open").click();
};

Comms.on("broken", () => {
    UI.broken = true;
    UI.breakIt();
});

UI.on = function(type, call) {
    UI.events.push({type, call});
};

UI.fire = function(type, data) {
    for (var obj of UI.events) {
        if (obj.type == type) {
            obj.call((data) ? data : null);
        }
    }
}

UI.Presets.ButtonToggle = function(button) {
    button.when("click", (e) => {
        let sevn = e.target;
        if (sevn.getr("data-checked")) {
            sevn.rmtr("data-checked");
        } else {
            sevn.attr("data-checked", true);
        }
    });

    return button;
};

UI.Presets.ButtonToggle(find("button.button.toggle"));




UI.Components = {};

UI.Components.serverLine = function(payload) {
    let root = document.createElement("div").attr("data-id", payload.id).chng("className", "server-line cont");
    
    let idEL = document.createElement("div").chng("className", "server-line id").chng("innerText", payload.id);
    let aliasEL = document.createElement("a").chng("className", "server-line alias").chng("type", "text").chng("innerText", payload.alias).chng("href", "/" + payload.alias).chng("target", "_blank").chng("rel", "nofollow");
    let portEL = document.createElement("div").chng("className", "server-line port").chng("type", "text").chng("innerText", payload.port);
    let runonbootEL = document.createElement("button").chng("className", "button toggle server-line runonboot").chng("disabled", true).chng("innerText", "Run On Boot");
    let runfileEL = document.createElement("div").chng("className", "server-line runfile").chng("type", "text").chng("innerText", payload.runfile);
    let editEL = document.createElement("button").chng("className", "button server-line edit").chng("innerText", "Edit").attr("data-id", payload.id);
    if (payload.runonboot) {
        runonbootEL.attr("data-checked", true);
    }
    if (payload.running) {
        root.attr("data-running", true);
    }
    editEL.when("click", () => {UI.showEdit(payload.id)});

    root.append(idEL, aliasEL, portEL, runonbootEL, runfileEL, editEL);

    find("div.configcanvas").append(root);
};

UI.Components.file = function(name, loc, folder) {
    let root = document.createElement("div").attr("data-name", name).chng("className", "file-line cont");
    if (folder) {
        root.attr("data-folder", true);
        root.when("click", (e) => {
            if (e.target == root) {
                UI.files.show(new Array(...UI.files.loc, name));
            }
        });
    }

    let icon = "png/unknown.png"

    if (name.lastIndexOf(".") >= 0) {
        let ext = name.slice(name.lastIndexOf(".") + 1);
        if (UI.fileicons.includes(ext)) {
            icon = "png/" + ext + ".png";
        }
    }
    if (folder) {
        icon = "png/folder.png";
    }

    let iconEL = document.createElement("img").chng("className", "file-line img").chng("src", icon);
    let fileEL = document.createElement("div").chng("className", "file-line name").chng("innerText", name);
    let deleteEL = document.createElement("div").chng("className", "file-line delete").attr("data-loc", JSON.stringify(loc));

    deleteEL.when("click", async (e) => {
        if (e.target.getr("data-staged")) {
            await Home.files.delete(UI.editing.id, JSON.parse(e.target.getr("data-loc")));
            if (document.body.getr("data-mode") == "files") {
                UI.files.show(UI.files.loc);
            }
        } else {
            e.target.attr("data-staged", true);
            if (e.target.parentNode.className == "file-line cont") {
                e.target.parentNode.attr("data-staged");
            }
        }
        
    });

    root.append(iconEL, fileEL, deleteEL);

    find("div.files-canvas").append(root);
};

UI.Components.logline = function(container, line) {
    let root = document.createElement("div").chng("innerText", line.data);
    
    if (line.type == "log") {
        root.chng("className", "logs-line rooter info");
    } else if (line.type == "err") {
        root.chng("className", "logs-line rooter error");
    }

    container.append(root);
};

UI.Components.folder = function(name, loc) {
    UI.Components.file(name, loc, true);
};


UI.showEdit = async function(id) {
    try {
        let info = await Home.servers.get(id);
        UI.editing = info;
    
        find(".editor.id").chng("innerText", info.id);
        find(".editor.alias:not(input)").chng("innerText", info.alias);
        find("a.editor.alias").chng("innerText", info.alias).chng("href", "/" + info.alias);
        find("input.editor.alias").chng("value", info.alias);
        find("input.editor.port").chng("value", info.port);
        if (info.runonboot) {
            find("button.toggle.editor.runonboot").attr("data-checked", true);
        } else {
            find("button.toggle.editor.runonboot").rmtr("data-checked", true);
        }
        find("input.editor.runfile").chng("value", info.runfile);
        find("div.editor.staging").rmtr("data-active");
    
        if (info.running) {
            find("div.edit").attr("data-running", true);
        } else {
            find("div.edit").rmtr("data-running");
        }
    
        document.body.attr("data-mode", "edit");
    } catch (err) {
        console.error(err);
    }
};


UI.showConfig = async function() {
    try {
        let ssvvrr = await Home.servers.list();
        find("div.configcanvas").innerHTML = "";
        for (let i in ssvvrr) {
            UI.Components.serverLine(ssvvrr[i]);
        }
        document.body.attr("data-mode", "config");
    } catch (err) {
        console.err(err);
    }
};


UI.files.load = function(results) {
    find("div.files-canvas").chng("innerHTML", "");

    for (var i = 0; i < results.length; i++) {
        if (results[i].type == "folder") {
            UI.Components.folder(results[i].name, results[i].path);
        }
    }

    for (var i = 0; i < results.length; i++) {
        if (results[i].type == "file") {
            UI.Components.file(results[i].name, results[i].path);
        }
    }

    let absoluteSTR = "";

    if (results[0] && results[0].path && results[0].path.length > 0) {
        let absoluteARR = JSON.parse(JSON.stringify(results[0].path));
        absoluteARR.pop()
        absoluteSTR = absoluteARR.join(" > ");
    }
    
    find("span.files-trace.content").chng("innerText", absoluteSTR);
}

UI.on("update", UI.files.load);

UI.files.loc = [];

UI.files.show = async function(loc) {
    document.body.attr("data-mode", "files");

    UI.files.load(await Home.files.list(UI.editing.id, loc));
    UI.files.loc = loc;
};

find("button.button.editor.fileman").when("click", () => { UI.files.show([]) });

UI.edit.updateInfo = async function () {
    try {
        let id = UI.editing.id;
        let alias = find("input.editor.alias").value;
        let port = parseInt(find("input.editor.port").value);
        let runonboot = !(!(find("button.toggle.editor.runonboot").getr("data-checked")));
        let runfile = find("input.editor.runfile").value;
        let work = {
            id: id, alias: alias, port: port, runonboot: runonboot, runfile: runfile
        };

        let sevn = await Home.servers.update(work);

        if (sevn) {
            find("div.editor.staging").attr("data-active", true);
        }
    } catch (err) { console.log(err); }
};

UI.edit.createServer = async function() {
    try {
        let id = find("input.create.server-line.id").value;
        let alias = find("input.create.server-line.alias").value;
        let port = parseInt(find("input.create.server-line.port").value);
        let runonboot = !(!(find("button.toggle.create.server-line.runonboot").getr("data-checked")));
        let runfile = find("input.create.server-line.runfile").value;
        let work = {
            id: id, alias: alias, port: port, runonboot: runonboot, runfile: runfile
        };

        let sevn = await Home.servers.new(work);
        
        console.log(sevn);

        find("input.create.server-line.id").value = "";
        find("input.create.server-line.alias").value = "";
        find("input.create.server-line.port").value = "";
        find("button.toggle.create.server-line.runonboot").attr("data-checked", true);
        find("input.create.server-line.runfile").value = "";

        UI.showConfig();
    } catch (err) { console.log(err); }
};

UI.showConfig();

UI.showLogs = async function(id) {
    try {
        let container = find("div.logs-canvas");
        let list = await Home.servers.logs(id);
        container.innerHTML = "";
        for (let i in list) {
            UI.Components.logline(container, list[i]);
        }
        document.body.attr("data-mode", "logs");
    } catch (err) {
        console.err(err);
    }
};

find("button.button.create.server-line.create").when("click", UI.edit.createServer);

find("button.button.editor.return").when("click", UI.showConfig);

find("button.button.editor.update").when("click", UI.edit.updateInfo);

find("button.button.action.files.return").when("click", () => { 
    if (UI.files.loc.length == 0) { 
        UI.showEdit(UI.editing.id); 
    } else { 
        UI.files.loc.pop(); 
        UI.files.show(UI.files.loc) 
    } 
});

find("button.button.action.logger.return").when("click", () => { UI.showEdit(UI.editing.id); });

find("button.button.editor.start").when("click", () => { Home.servers.start(UI.editing.id) });
find("button.button.editor.stop").when("click", () => { Home.servers.stop(UI.editing.id) });
find("button.button.editor.restart").when("click", () => { Home.servers.restart(UI.editing.id) });

find("button.button.editor.logs").when("click", () => { UI.showLogs(UI.editing.id) });
find("button.button.editor.console").when("click", () => { UI.showLogs(UI.editing.id).then(() => { document.body.attr("data-mode", "console"); find("div.runtime-logs").innerHTML = ""; }); });

find("button.button.action.upload.folder").when("click", () => {
    find("div.splash.folder").attr("data-active", true);
});

find("button.button.action.logger.runtime.gotime").when("click", async () => {
    let args = find("input.logger.runtime.console").value.split(" ");

    if (find("div.runtime-logs").getr("data-thinking")) {
        return;
    }

    try {
        let container = find("div.runtime-logs");
        find("input.logger.runtime.console").value = "";
        container.innerHTML = "";
        find("div.runtime-logs").attr("data-thinking", true);
        let body = await Home.script.npm(UI.editing.id, args);
        find("div.runtime-logs").rmtr("data-thinking");
        let list = body.logs;
        console.log(list);
        for (let i in list) {
            UI.Components.logline(container, list[i]);
        }
    } catch (err) {
        console.err(err);
    }
});

find("input.logger.runtime.console").when("keypress", (e) => {
    if (e.key.toLowerCase() == "enter") {
        find("button.button.action.logger.runtime.gotime").click();
    }
});


find("div.splash.folder").when("click", (e) => {
    if (e.target == find("div.splash.folder")) {
        e.target.rmtr("data-active");
        find("input.input.action.create.folder").value = "";
    }
});

find("input.input.action.create.folder").when("keypress", (e) => {
    if (e.key.toLowerCase() == "enter") {
        find("button.button.action.create.folder").click();
    }
});

find("button.button.action.create.folder").when("click", async () => {
    let name = find("input.input.action.create.folder").value;
    await Home.files.upload(UI.editing.id, new Array(...UI.files.loc, name), "folder");

    find("div.splash.folder").click();
    UI.files.show(UI.files.loc);
});

find("button.button.self-logs-open").when("click", async () => {
    try {
        let container = find("div.logs-canvas-self");
        let list = await Home.self.logs();
        container.innerHTML = "";
        for (let i in list) {
            UI.Components.logline(container, list[i]);
        }
        find("div.splash.self-log").attr("data-active", true);
    } catch (err) {
        console.err(err);
    }
});

find("div.splash.self-log").when("click", (e) => {
    if (e.target == find("div.splash.self-log") && !UI.broken) {
        e.target.rmtr("data-active");
    }
});

let uploadCue = [];
let reader = new FileReader();
let currentUpload = null;

let nextUpload = function() {
    if (currentUpload == null && uploadCue.length > 0) {
        currentUpload = uploadCue.shift();

        reader.readAsDataURL(currentUpload.file);
    } else {
        if (document.body.getr("data-mode") == "files") {
            UI.files.show(UI.files.loc);
        }
    }
};

let handleUpload = async function(_e) {
    let data = reader.result;
    let treated = data.split(",")[1];

    await Home.files.upload(currentUpload.id, currentUpload.loc, treated);

    currentUpload = null;
    nextUpload();
};

reader.addEventListener("load", handleUpload);

find("button.button.action.upload.file").when("click", () => {
    find("input.files-upload[type=\"file\"]").click();
});

find("input.files-upload[type=\"file\"]").when("input", (e) => {
    let list = e.target.files;

    for (let i = 0; i < list.length; i++) {
        let loc = new Array(...UI.files.loc);
        loc.push(list[i].name);
        uploadCue.push({ id: UI.editing.id, loc: loc, file: list[i]});
    }

    nextUpload();
});

// Socket based refreshes
Socket.on("start", (data) => {
    let mode = document.body.getr("data-mode");
    if (mode == "config") {
        UI.showConfig();
    } else if (mode == "edit") {
        if (UI.editing.id == data.target) {
            UI.showEdit(UI.editing.id);
        }
    }
});

Socket.on("stop", (data) => {
    let mode = document.body.getr("data-mode");
    if (mode == "config") {
        UI.showConfig();
    } else if (mode == "edit") {
        if (UI.editing.id == data.target) {
            UI.showEdit(UI.editing.id);
        }
    }
});

Socket.on("log", (data) => {
    let mode = document.body.getr("data-mode");
    if (mode == "logs") {
        if (UI.editing.id == data.target) {
            UI.Components.logline(find("div.logs-canvas"), data.message);
        }
    }
});