let Home = {};
Home.servers = {};

Home.servers.list = async function() {
    return new Promise(async (resolve, reject) => {
        try {
            let servers = JSON.parse(await getRequest("list", {}));
            resolve(servers);
        } catch (err) {
            reject(err);
        }
    });
};

let UI = {};
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
    
    let idEL = document.createElement("div").chng("className", "button server-line id").chng("innerText", payload.id);
    let aliasEL = document.createElement("div").chng("className", "server-line alias").chng("type", "text").chng("innerText", payload.alias);
    let portEL = document.createElement("div").chng("className", "server-line port").chng("type", "text").chng("innerText", payload.port);
    let runonbootEL = document.createElement("button").chng("className", "button toggle server-line runonboot").chng("disabled", true).chng("innerText", "Run On Boot");
    let runfileEL = document.createElement("div").chng("className", "server-line runfile").chng("type", "text").chng("innerText", payload.runfile);
    let updateEL = document.createElement("button").chng("className", "button server-line update").chng("innerText", "Edit").attr("data-id", payload.id);
    if (payload.runonboot) {
        runonbootEL.attr("data-checked", true);
    }

    root.append(idEL, aliasEL, portEL, runonbootEL, runfileEL, updateEL);

    find("div.configcanvas").append(root);
};





let setup = async function() {
    try {
        let ssvvrr = await Home.servers.list();
        for (var i in ssvvrr) {
            UI.Components.serverLine(ssvvrr[i]);
        }
    } catch (err) {
        console.log(err);
    }
};

setup();