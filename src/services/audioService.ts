import errorSoundUrl from "~/assets/error.mp3";
import failSoundUrl from "~/assets/fail.mp3";
import winSoundUrl from "~/assets/win.mp3";

export class AudioService {
	private audioCache = new Map<string, HTMLAudioElement>();

	constructor() {
		this.audioCache.set("win", new Audio(winSoundUrl));
		this.audioCache.set("fail", new Audio(failSoundUrl));
		this.audioCache.set("error", new Audio(errorSoundUrl));

		this.audioCache.forEach((audio) => {
			audio.preload = "auto";
		});
	}

	private playAudio(soundKey: string) {
		const audio = this.audioCache.get(soundKey);
		audio.volume = 0.5;
		audio.currentTime = 0;
		audio.play();
	}

	win() {
		this.playAudio("win");
	}

	fail() {
		this.playAudio("fail");
	}

	error() {
		this.playAudio("error");
	}
}
