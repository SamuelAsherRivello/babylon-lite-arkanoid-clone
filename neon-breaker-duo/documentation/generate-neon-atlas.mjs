import { deflateSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
const width=128,height=16,rgba=Buffer.alloc(width*height*4);
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16),255];
function px(x,y,c){if(x<0||x>=width||y<0||y>=height)return;rgba.set([...hex(c)],(y*width+x)*4);}
function rect(x,y,w,h,c){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)px(xx,yy,c);}
function cell(i,base,border,light,shadow){const x=i*16;rect(x,0,16,16,base);rect(x+1,1,14,2,light);rect(x+1,3,2,10,border);rect(x+3,12,12,3,shadow);rect(x+14,3,1,9,border);}
cell(0,'#fa48c4','#d929a9','#ffd5f4','#aa247f');rect(0+4,5,8,5,'#ff83df');
cell(1,'#29c9ff','#1b81bd','#d6faff','#175e98');for(let y=5;y<11;y++){rect(16+4,y,2,2,'#8bedff');rect(16+9,y,2,2,'#8bedff');}
for(let y=2;y<14;y++)for(let x=34;x<46;x++)if((x-40)**2+(y-8)**2<=25)px(x,y,y<7?'#fff6bc':y>10?'#d44f38':'#ffd44f');
rect(51,5,12,6,'#55f0d0');rect(52,4,10,1,'#eafff8');rect(53,3,8,1,'#a0fff0');rect(52,11,10,2,'#149baf');
rect(67,5,12,6,'#ff7eb9');rect(68,4,10,1,'#fff1f7');rect(69,3,8,1,'#ffc8e0');rect(68,11,10,2,'#c43e86');
rect(82,2,12,12,'#137f9b');rect(84,4,8,8,'#55f0d0');rect(84,7,8,2,'#e5fff9');rect(87,4,2,8,'#e5fff9');
rect(98,2,12,12,'#642a94');rect(100,4,8,8,'#e58cff');rect(102,8,4,2,'#fff0ff');rect(103,5,2,3,'#fff0ff');
rect(114,2,12,12,'#254e9f');rect(116,4,8,8,'#9dc8ff');rect(116,7,8,2,'#eaf4ff');rect(119,5,2,6,'#eaf4ff');
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),len=Buffer.alloc(4),check=Buffer.alloc(4);len.writeUInt32BE(data.length);check.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([len,name,data,check]);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
const rows=Buffer.alloc(height*(1+width*4));for(let y=0;y<height;y++)rgba.copy(rows,y*(1+width*4)+1,y*width*4,(y+1)*width*4);
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
await writeFile(new URL('../src/content/babylon/images/neon-brick-atlas.png',import.meta.url),png);
