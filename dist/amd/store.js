var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "rxjs/BehaviorSubject", "aurelia-framework"], function (require, exports, BehaviorSubject_1, aurelia_framework_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Store = /** @class */ (function () {
        function Store(initialState) {
            this.logger = aurelia_framework_1.LogManager.getLogger("aurelia-store");
            this.devToolsAvailable = false;
            this.actions = new Map();
            this.initialState = initialState;
            this._state = new BehaviorSubject_1.BehaviorSubject(this.initialState);
            this.state = this._state.asObservable();
            this.setupDevTools();
        }
        Store.prototype.registerAction = function (name, reducer) {
            if (reducer.length !== 1) {
                throw new Error("The reducer is expected to have exactly one parameter, which will be the current state");
            }
            this.actions.set(reducer, { name: name, reducer: reducer });
        };
        Store.prototype.dispatch = function (reducer) {
            var _this = this;
            if (this.actions.has(reducer)) {
                var action_1 = this.actions.get(reducer);
                var result = action_1.reducer(this._state.getValue());
                if (!result && typeof result !== "object") {
                    throw new Error("The reducer has to return a new state");
                }
                var apply_1 = function (newState) {
                    _this._state.next(newState);
                    _this.updateDevToolsState(action_1.name, newState);
                };
                if (typeof result.then === "function") {
                    result.then(function (resolvedState) { return apply_1(resolvedState); });
                }
                else {
                    apply_1(result);
                }
            }
        };
        Store.prototype.setupDevTools = function () {
            var _this = this;
            if (window.devToolsExtension) {
                this.logger.info("DevTools are available");
                this.devToolsAvailable = true;
                this.devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect();
                this.devTools.init(this.initialState);
                this.devTools.subscribe(function (message) {
                    _this.logger.debug("DevTools sent change " + message.type);
                    if (message.type === "DISPATCH") {
                        _this._state.next(JSON.parse(message.state));
                    }
                });
            }
        };
        Store.prototype.updateDevToolsState = function (action, state) {
            if (this.devToolsAvailable) {
                this.devTools.send(action, state);
            }
        };
        Store = __decorate([
            aurelia_framework_1.autoinject()
        ], Store);
        return Store;
    }());
    exports.Store = Store;
});
