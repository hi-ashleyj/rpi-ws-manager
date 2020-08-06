let thisconnection = window.location.href;

let getRequest = function(method, body) {
    return new Promise(async (resolve, reject) => {
        let request = new XMLHttpRequest();
        request.open("GET", thisconnection + "?method=" + method);
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
    })
};

let postRequest = function(method, body) {
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.open("POST", thisconnection + "?method=" + method);
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
    })
};

