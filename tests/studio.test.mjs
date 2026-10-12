import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync,existsSync} from "node:fs";
import path from "node:path";
import vm from "node:vm";
const infra=path.resolve(import.meta.dirname,"..");
const shared=path.join(infra,"branding/studio");
const sites=["caddy/site","portfolio/site"];
const backup=process.env.REDESIGN_BACKUP;
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const read=file=>readFileSync(file,"utf8");
test("canonical studio tokens, accessible states and responsive layouts",()=>{
 const tokens=read(path.join(shared,"tokens.css"));
 for(const value of ["#ffffff","#080808","#5a5a5a","#d8d8d8","#f0f0f0","#146ef5","#1366e2","--radius-control:4px","--radius-card:8px","--page-width:1200px","--section-gap:80px"])assert.ok(tokens.includes(value),value);
 const css=read(path.join(shared,"components.css"));
 for(const feature of [":focus-visible","prefers-reduced-motion","max-width:900px","max-width:600px",".is-nav-open",".button:disabled"])assert.ok(css.includes(feature),feature);
 assert.match(css,/@media\(max-width:900px\)\{\s*\.hero\{grid-template-columns:minmax\(0,1fr\)/);
 assert.doesNotMatch(css,/Georgia|Times New Roman|(?:linear|radial)-gradient|box-shadow|text-shadow/);
 for(const file of walk(shared).filter(file=>file.endsWith(".css")))assert.equal((read(file).match(/{/g)||[]).length,(read(file).match(/}/g)||[]).length,file);
});
test("shared navigation, gallery and storage-denied behavior parses",()=>{
 const app=read(path.join(shared,"app.js"));new vm.Script(app);
 for(const feature of ['let preferredTheme = "light"','aria-controls','aria-expanded','"Escape"','trigger.focus()','role','serviceWorker']) {
  if(feature==="role")continue;assert.ok(app.includes(feature),feature);
 }
 assert.doesNotMatch(app,/pointermove|IntersectionObserver/);
 assert.match(app,/try \{[\s\S]*sessionStorage/);
});
for(const [index,site] of sites.entries()){
 const dir=path.join(infra,site),files=walk(dir);
 test(site+": all documents use the canonical design and preserve business links/content/SEO",()=>{
  for(const file of files.filter(file=>file.endsWith(".html"))){
   const html=read(file);
   assert.match(html,/styles\.css\?v=11/,file);
   assert.match(html,/class="skip-link"/,file);
   assert.match(html,/<main id="main-content" tabindex="-1"/,file);
   assert.doesNotMatch(html,/styles\.css\?v=7|app\.js\?v=5|brand-v2\.svg/,file);
   for(const [,url] of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)){
    const pathname=url.split(/[?#]/)[0];
    if(!/\.(css|js|svg|woff2|webmanifest)$/.test(pathname))continue;
    const disk=pathname.startsWith("/design/")?path.join(shared,pathname.slice(8)):path.join(dir,pathname.slice(1));
    assert.ok(existsSync(disk),file+": "+url);
   }
   if(backup){
    const before=read(path.join(backup,index===0?"strona":"portfolio",path.relative(dir,file)));
    const oldAnchors=[...before.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(match=>match[1]);
    for(const href of oldAnchors){
     const expected=href.replace(/\.svg\?v=3$/, ".svg?v=4");
     assert.ok(html.includes('href="'+expected+'"'),file+": removed navigation "+href);
    }
    const text=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,"").replace(/<[^>]*>/g," ").replace(/\s+/g," ");
    for(const [,oldText] of before.matchAll(/>([^<>]+)</g)){
     const clean=oldText.replace(/\s+/g," ").trim();
     if(!clean||clean.startsWith("{")||clean.startsWith("location."))continue;
     assert.ok(text.includes(clean),file+": removed text "+clean);
    }
    for(const [,meta] of before.matchAll(/(<meta\b[^>]*(?:name="description"|name="robots")[^>]*>)/g))assert.ok(html.includes(meta),file+": SEO changed");
    const fields=[...before.matchAll(/<(?:input|textarea|select)\b[^>]*name="([^"]*)"/g)].map(match=>match[1]);
    for(const field of fields)assert.ok(html.includes('name="'+field+'"'),file+": removed field "+field);
   }
  }
 });
 test(site+": one shared stylesheet and local licensed fonts",()=>{
  assert.equal(read(path.join(dir,"styles.css")).trim(),'/* Both sites consume the same canonical system. */\n@import url("/design/components.css?v=4");');
  const css=read(path.join(shared,"components.css"));
  assert.doesNotMatch(css,/fonts\.googleapis|fonts\.gstatic/);
  for(const [,url] of css.matchAll(/url\("([^"]+\.woff2)"\)/g))assert.equal(readFileSync(path.join(dir,url.slice(1))).subarray(0,4).toString(),"wOF2",url);
  for(const license of ["Inter-LICENSE.txt","JetBrains-Mono-LICENSE.txt"])assert.ok(existsSync(path.join(dir,"fonts",license)));
 });
 test(site+": scripts and offline cache parse; private routes never cached",()=>{
  for(const file of files.filter(file=>file.endsWith(".js")))new vm.Script(read(file),{filename:file});
  const sw=read(path.join(dir,"sw.js"));
  assert.match(sw,/studio-v6/);assert.match(sw,/styles\.css\?v=11/);assert.match(sw,/design\/tokens\.css\?v=1/);
  assert.match(sw,/pathname\.startsWith\("\/api\/"\)/);assert.match(sw,/pathname\.startsWith\("\/admin"\)/);
  assert.match(sw,/if \(response\.ok\)/);
 });
 test(site+": SVG XML attributes and references are consistent",()=>{
  for(const file of files.filter(file=>file.endsWith(".svg"))){
   const svg=read(file);
   for(const [,attrs] of svg.matchAll(/<[a-zA-Z][\w:-]*\s+([^<>]*?)\/?\s*>/g)){
    const names=[...attrs.matchAll(/([\w:-]+)\s*=\s*"[^"]*"/g)].map(match=>match[1]);
    assert.equal(names.length,new Set(names).size,file);
   }
   for(const [,id] of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(svg.includes('id="'+id+'"'),file);
  }
 });
 test(site+": Docker serves shared assets read-only",()=>{
  assert.match(read(path.join(infra,index===0?"strona":"portfolio","compose.yaml")),/branding\/studio:\/usr\/share\/nginx\/html\/design:ro/);
 });
 if(process.env.TEST_LOCAL_PREVIEW==="1")test(site+": all public routes, shared assets, fonts, APIs and 404 serve successfully",async()=>{
  const base="http://127.0.0.1:"+(index===0?8091:8092);
  const assets=new Set(["/styles.css?v=11","/design/components.css?v=4","/design/tokens.css?v=1","/design/motion.js?v=1","/design/app.js?v=6","/design/errors.css?v=1","/brand-studio.svg","/sw.js","/site.webmanifest?v=2"]);
  for(const file of files.filter(file=>file.endsWith(".html")&&!file.includes(path.sep+"errors"+path.sep))){
   const route="/"+path.relative(dir,file).split(path.sep).join("/").replace(/index\.html$/,"");
   const response=await fetch(base+route);assert.equal(response.status,200,route);
   const html=await response.text();assert.match(html,/styles\.css\?v=11/,route);
   for(const [,url] of html.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css|svg)(?:\?[^"]*)?)"/g))assets.add(url);
  }
  for(const [,url] of read(path.join(shared,"components.css")).matchAll(/url\("([^"]+\.woff2)"\)/g))assets.add(url);
  for(const asset of assets){
   const response=await fetch(base+asset);assert.equal(response.status,200,asset);
   if(asset==="/sw.js")assert.match(response.headers.get("cache-control"),/no-cache/);
   await response.arrayBuffer();
  }
  const missing=await fetch(base+"/__studio_missing__");assert.equal(missing.status,404);assert.match(await missing.text(),/error\.css\?v=3/);
  const status=await fetch(base+"/api/status");assert.equal(status.status,200);assert.ok((await status.json()).services);
 });
}
