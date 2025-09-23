import { MODEL, openai } from "../api/ai";
import type { FutggPlayer } from "../api/futgg";
import { futgg } from "../api/futgg";
import { MarketAnalyzer } from "./analyzer";
import {
	getMarketTimingContext,
	type MarketTimingContext,
} from "./market-timing";
import type {
	AITradingRecommendation,
	TradingContext,
	TradingDecision,
} from "./types";

export class AITrader {
	private analyzer = new MarketAnalyzer();

	async getAITradingRecommendations(
		options: {
			minRate?: number;
			maxRate?: number;
			minPrice?: number;
			maxPrice?: number;
			maxPlayers?: number;
			useMomentum?: boolean;
		} = {},
	): Promise<AITradingRecommendation> {
		const {
			minRate = 80,
			maxRate = 90,
			minPrice = 5000,
			maxPrice = 50000,
			maxPlayers = 10,
			useMomentum = true,
		} = options;

		// Get market timing context
		const marketTiming = getMarketTimingContext();
		console.log(
			`⏰ Market Timing: ${marketTiming.marketPhase} | Recommended: ${marketTiming.recommendedStrategy.toUpperCase()}`,
		);
		const lastRewardDisplay = marketTiming.lastReward
			? `Last: ${marketTiming.lastReward.name} ${marketTiming.lastReward.hoursAgo.toFixed(1)}h ago`
			: "";

		const nextRewardDisplay = `Next: ${marketTiming.nextReward.name} in ${marketTiming.nextReward.timeUntil.toFixed(1)}h`;

		const timingDisplay = lastRewardDisplay
			? `${lastRewardDisplay} | ${nextRewardDisplay}`
			: nextRewardDisplay;

		console.log(
			`📅 ${marketTiming.dayOfWeek} ${marketTiming.hourLondon}:00 London | ${timingDisplay}`,
		);

		// Show weekly cycle
		console.log(`\n📅 Weekly Rewards Cycle:`);
		marketTiming.upcomingRewards.forEach((reward, i) => {
			const icon = i === 0 ? "🎯" : "📍";
			console.log(
				`   ${icon} ${reward.name} (${reward.day}) - ${reward.timeUntil.toFixed(1)}h (${reward.impact} impact)`,
			);
		});

		console.log(`🔍 Fetching players for AI analysis...`);

		// Get players using momentum or regular search
		const players = useMomentum
			? await futgg.getMomentumPlayers({
					minRate,
					maxRate,
					minPrice,
					maxPrice,
					special_cards: false,
					hours: "24",
				})
			: await futgg.getPlayers({
					minRate,
					maxRate,
					minPrice,
					maxPrice,
				});

		console.log(
			`📊 Found ${players.length} players, analyzing top ${Math.min(maxPlayers, players.length)}...`,
		);

		const recommendations: TradingDecision[] = [];
		const playersToAnalyze = players.slice(0, maxPlayers);

		for (let i = 0; i < playersToAnalyze.length; i++) {
			const player = playersToAnalyze[i];
			console.log(
				`🤖 Analyzing ${i + 1}/${playersToAnalyze.length}: ${player.name}...`,
			);

			try {
				const decision = await this.analyzePlayerForTrading(
					player,
					marketTiming,
				);
				if (decision) {
					recommendations.push(decision);
				}
			} catch (error) {
				console.error(`❌ Failed to analyze ${player.name}:`, error);
			}
		}

		// Sort by confidence and expected profit
		recommendations.sort((a, b) => {
			const scoreA =
				a.confidence * 0.6 + ((a.expectedProfit || 0) / 1000) * 0.4;
			const scoreB =
				b.confidence * 0.6 + ((b.expectedProfit || 0) / 1000) * 0.4;
			return scoreB - scoreA;
		});

		// Generate market overview
		const marketOverview = {
			totalPlayersAnalyzed: playersToAnalyze.length,
			bullishCount: recommendations.filter((r) => r.action === "buy").length,
			bearishCount: recommendations.filter((r) => r.action === "sell").length,
			highConfidenceCount: recommendations.filter((r) => r.confidence >= 75)
				.length,
			averageExpectedProfit:
				recommendations.reduce((sum, r) => sum + (r.expectedProfit || 0), 0) /
					recommendations.length || 0,
		};

		console.log(
			`✅ Analysis complete! Found ${recommendations.length} actionable opportunities`,
		);

		return {
			recommendations,
			marketOverview,
			timestamp: new Date(),
		};
	}

	private async analyzePlayerForTrading(
		player: FutggPlayer,
		marketTiming: MarketTimingContext,
	): Promise<TradingDecision | null> {
		try {
			// Get detailed player data
			const [playerPrices, priceHistory, seasonalPattern] = await Promise.all([
				futgg.getPlayerPrices(player.eaId),
				futgg.getPlayerPricesHistory(player.eaId, "three"),
				futgg.getSeasonalProfile(player.eaId, "week").catch(() => ({})),
			]);

			// Perform market analysis
			const marketAnalysis = this.analyzer.analyzeMarket(
				player,
				playerPrices,
				priceHistory,
			);
			const arbitrageData = this.analyzer.findArbitrageOpportunities(
				player,
				playerPrices,
			);

			// Build context for AI
			const context: TradingContext = {
				player: {
					id: player.id,
					eaId: player.eaId,
					name: player.name,
					rating: player.rating,
					position: player.position,
					price: player.price,
					momentumPercentage: player.momentumPercentage,
					stats: player.faceStats,
				},
				marketData: marketAnalysis,
				priceHistory,
				seasonalPattern,
				arbitrageData: arbitrageData || undefined,
				marketTiming, // Add market timing context
			};

			// Get AI decision
			const aiDecision = await this.getAIDecision(context);
			return aiDecision;
		} catch (error) {
			console.error(`Error analyzing ${player.name}:`, error);
			return null;
		}
	}

	private async getAIDecision(
		context: TradingContext,
	): Promise<TradingDecision | null> {
		const prompt = this.buildAnalysisPrompt(context);

		try {
			const response = await openai.chat.completions.create({
				model: MODEL,
				messages: [
					{
						role: "system",
						content: `You are an expert FIFA Ultimate Team trader. Analyze player data and provide trading recommendations based on market timing, momentum, and technical analysis. Always respond with valid JSON only.`,
					},
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.3,
				max_tokens: 1000,
			});

			const content = response.choices[0]?.message?.content;
			if (!content) return null;

			// Parse AI response
			const aiResponse = JSON.parse(content);

			// Validate and return decision
			return this.validateAIResponse(aiResponse, context);
		} catch (error) {
			console.error("AI decision error:", error);
			return null;
		}
	}

	private buildAnalysisPrompt(context: TradingContext): string {
		const { player, marketData, priceHistory, arbitrageData, marketTiming } =
			context;

		const recentPrices = priceHistory.slice(-5).map((p) => p.price);
		const priceChange =
			recentPrices.length >= 2
				? (
						((recentPrices[recentPrices.length - 1] - recentPrices[0]) /
							recentPrices[0]) *
						100
					).toFixed(1)
				: "0";

		// Timeframe explanations
		const timeframeInfo = `short: 1-6 hours (Quick flips, arbitrage, immediate opportunities)
medium: 6-48 hours (Event trading, Weekend League cycles, TOTW plays)
long: 2-7 days (Position building, meta investments, seasonal trends)`;

		return `Analyze this FIFA player for trading:

PLAYER INFO:
- Name: ${player.name}
- Rating: ${player.rating} OVR
- Position: ${player.position}
- Current Price: ${player.price.toLocaleString()} coins
- Momentum: ${player.momentumPercentage || 0}%

MARKET DATA:
- Volatility: ${marketData.volatility.toFixed(1)}%
- Liquidity Score: ${marketData.liquidityScore}/100
- Market Trend: ${marketData.marketTrend}
- Price Stability: ${marketData.priceStability}
- Supply Level: ${marketData.supplyLevel}
- Recent Price Change: ${priceChange}%

MARKET TIMING CONTEXT:
- Current Time: ${marketTiming.dayOfWeek} ${marketTiming.hourLondon}:00 London Time
- Market Phase: ${marketTiming.marketPhase}
- Recommended Strategy: ${marketTiming.recommendedStrategy}
${marketTiming.lastReward ? `- Last Reward: ${marketTiming.lastReward.name} ${marketTiming.lastReward.hoursAgo.toFixed(1)} hours ago (${marketTiming.lastReward.impact} impact)` : ""}
- Next Reward: ${marketTiming.nextReward.name} in ${marketTiming.nextReward.timeUntil.toFixed(1)} hours (${marketTiming.nextReward.impact} impact)
${marketTiming.activeReward ? `- ACTIVE REWARD: ${marketTiming.activeReward.name} (${marketTiming.activeReward.marketEffect} effect)` : ""}

WEEKLY REWARDS CYCLE (in order):
${marketTiming.upcomingRewards
	.map(
		(reward, i) =>
			`${i + 1}. ${reward.name} (${reward.day}) - ${reward.timeUntil.toFixed(1)}h (${reward.impact} impact)`,
	)
	.join("\n")}

DAILY CONTENT (6 PM London Time):
${
	marketTiming.dailyContent
		? `- Today's Content: ${marketTiming.dailyContent.description} (${marketTiming.dailyContent.type}, ${marketTiming.dailyContent.tradeable ? "tradeable" : "untradeable"}, ${marketTiming.dailyContent.impact} impact)
- Players Affected: ${marketTiming.dailyContent.playersAffected?.join(", ") || "Unknown"}`
		: "- Content detection not available yet (will be added via API later)"
}

STATS (relevant for demand):
- Pace: ${player.stats.pace}
- Shooting: ${player.stats.shooting}
- Passing: ${player.stats.passing}
- Dribbling: ${player.stats.dribbling}

${
	arbitrageData
		? `ARBITRAGE OPPORTUNITY:
- Market Price: ${arbitrageData.currentMarketPrice.toLocaleString()}
- Lowest Buy Now: ${arbitrageData.lowestBuyNowPrice.toLocaleString()}
- Potential Profit: ${arbitrageData.potentialProfit.toLocaleString()} (${arbitrageData.profitMargin.toFixed(1)}%)
- Risk Score: ${arbitrageData.riskScore}/100`
		: ""
}

TIMEFRAME DEFINITIONS:
${timeframeInfo}

CRITICAL: EA TAX CALCULATION
- Every sale has a 5% EA tax deducted from the selling price
- Example: Sell for 10,000 coins → You receive 9,500 coins (10,000 - 500 tax)
- ALWAYS calculate profit as: (sellPrice * 0.95) - buyPrice
- Never recommend trades with less than 6% profit margin to account for tax

Provide your analysis as JSON with this exact structure:
{
  "action": "buy" | "sell" | "hold",
  "confidence": <number 0-100>,
  "targetBuyPrice": <number or null>,
  "targetSellPrice": <number or null>,
  "expectedProfit": <number or null>,
  "reasoning": ["<reason1>", "<reason2>", "<reason3>"],
  "riskLevel": "low" | "medium" | "high",
  "timeframe": "short" | "medium" | "long"
}

PROFIT CALCULATION RULES:
- Expected profit MUST account for 5% EA tax
- Formula: expectedProfit = (targetSellPrice * 0.95) - targetBuyPrice
- Minimum profitable margin: 6% above buy price
- Example: Buy 10,000 → Must sell for 10,600+ to break even after tax

TRADING RULES BASED ON MARKET TIMING:
- PRE-REWARD: Sell valuable players before high impact rewards (Rivals/WL), hold for medium impact
- REWARD-ACTIVE: AVOID trading - market too volatile, prices crash during rewards
- POST-REWARD: BUY the dip - prices recover 1-2 hours after rewards end
- NORMAL: Focus on fundamentals - momentum, volatility, stats, arbitrage

DAILY CONTENT RULES (6 PM London Time):
- TRADEABLE PACKS: Market crashes due to supply increase - sell before, buy after
- UNTRADEABLE PACKS: Minimal market impact - continue normal trading
- SBC RELEASES: Spike demand for required players - buy affected positions/leagues before
- HERO/ICON SBC: Major market movement - high-rated players spike, others may dip
- OBJECTIVES: Check if rewards are tradeable - plan accordingly

GENERAL CONSIDERATIONS:
- High pace/dribbling players are meta and hold value better
- Momentum > 10% indicates rising demand
- Volatility > 15% means higher risk but potential reward
- Low supply + high demand = good buy opportunity
- Arbitrage opportunities with low risk scores are immediate buys
- ALWAYS consider market timing phase in your decision`;
	}

	private validateAIResponse(
		aiResponse: any,
		context: TradingContext,
	): TradingDecision | null {
		if (!aiResponse || typeof aiResponse !== "object") return null;

		const { player } = context;

		// Validate required fields
		if (!["buy", "sell", "hold"].includes(aiResponse.action)) return null;
		if (
			typeof aiResponse.confidence !== "number" ||
			aiResponse.confidence < 0 ||
			aiResponse.confidence > 100
		)
			return null;
		if (!Array.isArray(aiResponse.reasoning)) return null;

		// Recalculate profit with proper EA tax (5%)
		let correctedProfit = aiResponse.expectedProfit;
		if (aiResponse.targetBuyPrice && aiResponse.targetSellPrice) {
			const netReceived = aiResponse.targetSellPrice * 0.95; // After 5% EA tax
			correctedProfit = netReceived - aiResponse.targetBuyPrice;

			// If profit is negative or too small after tax, convert to hold
			if (correctedProfit < 0) {
				console.warn(
					`❌ Converted ${aiResponse.action} to HOLD - would lose ${Math.abs(correctedProfit)} coins after tax`,
				);
				return {
					playerId: player.id,
					eaId: player.eaId,
					playerName: player.name,
					currentPrice: player.price,
					action: "hold",
					confidence: Math.max(50, Math.round(aiResponse.confidence - 20)),
					targetBuyPrice: undefined,
					targetSellPrice: undefined,
					expectedProfit: undefined,
					reasoning: [
						"Tax calculation shows unprofitable trade",
						...aiResponse.reasoning.slice(0, 4),
					],
					riskLevel: "medium",
					timeframe: aiResponse.timeframe || "medium",
				};
			}
		}

		return {
			playerId: player.id,
			eaId: player.eaId,
			playerName: player.name,
			currentPrice: player.price,
			action: aiResponse.action,
			confidence: Math.round(aiResponse.confidence),
			targetBuyPrice: aiResponse.targetBuyPrice || undefined,
			targetSellPrice: aiResponse.targetSellPrice || undefined,
			expectedProfit: correctedProfit || undefined,
			reasoning: aiResponse.reasoning.slice(0, 5), // max 5 reasons
			riskLevel: aiResponse.riskLevel || "medium",
			timeframe: aiResponse.timeframe || "medium",
		};
	}
}
