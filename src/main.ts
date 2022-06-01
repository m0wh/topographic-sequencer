import * as Tone from 'tone'
import patterns from './patterns'
import bdSample from 'url:./kit/kick.wav'
import sdSample from 'url:./kit/snare.wav'
import hhSample from 'url:./kit/hat_close.wav'

const playBtn = document.querySelector('.transport .play')
const bpmInput = document.querySelector('.transport #bpm') as HTMLInputElement
const xSlider = document.querySelector('.form #x') as HTMLInputElement
const ySlider = document.querySelector('.form #y') as HTMLInputElement
const bdFillSlider = document.querySelector('.form #bd-fill') as HTMLInputElement
const sdFillSlider = document.querySelector('.form #sd-fill') as HTMLInputElement
const hhFillSlider = document.querySelector('.form #hh-fill') as HTMLInputElement

function lerp (start: number, end: number, amt: number): number { return (1 - amt) * start + amt * end }
// function scale (number: number, inMin: number, inMax: number, outMin: number, outMax: number): number { return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin }

function readPattern (x: number, y: number, step: number, instrument: number): number {
  const i = x >> 6
  const j = y >> 6
  const k = ((x / 64) % 1) * 256
  const l = ((y / 64) % 1) * 256

  const patA = patterns[i][j]
  const patB = patterns[i + 1][j]
  const patC = patterns[i][j + 1]
  const patD = patterns[i + 1][j + 1]

  const p = patA.map((_, n) => lerp(
    lerp(patA[n], patB[n], k / 255),
    lerp(patC[n], patD[n], k / 255),
    l / 255
  ))

  return p[step + 32 * instrument]
}

const instruments = [
  { name: 'Bass Drum', audio: bdSample, fill: 100, note: 'C1' },
  { name: 'Snare Drum', audio: sdSample, fill: 200, note: 'D1' },
  { name: 'Hi Hat', audio: hhSample, fill: 150, note: 'E1' }
]

const options = {
  x: 30,
  y: 235
}

let currentStep = 0

const sampler = new Tone.Sampler({
  urls: {
    C1: instruments[0].audio,
    D1: instruments[1].audio,
    E1: instruments[2].audio
  },
  onload: () => {
    playBtn.textContent = '▶'
    playBtn.addEventListener('click', () => { Tone.start() }, { once: true })
    playBtn.addEventListener('click', () => {
      if (Tone.Transport.state === 'stopped') {
        currentStep = 0
        Tone.Transport.start()
        playBtn.textContent = '■'
      } else {
        currentStep = 0
        Tone.Transport.stop()
        playBtn.textContent = '▶'
        updateView(0)
      }
    })
  }
}).toDestination()

Tone.Transport.bpm.value = 120
Tone.Transport.swing = 0

Tone.Transport.scheduleRepeat((time) => {
  instruments.forEach((instrument, i) => {
    const level = readPattern(options.x, options.y, currentStep, i)
    if (level > instrument.fill) {
      sampler.triggerAttack(instrument.note, time, level > 192 ? 1 : 0.6)
    }
  })

  updateView(currentStep)

  currentStep = (currentStep + 1) % 32
}, '32n')

function updateView (currentStep) {
  document.querySelectorAll('.view .inst').forEach((instEl, inst) => {
    instEl.querySelectorAll('.inst__steps .step').forEach((stepEl, step) => {
      const level = readPattern(options.x, options.y, step, inst)
      stepEl.setAttribute('class', `step ${level > instruments[inst].fill ? (level > 192 ? 'accent' : 'active') : ''} ${currentStep === step ? 'now' : ''}`)
    })
  })
}
updateView(0)

xSlider.value = options.x + ''
xSlider.addEventListener('change', (e) => { options.x = parseInt(xSlider.value) })
bpmInput.value = Tone.Transport.bpm.value + ''
bpmInput.addEventListener('change', (e) => { Tone.Transport.bpm.value = parseInt(bpmInput.value) })
ySlider.value = options.y + ''
ySlider.addEventListener('change', (e) => { options.y = parseInt(ySlider.value) })
bdFillSlider.value = 255 - instruments[0].fill + ''
bdFillSlider.addEventListener('change', (e) => { instruments[0].fill = 255 - parseInt(bdFillSlider.value) })
sdFillSlider.value = 255 - instruments[1].fill + ''
sdFillSlider.addEventListener('change', (e) => { instruments[1].fill = 255 - parseInt(sdFillSlider.value) })
hhFillSlider.value = 255 - instruments[2].fill + ''
hhFillSlider.addEventListener('change', (e) => { instruments[2].fill = 255 - parseInt(hhFillSlider.value) })
