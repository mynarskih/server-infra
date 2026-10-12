import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import path from "node:path";
const source=readFileSync(path.resolve(import.meta.dirname,"../branding/studio/motion.js"),"utf8");
function page({reduced=false,intersection=true,animation=true,throws=false}={}){
 const events={},documentEvents={},mediaEvents={},observers=[],mutations=[],calls=[];
 const preference={matches:reduced,addEventListener:(name,cb)=>mediaEvents[name]=cb};
 const main={nodeType:1,children:[],events:{},matches:()=>false,querySelectorAll:()=>main.children,addEventListener:(name,cb)=>main.events[name]=cb};
 function element(top){
  const el={nodeType:1,dataset:{},parentElement:main,focused:false,matches:selector=>selector===":focus-within"?el.focused:true,querySelectorAll:()=>[],getBoundingClientRect:()=>({top,height:180}),contains:node=>node===el};
  el.animate=(frames,options)=>{
   if(throws)throw new Error("Unsupported");
   const listeners={};
   const effect={cancelled:false,addEventListener:(name,cb)=>listeners[name]=cb,cancel(){this.cancelled=true;listeners.cancel?.();},finish:()=>listeners.finish?.()};
   calls.push({el,frames,options,effect});return effect;
  };
  main.children.push(el);return el;
 }
 const visible=element(80),below=element(1000),last=element(1400);
 class Observer{
  constructor(callback,options){this.callback=callback;this.options=options;this.targets=new Set();observers.push(this);}
  observe(el){this.targets.add(el);}unobserve(el){this.targets.delete(el);}disconnect(){this.targets.clear();}
  enter(el,ratio=0.5){this.callback([{target:el,isIntersecting:true,intersectionRatio:ratio}]);}
 }
 class Changes{constructor(cb){this.callback=cb;mutations.push(this);}observe(){this.connected=true;}disconnect(){this.connected=false;}add(el){this.callback([{addedNodes:[el]}]);}}
 class HtmlElement{}
 if(animation)HtmlElement.prototype.animate=()=>{};
 const context={window:intersection?{IntersectionObserver:Observer}:{},IntersectionObserver:Observer,HTMLElement:HtmlElement,MutationObserver:Changes,matchMedia:()=>preference,innerHeight:800,addEventListener:(name,cb)=>events[name]=cb,document:{hidden:false,readyState:"complete",querySelector:()=>main,addEventListener:(name,cb)=>documentEvents[name]=cb}};
 vm.runInNewContext(source,context);
 return {main,visible,below,last,observers,mutations,calls,context,preference,element,events,documentEvents,setReduced(value){preference.matches=value;mediaEvents.change?.();}};
}
test("unsupported animation/intersection APIs leave content untouched",()=>{
 for(const options of [{intersection:false},{animation:false}]){
  const p=page(options);assert.equal(p.observers.length,0);assert.equal(p.calls.length,0);assert.deepEqual(p.below.dataset,{});
 }
 assert.doesNotMatch(source,/style\.(?:opacity|visibility|display)|aria-hidden|\.hidden\s*=/);
});
test("reduced motion does not observe or animate content",()=>{
 const p=page({reduced:true});assert.equal(p.observers.length,0);assert.equal(p.calls.length,0);assert.deepEqual(p.below.dataset,{});
});
test("above-fold content remains static; lower cards reveal once on scroll",()=>{
 const p=page(),observer=p.observers[0];
 assert.equal(p.visible.dataset.scrollReveal,"static");assert.equal(p.below.dataset.scrollReveal,"pending");assert.equal(p.calls.length,0);
 observer.enter(p.below,0.08);assert.equal(p.calls.length,0);
 observer.enter(p.below);observer.enter(p.below);assert.equal(p.calls.length,1);
 assert.equal(p.below.dataset.scrollReveal,"done");assert.equal(observer.targets.has(p.below),false);
 assert.equal(p.calls[0].options.fill,"backwards");assert.equal(p.calls[0].frames[1].opacity,1);
});
test("dynamic content gets observed; stagger is capped",()=>{
 const p=page(),next=p.element(1800);p.mutations[0].add(next);assert.equal(p.observers[0].targets.has(next),true);
 p.observers[0].enter(next);assert.equal(p.calls[0].options.delay,140);
});
test("turning reduced motion on cancels effects and disconnects observation",()=>{
 const p=page();p.observers[0].enter(p.below);p.setReduced(true);
 assert.equal(p.calls[0].effect.cancelled,true);assert.equal(p.observers[0].targets.size,0);
 p.observers[0].enter(p.last);assert.equal(p.calls.length,1);
});
test("keyboard focus cancels an effect immediately",()=>{
 const p=page();p.observers[0].enter(p.below);p.main.events.focusin({target:p.below});assert.equal(p.calls[0].effect.cancelled,true);
});
test("animation failure never hides or removes content",()=>{
 const p=page({throws:true});assert.doesNotThrow(()=>p.observers[0].enter(p.below));assert.equal(p.below.dataset.scrollReveal,"done");assert.equal(p.main.children.includes(p.below),true);
});
test("background/bfcache lifecycle cancels animation and resumes pending observation",()=>{
 const p=page();p.observers[0].enter(p.below);p.context.document.hidden=true;p.documentEvents.visibilitychange();assert.equal(p.calls[0].effect.cancelled,true);
 p.events.pagehide();assert.equal(p.mutations[0].connected,false);
 p.context.document.hidden=false;p.events.pageshow({persisted:true});assert.equal(p.observers.length,2);assert.equal(p.mutations[0].connected,true);assert.equal(p.observers[1].targets.has(p.last),true);
});
