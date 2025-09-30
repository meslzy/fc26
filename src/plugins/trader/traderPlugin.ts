import { AudioService } from "~/services/audioService";
import { LoggerService } from "~/services/loggerService";

export class TraderPlugin {
	audioService: AudioService;
	loggerService: LoggerService;

	stopButton: HTMLButtonElement;
	startButton: HTMLButtonElement;

	private start() {
		this.loggerService.addLog("Started");
		this.audioService.win();
	}

	private stop() {
		this.loggerService.addLog("Stopped");
		this.audioService.fail();
	}

	private createTraderContainer() {
		const container = document.createElement("div");
		container.style.height = "100%";
		container.style.width = "100%";
		container.style.display = "flex";
		container.style.flexDirection = "column";
		container.style.backgroundColor = "#201f26";
		container.style.borderRadius = "16px";
		container.style.overflow = "hidden";

		const itemsContainer = document.createElement("div");
		itemsContainer.style.flex = "1";
		itemsContainer.style.display = "flex";
		itemsContainer.style.flexDirection = "column";
		itemsContainer.style.gap = "1rem";

		const controlsContainer = document.createElement("div");
		controlsContainer.classList = "button-container";
		controlsContainer.style.padding = "16px";

		this.stopButton = createButton({
			text: "Stop",
			onclick: () => this.stop(),
		});

		this.startButton = createButton({
			text: "Start",
			variant: "primary",
			onclick: () => this.start(),
		});

		controlsContainer.appendChild(this.stopButton);
		controlsContainer.appendChild(this.startButton);

		container.appendChild(itemsContainer);
		container.appendChild(controlsContainer);

		return container;
	}

	private createContainer() {
		const container = document.createElement("div");
		container.style.height = "100%";
		container.style.width = "100%";
		container.style.position = "relative";
		container.style.overflow = "hidden";
		container.style.display = "flex";
		container.style.flexDirection = "row";

		const left = document.createElement("div");
		left.style.flex = "1";
		left.style.display = "flex";
		left.style.flexDirection = "column";
		left.style.padding = "2rem";
		left.style.paddingRight = "1rem";

		left.appendChild(this.createTraderContainer());

		const right = document.createElement("div");
		right.style.flex = "1";
		right.style.display = "flex";
		right.style.flexDirection = "column";
		right.style.padding = "2rem";
		right.style.paddingLeft = "1rem";

		this.loggerService.init(right);

		container.appendChild(left);
		container.appendChild(right);

		return container;
	}

	constructor() {
		this.loggerService = new LoggerService();
		this.audioService = new AudioService();
	}

	init() {
		const container = this.createContainer();

		const TraderView = function (this: any) {
			UTRootView.call(this);
		};

		JSUtils.inherits(TraderView, UTRootView);

		TraderView.prototype._generate = function _generate() {
			if (this.generated) return;
			this.__generated = true;
			this.__root = container;
		};

		const TraderController = function (this: any) {
			UTRootViewController.call(this);
		};

		JSUtils.inherits(TraderController, UTRootViewController);

		TraderController.prototype.viewDidAppear = function () {
			this.getNavigationController().setNavigationVisibility(true, true);
		};

		TraderController.prototype.getNavigationTitle = () => "Trader";

		TraderController.prototype._getViewInstanceFromData = () => new TraderView();

		const UTGameTabBarController_initWithViewControllers = UTGameTabBarController.prototype.initWithViewControllers;

		UTGameTabBarController.prototype.initWithViewControllers = function (tabs: any[]) {
			const traderNav = new UTGameFlowNavigationController();
			traderNav.initWithRootController(new TraderController());

			const tab = new UTTabBarItemView();
			tab.init();
			tab.setTag(6);
			tab.setText("Trader");
			tab.addClass("icon-transfer");
			traderNav.tabBarItem = tab;

			tabs.push(traderNav);

			UTGameTabBarController_initWithViewControllers.call(this, tabs);
		};
	}
}
