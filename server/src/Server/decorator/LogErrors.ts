export function LogErrors(target: any, propertyName: any, descriptor: any) {
	const method = descriptor.value;

	descriptor.value = function(...args: any) {
		try {
			return method.apply(target, args);
		} catch (error: any) {
			console.error(error);
		}
	};
}
