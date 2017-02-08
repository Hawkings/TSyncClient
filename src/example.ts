import {Client} from './core/Client';
import {Remote, Member, RemoteObject} from './sharedobject/Remote';
import {Validators as RV} from './sharedobject/Validators';
import EventEmitter = require('wolfy87-eventemitter');

var mySlide: HTMLInputElement = <HTMLInputElement>document.getElementById('client');
var serverSlide: HTMLInputElement = <HTMLInputElement>document.getElementById('server');

@Remote
class ExampleSyncedRanger {
  @Member(RV.isNumericString.isGreatOrEqual(0).isLessOrEqual(100))
  public value: string;
}

var c = new Client({
  sharedObjects: [ExampleSyncedRanger]
});

var myRanger: ExampleSyncedRanger&RemoteObject;
var serverRanger: ExampleSyncedRanger&RemoteObject;

c.on('newObject', (object) => {
  if (object.__remoteInstance.id === "clientRange") {
    myRanger = object;
  } else if (object.__remoteInstance.id == "serverRange") {
    serverRanger = object;
  }
  if (myRanger && serverRanger) {
    console.log(serverRanger);
    mySlide.onchange = function(v) {
      myRanger.value = mySlide.value;
    }
  }
});

c.on('objectChange', (obj) => {
  serverSlide.value = serverRanger.value;
})
