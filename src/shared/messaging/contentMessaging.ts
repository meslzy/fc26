import { defineCustomEventMessaging } from "@webext-core/messaging/page";
import type { BackgroundMessaging } from "./backgroundMessaging";

export interface ContentMessaging extends BackgroundMessaging {}

export const contentMessaging = defineCustomEventMessaging<ContentMessaging>({
	namespace: "fc26-content-messaging",
});
