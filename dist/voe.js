(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.voe = {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var TEXT = 3;
    var handlerMap = {};
    var tagMap = new Map([
        ['view', 'div'],
        ['text', 'span'],
        ['icon', 'i'],
        ['button', 'button'],
        ['image', 'img'],
        ['navigator', 'a'],
    ]);
    function h(tag, attrs) {
        var props = attrs || {};
        var key = props.key || null;
        var children = [];
        // use undefined tag, need throw error.
        var newTag = tagMap.get(tag);
        if (!newTag && typeof tag !== 'function') {
            children.push({ tag: "<" + tag + "> does not exist\uFF0Cplease check your code", type: TEXT });
            return {
                tag: tag,
                props: props,
                children: children,
                key: key,
            };
        }
        Object.keys(props).forEach(function (k, i) {
            if (k[0] === 'o' && k[1] === 'n') {
                var e = props[k];
                handlerMap[i] = e;
                props[k] = i;
            }
        });
        for (var i = 2; i < arguments.length; i++) {
            var vnode = arguments[i];
            if (vnode == null || vnode === true || vnode === false) ;
            else if (typeof vnode === 'string' || typeof vnode === 'number') {
                children.push({ tag: vnode + '', type: TEXT });
            }
            else {
                children.push(vnode);
            }
        }
        /**
         * component render
         * {
         *  tag: {
         *    tag: xxx,
         *    ...
         *  }
         *  ...
         * }
         * @type {string}
         */
        var tagName = typeof tag === 'function' ? tag(props) : tag;
        return tagName.tag ? tagName : {
            tag: tagMap.get(tagName) || tagName,
            props: props,
            children: children,
            key: key,
        };
    }

    function updateElement(dom, oldProps, newProps) {
        Object.keys(newProps)
            .filter(function (o, n) { return function (k) { return o[k] !== n[k]; }; })
            .forEach(function (name) {
            updateProperty(dom, name, oldProps[name], newProps[name], false);
        });
    }
    function updateProperty(dom, name, oldValue, newValue, isSvg) {
        if (name === 'key' || oldValue === newValue) ;
        else if (name === 'style') {
            for (var k in __assign(__assign({}, oldValue), newValue)) {
                oldValue = newValue == null || newValue[k] == null ? '' : newValue[k];
                dom[name][k] = oldValue;
            }
        }
        else if (name[0] === 'o' && name[1] === 'n') {
            name = name.slice(2).toLowerCase();
            var newHandler = function (e) {
                worker.postMessage(JSON.stringify({
                    type: EVENT,
                    id: newValue,
                    data: {
                        type: e.type,
                        x: e.x,
                        y: e.y,
                        clientX: e.clientX,
                        clientY: e.clientY,
                        offsetX: e.offsetX,
                        offsetY: e.offsetY,
                        pageX: e.pageX,
                        pageY: e.pageY
                    }
                }));
            };
            dom.addEventListener(name, newHandler);
        }
        else if (name in dom && !isSvg) {
            dom[name] = newValue == null ? '' : newValue;
        }
        else if (newValue == null || newValue === false) ;
        else {
            dom.setAttribute(name, newValue);
        }
    }
    function createElement(vnode) {
        var dom = vnode.type === TEXT
            ? document.createTextNode(vnode.tag)
            : document.createElement(vnode.tag);
        elementMap.push(dom);
        if (vnode.children) {
            for (var i = 0; i < vnode.children.length; i++) {
                dom.appendChild(createElement(vnode.children[i]));
            }
        }
        for (var name in vnode.props) {
            updateProperty(dom, name, null, vnode.props[name], false);
        }
        return dom;
    }

    var elementMap = [];
    var worker = null;
    var isNum = function (x) { return typeof x === 'number'; };
    function masochism() {
        var scripts = document.getElementsByTagName('script');
        var path = scripts[scripts.length - 1].src;
        elementMap.push(document.body);
        worker = new Worker(path);
        worker.onmessage = function (e) {
            var _a;
            var _b = JSON.parse(e.data), type = _b.type, data = _b.data, name = _b.name, prams = _b.prams;
            if (type === COMMIT) {
                requestAnimationFrame(function () {
                    for (var index in data) {
                        commit(data[index]);
                    }
                });
            }
            if (type === WEB_API) {
                (_a = window[name[0]])[name[1]].apply(_a, prams);
            }
        };
    }
    function commit(op) {
        if (op.length === 3) {
            isNum(op[1])
                ? getElement(op[0]).insertBefore(getElement(op[2]) || createElement(op[2]), getElement(op[1]))
                : updateElement(getElement(op[0]), op[1], op[2]);
        }
        else {
            isNum(op[1])
                ? getElement(op[0]).removeChild(getElement(op[1]))
                : (getElement(op[0]).nodeValue = op[1]);
        }
    }
    var getElement = function (index) { return elementMap[index] || null; };

    var _a;
    var MAIN = typeof window !== 'undefined';
    var effectStack = [];
    var commitQueue = [];
    var targetMap = new WeakMap();
    var COMMIT = (_a = [1, 2, 3], _a[0]), EVENT = _a[1], WEB_API = _a[2];
    function render(instance) {
        MAIN ? masochism() : sadism(instance);
    }
    function sadism(instance) {
        instance.update = effect(function () {
            var oldVnode = instance.subTree || null;
            var newVnode = (instance.subTree = instance.tag(instance.props));
            var index = 2;
            var commit = diff(1, index, oldVnode, newVnode);
            self.postMessage(JSON.stringify({
                type: COMMIT,
                data: commit
            }), null);
        });
        instance.update();
        self.onmessage = function (e) {
            var _a = JSON.parse(e.data), type = _a.type, data = _a.data, id = _a.id;
            if (type === EVENT) {
                var fn = handlerMap[id];
                fn && fn(data);
            }
        };
        self.localStorage = {
            getItem: function (key) {
                callMethod(['localStorage', 'getItem'], [key]);
            },
            setItem: function (key, val) {
                callMethod(['localStorage', 'setItem'], [key, val]);
            }
        };
    }
    function diff(parent, node, oldVnode, newVnode) {
        if (oldVnode === newVnode) ;
        else if (oldVnode != null &&
            oldVnode.type === TEXT &&
            newVnode.type === TEXT) {
            if (oldVnode.tag !== newVnode.tag)
                commitQueue.push([node, newVnode.tag]);
        }
        else if (oldVnode == null || oldVnode.tag !== newVnode.tag) {
            commitQueue.push([parent, -1, newVnode]);
            if (oldVnode != null) {
                commitQueue.push([parent, node]);
            }
        }
        else {
            var oldKids = oldVnode.children;
            var newKids = newVnode.children;
            var oldStart = 0;
            var newStart = 0;
            var oldEnd = oldKids.length - 1;
            var newEnd = newKids.length - 1;
            var oldHead = oldKids[0];
            var newHead = newKids[0];
            var oldTail = oldKids[oldEnd];
            var newTail = newKids[newEnd];
            var oldKeyed = void 0;
            var oldIdx = void 0;
            var moveEl = void 0;
            while (oldStart <= oldEnd && newStart <= newEnd) {
                if (oldHead == null) {
                    oldHead = oldKids[++oldStart];
                }
                else if (oldTail == null) {
                    oldTail = oldKids[--oldEnd];
                }
                else if (newHead == null) {
                    oldHead = oldKids[++newStart];
                }
                else if (newTail == null) {
                    oldTail = oldKids[--newEnd];
                }
                else if (isSame(oldHead, newHead)) {
                    diff(null, null, oldHead, newHead);
                    oldHead = oldKids[++oldStart];
                    newHead = newKids[++newStart];
                }
                else if (isSame(oldTail, newTail)) {
                    diff(null, null, oldTail, newTail);
                    oldTail = oldKids[--oldEnd];
                    newTail = newKids[--newEnd];
                }
                else if (isSame(oldHead, newTail)) {
                    diff(null, null, oldHead, newTail);
                    //insert
                    oldHead = oldKids[++oldStart];
                    newTail = newKids[--newEnd];
                }
                else if (isSame(oldTail, newHead)) {
                    diff(null, null, oldHead, newTail);
                    //insert
                    oldTail = oldKids[--oldTail];
                    newHead = newKids[++newStart];
                }
                else {
                    if (oldKeyed == null) {
                        oldKeyed = createKeyed(oldKids, oldStart, oldEnd);
                    }
                    oldIdx = oldKeyed[newHead.key];
                    if (oldIdx != null) {
                        //insert
                        newHead = newKids[++newStart];
                    }
                    else {
                        moveEl = oldKids[oldIdx];
                        if (moveEl.tag !== newHead.tag) ;
                        else {
                            // diff
                            oldKids[oldIdx] = null;
                            // insert
                        }
                        newHead = newKids[++newStart];
                    }
                }
            }
        }
    }
    function createKeyed(kids, start, end) {
        var i, out = {}, key, kid;
        for (i = start; i <= end; i++) {
            kid = kids[i];
            if (kid != null) {
                key = kid.key;
                if (key !== undefined)
                    out[key] = i;
            }
        }
        return out;
    }
    function isSame(a, b) {
        return a.key === b.key && a.tag === b.tag;
    }
    function effect(fn) {
        var effect = function effect() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return run(effect, fn, args);
        };
        return effect;
    }
    function run(effect, fn, args) {
        if (effectStack.indexOf(effect) === -1) {
            try {
                effectStack.push(effect);
                return fn.apply(void 0, args);
            }
            finally {
                effectStack.pop();
            }
        }
    }
    function trigger(target, key) {
        var deps = targetMap.get(target);
        var effects = new Set();
        deps.get(key).forEach(function (e) { return effects.add(e); });
        effects.forEach(function (e) { return e(); });
    }
    function track(target, key) {
        var effect = effectStack[effectStack.length - 1];
        if (effect) {
            var depsMap = targetMap.get(target);
            if (!depsMap) {
                targetMap.set(target, (depsMap = new Map()));
            }
            var dep = depsMap.get(key);
            if (!dep) {
                depsMap.set(key, (dep = new Set()));
            }
            if (!dep.has(effect)) {
                dep.add(effect);
            }
        }
    }
    function callMethod(name, prams) {
        self.postMessage(JSON.stringify({
            type: WEB_API,
            name: name,
            prams: prams
        }), null);
    }

    var toProxy = new WeakMap();
    var toRaw = new WeakMap();
    var isObj = function (x) { return typeof x === 'object'; };
    function reactive(target) {
        if (!isObj(target))
            return target;
        var proxy = toProxy.get(target);
        if (proxy)
            return proxy;
        if (toRaw.has(target))
            return target;
        var handlers = {
            get: function (target, key, receiver) {
                var newValue = target[key];
                if (isObj(newValue)) {
                    return reactive(newValue);
                }
                var res = Reflect.get(target, key, receiver);
                track(target, key);
                return res;
            },
            set: function (target, key, value, receiver) {
                var res = Reflect.set(target, key, value, receiver);
                if (key in target)
                    trigger(target, key);
                return res;
            },
            deleteProperty: function (target, key, receiver) {
                return Reflect.defineProperty(target, key, receiver);
            }
        };
        var observed = new Proxy(target, handlers);
        toProxy.set(target, observed);
        toRaw.set(observed, target);
        if (!targetMap.has(target)) {
            targetMap.set(target, new Map());
        }
        return observed;
    }

    exports.h = h;
    exports.reactive = reactive;
    exports.render = render;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
