import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const output = ts.transpileModule(fs.readFileSync('lib/theme-colors.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const colors = {};
new Function('exports', output)(colors);
const lum = hex => {
 const values = hex.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16)/255).map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4);
 return values.reduce((sum,n,i)=>sum+n*[0.2126,0.7152,0.0722][i],0);
};
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+0.05)/(Math.min(lum(a),lum(b))+0.05);
let checks=0, worst=100;
for(const [name,preset] of Object.entries({brand:{value:colors.brandAccentColor}})){
 const p=colors.createAccentPalette(preset.value), t=colors.createThemeColorTokens(preset.value);
 for(const mode of ['Light','Dark']){
  const glass=colors.getSurfaceContrastSamples(mode);
  const surfaces=['background','surface','surfaceHover','surfaceElevated','primaryContainer','primaryContainerHover'].map(role=>p[role+mode]).concat(glass.canvas,glass.cards,glass.fields);
  for(const text of ['textPrimary','textSecondary','textMuted','primaryInk']) for(const bg of surfaces){
   const contrast=ratio(p[text+mode],bg); worst=Math.min(worst,contrast);checks++;
   assert(contrast>=4.5,`${name} ${mode} ${text} ${bg}: ${contrast}`);
  }
  for(const fill of ['primary','primaryHover','primaryPressed']){checks++;assert(ratio(p[fill+mode],p['onPrimary'+mode])>=4.5,`${name} ${fill+mode} on-primary`);}
  for(const bg of [p['surface'+mode],p['surfaceElevated'+mode],...glass.fields]){checks++;assert(ratio(mode==='Light'?t.input:t.inputDark,bg)>=3,`${name} ${mode} input border`);}
 }
}
console.log(JSON.stringify({palettes:1,checks,minimumTextContrast:worst.toFixed(2),passed:true}));
