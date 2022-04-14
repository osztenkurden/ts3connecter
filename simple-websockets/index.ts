//import Socket from 'ws';
import { StandardWebSocketClient as Socket } from 'https://deno.land/x/websocket@v0.1.3/mod.ts';
import { convertEventToMessage, convertMessageToEvent, AvailableArgumentTypes } from './util.ts';

type AddEventListener = <K extends 'message' | 'close' | 'error' | 'open'>(
	type: K,
	listener: (this: WebSocket, ev: WebSocketEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions | undefined
) => void;

type Listener = (...args: AvailableArgumentTypes[]) => void;

interface EventDescriptor {
	listener: Listener;
	once: boolean;
}
class SimpleWebSocket {
	_socket: Socket;

	private events: Map<string, EventDescriptor[]>;
	private maxListeners: number;
	constructor(socket: Socket) {
		this.events = new Map();
		this._socket = socket;
		this.maxListeners = 10;

		const addEventListener = this._socket.addListener.bind(this._socket) as AddEventListener;

		addEventListener('open', () => {
			this.emit('connection');
		});
		// deno-lint-ignore no-explicit-any
		addEventListener('message', (event: any) => {
			this.handleData(event as string);
		});
		addEventListener('close', () => {
			this.emit('disconnect');
		});
	}

	eventNames = () => {
		const listeners = this.events.entries();
		const nonEmptyEvents: string[] = [];

		for (const entry of listeners) {
			if (entry[1] && entry[1].length > 0) {
				nonEmptyEvents.push(entry[0]);
			}
		}

		return nonEmptyEvents;
	};

	getMaxListeners = () => this.maxListeners;

	listenerCount = (eventName: string) => {
		const listeners = this.listeners(eventName);
		return listeners.length;
	};

	listeners = (eventName: string) => {
		const descriptors = this.events.get(eventName) || [];
		return descriptors.map(descriptor => descriptor.listener);
	};

	removeListener = (eventName: string, listener: Listener) => {
		return this.off(eventName, listener);
	};

	off = (eventName: string, listener: Listener) => {
		const descriptors = this.events.get(eventName) || [];

		this.events.set(
			eventName,
			descriptors.filter(descriptor => descriptor.listener !== listener)
		);
		this.emit('removeListener', eventName, listener);
		return this;
	};

	send(eventName: string, ...values: AvailableArgumentTypes[]) {
		//if (this._socket.webSocket?.readyState !== 1) return false;
		this._socket.send(convertEventToMessage(eventName, ...values));
		return true;
	}

	addListener = (eventName: string, listener: Listener) => {
		return this.on(eventName, listener);
	};

	on = (eventName: string, listener: Listener) => {
		const listOfListeners = [...(this.events.get(eventName) || [])];
		listOfListeners.push({ listener, once: false });
		this.events.set(eventName, listOfListeners);

		return this;
	};

	once = (eventName: string, listener: Listener) => {
		const listOfListeners = [...(this.events.get(eventName) || [])];

		listOfListeners.push({ listener, once: true });
		this.events.set(eventName, listOfListeners);

		return this;
	};

	prependListener = (eventName: string, listener: Listener) => {
		const listOfListeners = [...(this.events.get(eventName) || [])];

		listOfListeners.unshift({ listener, once: false });
		this.events.set(eventName, listOfListeners);

		return this;
	};

	// deno-lint-ignore no-explicit-any
	emit = (eventName: string, ...args: any[]) => {
		const listeners = this.events.get(eventName);
		if (!listeners || listeners.length === 0) return false;

		listeners.forEach(listener => {
			if (listener.once) {
				this.events.set(
					eventName,
					listeners.filter(listenerInArray => listenerInArray !== listener)
				);
			}
			listener.listener(...args);
		});
		return true;
	};

	prependOnceListener = (eventName: string, listener: Listener) => {
		const listOfListeners = [...(this.events.get(eventName) || [])];

		listOfListeners.unshift({ listener, once: true });
		this.events.set(eventName, listOfListeners);

		return this;
	};

	removeAllListeners = (eventName: string) => {
		this.events.set(eventName, []);
		return this;
	};

	setMaxListeners = (n: number) => {
		this.maxListeners = n;
		return this;
	};

	rawListeners = (eventName: string) => {
		return this.events.get(eventName) || [];
	};

	private handleData = (data: string) => {
		const dataObject = convertMessageToEvent(data);
		if (!dataObject) return;
		return this.emit(dataObject.eventName, ...dataObject.values);
	};
}

export { convertMessageToEvent, convertEventToMessage };
export { SimpleWebSocket };
