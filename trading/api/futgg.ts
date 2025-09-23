export type Timeframe = "today" | "three" | "week" | "month" | "year";

export interface FutggGetPlayersOptions {
	minRate?: number;
	maxRate?: number;
	minPrice?: number;
	maxPrice?: number;
	page?: number;
}

export interface FutggGetMomentumPlayersOptions {
	special_cards?: boolean;
	minRate?: number;
	maxRate?: number;
	minPrice?: number;
	maxPrice?: number;
	hours?: "6" | "12" | "24";
	page?: number;
}

export interface FutggPlayer {
	id: number;
	eaId: number;
	name: string;
	rating: number;
	price: number;
	momentumPercentage: number;
	position: string;
	nation: string;
	club: string;
	league: string;
	faceStats: {
		pace: number;
		shooting: number;
		passing: number;
		dribbling: number;
		defending: number;
		physicality: number;
	};
	accelerateType: string;
	totalIgs: number;
	height: number;
	foot: string;
	weakFoot: number;
	skillMoves: number;
	rarityName: string;
	url: string;
}

export interface FutggTimeframe {
	hours: number;
	bucketMinutes: number;
}

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

export interface FutggCompletedAuction {
	soldDate: string;
	soldPrice: number;
}

export interface FutggLiveAuction {
	buyNowPrice: number;
	endDate: string;
	startingBid: number;
}

export interface FutggPriceHistory {
	date: string;
	price: number;
}

export interface FutggPriceRange {
	minPrice: number;
	maxPrice: number;
}

export interface FutggOverview {
	averageBin: number;
	cheapestSale: number;
	discardValue: number;
	yesterdayAverageBin: number;
}

export interface FutggMomentumUpdate {
	updatedAt: string;
	bin: number;
}

export interface FutggMomentum {
	lowestBin: number;
	highestBin: number;
	currentBinMomentum: number;
	lastUpdates: FutggMomentumUpdate[];
}

export interface FutggPlayerPrices {
	eaId: number;
	currentPrice: FutggPlayerPrice;
	completedAuctions: FutggCompletedAuction[];
	liveAuctions: FutggLiveAuction[];
	history: FutggPriceHistory[];
	priceRange: FutggPriceRange;
	overview: FutggOverview;
	momentum: FutggMomentum;
}

export interface FutGGPlayerPricesHistory {
	price: number;
	timestamp: number;
}

class Futgg {
	private readonly futggApiUrl = "https://www.fut.gg/api/fut/";

	private readonly headers = {
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
		Accept: "application/json, text/plain, */*",
		"Accept-Language": "en-GB,en;q=0.9",
		Origin: "https://www.fut.gg",
		Referer: "https://www.fut.gg/",
	};

	private readonly timeframes: Record<Timeframe, FutggTimeframe> = {
		today: { hours: 24, bucketMinutes: 30 },
		three: { hours: 72, bucketMinutes: 60 },
		week: { hours: 168, bucketMinutes: 120 },
		month: { hours: 720, bucketMinutes: 360 },
		year: { hours: 8760, bucketMinutes: 1440 },
	};

	private async fetchWithRetry(
		url: string,
		options: RequestInit = {},
		retries = 3,
	): Promise<Response> {
		for (let i = 0; i < retries; i++) {
			try {
				const response = await fetch(url, {
					...options,
					headers: {
						...this.headers,
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
	}

	private median(prices: number[]): number {
		if (prices.length === 0) return 0;
		prices.sort((a, b) => a - b);
		const mid = Math.floor(prices.length / 2);
		return prices.length % 2 !== 0
			? prices[mid]
			: (prices[mid - 1] + prices[mid]) / 2;
	}

	getPlayers = async (
		options: FutggGetPlayersOptions = {},
	): Promise<FutggPlayer[]> => {
		const { minRate, maxRate, minPrice, maxPrice, page = 1 } = options;

		const url = new URL("players/", this.futggApiUrl);
		url.searchParams.set("page", String(page));
		url.searchParams.set("quality_id", "2");
		if (minRate) url.searchParams.set("overall__gte", String(minRate));
		if (maxRate) url.searchParams.set("overall__lte", String(maxRate));
		if (minPrice) url.searchParams.set("price__gte", String(minPrice));
		if (maxPrice) url.searchParams.set("price__lte", String(maxPrice));

		const response = await this.fetchWithRetry(url.href);
		const data = await response.json();

		if (!data || !data.data) {
			throw new Error("No data received from API");
		}

		return data.data.map((player: any) => ({
			id: player.id,
			eaId: player.eaId,
			name: `${player.firstName} ${player.lastName}`,
			rating: player.overall,
			price: player.price,
			momentumPercentage: player.momentumPercentage,
			position: player.position,
			nation: player.nation.name,
			club: player.club.name,
			league: player.league.name,
			faceStats: {
				pace: player.faceStatsV2.facePace,
				shooting: player.faceStatsV2.faceShooting,
				passing: player.faceStatsV2.facePassing,
				dribbling: player.faceStatsV2.faceDribbling,
				defending: player.faceStatsV2.faceDefending,
				physicality: player.faceStatsV2.facePhysicality,
			},
			totalIgs: player.totalIgs,
			height: player.height,
			foot: player.foot,
			weakFoot: player.weakFoot,
			skillMoves: player.skillMoves,
			rarityName: player.rarityName,
			url: player.url,
		}));
	};

	getMomentumPlayers = async (
		options: FutggGetMomentumPlayersOptions = {},
	): Promise<FutggPlayer[]> => {
		const {
			special_cards,
			hours,
			minRate,
			maxRate,
			minPrice,
			maxPrice,
			page = 1,
		} = options;

		const url = new URL("players/v2/momentum/24", this.futggApiUrl);

		url.searchParams.set("page", String(page));
		url.searchParams.set("quality_id", "2");
		url.searchParams.set(
			"only_special_cards",
			special_cards ? "true" : "false",
		);

		if (hours) url.searchParams.set("hours", hours);
		if (minRate) url.searchParams.set("overall__gte", String(minRate));
		if (maxRate) url.searchParams.set("overall__lte", String(maxRate));
		if (minPrice) url.searchParams.set("price__gte", String(minPrice));
		if (maxPrice) url.searchParams.set("price__lte", String(maxPrice));

		const response = await this.fetchWithRetry(url.href);
		const data = await response.json();

		if (!data || !data.data) {
			throw new Error("No data received from API");
		}

		return data.data.map((player: any) => ({
			id: player.id,
			eaId: player.eaId,
			name: `${player.firstName} ${player.lastName}`,
			rating: player.overall,
			price: player.price,
			momentumPercentage: player.momentumPercentage,
			position: player.position,
			nation: player.nation.name,
			club: player.club.name,
			league: player.league.name,
			faceStats: {
				pace: player.faceStatsV2.facePace,
				shooting: player.faceStatsV2.faceShooting,
				passing: player.faceStatsV2.facePassing,
				dribbling: player.faceStatsV2.faceDribbling,
				defending: player.faceStatsV2.faceDefending,
				physicality: player.faceStatsV2.facePhysicality,
			},
			totalIgs: player.totalIgs,
			height: player.height,
			foot: player.foot,
			weakFoot: player.weakFoot,
			skillMoves: player.skillMoves,
			rarityName: player.rarityName,
			url: player.url,
		}));
	};

	getPlayerPrice = async (id: number): Promise<FutggPlayerPrice> => {
		const url = new URL("player-prices/26", this.futggApiUrl);
		url.searchParams.set("ids", String(id));
		const response = await this.fetchWithRetry(url.href);
		const data = await response.json();

		if (!data || !data.data || data.data.length === 0) {
			throw new Error(`No data found for player ID ${id}`);
		}

		return data.data[0];
	};

	getPlayerPrices = async (id: number): Promise<FutggPlayerPrices> => {
		const url = new URL(`player-prices/26/${id}`, this.futggApiUrl);
		const response = await this.fetchWithRetry(url.href);
		const data = await response.json();

		if (!data || !data.data) {
			throw new Error(`No data found for player ID ${id}`);
		}

		return data.data;
	};

	getPlayerPricesHistory = async (
		id: number,
		timeframe: Timeframe = "today",
	): Promise<FutGGPlayerPricesHistory[]> => {
		const playerData = await this.getPlayerPrices(id);
		if (!playerData || !playerData.completedAuctions.length) return [];

		const config = this.timeframes[timeframe];
		const bucketSize = config.bucketMinutes * 60 * 1000;

		const pairs: Array<[number, number]> = playerData.completedAuctions
			.map(
				(auction) =>
					[new Date(auction.soldDate).getTime(), auction.soldPrice] as [
						number,
						number,
					],
			)
			.sort((a, b) => a[0] - b[0]);

		if (!pairs.length) return [];

		const nowMs = pairs[pairs.length - 1][0];
		const cutoffTime = nowMs - config.hours * 60 * 60 * 1000;

		const relevantAuctions = pairs.filter(
			([timestamp]) => timestamp >= cutoffTime,
		);

		if (!relevantAuctions.length) return [];

		const buckets = new Map<number, number[]>();

		for (const [timestamp, price] of relevantAuctions) {
			const bucketTime = Math.floor(timestamp / bucketSize) * bucketSize;
			if (!buckets.has(bucketTime)) {
				buckets.set(bucketTime, []);
			}
			buckets.get(bucketTime)?.push(price);
		}

		let priceHistory: FutGGPlayerPricesHistory[] = Array.from(buckets.entries())
			.map(([timestamp, prices]) => ({
				timestamp,
				price: this.median(prices),
			}))
			.sort((a, b) => a.timestamp - b.timestamp);

		if (priceHistory.length > 600) {
			const step = Math.max(1, Math.floor(priceHistory.length / 600));
			priceHistory = priceHistory.filter((_, index) => index % step === 0);
		}

		return priceHistory;
	};

	getSeasonalProfile = async (
		id: number,
		timeframe: Timeframe = "week",
	): Promise<Record<string, number>> => {
		const playerData = await this.getPlayerPrices(id);
		if (
			!playerData ||
			!playerData.completedAuctions.length ||
			playerData.completedAuctions.length < 12
		) {
			return {};
		}

		const config = this.timeframes[timeframe];
		const cutoffTime = Date.now() - config.hours * 60 * 60 * 1000;

		const relevantAuctions = playerData.completedAuctions
			.filter((auction) => {
				const timestamp = new Date(auction.soldDate).getTime();
				return timestamp >= cutoffTime && auction.soldPrice > 0;
			})
			.map((auction) => ({
				timestamp: new Date(auction.soldDate).getTime(),
				price: auction.soldPrice,
			}));

		if (!relevantAuctions.length) return {};

		const buckets = new Map<string, number[]>();
		const allPrices: number[] = [];

		for (const { timestamp, price } of relevantAuctions) {
			const date = new Date(timestamp);
			const dayOfWeek = date.getUTCDay();
			const hour = date.getUTCHours();
			const key = `${dayOfWeek}:${hour}`;

			if (!buckets.has(key)) {
				buckets.set(key, []);
			}
			buckets.get(key)?.push(price);
			allPrices.push(price);
		}

		if (!allPrices.length) return {};

		const globalMedian = this.median(allPrices);
		const profile: Record<string, number> = {};

		for (const [key, prices] of buckets.entries()) {
			if (prices.length < 3) continue;

			const bucketMedian = this.median(prices);
			const relativeChange =
				((bucketMedian - globalMedian) / globalMedian) * 100;
			profile[key] = Number(relativeChange.toFixed(2));
		}

		return profile;
	};
}

export const futgg = new Futgg();
