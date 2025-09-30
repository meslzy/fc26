import { defineConfig } from "wxt";

export default defineConfig({
	srcDir: "src",
	webExt: {
		disabled: true,
	},
	manifest: {
		host_permissions: [
			"https://*.ea.com/*",
			"https://*.fut.gg/*",
		],
		web_accessible_resources: [
			{
				resources: ["fc26.js"],
				matches: ["https://*.ea.com/*"],
			},
		],
	},
});
