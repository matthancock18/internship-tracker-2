const sharp = require('sharp');
const path = require('path');

const SIZE = 1024;

// The T mark — clean, bold, perfectly centred
const tMark = `
  <rect x="192" y="248" width="640" height="112" rx="56" fill="#0EA5E9"/>
  <rect x="456" y="248" width="112" height="528" rx="56" fill="#0EA5E9"/>
`;

// Full icon: navy bg + glow + T
const iconSvg = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#0F172A"/>
  <radialGradient id="glow" cx="50%" cy="45%" r="42%">
    <stop offset="0%" stop-color="#0EA5E9" stop-opacity="0.15"/>
    <stop offset="100%" stop-color="#0EA5E9" stop-opacity="0"/>
  </radialGradient>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  ${tMark}
</svg>`;

// Splash: identical T, no background (expo-splash-screen composites it onto backgroundColor)
const splashSvg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="37" y="47" width="126" height="22" rx="11" fill="#0EA5E9"/>
  <rect x="89" y="47" width="22" height="106" rx="11" fill="#0EA5E9"/>
</svg>`;

// Android adaptive foreground: T centred in a 108dp safe zone on a 192×192 canvas
// Background is navy (#0F172A) supplied in app.json adaptiveIcon.backgroundColor
const androidFgSvg = `<svg width="432" height="432" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">
  <rect x="81" y="105" width="270" height="48" rx="24" fill="#0EA5E9"/>
  <rect x="192" y="105" width="48" height="222" rx="24" fill="#0EA5E9"/>
</svg>`;

// Android monochrome: same shape in white (system tints it)
const androidMonoSvg = `<svg width="432" height="432" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">
  <rect x="81" y="105" width="270" height="48" rx="24" fill="#FFFFFF"/>
  <rect x="192" y="105" width="48" height="222" rx="24" fill="#FFFFFF"/>
</svg>`;

const out = (name) => path.join(__dirname, '../assets/images', name);

sharp(Buffer.from(iconSvg))
  .resize(SIZE, SIZE)
  .png()
  .toFile(out('icon.png'))
  .then(() => console.log('✓ icon.png'))
  .then(() => sharp(Buffer.from(splashSvg)).resize(200, 200).png().toFile(out('splash-icon.png')))
  .then(() => console.log('✓ splash-icon.png'))
  .then(() => sharp(Buffer.from(androidFgSvg)).resize(432, 432).png().toFile(out('android-icon-foreground.png')))
  .then(() => console.log('✓ android-icon-foreground.png'))
  .then(() => sharp(Buffer.from(androidMonoSvg)).resize(432, 432).png().toFile(out('android-icon-monochrome.png')))
  .then(() => console.log('✓ android-icon-monochrome.png'))
  .catch(console.error);
