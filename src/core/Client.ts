import EventEmitter = require('wolfy87-eventemitter');
import {RemoteChangeOwnership as ChangeOwnership,
  RemoteSetWriteDriver as SetWriteDriver,
  RemoteUpdateObjectKeyValue as UpdateKeyValue} from '../sharedobject/Remote';

// TODO: Configurable address
export class IClientConfig {
  sharedObjects?: [any]
}

export class Client extends EventEmitter {
  serverObjects: {
    [id: string]: {
      type: string,
      object: any
    }
  }

  sharedObjects: {
    [id: string]: {
      type: string,
      object: any
    }
  }

  sharedObjectConstructors = {}

  constructor(config: IClientConfig) {
    super();
    this.sharedObjects = {};
    this.serverObjects = {};

    if (config.sharedObjects) {
      config.sharedObjects.forEach((v) => {
        this.sharedObjectConstructors[v.name] = v;
      })
    }

    if ("WebSocket" in window) {
      var ws = new WebSocket("ws://localhost:8080/", "tsync");
      ws.onopen = () => {
        console.log('WebSocket Client Connected');
        this.emit('connect')
      };

      ws.onmessage = (evt) => {
        var msg = evt.data;
        var json = JSON.parse(msg);
        // TODO: doesn't parse packets here, use a driver
        if (json._ && json._ === "objectMetadata") {
          var result = new this.sharedObjectConstructors[json.type]();
          if (json.owner === '/') {
            console.log(result);
            ChangeOwnership(result, false);
            this.serverObjects[json.id] = {
              type: json.type,
              object: result
            };
          } else {
            // TODO: Check ownership
            SetWriteDriver(result, (key, value) => {
              ws.send(JSON.stringify({
                _: 'updateObject',
                id: json.id,
                k: key,
                v: value
              }))
            });
            this.sharedObjects[json.id] = {
              type: json.type,
              object: result
            };
          }
          this.emit("newObject", json.id, result);
        } else if (json._ && json._ === "updateObject") {
          // TODO: Check ownership
          var obj = this.serverObjects[json.id];
          if (obj) {
            UpdateKeyValue(obj.object, json.k, json.v);
            obj.object.emit('change', json);
          }
        }
      };

      ws.onclose = function() {
        console.log("Connection is closed...");
      };
    } else {
      throw "You must not be proud of your web explorer."
    }
  }

  getOwnObjectById(id: string) {
    return this.sharedObjects[id].object;
  }

  getServerObjectById(id: string) {
    return this.serverObjects[id].object;
  }
}
