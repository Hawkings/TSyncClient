import EventEmitter = require('wolfy87-eventemitter');
import {RemoteChangeOwnership as ChangeOwnership,
RemoteSetWriteDriver as SetWriteDriver,
RemoteUpdateMultipleValues as UpdateMultipleValues,
RemoteObject} from '../sharedobject/Remote';

// TODO: Configurable address
export class IClientConfig {
  sharedObjects?: [any]
}

export class Client extends EventEmitter {
  private sharedObjects: {
    [id: string]: {
      type: string,
      object: any
    }
  }

  private sharedObjectConstructors = {}
  private triggering: boolean = false;
  private ws: WebSocket;
  private packet: any = {};

  constructor(config: IClientConfig) {
    super();
    this.sharedObjects = {};

    if (config.sharedObjects) {
      config.sharedObjects.forEach((v) => {
        this.sharedObjectConstructors[v.name] = v;
      })
    }

    if ("WebSocket" in window) {
      var ws = this.ws = new WebSocket("ws://localhost:8080/", "tsync");
      ws.onopen = () => {
        console.log('WebSocket Client Connected');
        this.emit('connect')
      };

      ws.onmessage = (evt) => {
        var msg = evt.data;
        var json = JSON.parse(msg);
        console.log(json);
        // TODO: doesn't parse packets here, use a driver
        if ('newObjects' in json) {
          for (var id in json.newObjects) {
            var obj = json.newObjects[id];
            var result: RemoteObject = new this.sharedObjectConstructors[obj.type]();
            result.__remoteInstance.id = id;
            if (obj.path !== '') {
              ChangeOwnership(result, false);
              this.sharedObjects[id] = {
                type: obj.type,
                object: result
              };
            } else {
              var self = this;
              // TODO: Check ownership
              SetWriteDriver(result, function(key, value) {
                console.log(this.id);
                self.packet.objectChanges =
                self.packet.objectChanges || {};
                self.packet.objectChanges[this.id] =
                self.packet.objectChanges[this.id] || {};
                self.packet.objectChanges[this.id][key] = value;
                self.triggerUpdates()
              });
              this.sharedObjects[id] = {
                type: obj.type,
                object: result
              };
            }
            this.emit("newObject", result);
          }
        } else if ("objectChanges" in json) {
          for (var id in json.objectChanges) {
            console.log(this.sharedObjects, id);
            var o: RemoteObject = this.sharedObjects[id].object;
            if (o) {
              UpdateMultipleValues(o, json.objectChanges[id]);
              this.emit('objectChange', o, json.objectChanges[id]);
            }
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
    return this.sharedObjects[id].object;
  }

  triggerUpdates() {
    if (this.triggering)
      return;
    this.triggering = true;
    setTimeout((v) => {
      this.triggering = false;
      this.flush();
    },0);
  }

  private flush() {
    this.ws.send(JSON.stringify(this.packet));
    console.log(this.packet);
    this.packet = {};
  }

  private Drivers() {
    this.on('newObject', (obj: RemoteObject, owner: boolean) => {
      console.log('client@newObject');
    }).on('objectDestroy', (obj: RemoteObject) => {
      console.log('server@objectDestroy');
    }).on('joinRoom', (room) => {
      console.log('client@joinRoom');
    }).on('disconnect', () => {
      console.log('client@disconnect');
    }).on('objectChange', (obj: RemoteObject, changes: any) => {
      console.log('client@objectChange');
    })
  }
}
