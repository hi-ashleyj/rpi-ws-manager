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

Home.files.delete = async function(id, path, isFolder) {
    return new Promise(async (resolve, reject) => {
        try {
            let obj = JSON.parse(await Comms.post("deletefile", JSON.stringify({id: id, path: path, folder: isFolder})));
            resolve(obj.files);
        } catch (err) {
            resolve(null);
        }
    });
};

let UI = {};
UI.editing;
UI.Presets = {};
UI.edit = {};
UI.files = {};

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
        let id = find("input.create.server-line.alias").value;
        let alias = find("input.create.server-line.alias").value;
        let port = parseInt(find("input.create.server-line.port").value);
        let runonboot = !(!(find("button.toggle.create.server-line.runonboot").getr("data-checked")));
        let runfile = find("input.create.server-line.runfile").value;
        let work = {
            id: id, alias: alias, port: port, runonboot: runonboot, runfile: runfile
        };

        let sevn = await Home.servers.new(work);

        find("input.create.server-line.alias").value = "";
        find("input.create.server-line.alias").value = "";
        find("input.create.server-line.port").value = "";
        find("button.toggle.create.server-line.runonboot").attr("data-checked", true);
        find("input.create.server-line.runfile").value = "";
    } catch (err) { console.log(err); }
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



UI.showConfig();

find("button.button.editor.return").when("click", UI.showConfig);

find("button.button.editor.update").when("click", UI.edit.updateInfo);
