import {Client} from './core/Client';
import {Remote, Member} from './sharedobject/Remote';
import {Validators as RV} from './sharedobject/Validators';
import EventEmitter = require('wolfy87-eventemitter');

var mySlide: HTMLInputElement = <HTMLInputElement>document.getElementById('client');
var serverSlide: HTMLInputElement = <HTMLInputElement>document.getElementById('server');

@Remote
class ExampleSyncedRanger extends EventEmitter {
  @Member(RV.isNumericString.isGreatOrEqual(0).isLessOrEqual(100))
  public value: string;
}

var c = new Client({
  sharedObjects: [ExampleSyncedRanger]
});

var myRanger: ExampleSyncedRanger;
var serverRanger: ExampleSyncedRanger;

c.on('newObject', (id, object) => {
  if (id === "clientRange") {
    myRanger = object;
  } else if (id == "serverRange") {
    serverRanger = object;
  }
  if (myRanger && serverRanger) {
    console.log(serverRanger);
    mySlide.onchange = function(v) {
      myRanger.value = mySlide.value;
    }

    serverRanger.on('change', function(v) {
      console.log("changed");
      serverSlide.value = serverRanger.value;
    })
  }
});
