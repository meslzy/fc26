import { defineExtensionMessaging } from "@webext-core/messaging";
import type { FutggPlayerPrice } from "~/api/futgg";

export interface BackgroundMessaging {
	log(data: string): void;
	getPlayerPrices: (ids: number[]) => Promise<FutggPlayerPrice[]>;
}

export const backgroundMessaging = defineExtensionMessaging<BackgroundMessaging>();
