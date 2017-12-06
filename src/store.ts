import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

import {
  autoinject,
  LogManager
} from "aurelia-framework";
import { jump, StateHistory } from "./history";

export type NextState<T> = T | StateHistory<T>;
export type Reducer<T> = (state: NextState<T>, ...params: any[]) => NextState<T> | Promise<NextState<T>>;

@autoinject()
export class Store<T> {
  public readonly state: Observable<NextState<T>>;

  private logger = LogManager.getLogger("aurelia-store");
  private devToolsAvailable: boolean = false;
  private devTools: any;
  private actions: Map<Reducer<T>, { name: string, reducer: Reducer<T> }> = new Map();
  private _state: BehaviorSubject<NextState<T>>;

  constructor(private initialState: T, private undoable: boolean = false) {
    this._state = new BehaviorSubject<NextState<T>>(this.undoable ? { past: [], present: initialState, future: [] } : initialState);
    this.state = this._state.asObservable();

    this.setupDevTools();

    if (this.undoable) {
      this.registerHistoryMethods();
    }
  }

  public registerAction(name: string, reducer: Reducer<T>) {
    if (reducer.length === 0) {
      throw new Error("The reducer is expected to have one or more parameters, where the first will be the present state");
    }

    this.actions.set(reducer, { name, reducer });
  }

  public dispatch(reducer: Reducer<T>, ...params: any[]) {
    if (this.actions.has(reducer)) {
      const action = this.actions.get(reducer);
      const result = action!.reducer(this._state.getValue(), ...params);

      if (!result && typeof result !== "object") {
        throw new Error("The reducer has to return a new state");
      }

      const apply = (newState: T) => {
        this._state.next(newState);
        this.updateDevToolsState(action!.name, newState);
      }

      if (typeof (result as Promise<T>).then === "function") {
        (result as Promise<T>).then((resolvedState: T) => apply(resolvedState));
      } else {
        apply(result as T);
      }
    }
  }

  private setupDevTools() {
    if ((<any>window).devToolsExtension) {
      this.logger.info("DevTools are available");
      this.devToolsAvailable = true;
      this.devTools = (<any>window).__REDUX_DEVTOOLS_EXTENSION__.connect();
      this.devTools.init(this.initialState);

      this.devTools.subscribe((message: any) => {
        this.logger.debug(`DevTools sent change ${message.type}`);

        if (message.type === "DISPATCH") {
          this._state.next(JSON.parse(message.state));
        }
      });
    }
  }

  private updateDevToolsState(action: string, state: T) {
    if (this.devToolsAvailable) {
      this.devTools.send(action, state);
    }
  }

  private registerHistoryMethods() {
    this.registerAction("jump", jump);
  }
}
