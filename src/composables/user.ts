export interface Coins {
	type: string;
	amount: number;
}

export interface User {
	id: string;
	coins: Coins;
}

export const getUser = (): User => {
	return services.User.getUser();
};

export const getUserCoins = () => {
	return getUser().coins.amount;
};
