import {Client} from './core/Client';
import {Remote, Member, RemoteObject, RemoteUtils as rUtils} from './sharedobject/Remote'
import {Validators as RV} from './sharedobject/Validators'

@Remote
class ExampleMouse {
  @Member(RV.isNumber.isGreaterOrEqual(0).isInteger)
  public x: number;
  @Member(RV.isNumber.isGreaterOrEqual(0).isInteger)
  public y: number;
}

var c = new Client({
  sharedObjects: [ExampleMouse]
})

var body = document.body;
var ownMouse: RemoteObject&ExampleMouse;

body.onmousemove = function(ev) {
  ownMouse.x = ev.clientX;
  ownMouse.y = ev.clientY;
}

// Create an new image when a client joins the room
c.on('newObject', (obj: RemoteObject) => {
  if (obj instanceof ExampleMouse) {
    if (rUtils.GetOwn(obj)) {
        ownMouse = obj;
        return;
    }

    var img = new Image();
    img.style.position = "absolute";

    img.onload = function() {
      body.appendChild(img);
    };

    img.src = 'http://icons.iconarchive.com/icons/icons8/windows-8/16/Very-Basic-Cursor-icon.png';

    // Subscribe to changes. Every time this item changes, lets change
    // the cursor's image
    rUtils.Subscribe(obj, (o) => {
      img.style.left = ""+o.x;
      img.style.top = ""+o.y;
    });
  }
})
