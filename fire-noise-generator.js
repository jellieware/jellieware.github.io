// TODO: HOW CAN THE AUDIO WORKLET BE AWARE OF SAMPLE RATE? currently using sampleRate, but not sure it knows what that is!
// TODO: SENDING ONLY FIRST INDEX OF PARAMETER ARRAY BECAUSE DON'T REALLY KNOW HOW TO IMPLEMENT IT! 

const TWO_PI = 6.28318530717958647693;
const map = (value, in_min, in_max, out_min, out_max) => (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
let currentNoise = 0;
const generateNewNoise = () => currentNoise = Math.random() * 2 - 1;

class Biquad
{
  constructor(type = "lowpass")
  {
    this.type = type;
    this.a0 = 1.0;
    this.a1 = 0.0;
    this.a2 = 0.0;
    this.b1 = 0.0;
    this.b2 = 0.0;
    this.Fc = 0.50;
    this.Q = 0.707;
    this.peakGain = 0.0;
    this.z1 = 0.0;
    this.z2 = 0.0;
    this.calcBiquad();
}

setFreq(freq)
{
    this.Fc = freq;
    this.calcBiquad();
}

setBiquad(type, freq, Q, peakGainDB)
{
    this.type = type;
    this.Fc = freq;
    this.Q = Q;
    this.peakGain = peakGainDB;
    this.calcBiquad();
}

calcBiquad()
{
    this.norm;
    this.V = Math.pow(10, Math.abs(this.peakGain) / 20.0);
    this.K = Math.tan(Math.PI * this.Fc);
    switch (this.type) {
        case "lowpass":
        this.norm = 1 / (1 + this.K / this.Q + this.K * this.K);
        this.a0 = this.K * this.K * this.norm;
        this.a1 = 2 * this.a0;
        this.a2 = this.a0;
        this.b1 = 2 * (this.K * this.K - 1) * this.norm;
        this.b2 = (1 - this.K / this.Q + this.K * this.K) * this.norm;
        break;

        case "highpass":
        this.norm = 1 / (1 + this.K / this.Q + this.K * this.K);
        this.a0 = 1 * this.norm;
        this.a1 = -2 * this.a0;
        this.a2 = this.a0;
        this.b1 = 2 * (this.K * this.K - 1) * this.norm;
        this.b2 = (1 - this.K / this.Q + this.K * this.K) * this.norm;
        break;

        case "bandpass":
        this.norm = 1 / (1 + this.K / this.Q + this.K * this.K);
        this.a0 = this.K / this.Q * this.norm;
        this.a1 = 0;
        this.a2 = -this.a0;
        this.b1 = 2 * (this.K * this.K - 1) * this.norm;
        this.b2 = (1 - this.K / this.Q + this.K * this.K) * this.norm;
        break;

        case "notch":
        this.norm = 1 / (1 + this.K / this.Q + this.K * this.K);
        this.a0 = (1 + this.K * this.K) * this.norm;
        this.a1 = 2 * (this.K * this.K - 1) * this.norm;
        this.a2 = this.a0;
        this.b1 = this.a1;
        this.b2 = (1 - this.K / this.Q + this.K * this.K) * this.norm;
        break;

        case "peak":
            if (this.peakGain >= 0) {    // boost
                this.norm = 1 / (1 + 1/this.Q * this.K + this.K * this.K);
                this.a0 = (1 + this.V/this.Q * this.K + this.K * this.K) * this.norm;
                this.a1 = 2 * (this.K * this.K - 1) * this.norm;
                this.a2 = (1 - this.V/this.Q * this.K + this.K * this.K) * this.norm;
                this.b1 = this.a1;
                this.b2 = (1 - 1/this.Q * this.K + this.K * this.K) * this.norm;
            }
            else {    // cut
                this.norm = 1 / (1 + this.V/this.Q * this.K + this.K * this.K);
                this.a0 = (1 + 1/this.Q * this.K + this.K * this.K) * this.norm;
                this.a1 = 2 * (this.K * this.K - 1) * this.norm;
                this.a2 = (1 - 1/this.Q * this.K + this.K * this.K) * this.norm;
                this.b1 = this.a1;
                this.b2 = (1 - this.V/this.Q * this.K + this.K * this.K) * this.norm;
            }
            break;
            case "lowshelf":
            if (this.peakGain >= 0) {    // boost
                this.norm = 1 / (1 + Math.sqrt(2) * this.K + this.K * this.K);
                this.a0 = (1 + Math.sqrt(2*this.V) * this.K + this.V * this.K * this.K) * this.norm;
                this.a1 = 2 * (this.V * this.K * this.K - 1) * this.norm;
                this.a2 = (1 - Math.sqrt(2*this.V) * this.K + this.V * this.K * this.K) * this.norm;
                this.b1 = 2 * (this.K * this.K - 1) * this.norm;
                this.b2 = (1 - Math.sqrt(2) * this.K + this.K * this.K) * this.norm;
            }
            else {    // cut
                this.norm = 1 / (1 + Math.sqrt(2*this.V) * this.K + this.V * this.K * this.K);
                this.a0 = (1 + Math.sqrt(2) * this.K + this.K * this.K) * this.norm;
                this.a1 = 2 * (this.K * this.K - 1) * this.norm;
                this.a2 = (1 - Math.sqrt(2) * this.K + this.K * this.K) * this.norm;
                this.b1 = 2 * (this.V * this.K * this.K - 1) * this.norm;
                this.b2 = (1 - Math.sqrt(2*this.V) * this.K + this.V * this.K * this.K) * this.norm;
            }
            break;
            case "highshelf":
            if (this.peakGain >= 0) {    // boost
                this.norm = 1 / (1 + Math.sqrt(2) * this.K + this.K * this.K);
                this.a0 = (this.V + Math.sqrt(2*this.V) * this.K + this.K * this.K) * this.norm;
                this.a1 = 2 * (this.K * this.K - this.V) * this.norm;
                this.a2 = (this.V - Math.sqrt(2*this.V) * this.K + this.K * this.K) * this.norm;
                this.b1 = 2 * (this.K * this.K - 1) * this.norm;
                this.b2 = (1 - Math.sqrt(2) * this.K + this.K * this.K) * this.norm;
            }
            else {    // cut
                this.norm = 1 / (this.V + Math.sqrt(2*this.V) * this.K + this.K * this.K);
                this.a0 = (1 + Math.sqrt(2) * this.K + this.K * this.K) * this.norm;
                this.a1 = 2 * (this.K * this.K - 1) * this.norm;
                this.a2 = (1 - Math.sqrt(2) * this.K + this.K * this.K) * this.norm;
                this.b1 = 2 * (this.K * this.K - this.V) * this.norm;
                this.b2 = (this.V - Math.sqrt(2*this.V) * this.K + this.K * this.K) * this.norm;
            }
            break;
        }
    }

    process(inValue) {
        let outValue = inValue * this.a0 + this.z1;
        this.z1 = inValue * this.a1 + this.z2 - this.b1 * outValue;
        this.z2 = inValue * this.a2 - this.b2 * outValue;
        return outValue;
    }
}

class Glide
{
  constructor()
  {
    this.a = 0.0;
    this.b = 0.0;
    this.z = 0.0;
}

init(startValue, glideTimeMS, sampleRate)
{
    this.z = startValue;
    // set coefficients
    this.a = Math.exp(-TWO_PI / (glideTimeMS * 0.001 * sampleRate));
    this.b = 1.0 - this.a;
} 

process(targetValue)
{
    this.z = (targetValue * this.b) + (this.z * this.a);
    return this.z;
}
}

class Roaring
{
  constructor()
  {
    this.gain = 1;
    this.noiseSeed = 1;

    this.bandPass = new Biquad();
    this.lop = new Biquad();
    this.lop2 = new Biquad();
    this.hip = new Biquad();

    this.bandPass.setBiquad("bandpass", 30 / sampleRate, 1.5, 2);
    this.lop.setBiquad("lowpass", 800 / sampleRate, 0.707, 2);
    this.lop2.setBiquad("lowpass", 2875 / sampleRate, 0.707, 2);
    this.hip.setBiquad("highpass", 30 / sampleRate, 0.707, 2);
}

setSize(value)
    { // value between 0 - 1
        // this.gain = Math.pow(value, 2.0);
        this.boomAmount = map(value, 0.0, 1.0, 100.0, 30.0);
        this.hip.setFreq(this.boomAmount/sampleRate);
        this.bandPass.setFreq(this.boomAmount/sampleRate);
        this.lopFreq = map(Math.pow(value, 2.5), 0.0, 1.0, 10.0, 800.0);
        this.lop.setFreq(this.lopFreq/sampleRate);
        this.noiseSeed = map(value, 0.0, 1.0, 0.02, 1.0);
    }

  generate(size = 1) // generate one sample of data
  {
    // adjust to size
    this.boomAmount = map(size, 0.0, 1.0, 100.0, 30.0);
        this.hip.setFreq(this.boomAmount/sampleRate);
        this.bandPass.setFreq(this.boomAmount/sampleRate);
        this.lopFreq = map(Math.pow(size, 2.5), 0.0, 1.0, 10.0, 800.0);
        this.lop.setFreq(this.lopFreq/sampleRate);
        this.noiseSeed = map(size, 0.0, 1.0, 0.02, 1.0);

    // noise1 wants to be EITHER +1 or -1
    this.noise1 = (Math.random() >= 0.5) * 2 - 1;
    this.noise2 = currentNoise;

    this.noise2 *= this.noiseSeed;

    this.noise2 = this.lop.process(this.noise2);

    this.noiseCombined = (this.noise1 * 0.5) * (this.noise2 * 0.5);1
    this.noiseCombined = this.bandPass.process(this.noiseCombined) * 40;
    this.noiseCombined = this.lop2.process(this.noiseCombined);

    this.output = this.hip.process(this.noiseCombined) * this.gain;

    return this.output;
}

}

class Hissing
{
  constructor()
  {
    this.gain = 1;
    this.noiseSeed = 1;

    this.lop = new Biquad();
    this.shelf = new Biquad();

    this.lop.setBiquad("lowpass", 100 / sampleRate, 2, 2);
    this.shelf.setBiquad("highshelf", 2000 / sampleRate, 0, 15);
}

setSize(value)
    { // value between 0 - 1
       // this.gain = Math.pow(value, 2.7); // was 1.2
        this.lopFreq = map(value, 0.0, 1.0, 10, 100.0);
        this.lop.setFreq(this.lopFreq/ sampleRate);
        this.noiseSeed = map(value, 0.0, 1.0, 0.02, 1.0);
    }

  generate(size = 1) // generate one sample of hiss
  {
        // adjust to size
        this.lopFreq = map(size, 0.0, 1.0, 10, 100.0);
        this.lop.setFreq(this.lopFreq/ sampleRate);
        this.noiseSeed = map(size, 0.0, 1.0, 0.02, 1.0);

      // noise2 wants to be EITHER +1 or -1
      this.noise1 = currentNoise;
      this.noise2 = (Math.random() >= 0.5) * 2 - 1;

      this.noise2 *= this.noiseSeed;

      // filter noise2
      this.noise2 = this.lop.process(this.noise2);

      this.noise2 * this.noise2 * this.noise2 * this.noise2;

          // multiply and set final volume
          this.output = (this.shelf.process(this.noise1 * this.noise2) * 0.04) * this.gain; // 0.04 used to be 0.08

          return this.output;
      }

  }

  class Crackling
  {
      constructor()
      {
        this.gain = 1;
        this.crackleAmount = 0.99975;
        this.env = new Glide();
        this.bandPass = new Biquad();
        this.lop = new Biquad();

        this.bandPass.setBiquad("bandpass", 1650 / sampleRate, 1.5, 2);
        this.lop.setBiquad("lowpass", 8200 / sampleRate, 0.707, 0);
    }

    setSize(value)
    {
        // this.gain = Math.pow(value, 0.5); 
        this.crackleAmount = map(Math.pow(value, 1.5), 0.0, 1.0, 1.0, 0.99975);
    }

  generate(size = 1) // generate one sample of crackle
  {
    // THIS WILL GENERATE MONO CRACKLES, BUT REALLY WE WANT TO THINK ABOUT MAKING LIKE A PARTICLE GENERATOR CLASS
    // THAT SPITS OUT A RANDOM CRACKLE IN A RANDOM PAN POSITION AT A RANDOM TIME

        // adjust to size
        this.crackleAmount = map(Math.pow(size, 1.5), 0.0, 1.0, 1.0, 0.99975);

        // calc per sample noise
        this.noise = currentNoise;

        if (this.noise > this.crackleAmount)
        {
          this.randomEnvTime = (Math.random() * 30) + 60;
          this.randomBandPassFreq = map(Math.random(), 0.0, 1.0, 1500.0, 16500.0);
          this.bandPass.setFreq(this.randomBandPassFreq / sampleRate);
          this.env.init(1, this.randomEnvTime, sampleRate);
      }

      this.noise = this.bandPass.process(this.noise);

      this.noise *= this.env.process(0);

        // take the high end off, to make it not sound like rain splatter
        this.noise = this.lop.process(this.noise);

        this.noise *= 0.1 * this.gain; // was also a '* 0.1' before

        return this.noise;
    }

}

class FireNoiseGenerator extends AudioWorkletProcessor
{
  constructor()
  {
    super();
    this.roaring = new Roaring();
    this.hissing = new Hissing();
    this.crackling = new Crackling();
}   

    static get parameterDescriptors()
    {
        return [{ name: 'size', defaultValue: 1}];
    }


process(inputs, outputs, parameters) {
    // INFO: outputs[devices][channel][frame]

    // grab parameter data
    const size = parameters.size;

    // loop through every frame
    for (let frame = 0; frame < outputs[0][0].length; ++frame)
    {
      // generate one random sample data and use that as the base for all DSP in this block
      // the three DSP algorithms will then just call on that variable rather than generating a new one (or more) every sample!
      generateNewNoise();

      let roar = this.roaring.generate(size[0]);
      let hiss = this.hissing.generate(size[0]);
      let crackle = this.crackling.generate(size[0]);

      let data = roar + crackle;

      // write out data
      for (let channel = 0; channel < outputs[0].length; ++channel)
      {
        outputs[0][channel][frame] = data;
    }
}

    // return true to keep alive
    return true;
}
}

registerProcessor('fire-noise-generator', FireNoiseGenerator);
