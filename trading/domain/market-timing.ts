export interface RewardsWindow {
	name: string;
	day: number; // 0 = Sunday, 1 = Monday, etc.
	hour: number; // UTC hour
	duration: number; // hours
	impact: "high" | "medium" | "low";
	marketEffect: "crash" | "dip" | "recovery" | "neutral";
}

export interface DailyContent {
	type: "packs" | "sbc" | "objectives" | "unknown";
	tradeable: boolean;
	impact: "low" | "medium" | "high";
	description: string;
	playersAffected?: string[]; // positions, leagues, nations affected
}

export interface MarketTimingContext {
	currentTime: Date;
	londonTime: Date;
	isRewardsTime: boolean;
	activeReward?: RewardsWindow;
	lastReward?: {
		name: string;
		hoursAgo: number; // hours since last reward
		impact: "high" | "medium" | "low";
	};
	nextReward: {
		name: string;
		timeUntil: number; // hours until next reward
		impact: "high" | "medium" | "low";
	};
	upcomingRewards: Array<{
		name: string;
		day: string;
		timeUntil: number;
		impact: "high" | "medium" | "low";
	}>;
	dailyContent?: DailyContent; // Will be populated by API later
	dayOfWeek: string;
	hourLondon: number;
	marketPhase: "pre-reward" | "reward-active" | "post-reward" | "normal";
	recommendedStrategy: "sell" | "buy" | "hold" | "wait";
}

// Helper function to get London time from UTC
export const getLondonTime = (date: Date = new Date()): Date => {
	// London follows Europe/London timezone (GMT/BST)
	const londonTime = new Date(
		date.toLocaleString("en-US", { timeZone: "Europe/London" }),
	);
	return londonTime;
};

export const getRewardsWindows = (): RewardsWindow[] => {
	return [
		// Weekly Rewards
		{
			name: "Rivals Rewards",
			day: 4, // Thursday
			hour: 7, // 7 AM UTC
			duration: 3,
			impact: "high",
			marketEffect: "crash",
		},
		{
			name: "Weekend League Rewards",
			day: 1, // Monday
			hour: 7, // 7 AM UTC
			duration: 3,
			impact: "high",
			marketEffect: "crash",
		},
		{
			name: "Squad Battles Rewards",
			day: 0, // Sunday
			hour: 7, // 7 AM UTC
			duration: 2,
			impact: "medium",
			marketEffect: "dip",
		},
		{
			name: "TOTW Release",
			day: 3, // Wednesday
			hour: 18, // 6 PM UTC
			duration: 2,
			impact: "medium",
			marketEffect: "neutral",
		},
		// Daily 6 PM Content Drops
		{
			name: "Daily Content Drop",
			day: 0, // Sunday
			hour: 18,
			duration: 1,
			impact: "medium",
			marketEffect: "neutral",
		},
		{
			name: "Daily Content Drop",
			day: 1, // Monday
			hour: 18,
			duration: 1,
			impact: "medium",
			marketEffect: "neutral",
		},
		{
			name: "Daily Content Drop",
			day: 2, // Tuesday
			hour: 18,
			duration: 1,
			impact: "medium",
			marketEffect: "neutral",
		},
		{
			name: "Daily Content Drop",
			day: 4, // Thursday
			hour: 18,
			duration: 1,
			impact: "medium",
			marketEffect: "neutral",
		},
		{
			name: "Daily Content Drop",
			day: 5, // Friday
			hour: 18,
			duration: 1,
			impact: "medium",
			marketEffect: "neutral",
		},
		{
			name: "Daily Content Drop",
			day: 6, // Saturday
			hour: 18,
			duration: 1,
			impact: "medium",
			marketEffect: "neutral",
		},
	];
};

export const isRewardsTime = (date: Date = new Date()): boolean => {
	const londonTime = getLondonTime(date);
	const londonDay = londonTime.getDay();
	const londonHour = londonTime.getHours();

	return getRewardsWindows().some(
		(window) =>
			window.day === londonDay &&
			londonHour >= window.hour &&
			londonHour < window.hour + window.duration,
	);
};

export const getCurrentReward = (
	date: Date = new Date(),
): RewardsWindow | null => {
	const londonTime = getLondonTime(date);
	const londonDay = londonTime.getDay();
	const londonHour = londonTime.getHours();

	return (
		getRewardsWindows().find(
			(window) =>
				window.day === londonDay &&
				londonHour >= window.hour &&
				londonHour < window.hour + window.duration,
		) || null
	);
};

export const getUpcomingRewards = (
	date: Date = new Date(),
): Array<{ reward: RewardsWindow; date: Date; hoursUntil: number }> => {
	const now = date;
	const londonTime = getLondonTime(now);
	const windows = getRewardsWindows();
	const upcomingRewards: Array<{
		reward: RewardsWindow;
		date: Date;
		hoursUntil: number;
	}> = [];

	// Calculate upcoming rewards for next 7 days
	for (const window of windows) {
		// Create next occurrence in London time
		const nextLondonTime = new Date(londonTime);
		let daysUntil = (window.day - londonTime.getDay() + 7) % 7;

		// If it's the same day, check if the reward time has passed
		if (daysUntil === 0) {
			if (londonTime.getHours() >= window.hour) {
				// Reward time has passed today, get next occurrence
				if (window.name.includes("Daily Content")) {
					// For daily content, get tomorrow's occurrence
					daysUntil = 1;
				} else {
					// For weekly rewards, get next week's occurrence
					daysUntil = 7;
				}
			}
			// Otherwise use today's occurrence
		}

		nextLondonTime.setDate(nextLondonTime.getDate() + daysUntil);
		nextLondonTime.setHours(window.hour, 0, 0, 0);

		const hoursUntil =
			(nextLondonTime.getTime() - londonTime.getTime()) / (1000 * 60 * 60);

		// Only include truly future rewards
		if (hoursUntil > 0) {
			upcomingRewards.push({
				reward: window,
				date: nextLondonTime,
				hoursUntil,
			});
		}
	}

	// Sort by time until reward
	return upcomingRewards.sort((a, b) => a.hoursUntil - b.hoursUntil);
};

export const getNextRewardsTime = (
	date: Date = new Date(),
): { reward: RewardsWindow; date: Date; hoursUntil: number } => {
	const upcomingRewards = getUpcomingRewards(date);
	return upcomingRewards[0];
};

export const getLastReward = (
	date: Date = new Date(),
): { reward: RewardsWindow; hoursAgo: number } | null => {
	const londonTime = getLondonTime(date);
	const windows = getRewardsWindows();
	const pastRewards: Array<{ reward: RewardsWindow; hoursAgo: number }> = [];

	// Look for rewards that happened in the last 24 hours
	for (const window of windows) {
		// Check if this reward happened today
		if (window.day === londonTime.getDay()) {
			const todayReward = new Date(londonTime);
			todayReward.setHours(window.hour, 0, 0, 0);

			const hoursAgo =
				(londonTime.getTime() - todayReward.getTime()) / (1000 * 60 * 60);

			// Only include if it happened in the past (positive hours ago) and within 24 hours
			if (hoursAgo > 0 && hoursAgo <= 24) {
				pastRewards.push({
					reward: window,
					hoursAgo,
				});
			}
		} else {
			// Check previous occurrences for weekly rewards
			const rewardDate = new Date(londonTime);

			// Calculate days ago this reward occurred
			let daysAgo = (londonTime.getDay() - window.day + 7) % 7;
			if (daysAgo === 0) daysAgo = 7; // If same day, go back a week

			rewardDate.setDate(rewardDate.getDate() - daysAgo);
			rewardDate.setHours(window.hour, 0, 0, 0);

			const hoursAgo =
				(londonTime.getTime() - rewardDate.getTime()) / (1000 * 60 * 60);

			// Only include rewards that happened in the last 7 days
			if (hoursAgo > 0 && hoursAgo <= 168) {
				// 7 days = 168 hours
				pastRewards.push({
					reward: window,
					hoursAgo,
				});
			}
		}
	}

	// Return the most recent reward
	if (pastRewards.length === 0) return null;
	return pastRewards.sort((a, b) => a.hoursAgo - b.hoursAgo)[0];
};

export const getMarketPhase = (
	date: Date = new Date(),
): "pre-reward" | "reward-active" | "post-reward" | "normal" => {
	const currentReward = getCurrentReward(date);
	if (currentReward) return "reward-active";

	const { hoursUntil } = getNextRewardsTime(date);

	// Pre-reward: 6 hours before high impact rewards, 3 hours before medium impact
	if (hoursUntil <= 6) {
		const nextReward = getNextRewardsTime(date).reward;
		if (nextReward.impact === "high" && hoursUntil <= 6) return "pre-reward";
		if (nextReward.impact === "medium" && hoursUntil <= 3) return "pre-reward";
	}

	// Post-reward: Check if we're within 2 hours after any reward
	const windows = getRewardsWindows();
	for (const window of windows) {
		const rewardEndTime = new Date(date);
		const daysUntil = (window.day - date.getUTCDay() + 7) % 7;
		rewardEndTime.setUTCDate(rewardEndTime.getUTCDate() + daysUntil);
		rewardEndTime.setUTCHours(window.hour + window.duration, 0, 0, 0);

		const hoursSinceEnd =
			(date.getTime() - rewardEndTime.getTime()) / (1000 * 60 * 60);
		if (hoursSinceEnd >= 0 && hoursSinceEnd <= 2) return "post-reward";
	}

	return "normal";
};

export const getRecommendedStrategy = (
	phase: "pre-reward" | "reward-active" | "post-reward" | "normal",
	nextReward?: RewardsWindow,
): "sell" | "buy" | "hold" | "wait" => {
	switch (phase) {
		case "pre-reward":
			// Sell before high impact rewards, hold before medium impact
			return nextReward?.impact === "high" ? "sell" : "hold";
		case "reward-active":
			// Don't trade during rewards - too volatile
			return "wait";
		case "post-reward":
			// Buy the dip after rewards
			return "buy";
		case "normal":
			return "hold";
	}
};

// Placeholder for future API integration
export const getTodaysDailyContent = (
	date: Date = new Date(),
): DailyContent | null => {
	const londonTime = getLondonTime(date);

	// Check if content has already dropped today (after 6 PM London time)
	const hasContentDropped = londonTime.getHours() >= 18;

	if (hasContentDropped) {
		// TODO: Connect to API to get actual daily content
		// For now, return a placeholder to show content has dropped
		return {
			type: "unknown",
			tradeable: false,
			impact: "medium",
			description: "Daily content detected (API integration pending)",
			playersAffected: [],
		};
	}

	return null; // Content hasn't dropped yet today
};

export const getMarketTimingContext = (
	date: Date = new Date(),
): MarketTimingContext => {
	const londonTime = getLondonTime(date);
	const currentReward = getCurrentReward(date);
	const nextRewardInfo = getNextRewardsTime(date);
	const lastRewardInfo = getLastReward(date);
	const upcomingRewardsInfo = getUpcomingRewards(date);
	const marketPhase = getMarketPhase(date);
	const recommendedStrategy = getRecommendedStrategy(
		marketPhase,
		nextRewardInfo.reward,
	);
	const dailyContent = getTodaysDailyContent(date);

	const dayNames = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];

	// Format upcoming rewards for AI context (filter out daily content drops for cleaner display)
	const upcomingRewards = upcomingRewardsInfo
		.filter((reward) => !reward.reward.name.includes("Daily Content"))
		.map((reward) => ({
			name: reward.reward.name,
			day: dayNames[reward.reward.day],
			timeUntil: reward.hoursUntil,
			impact: reward.reward.impact,
		}));

	return {
		currentTime: date,
		londonTime,
		isRewardsTime: !!currentReward,
		activeReward: currentReward || undefined,
		lastReward: lastRewardInfo
			? {
					name: lastRewardInfo.reward.name,
					hoursAgo: lastRewardInfo.hoursAgo,
					impact: lastRewardInfo.reward.impact,
				}
			: undefined,
		nextReward: {
			name: nextRewardInfo.reward.name,
			timeUntil: nextRewardInfo.hoursUntil,
			impact: nextRewardInfo.reward.impact,
		},
		upcomingRewards,
		dailyContent: dailyContent || undefined,
		dayOfWeek: dayNames[londonTime.getDay()],
		hourLondon: londonTime.getHours(),
		marketPhase,
		recommendedStrategy,
	};
};
