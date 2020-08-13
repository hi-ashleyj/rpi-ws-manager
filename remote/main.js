let Home = {};
Home.servers = {};

Home.servers.list = async function() {
    return new Promise(async (resolve, reject) => {
        try {
            let servers = JSON.parse(await Comms.post("list", {}));
            resolve(servers);
        } catch (err) {
            reject(err);
        }
    });
};

Home.servers.get = async function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let servers = JSON.parse(await Comms.post("getserver", JSON.stringify({id: id})));
            resolve(servers);
        } catch (err) {
            reject(err);
        }
    });
};

let UI = {};
UI.editing;
UI.Presets = {};

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



UI.showEdit = async function(id) {
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
        console.log(err);
    }
};



UI.showConfig();

find("button.button.editor.return").when("click", UI.showConfig);

find("button.button.editor.update").when("click", UI.updateInfo);
