let Comms = {};
Comms.connection = window.location.href;

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
            resolve(request.responseText);
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

