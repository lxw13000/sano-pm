const fs=require('fs'),path=require('path');
const moduleRoot=process.argv[2];
if(!moduleRoot)throw Error('Usage: node render-prototypes.js <node_modules>');
const sharp=require(path.join(moduleRoot,'sharp'));
const root=path.resolve(__dirname,'..'),dir=path.join(root,'原型图');
const pages=JSON.parse(fs.readFileSync(path.join(__dirname,'pages.json'),'utf8'));
fs.mkdirSync(dir,{recursive:true});
(async()=>{
 for(const p of pages){const target=path.join(dir,p.file+'.png');await sharp(path.join(root,'源文件',p.file+'.svg')).png().toFile(target);const meta=await sharp(target).metadata();if(meta.width!==1672||meta.height!==941)throw Error('Invalid size '+p.file);console.log(p.file);}
 const composites=[];
 for(const [i,p] of pages.entries()){composites.push({input:await sharp(path.join(dir,p.file+'.png')).resize(418,235).toBuffer(),left:(i%4)*418,top:Math.floor(i/4)*235});}
 await sharp({create:{width:1672,height:Math.ceil(pages.length/4)*235,channels:4,background:'#e3e8f1'}}).composite(composites).png().toFile(path.join(dir,'00-原型总览.png'));
 console.log('Rendered '+pages.length+' PNGs and contact sheet.');
})().catch(e=>{console.error(e);process.exitCode=1;});
