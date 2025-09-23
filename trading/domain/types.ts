export interface TradingDecision {
	playerId: number;
	eaId: number;
	playerName: string;
	currentPrice: number;
	action: "buy" | "sell" | "hold";
	confidence: number; // 0-100
	targetBuyPrice?: number;
	targetSellPrice?: number;
	expectedProfit?: number;
	reasoning: string[];
	riskLevel: "low" | "medium" | "high";
	timeframe: "short" | "medium" | "long"; // hours, days, weeks
}

export interface MarketAnalysis {
	playerId: number;
	volatility: number; // price volatility percentage
	momentum: number; // price momentum percentage
	liquidityScore: number; // how often player trades (0-100)
	priceStability: "stable" | "volatile" | "trending";
	marketTrend: "bullish" | "bearish" | "sideways";
	supplyLevel: "low" | "medium" | "high";
	demandIndicator: number; // auction completion rate
}

export interface ArbitrageOpportunity {
	playerId: number;
	eaId: number;
	playerName: string;
	currentMarketPrice: number;
	lowestBuyNowPrice: number;
	potentialProfit: number;
	profitMargin: number; // percentage
	riskScore: number; // 0-100, lower is better
	auctionCount: number;
	lastUpdated: Date;
}

export interface TradingContext {
	player: {
		id: number;
		eaId: number;
		name: string;
		rating: number;
		position: string;
		price: number;
		momentumPercentage?: number;
		stats: {
			pace: number;
			shooting: number;
			passing: number;
			dribbling: number;
			defending: number;
			physicality: number;
		};
	};
	marketData: MarketAnalysis;
	priceHistory: Array<{
		timestamp: number;
		price: number;
	}>;
	seasonalPattern?: Record<string, number>;
	arbitrageData?: ArbitrageOpportunity;
	marketTiming: import("./market-timing").MarketTimingContext;
}

export interface AITradingRecommendation {
	recommendations: TradingDecision[];
	marketOverview: {
		totalPlayersAnalyzed: number;
		bullishCount: number;
		bearishCount: number;
		highConfidenceCount: number;
		averageExpectedProfit: number;
	};
	timestamp: Date;
}
