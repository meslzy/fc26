import { getPlayerPrices } from "~/api/futgg";
import { backgroundMessaging } from "~/shared/messaging/backgroundMessaging";

export default defineBackground(() => {
	backgroundMessaging.onMessage("log", (message) => {
		console.log("Background received log message:", message.data);
	});

	backgroundMessaging.onMessage("getPlayerPrices", (message) => {
		return getPlayerPrices(...message.data);
	});
});
