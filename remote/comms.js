let Comms = {};
Comms.connection = window.location.href;
Comms.events = [];
Comms.on = function(type, call) {
    Comms.events.push({ type, call });
};

Comms.fire = function(type, data) {
    for (let i in Comms.events) {
        if (type == Comms.events[i].type) {
            Comms.events[i].call((data) ? data : null);
        }
    }
}

Comms.get = function(method, body) {
    return new Promise(async (resolve, reject) => {
        let request = new XMLHttpRequest();
        request.open("GET", Comms.connection + "?method=" + method);
        request.addEventListener("load", () => {
            resolve(request.responseText)
        });
        request.addEventListener("error", () => {
            reject(request.status);
        });
        if (body) {
            request.send(body);
        } else {
            request.send();
        }
    });
};

Comms.post = function(method, body) {
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.open("POST", Comms.connection + "?method=" + method);
        request.addEventListener("load", () => {
            let body = JSON.parse((request.responseText.length == 0) ? "{}" : request.responseText);
            if (body.error) {
                Comms.fire("broken");
                reject(418);
            } else {
                resolve(request.responseText);
            }
        });
        request.addEventListener("error", () => {
            reject(request.status);
        });
        if (body) {
            request.send(body);
        } else {
            request.send();
        }
    });
};

wsc = new WebSocket("ws" + ((Comms.connection.slice(0, 5) == "https") ? Comms.connection.slice(5) : (Comms.connection.slice(0, 4) == "http") ? Comms.connection.slice(4) : Comms.connection));

let Socket = {};
Socket.events = [];
Socket.on = function(type, call) {
    Socket.events.push({type: type, call: call});
};

wsc.addEventListener('open', function(_e) {
    Socket.send("hello", "hi");
});

Socket.fire = function(type, msg) {
    for (var i in Socket.events) {
        if (Socket.events[i].type == type) {
            Socket.events[i].call((msg) ? msg : "");
        }
    }
};

// Listen for messages
wsc.addEventListener('message', function (event) {
    let res = JSON.parse(event.data);
    Socket.fire(res.type, res.data);
});

Socket.send = function(type, data) {
    wsc.send(JSON.stringify({ type, data }));
};