import type {
	FutGGPlayerPricesHistory,
	FutggPlayer,
	FutggPlayerPrices,
} from "../api/futgg";
import type { ArbitrageOpportunity, MarketAnalysis } from "./types";

export class MarketAnalyzer {
	calculateVolatility(priceHistory: FutGGPlayerPricesHistory[]): number {
		if (priceHistory.length < 2) return 0;

		const prices = priceHistory.map((p) => p.price);
		const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
		const variance =
			prices.reduce((sum, price) => sum + (price - mean) ** 2, 0) /
			prices.length;
		const stdDev = Math.sqrt(variance);

		return (stdDev / mean) * 100; // return as percentage
	}

	calculateLiquidityScore(
		completedAuctions: number,
		timeframeDays: number = 7,
	): number {
		const auctionsPerDay = completedAuctions / timeframeDays;

		// Score based on auction frequency
		if (auctionsPerDay >= 10) return 100;
		if (auctionsPerDay >= 5) return 80;
		if (auctionsPerDay >= 2) return 60;
		if (auctionsPerDay >= 1) return 40;
		if (auctionsPerDay >= 0.5) return 20;
		return 10;
	}

	calculatePriceStability(
		volatility: number,
	): "stable" | "volatile" | "trending" {
		if (volatility < 5) return "stable";
		if (volatility > 20) return "volatile";
		return "trending";
	}

	calculateMarketTrend(
		priceHistory: FutGGPlayerPricesHistory[],
	): "bullish" | "bearish" | "sideways" {
		if (priceHistory.length < 3) return "sideways";

		const recent = priceHistory.slice(-5);
		const older = priceHistory.slice(-10, -5);

		if (recent.length === 0 || older.length === 0) return "sideways";

		const recentAvg =
			recent.reduce((sum, p) => sum + p.price, 0) / recent.length;
		const olderAvg = older.reduce((sum, p) => sum + p.price, 0) / older.length;

		const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

		if (changePercent > 5) return "bullish";
		if (changePercent < -5) return "bearish";
		return "sideways";
	}

	calculateSupplyLevel(auctionCount: number): "low" | "medium" | "high" {
		if (auctionCount < 5) return "low";
		if (auctionCount < 20) return "medium";
		return "high";
	}

	calculateDemandIndicator(
		completedAuctions: number,
		totalAuctions: number,
	): number {
		if (totalAuctions === 0) return 0;
		return (completedAuctions / totalAuctions) * 100;
	}

	analyzeMarket(
		player: FutggPlayer,
		playerPrices: FutggPlayerPrices,
		priceHistory: FutGGPlayerPricesHistory[],
	): MarketAnalysis {
		const volatility = this.calculateVolatility(priceHistory);
		const liquidityScore = this.calculateLiquidityScore(
			playerPrices.completedAuctions.length,
		);
		const priceStability = this.calculatePriceStability(volatility);
		const marketTrend = this.calculateMarketTrend(priceHistory);
		const supplyLevel = this.calculateSupplyLevel(
			playerPrices.liveAuctions.length,
		);
		const demandIndicator = this.calculateDemandIndicator(
			playerPrices.completedAuctions.length,
			playerPrices.completedAuctions.length + playerPrices.liveAuctions.length,
		);

		return {
			playerId: player.id,
			volatility,
			momentum: player.momentumPercentage || 0,
			liquidityScore,
			priceStability,
			marketTrend,
			supplyLevel,
			demandIndicator,
		};
	}

	findArbitrageOpportunities(
		player: FutggPlayer,
		playerPrices: FutggPlayerPrices,
	): ArbitrageOpportunity | null {
		const { liveAuctions, overview } = playerPrices;

		if (liveAuctions.length === 0) return null;

		const lowestBuyNow = Math.min(...liveAuctions.map((a) => a.buyNowPrice));
		const marketPrice = overview.averageBin;

		if (lowestBuyNow >= marketPrice) return null;

		// Calculate profit after 5% EA tax
		const netReceived = marketPrice * 0.95; // After 5% tax
		const potentialProfit = netReceived - lowestBuyNow;
		const profitMargin = (potentialProfit / lowestBuyNow) * 100;

		// Only consider if profit margin is at least 2% after tax
		if (profitMargin < 2) return null;

		// Calculate risk score (lower is better)
		const riskScore = this.calculateRiskScore(
			player,
			playerPrices,
			profitMargin,
		);

		return {
			playerId: player.id,
			eaId: player.eaId,
			playerName: player.name,
			currentMarketPrice: marketPrice,
			lowestBuyNowPrice: lowestBuyNow,
			potentialProfit,
			profitMargin,
			riskScore,
			auctionCount: liveAuctions.length,
			lastUpdated: new Date(),
		};
	}

	private calculateRiskScore(
		player: FutggPlayer,
		playerPrices: FutggPlayerPrices,
		profitMargin: number,
	): number {
		let risk = 50; // base risk

		// Lower risk for higher rated players
		risk -= Math.max(0, (player.rating - 80) * 2);

		// Lower risk for higher liquidity
		const liquidityScore = this.calculateLiquidityScore(
			playerPrices.completedAuctions.length,
		);
		risk -= liquidityScore * 0.3;

		// Higher risk for very high profit margins (too good to be true)
		if (profitMargin > 30) risk += 20;
		if (profitMargin > 50) risk += 30;

		// Lower risk for stable prices
		const priceHistory = playerPrices.completedAuctions.map((a) => ({
			timestamp: new Date(a.soldDate).getTime(),
			price: a.soldPrice,
		}));
		const volatility = this.calculateVolatility(priceHistory);
		risk += volatility * 0.5;

		return Math.max(0, Math.min(100, risk));
	}
}
