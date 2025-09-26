export function getValidPrice(price: number): number {
	if (price <= 1000) {
		return Math.floor(price / 50) * 50;
	}
	if (price <= 10000) {
		return Math.floor(price / 100) * 100;
	}
	if (price <= 50000) {
		return Math.floor(price / 250) * 250;
	}
	if (price <= 100000) {
		return Math.floor(price / 500) * 500;
	}
	return Math.floor(price / 1000) * 1000;
}

export function getNextLowerValidPrice(price: number): number {
	let step: number;

	if (price <= 1000) {
		step = 50;
	} else if (price <= 10000) {
		step = 100;
	} else if (price <= 50000) {
		step = 250;
	} else if (price <= 100000) {
		step = 500;
	} else {
		step = 1000;
	}

	return Math.max(0, price - step);
}
