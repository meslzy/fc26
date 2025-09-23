import { AITrader } from "./domain";

// Test AI Trading System
console.log("🚀 Starting AI Trading Analysis...\n");

const aiTrader = new AITrader();

try {
	const recommendations = await aiTrader.getAITradingRecommendations({
		minRate: 80,
		maxRate: 87,
		minPrice: 8000,
		maxPrice: 35000,
		maxPlayers: 20,
		useMomentum: true,
	});

	console.log(`\n${"=".repeat(60)}`);
	console.log("🎯 AI TRADING RECOMMENDATIONS");
	console.log("=".repeat(60));

	console.log(`\n📊 Market Overview:`);
	console.log(
		`• Players analyzed: ${recommendations.marketOverview.totalPlayersAnalyzed}`,
	);
	console.log(
		`• Buy opportunities: ${recommendations.marketOverview.bullishCount}`,
	);
	console.log(
		`• Sell opportunities: ${recommendations.marketOverview.bearishCount}`,
	);
	console.log(
		`• High confidence: ${recommendations.marketOverview.highConfidenceCount}`,
	);
	console.log(
		`• Avg expected profit: ${Math.round(recommendations.marketOverview.averageExpectedProfit).toLocaleString()} coins`,
	);

	console.log(`\n💰 Top Recommendations:`);
	recommendations.recommendations.slice(0, 10).forEach((rec, i) => {
		console.log(
			`\n${i + 1}. ${rec.playerName} (${rec.currentPrice.toLocaleString()} coins)`,
		);
		console.log(
			`   🎯 Action: ${rec.action.toUpperCase()} | Confidence: ${rec.confidence}% | Risk: ${rec.riskLevel}`,
		);

		// Show timeframe with explanation
		const timeframes = {
			short: "⚡ 1-6 hours (Quick flips, arbitrage)",
			medium: "📊 6-48 hours (Event trading, WL cycles)",
			long: "📈 2-7 days (Position building, meta plays)",
		};
		console.log(`   ⏱️  Timeframe: ${timeframes[rec.timeframe]}`);

		if (rec.targetBuyPrice) {
			console.log(
				`   💸 Target Buy: ${rec.targetBuyPrice.toLocaleString()} coins`,
			);
		}
		if (rec.targetSellPrice) {
			console.log(
				`   💰 Target Sell: ${rec.targetSellPrice.toLocaleString()} coins`,
			);
		}
		if (rec.expectedProfit) {
			console.log(
				`   📈 Expected Profit: ${rec.expectedProfit.toLocaleString()} coins`,
			);
		}

		console.log(`   📝 Reasoning: ${rec.reasoning.join(" • ")}`);
	});
} catch (error) {
	console.error("❌ Error during AI analysis:", error);
}
