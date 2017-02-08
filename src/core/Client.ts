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
  private serverObjects: {
    [id: string]: {
      type: string,
      object: any
    }
  }

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
    this.serverObjects = {};

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
        // TODO: doesn't parse packets here, use a driver
        if ('newObjects' in json) {
          for (var id in json.newObjects) {
            var obj = json.newObjects[id];
            var result: RemoteObject = new this.sharedObjectConstructors[obj.type]();
            result.__remoteInstance.id = id;
            if (obj.path === '/') {
              ChangeOwnership(result, false);
              this.serverObjects[json.id] = {
                type: json.type,
                object: result
              };
            } else {
              // TODO: Check ownership
              SetWriteDriver(result, (key, value) => {
                this.packet.objectChanges =
                this.packet.objectChanges || {};
                this.packet.objectChanges[id] =
                this.packet.objectChanges[id] || {};
                this.packet.objectChanges[id][key] = value;
                this.triggerUpdates()
              });
              this.sharedObjects[json.id] = {
                type: json.type,
                object: result
              };
            }
            this.emit("newObject", result);
          }
        } else if ("objectChanges" in json) {
          // TODO: Check ownership
          for (var id in json.objectChanges) {
            var o: RemoteObject = this.serverObjects[json.id].object;
            if (o) {
              UpdateMultipleValues(o, json.objectChanges[id]);
              this.emit('objectChange', json);
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
    return this.serverObjects[id].object;
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
      // TODO: Notify owner (if still exists) of object
      // TODO: Remove object from rooms
      // TODO: Broadcast if object's owner is server
    }).on('joinRoom', (room) => {
      console.log('client@joinRoom');
    }).on('disconnect', () => {
      console.log('client@disconnect');
    }).on('objectChange', (obj: RemoteObject, changes: any) => {
      console.log('client@objectChange');
    })
  }
}
