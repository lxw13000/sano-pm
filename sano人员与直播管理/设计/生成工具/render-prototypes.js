const fs=require('fs'),path=require('path');
const moduleRoot=process.argv[2]||'C:/Users/24725/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(moduleRoot,'sharp')),root=path.resolve(__dirname,'..'),out=path.join(root,'原型图');
const pages=JSON.parse(fs.readFileSync(path.join(__dirname,'pages.json'),'utf8'));
fs.mkdirSync(out,{recursive:true});
(async()=>{
 for(const page of pages){const file=path.join(out,page.file+'.png');await sharp(path.join(root,'源文件',page.file+'.svg')).png().toFile(file);const meta=await sharp(file).metadata();if(meta.width!==page.width||meta.height!==page.height)throw Error('Invalid size: '+page.file);console.log(page.file);}
 const thumbs=[];for(const [i,p]of pages.entries()){const thumb=await sharp(path.join(out,p.file+'.png')).resize(440,280,{fit:'contain',background:'#F5F7FB'}).toBuffer();thumbs.push({input:thumb,left:i%3*440,top:Math.floor(i/3)*280});}
 await sharp({create:{width:1320,height:Math.ceil(pages.length/3)*280,channels:4,background:'#E5EAF2'}}).composite(thumbs).png().toFile(path.join(out,'00-原型总览.png'));
 console.log('Rendered '+pages.length+' pages and overview.');
})().catch(e=>{console.error(e);process.exitCode=1;});
