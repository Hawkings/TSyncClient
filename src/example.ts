import {Client} from './core/Client';
import {Remote, Member, RemoteObject, RemoteUtils as rUtils} from './sharedobject/Remote';
import {Validators as RV} from './sharedobject/Validators';

var mySlide: HTMLInputElement = <HTMLInputElement>document.getElementById('client');
var serverSlide: HTMLInputElement = <HTMLInputElement>document.getElementById('server');

@Remote
class ExampleSyncedRanger {
  @Member(RV.isNumericString.isGreaterOrEqual(0).isLessOrEqual(100))
  public value: string;
}

var c = new Client({
  sharedObjects: [ExampleSyncedRanger]
});

var myRanger: ExampleSyncedRanger&RemoteObject;
var serverRanger: ExampleSyncedRanger&RemoteObject;

c.on('newObject', (object) => {
  if (rUtils.GetId(object) === "clientRange") {
    myRanger = object;
  } else if (rUtils.GetId(object) === "serverRange") {
    serverRanger = object;
  }
  if (myRanger && serverRanger) {
    mySlide.onchange = function(v) {
      myRanger.value = mySlide.value;
    }
  }
});

c.on('objectChange', (obj) => {
  serverSlide.value = serverRanger.value;
})
