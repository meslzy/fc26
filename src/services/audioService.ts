// @ts-expect-error: its custom module declaration
import errorSoundUrl from "data-base64:~/sounds/error.mp3";
// @ts-expect-error: its custom module declaration
import failSoundUrl from "data-base64:~/sounds/fail.mp3";
// @ts-expect-error: its custom module declaration
import winSoundUrl from "data-base64:~/sounds/win.mp3";

import type { SettingsManager } from "~/managers/settingsManager";

export class AudioService {
  private audioCache = new Map<string, HTMLAudioElement>();

  constructor(private settingsManager: SettingsManager) {
    this.audioCache.set("win", new Audio(winSoundUrl));
    this.audioCache.set("fail", new Audio(failSoundUrl));
    this.audioCache.set("error", new Audio(errorSoundUrl));

    this.audioCache.forEach((audio) => {
      audio.preload = "auto";
    });
  }

  private playAudio(soundKey: string) {
    const audio = this.audioCache.get(soundKey);
    audio.currentTime = 0;
    audio.volume = this.settingsManager.settings.search.soundsVolume;
    audio.play();
  }

  win() {
    if (this.settingsManager.settings.search.soundsVolume) {
      this.playAudio("win");
    }
  }

  fail() {
    if (this.settingsManager.settings.search.enableFailSound) {
      this.playAudio("fail");
    }
  }

  error() {
    if (this.settingsManager.settings.search.enableErrorSound) {
      this.playAudio("error");
    }
  }
}
