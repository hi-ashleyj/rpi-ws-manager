let Home = {};
Home.servers = {};
Home.files = {};

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
    let aliasEL = document.createElement("div").chng("className", "server-line alias").chng("type", "text").chng("innerText", payload.alias);
    let portEL = document.createElement("div").chng("className", "server-line port").chng("type", "text").chng("innerText", payload.port);
    let runonbootEL = document.createElement("button").chng("className", "button toggle server-line runonboot").chng("disabled", true).chng("innerText", "Run On Boot");
    let runfileEL = document.createElement("div").chng("className", "server-line runfile").chng("type", "text").chng("innerText", payload.runfile);
    let editEL = document.createElement("button").chng("className", "button server-line edit").chng("innerText", "Edit").attr("data-id", payload.id);
    if (payload.runonboot) {
        runonbootEL.attr("data-checked", true);
    }
    editEL.when("click", () => {UI.showEdit(payload.id)});

    root.append(idEL, aliasEL, portEL, runonbootEL, runfileEL, editEL);

    find("div.configcanvas").append(root);
};

UI.Components.file = function(name, loc, folder) {
    let root = document.createElement("div").attr("data-name", name).chng("className", "file-line cont");
    if (folder) {
        root.attr("data-folder", true);
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

    root.append(iconEL, fileEL, deleteEL);

    find("div.files-canvas").append(root);
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
            find("button.button.editor.fileman").chng("hidden", true);
            find("button.button.editor.power").chng("innerText", "Stop");
        } else {
            find("button.button.editor.fileman").chng("hidden", false);
            find("button.button.editor.power").chng("innerText", "Start");
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

    console.log(results);
}

UI.on("update", UI.files.load);

UI.files.show = async function(loc) {
    document.body.attr("data-mode", "files");

    UI.files.load(await Home.files.list(UI.editing.id, loc));
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

find("button.button.create.server-line.create").when("click", UI.edit.createServer);

find("button.button.editor.return").when("click", UI.showConfig);

find("button.button.editor.update").when("click", UI.edit.updateInfo);

find("button.button.action.files.return").when("click", () => { UI.showEdit(UI.editing.id); });