var find = function (str) {var sevn = document.querySelectorAll(str); if (sevn.length !== 1) {return sevn} else {return sevn[0]}};
Element.prototype.find = function(str) {return this};
NodeList.prototype.find = function(str) {var sevn = this.querySelectorAll(str); if (sevn.length !== 1) {return sevn} else {return sevn[0]}};
Element.prototype.attr = function (attr, value) {this.setAttribute(attr, value); return this;};
NodeList.prototype.attr = function (attr, value) {for (var i = 0; i < this.length; i++) { this[i].setAttribute(attr, value); } return this; };
Element.prototype.getr = function (attr) {return this.getAttribute(attr);};
NodeList.prototype.getr = function (attr) {var out = []; for (var i = 0; i < this.length; i++) { out.push(this[i].getAttribute(attr)); } return out; };
Element.prototype.rmtr = function (attr) {this.removeAttribute(attr); return this;};
NodeList.prototype.rmtr = function (attr) {for (var i = 0; i < this.length; i++) { this[i].removeAttribute(attr); } return this; };
Element.prototype.chng = function (attr, value) {this[attr] = value; return this;};
NodeList.prototype.chng = function (attr, value) {for (var i = 0; i < this.length; i++) { this[i][attr] = value; } return this;};
Element.prototype.styl = function (property, value) { this.style[property] = value; return this; };
NodeList.prototype.styl = function (property, value) { for (var i = 0; i < this.length; i++) { this[i].style[property] = value; } return this; };
Element.prototype.when = function(type, call) { this.addEventListener(type, call); return this; };
NodeList.prototype.when = function (type, call) { for (var i = 0; i < this.length; i++) { this[i].addEventListener(type, call); } return this; };
Element.prototype.doForEach = function(runner) {runner(this); return this};
NodeList.prototype.doForEach = function (runner) { for (var i = 0; i < this.length; i++) { runner(this[i]) } return this; };

var newEl = function(type, classes, innerText) {
    if (innerText) {
        return document.createElement(type).chng("className", classes).chng("innerText", innerText);
    } else if (classes) {   
        return document.createElement(type).chng("className", classes);
    } else {
        return document.createElement(type);
    }
};