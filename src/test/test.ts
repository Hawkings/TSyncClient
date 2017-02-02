import {NiceMeme} from "./MemeFactory";

function white() : string {
  return ""+new NiceMeme();
}

var d : HTMLElement = <HTMLElement>document.getElementById("h3h3");
d.innerHTML = white();
