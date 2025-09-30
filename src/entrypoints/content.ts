import { backgroundMessaging } from "~/shared/messaging/backgroundMessaging";
import { contentMessaging } from "~/shared/messaging/contentMessaging";

export default defineContentScript({
	matches: ["https://*.ea.com/*"],
	async main() {
		contentMessaging.onMessage("log", (message) => {
			return backgroundMessaging.sendMessage("log", message.data);
		});

		contentMessaging.onMessage("getPlayerPrices", (message) => {
			return backgroundMessaging.sendMessage("getPlayerPrices", message.data);
		});

		await injectScript("/fc26.js", {
			keepInDom: true,
		});
	},
});
