// @ts-expect-error: its custom module declaration
import errorSoundUrl from "url:~/assets/sounds/error.mp3";
// @ts-expect-error: its custom module declaration
import failSoundUrl from "url:~/assets/sounds/fail.mp3";
// @ts-expect-error: its custom module declaration
import successSoundUrl from "url:~/assets/sounds/success.mp3";

export class AudioService {
	private isEnabled: boolean = true;
	private audioCache = new Map<string, HTMLAudioElement>();

	constructor() {
		this.preloadAudio();
	}

	setEnabled(enabled: boolean) {
		this.isEnabled = enabled;
	}

	private preloadAudio() {
		try {
			this.audioCache.set("success", new Audio(successSoundUrl));
			this.audioCache.set("fail", new Audio(failSoundUrl));
			this.audioCache.set("error", new Audio(errorSoundUrl));

			this.audioCache.forEach((audio) => {
				audio.volume = 0.5;
				audio.preload = "auto";
			});
		} catch (e) {
			console.log("Failed to preload audio files:", e);
		}
	}

	private playAudio(soundKey: string) {
		if (!this.isEnabled) return;

		try {
			const audio = this.audioCache.get(soundKey);
			if (audio) {
				audio.currentTime = 0;
				audio.play().catch((e) => {
					console.log(`Failed to play ${soundKey} sound:`, e);
				});
			}
		} catch (e) {
			console.log(`Sound playback failed for ${soundKey}:`, e);
		}
	}

	success() {
		this.playAudio("success");
	}

	fail() {
		this.playAudio("fail");
	}

	error() {
		this.playAudio("error");
	}
}
