import {build} from 'esbuild';
import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
for(const entry of ['background','content','ui','post-link-bridge'])await build({entryPoints:[`src/${entry}.ts`],bundle:true,outfile:`dist/${entry}.js`,format:['content','post-link-bridge'].includes(entry)?'iife':'esm',target:'chrome120',minify:true,sourcemap:false});
await build({entryPoints:['src/core.ts'],outfile:'output/core.mjs',bundle:true,platform:'node',format:'esm'});
console.log('Built unpacked extension → dist/');
