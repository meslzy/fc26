// @ts-expect-error: its custom module declaration
import errorSoundUrl from "url:~/assets/sounds/error.mp3";
// @ts-expect-error: its custom module declaration
import failSoundUrl from "url:~/assets/sounds/fail.mp3";
// @ts-expect-error: its custom module declaration
import successSoundUrl from "url:~/assets/sounds/success.mp3";

export class AudioManager {
  private isEnabled: boolean = true;

  private audioCache = new Map<string, HTMLAudioElement>();

  constructor() {
    this.audioCache.set("success", new Audio(successSoundUrl));
    this.audioCache.set("fail", new Audio(failSoundUrl));
    this.audioCache.set("error", new Audio(errorSoundUrl));

    this.audioCache.forEach((audio) => {
      audio.volume = 0.5;
      audio.preload = "auto";
    });
  }

  private playAudio(soundKey: string) {
    if (!this.isEnabled) return;

    const audio = this.audioCache.get(soundKey);

    audio.currentTime = 0;
    audio.play();
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
