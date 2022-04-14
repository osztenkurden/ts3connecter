import { WebSocketServer } from 'https://deno.land/x/websocket@v0.1.3/mod.ts';

import { SimpleWebSocket, convertEventToMessage } from './simple-websockets/index.ts';
import { AvailableArgumentTypes } from "./simple-websockets/util.ts";


type ListenerCallback = (socket: SimpleWebSocket, url: string) => void;

class SimpleWebSocketServer extends WebSocketServer {
	connectionListeners: ListenerCallback[];
	constructor(port = 8080, realIpHeader: string | null = null) {
		super(port, realIpHeader);
		this.connectionListeners = [];
		super.on('connection', (socket, request) => {
			const simpleSocket = new SimpleWebSocket(socket);

			this.connectionListeners.forEach(listener => {
				listener(simpleSocket, request);
			});
		});
	}
	onConnection(listener: ListenerCallback) {
		this.connectionListeners.push(listener);
	}
	send(eventName: string, ...values: AvailableArgumentTypes[]) {
		this.clients.forEach(socket => {
			socket.send(convertEventToMessage(eventName, ...values));
		});
	}
}

export { SimpleWebSocketServer, SimpleWebSocket };
