import {Client} from './core/Client';
import {Remote, Member, RemoteObject} from './sharedobject/Remote'
import {Validators as RV} from './sharedobject/Validators'
import EventEmitter = require("wolfy87-eventemitter");

@Remote
class ExampleMouse extends EventEmitter {
  @Member(RV.isNumber.isGreatOrEqual(0).isInteger)
  public x: number;
  @Member(RV.isNumber.isGreatOrEqual(0).isInteger)
  public y: number;
}

var s = new Client({
  sharedObjects: [ExampleMouse]
})

var miceRoom = new Room("mice", s);

s.on('newPeer', (peer: Peer) => {
  // Peer's owned pointer
  var peerMouse = s.createSharedObject<ExampleMouse>("mouse", ExampleMouse, peer);
  miceRoom.add(peerMouse);


  // either
  miceRoom.add(peer);
  // or
  // peer.watch(miceRoom);
});
