const futggApiUrl = "https://www.fut.gg/api/fut/";

const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
	for (let i = 0; i < retries; i++) {
		try {
			const response = await fetch(url, {
				...options,
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
					Accept: "application/json, text/plain, */*",
					"Accept-Language": "en-GB,en;q=0.9",
					Origin: "https://www.fut.gg",
					Referer: "https://www.fut.gg/",
					...options.headers,
				},
			});

			if (response.ok) return response;

			if (response.status === 429 && i < retries - 1) {
				console.warn(`Rate limited. Retrying in ${1000 * (i + 1)}ms...`);
				await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
				continue;
			}

			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		} catch (error) {
			if (i === retries - 1) throw error;
			await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
		}
	}

	throw new Error("Max retries exceeded");
};

export interface FutggPlayerPrice {
	eaId: number;
	price: number | null;
	isExtinct: boolean;
	isSbc: boolean;
	isObjective: boolean;
	isUntradeable: boolean;
	premiumSeasonPassLevel: number | null;
	standardSeasonPassLevel: number | null;
	priceUpdatedAt: string;
}

export const getPlayerPrices = async (...ids: number[]): Promise<FutggPlayerPrice[]> => {
	const url = new URL("player-prices/26/", futggApiUrl);
	url.searchParams.set("ids", ids.join(","));
	const response = await fetchWithRetry(url.href);
	const data = await response.json();

	if (!data || !data.data || data.data.length === 0) {
		throw new Error(`No data found for player IDs ${ids.join(", ")}`);
	}

	return data.data;
};
