document.addEventListener("DOMContentLoaded", () => {

    console.log("Archive Audio Engine Loaded");

    window.ArchiveEngine = {

    started: false,

    audio: {

        context: null,

        analyser: null,

        source: null,

        data: null

    },

    frequency: {

        sub: 0,

        kick: 0,

        mid: 0,

        high: 0,

        volume: 0

    },

    visual: {

    sub: 0,

    kick: 0,

    mid: 0,

    high: 0,

    volume: 0,

    glow: 0,

    scale: 1,

    depth: 0

}

};

    function startAudioEngine() {

    if (ArchiveEngine.started) return;

    if (!window.globalAudio) return;

    ArchiveEngine.audio.context =
        new AudioContext();

    ArchiveEngine.audio.source =
        ArchiveEngine.audio.context.createMediaElementSource(
            window.globalAudio
        );

    ArchiveEngine.audio.analyser =
        ArchiveEngine.audio.context.createAnalyser();

    ArchiveEngine.audio.analyser.fftSize = 512;

    ArchiveEngine.audio.data =
        new Uint8Array(
            ArchiveEngine.audio.analyser.frequencyBinCount
        );

    ArchiveEngine.audio.source.connect(
        ArchiveEngine.audio.analyser
    );

    ArchiveEngine.audio.analyser.connect(
        ArchiveEngine.audio.context.destination
    );

    ArchiveEngine.started = true;
    updateFrequency();
    updateVisuals();

    console.log("Archive Audio Engine Started");

}
function updateFrequency() {

    if (!ArchiveEngine.started) {

        requestAnimationFrame(updateFrequency);
        return;

    }

    ArchiveEngine.audio.analyser.getByteFrequencyData(
        ArchiveEngine.audio.data
    );

    const data = ArchiveEngine.audio.data;

    // Very simple band averages for now
    let sub = 0;
    let kick = 0;
    let mid = 0;
    let high = 0;

    for (let i = 0; i < 4; i++) sub += data[i];
    for (let i = 4; i < 8; i++) kick += data[i];
    for (let i = 8; i < 40; i++) mid += data[i];
    for (let i = 40; i < data.length; i++) high += data[i];

    ArchiveEngine.frequency.sub = (sub / 4) / 255;
    ArchiveEngine.frequency.kick = (kick / 4) / 255;
    ArchiveEngine.frequency.mid = (mid / 32) / 255;
    ArchiveEngine.frequency.high =
        (high / (data.length - 40)) / 255;

    ArchiveEngine.frequency.volume =
        (
            ArchiveEngine.frequency.sub +
            ArchiveEngine.frequency.kick +
            ArchiveEngine.frequency.mid +
            ArchiveEngine.frequency.high
        ) / 4;

        const root = document.documentElement;

root.style.setProperty(
    "--archive-sub",
    ArchiveEngine.frequency.sub
);

root.style.setProperty(
    "--archive-kick",
    ArchiveEngine.frequency.kick
);

root.style.setProperty(
    "--archive-mid",
    ArchiveEngine.frequency.mid
);

root.style.setProperty(
    "--archive-high",
    ArchiveEngine.frequency.high
);

root.style.setProperty(
    "--archive-volume",
    ArchiveEngine.frequency.volume
);
    requestAnimationFrame(updateFrequency);

}
function updateVisuals() {

    if (!ArchiveEngine.started) {

        requestAnimationFrame(updateVisuals);
        return;

    }

    const visual = ArchiveEngine.visual;
    const freq = ArchiveEngine.frequency;

    // Smooth each value
    visual.sub += (freq.sub - visual.sub) * 0.12;
    visual.kick += (freq.kick - visual.kick) * 0.18;
    visual.mid += (freq.mid - visual.mid) * 0.10;
    visual.high += (freq.high - visual.high) * 0.10;
    visual.volume += (freq.volume - visual.volume) * 0.08;

    // Derived visual properties
    visual.scale = 1 + visual.kick * 0.08;
    visual.glow = 20 + visual.sub * 90;
    visual.depth = visual.kick * 28;

    const root = document.documentElement;

    root.style.setProperty("--archive-scale", visual.scale);
    root.style.setProperty("--archive-glow", visual.glow + "px");
    root.style.setProperty("--archive-depth", visual.depth + "px");
    root.style.setProperty("--archive-sub", visual.sub);
    root.style.setProperty("--archive-kick", visual.kick);
    root.style.setProperty("--archive-mid", visual.mid);
    root.style.setProperty("--archive-high", visual.high);

    requestAnimationFrame(updateVisuals);

}
    window.globalAudio?.addEventListener(
        "play",
        startAudioEngine
    );

});