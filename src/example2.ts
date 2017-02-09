import {Client} from './core/Client';
import {Remote, Member, RemoteObject} from './sharedobject/Remote'
import {Validators as RV} from './sharedobject/Validators'
import EventEmitter = require("wolfy87-eventemitter");

@Remote
class ExampleMouse {
  @Member(RV.isNumber.isGreatOrEqual(0).isInteger)
  public x: number;
  @Member(RV.isNumber.isGreatOrEqual(0).isInteger)
  public y: number;
}

var c = new Client({
  sharedObjects: [ExampleMouse]
})

var body = document.body;
var images: { [id: string]: HTMLImageElement } = {};
var ownMouse: RemoteObject&ExampleMouse;

body.onmousemove = function(ev) {
  console.log(ownMouse.__remoteInstance.id, ownMouse.__remoteInstance.own);
  ownMouse.x = ev.clientX;
  ownMouse.y = ev.clientY;
}

// Create an new image when a client joins the room
c.on('newObject', (obj: RemoteObject) => {
  if (obj instanceof ExampleMouse) {
    console.log(obj);
    if (obj.__remoteInstance.own === true) {
        ownMouse = obj;
        return;
    }

    var img = new Image();
    img.style.position = "absolute";

    img.onload = function() {
      body.appendChild(img);
    };

    img.src = 'http://icons.iconarchive.com/icons/icons8/windows-8/16/Very-Basic-Cursor-icon.png';

    images[obj.__remoteInstance.id] = img;
  }
})
// Update image's position when got new data
  .on('objectChange', (obj: RemoteObject) => {
  if (obj instanceof ExampleMouse) {
    console.log(obj);
    images[obj.__remoteInstance.id].style.left = ""+obj.x;
    images[obj.__remoteInstance.id].style.top = ""+obj.y;
  }
});
