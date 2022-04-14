// /import { serve } from "http/server.ts";
import { SimpleWebSocketServer, SimpleWebSocket } from "./sws.ts";
import { existsSync } from 'fs/exists.ts';
import { writeAll } from 'streams/conversion.ts';

const CONFIG_FILE = './config.json';

let config = { server: '', api: '', id: '' };

try {
  config = JSON.parse(Deno.readTextFileSync(CONFIG_FILE));
} catch {
  if(!existsSync(CONFIG_FILE)){
    Deno.writeTextFileSync(CONFIG_FILE, JSON.stringify(config));
  }
  console.log('There was an error during file read.');
  Deno.exit();
}

if(!config.server || !config.api){
  console.log('No valid config detected');
  Deno.exit();
}
let talking: string[] = [];

let sockets: SimpleWebSocket[] = [];

const updateConsoleText = () => {
  const text = '\n\n\n\n\tTS3 Voice Listener v0.1\n\tCurrently speaking: ' + talking.join(', ');
  const textBuffer = new TextEncoder().encode(text)
  console.clear();
  writeAll(Deno.stdout, textBuffer)
}


const wss = new SimpleWebSocketServer(4141);
console.log('\n\n\n')
console.log("\tTS3 Voice Listener v0.1");
console.log("\t");

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// deno-lint-ignore no-explicit-any
const areArraysSame = (array1: any[], array2: any[]) => (array1.length == array2.length) && array1.every((el, i) => el === array2[i]);
wss.onConnection(socket => {
  sockets.push(socket);
  socket.send("talkers", talking)
  socket.on('disconnect', () => {
    sockets = sockets.filter(sock => sock !== socket);
  })
});



const sendTalkingPeople = () => {
  sockets.forEach(socket => socket.send("talkers", talking))
  updateConsoleText();
}

const mainLoop = () => fetch(`${config.server}/${config.id || '1'}/clientlist?-voice`, { headers: { 'x-api-key':config.api}}).catch((e) => { console.log(e); mainLoop(); }).then(res => res?.json()).then(res => {
  if(!res || !res.body) return;
  // deno-lint-ignore no-explicit-any
  const ntalking = res.body.filter((client: any) => client.client_flag_talking === '1').map((client: any) => client.client_nickname) as string[];
	if(!areArraysSame(talking, ntalking)){
    talking = ntalking;
		sendTalkingPeople();
	}	
}).then(async () => {
  await wait(250);
  mainLoop();
})
mainLoop(); 