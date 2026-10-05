let audio:AudioContext|undefined;
export function enableAudio(){try{audio??=new AudioContext();void audio.resume()}catch{/* Device may not support audio. */}}
export function notifyWarning(sound:boolean){navigator.vibrate?.([100,70,100]);if(!sound)return;try{if(!audio||audio.state!=='running')return;const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.frequency.value=740;gain.gain.value=0.08;oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+0.15)}catch{/* Visual warning remains available. */}}
