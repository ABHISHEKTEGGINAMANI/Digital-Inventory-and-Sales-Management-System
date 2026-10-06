/**
 * ApexFlow Notification & Sound Effects Engine
 */

class NotificationEngine {
  constructor() {
    this.container = document.getElementById("toast-container");
    this.audioCtx = null;
    this.initAudio();
  }

  initAudio() {
    // Lazily initialize Web Audio API upon first user interaction
    const unlockAudio = () => {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };
    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("keydown", unlockAudio, { once: true });
  }

  playTone(freq, type = "sine", duration = 0.15, gain = 0.1) {
    try {
      const settings = window.appStore ? window.appStore.getSettings() : { soundAlerts: true };
      if (!settings.soundAlerts) return;

      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gainNode.gain.setValueAtTime(gain, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  playScanBeep() {
    this.playTone(987.77, "sine", 0.08, 0.15); // B5 note
  }

  playSuccessChime() {
    this.playTone(523.25, "triangle", 0.1, 0.12); // C5
    setTimeout(() => {
      this.playTone(659.25, "triangle", 0.15, 0.12); // E5
      setTimeout(() => {
        this.playTone(783.99, "triangle", 0.25, 0.15); // G5
      }, 100);
    }, 100);
  }

  playWarningAlert() {
    this.playTone(330, "sawtooth", 0.18, 0.12);
    setTimeout(() => {
      this.playTone(311.13, "sawtooth", 0.25, 0.12);
    }, 160);
  }

  show({ title, message, type = "info", duration = 3800 }) {
    if (!this.container) {
      this.container = document.getElementById("toast-container");
      if (!this.container) {
        this.container = document.createElement("div");
        this.container.id = "toast-container";
        this.container.className = "toast-container";
        document.body.appendChild(this.container);
      }
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
      this.playTone(784, "sine", 0.1, 0.08);
    } else if (type === "warning") {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      this.playWarningAlert();
    } else if (type === "danger") {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      this.playTone(220, "sawtooth", 0.2, 0.15);
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:2px;" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.3s, transform 0.3s";
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      setTimeout(() => toast.remove(), 320);
    }, duration);
  }

  success(title, message) {
    this.show({ title, message, type: "success" });
  }

  warning(title, message) {
    this.show({ title, message, type: "warning", duration: 5000 });
  }

  danger(title, message) {
    this.show({ title, message, type: "danger", duration: 6000 });
  }

  info(title, message) {
    this.show({ title, message, type: "info" });
  }
}

window.notifications = new NotificationEngine();
