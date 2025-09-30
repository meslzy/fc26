import { CardPlugin } from "~/plugins/card";
import { TraderPlugin } from "~/plugins/trader";
import { TransferPlugin } from "~/plugins/transfer";

export default defineUnlistedScript(() => {
	const cardPlugin = new CardPlugin();
	const traderPlugin = new TraderPlugin();
	const transferPlugin = new TransferPlugin();

	cardPlugin.init();
	traderPlugin.init();
	transferPlugin.init();
});
