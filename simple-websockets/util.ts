
type AvailableArgumentTypes = string | number | Record<string, string> | null | undefined | AvailableArgumentTypes[];


const convertEventToMessage = (eventName: string, ...values: AvailableArgumentTypes[]) => {
	return JSON.stringify({ eventName, values });
};

const convertMessageToEvent = (data: string): { eventName: string; values: AvailableArgumentTypes[] } | null => {
	if (!data) return null;
	if (typeof data !== 'string') return null;
	try {
		const dataObject = JSON.parse(data);
		if (!dataObject.eventName && typeof dataObject.eventName !== 'string') return null;
		if (dataObject.values && !Array.isArray(dataObject.values)) return null;
		return {
			eventName: dataObject.eventName,
			values: dataObject.values || []
		};
	} catch {
		return null;
	}
};
export type { AvailableArgumentTypes };
export { convertEventToMessage, convertMessageToEvent,  };
