/* Ad Buy Live: Kahoot-style class game. Shared by the student page and the teacher screen.
   Engine from the District 214 Accounting live games (Controls Live); questions cover Ad Buy Showdown. */
"use strict";
/* ============================================================ QUESTION BANK
   First option is always the correct one; options are shuffled when a game is built.
   v:2 marks the "New questions" set. Data questions use the same audience numbers as Ad Buy Showdown. */
const SKILLS={
 speak:{name:"Speak Ads Manager",short:"Ad terms",secs:20,desc:"The words on every ad report.",
   tip:"CPM = cost per 1,000 impressions. Click rate = clicks ÷ impressions. A conversion is a click that becomes a sale. Cost per sale = ad spend ÷ sales. ROAS = revenue ÷ ad spend. Frequency = how many times the same person saw the ad. Reach = how many different people saw it."},
 math:{name:"Run the Numbers",short:"Ad math",secs:30,desc:"Impressions, clicks, sales, ROAS, and profit.",
   tip:"Follow the funnel: impressions = budget ÷ CPM × 1,000. Clicks = impressions × click rate. Sales = clicks × conversion rate. ROAS = revenue ÷ ad spend. Profit = sales × profit per sale − ad spend. Break-even sales = budget ÷ profit per sale."},
 scroll:{name:"Who's Scrolling Where",short:"Platform audiences",secs:20,desc:"Read the audience data. Who uses what?",
   tip:"YouTube reaches nearly every age group. Teens and young adults lean on Instagram, TikTok, and Snapchat. Parents ages 35–54 are the one group where Facebook beats the teen apps. Snapchat barely reaches adults 55+."},
 target:{name:"Target the Buyer",short:"Targeting",secs:20,desc:"Who sees the ad, and where they live.",
   tip:"Aim at the person who pays, not just the person who uses it. Match location to where buyers can actually get the product. Interests narrow adults only; teens can be targeted by age and location only. Too narrow causes ad fatigue; too broad wastes impressions."},
 feed:{name:"Fit the Feed",short:"Format and objective",secs:20,desc:"The right format and objective for the job.",
   tip:"Pre-roll belongs on YouTube. Story ads with a swipe-up belong on Snapchat. Short-form video wins on TikTok and Reels. Single images do best on Pinterest and Facebook. If the client gets paid when people buy, pick the Sales objective."},
 call:{name:"Make the Call",short:"Campaign decisions",secs:25,desc:"You're the agency. What's the smart move?",
   tip:"Profit is the score, not clicks or impressions. Move money toward the platform with the lowest cost per sale. Cut groups with little interest. Stop spending once the product sells out. Expect higher ad prices when every brand is competing."}
};
const ORDER=["speak","math","scroll","target","feed","call"];
const BANK=[
 // ---- ad terms
 {id:"s1",sk:"speak",p:"CPM is:",o:["The cost to show an ad 1,000 times","The cost of each click","The cost of each sale","The share of viewers who click"],x:"The M is the Roman numeral for 1,000. CPM means cost per thousand impressions."},
 {id:"s2",sk:"speak",p:"Click rate (CTR) is found by:",o:["Clicks ÷ impressions","Impressions ÷ clicks","Sales ÷ clicks","Revenue ÷ ad spend"],x:"It's the share of people who saw the ad and tapped it."},
 {id:"s3",sk:"speak",p:"ROAS stands for:",o:["Return on ad spend","Rate of ad sales","Reach on all screens","Revenue over audience size"],x:"ROAS = revenue ÷ ad spend. A 5x ROAS means every $1 of ads brought back $5 in sales."},
 {id:"s4",sk:"speak",p:"An ad report shows a frequency of 6. What does that mean?",o:["The average person saw the ad 6 times","6 people saw the ad","The ad ran for 6 days","6% of viewers clicked"],x:"Frequency is how many times the same person saw your ad. After about 3, extra views do less."},
 {id:"s5",v:2,sk:"speak",p:"In an ad campaign, a conversion is:",o:["A click that turns into a purchase","An ad that moves to a new platform","A viewer who scrolls past","Switching the budget to another platform"],x:"Conversions are the sales. They're what the client actually gets paid for."},
 {id:"s6",v:2,sk:"speak",p:"An ad had 1,000 impressions but a reach of 250. What happened?",o:["The same people saw it about 4 times each","1,000 different people saw it","250 people bought the product","The ad stopped running early"],x:"Reach counts different people. 1,000 ÷ 250 = a frequency of 4."},
 {id:"s7",v:2,sk:"speak",p:"Cost per sale is found by:",o:["Ad spend ÷ sales","Sales ÷ ad spend","Revenue − ad spend","Clicks ÷ impressions"],x:"It tells you what each sale cost in ads. Compare it to profit per sale."},
 {id:"s8",v:2,sk:"speak",p:"A target market is:",o:["The specific group of customers a business tries to reach","Everyone on social media","The store where the product is sold","The platform with the cheapest ads"],x:"Every targeting choice in the campaign builder narrows down the target market."},
 // ---- ad math
 {id:"m1",sk:"math",p:"A $2,000 budget at a $10 CPM buys how many impressions?",o:["200,000","20,000","2,000,000","200"],x:"$2,000 ÷ $10 × 1,000 = 200,000 impressions."},
 {id:"m2",sk:"math",p:"50,000 impressions with a 2% click rate gives how many clicks?",o:["1,000","100","2,500","10,000"],x:"50,000 × 0.02 = 1,000 clicks."},
 {id:"m3",sk:"math",p:"You spent $3,000 on ads and sold $12,000 of product. What is the ROAS?",o:["4x","0.25x","9x","15x"],x:"$12,000 ÷ $3,000 = 4. Every ad dollar brought back $4 in sales."},
 {id:"m4",sk:"math",p:"Ads cost $1,500 and sold 60 hoodies. Each hoodie earns $40 profit before ads. What is the campaign's profit?",o:["$900","$2,400","$3,900","$40"],x:"60 × $40 = $2,400, minus $1,500 of ads = $900."},
 {id:"m5",v:2,sk:"math",p:"800 people clicked and 5% of them bought. How many sales?",o:["40","160","400","4"],x:"800 × 0.05 = 40 sales."},
 {id:"m6",v:2,sk:"math",p:"You spent $1,200 on ads and made 30 sales. What was the cost per sale?",o:["$40","$30","$1,170","$4"],x:"$1,200 ÷ 30 = $40 per sale."},
 {id:"m7",v:2,sk:"math",p:"Each concert ticket earns $50 profit. The ad budget is $6,000. How many tickets must you sell just to break even?",o:["120","60","300","1,200"],x:"$6,000 ÷ $50 = 120 tickets. Every ticket after that is profit."},
 {id:"m8",v:2,sk:"math",p:"Campaign A: $5,000 of ads, $20,000 revenue. Campaign B: $1,000 of ads, $6,000 revenue. Which had the better ROAS?",o:["Campaign B, 6x vs 4x","Campaign A, because it made more revenue","They're tied","Campaign A, 4x vs 6x"],x:"A: 20,000 ÷ 5,000 = 4x. B: 6,000 ÷ 1,000 = 6x. B got more back for every dollar."},
 // ---- platform audiences (same numbers as the game's audience insights)
 {id:"w1",sk:"scroll",p:"Which of these platforms reaches the largest share of parents ages 35–54?",o:["Facebook","Snapchat","TikTok","Instagram"],x:"75% of parents use Facebook each week. Only 18% use Snapchat."},
 {id:"w2",sk:"scroll",p:"Which platform reaches about 90% of teens every week?",o:["YouTube","Facebook","Pinterest","Snapchat"],x:"YouTube reaches nearly every age group, teens included."},
 {id:"w3",sk:"scroll",p:"Which group is hardest to reach on Snapchat?",o:["Ages 55+","Ages 13–15","Ages 16–17","Ages 18–24"],x:"Only about 6% of adults 55+ use Snapchat each week."},
 {id:"w4",sk:"scroll",p:"Among these, which platform do the most 18–24 year-olds use each week?",o:["Instagram","TikTok","Snapchat","Pinterest"],x:"78% of 18–24 year-olds use Instagram, more than TikTok (62%) or Snapchat (60%)."},
 {id:"w5",v:2,sk:"scroll",p:"You need ONE platform that reaches both teens and their parents. Best pick?",o:["YouTube","Snapchat","Facebook","Pinterest"],x:"YouTube reaches about 90% of teens and 85% of parents."},
 {id:"w6",v:2,sk:"scroll",p:"About 20,000 people ages 16–17 live nearby, and 65% use TikTok. About how many is that?",o:["13,000","6,500","1,300","20,065"],x:"20,000 × 0.65 = 13,000 people."},
 {id:"w7",v:2,sk:"scroll",p:"25% of 16–17 year-olds use Facebook, but 75% of parents do. What should an advertiser take from that?",o:["Facebook is better for reaching parents than teens","Facebook is the best way to reach teens","Teens and parents use Facebook equally","Nobody uses Facebook anymore"],x:"Platforms skew toward different ages. Match the platform to who you're trying to reach."},
 {id:"w8",v:2,sk:"scroll",p:"Which of these platforms reaches the smallest share of 16–17 year-olds?",o:["Facebook","Instagram","TikTok","Snapchat"],x:"Only 25% of 16–17 year-olds use Facebook each week."},
 // ---- targeting
 {id:"t1",sk:"target",p:"A theme park season pass is fun for teens. Who usually pays for it?",o:["Parents ages 35–54","Ages 13–15","Adults 55+","The park"],x:"The user and the buyer aren't always the same person. Aim ads at the one paying."},
 {id:"t2",sk:"target",p:"Under platform rules, how can advertisers target users under 18?",o:["By age and location only","By any interest they want","By what they searched last week","They can't show ads to anyone under 18"],x:"Interest targeting only works on adults. That rule protects teens."},
 {id:"t3",sk:"target",p:"A bubble tea shop is opening in downtown Arlington Heights. Where should its ads run?",o:["Local, within 25 miles","The whole United States","The Midwest","Anywhere the ads are cheapest"],x:"Nobody drives from Iowa for a $6 drink. Ads far away reach people who can't buy."},
 {id:"t4",sk:"target",p:"Adding the interest \"EDM / dance music\" to a Calvin Harris concert campaign:",o:["Shrinks the adult audience but makes each viewer more likely to buy","Makes the audience bigger","Makes every ad cheaper","Adds teens who like EDM"],x:"A narrower, more interested audience sees the ad. Teens are not narrowed by interest."},
 {id:"t5",v:2,sk:"target",p:"Your audience is tiny and the frequency hits 12. What's the problem?",o:["Ad fatigue: the same people keep seeing it","Too many new people saw it","The ads were too cheap","Nothing. More views is always better"],x:"After about 3 views, each extra view does less. A bigger audience or less spend fixes it."},
 {id:"t6",v:2,sk:"target",p:"An ACT prep app is used by high school juniors. Who is the best buyer to aim at?",o:["Parents of teenagers","Adults 55+","Ages 25–34","Ages 13–15"],x:"The junior uses it, but the parent pays. That's why Facebook and YouTube win this round in the game."},
 {id:"t7",v:2,sk:"target",p:"A limited sneaker drop ships anywhere in the U.S. Best location setting?",o:["United States","Local, within 25 miles","Chicagoland","Arlington Heights only"],x:"Anyone in the country can buy it, so a bigger area means more buyers and less ad fatigue."},
 {id:"t8",v:2,sk:"target",p:"What's the biggest risk of targeting too broadly?",o:["Most impressions go to people who will never buy","Each impression costs much more","Frequency gets too high","The platform rejects the ad"],x:"Broad audiences are cheap to reach, but most of that money lands on non-buyers."},
 // ---- format and objective
 {id:"c1",sk:"feed",p:"A 15–30 second video that plays before other videos fits best on:",o:["YouTube","Snapchat","Pinterest","Instagram"],x:"That's pre-roll. It's built for YouTube."},
 {id:"c2",sk:"feed",p:"A full-screen story ad with a swipe-up link fits best on:",o:["Snapchat","YouTube","Pinterest","Facebook"],x:"Snapchat is built around full-screen stories you tap through."},
 {id:"c3",sk:"feed",p:"Your client only makes money when people buy. Which objective should you pick?",o:["Sales","Awareness","Traffic","Video views"],x:"Sales tells the platform to hunt for buyers. Impressions cost more, but the right people see them."},
 {id:"c4",sk:"feed",p:"Why does a creator partnership cost more than other formats in Ad Buy Showdown?",o:["The creator takes a 15% fee before the ads run","Creators only post on Facebook","Platforms charge double for video","It doesn't cost more"],x:"You pay the creator, so less of the budget buys ads. It's worth it when creators drive more clicks and sales."},
 {id:"c5",v:2,sk:"feed",p:"A single photo with a headline performs worst on which of these?",o:["TikTok","Pinterest","Facebook","Instagram"],x:"TikTok is a video feed. A still image gets scrolled past."},
 {id:"c6",v:2,sk:"feed",p:"The Awareness objective gives you:",o:["The cheapest impressions, but fewer buyers","The most buyers","The most clicks","Free ads"],x:"Awareness is great for getting seen. It isn't built to find buyers."},
 {id:"c7",v:2,sk:"feed",p:"Short-form video is strongest on which platform?",o:["TikTok","Facebook","Pinterest","None of them"],x:"TikTok is a short-form video feed, so that's where the format fits best."},
 {id:"c8",v:2,sk:"feed",p:"Why pick the creative format before you split the budget?",o:["One format runs on every platform you buy, so the platforms should fit it","Formats are cheaper on Mondays","The platform picks the format for you","Format doesn't affect results"],x:"A great platform with the wrong format still underperforms."},
 // ---- campaign decisions
 {id:"k1",sk:"call",p:"250 pairs of sneakers sell out on day 3, but the ads run for 7 days. What happens to the ad money after day 3?",o:["It's wasted. There's nothing left to sell","It sells more sneakers","The platform refunds it","It raises the price of the sneakers"],x:"Once you sell out, more ads can't earn anything. Smaller budgets can win limited drops."},
 {id:"k2",sk:"call",p:"It's Black Friday and every brand is buying ads. What happens to your CPM?",o:["It goes up because more advertisers compete","It goes down","It stays the same","Ads become free"],x:"Ad space is an auction. More bidders push the price up."},
 {id:"k3",sk:"call",p:"Two campaigns get about the same impressions. One sells 50 tickets, the other sells 2. Most likely reason?",o:["The second one reached people who didn't want the product","The second one had fewer impressions","The second one had a bigger budget","The second one ran on a weekend"],x:"Impressions aren't the goal. Who sees the ad decides whether it sells."},
 {id:"k4",sk:"call",p:"Team A got 20,000 clicks and lost money. Team B got 3,000 clicks and made $8,000. Who ran the better campaign?",o:["Team B, because profit is the goal","Team A, because it got more clicks","They tied","Team A, because clicks equal sales"],x:"Clicks cost money. Only sales pay it back."},
 {id:"k5",v:2,sk:"call",p:"A local boba shop has $1,500 for opening week. Which plan fits best?",o:["Snapchat and Instagram stories to local teens and young adults","YouTube pre-roll to the whole U.S.","Facebook ads to adults 55+ in the Midwest","Pinterest image ads to everyone"],x:"Local buyers, the apps they use, and a format that fits those apps."},
 {id:"k6",v:2,sk:"call",p:"One platform sold tickets at $15 each in ads, another at $90. Each ticket earns $50 profit. What's your move next round?",o:["Move money from the $90 platform to the $15 one","Spend more on the $90 platform","Split the budget evenly","Stop advertising"],x:"At $90 a sale you lose $40 on every ticket. At $15 you keep $35."},
 {id:"k7",v:2,sk:"call",p:"Leaving $1,000 of the budget unspent is:",o:["Sometimes smart, if the extra ads would have lost money","Always a mistake","Against the rules","The same as losing $1,000"],x:"Unspent budget isn't a cost. Ads that lose money are."},
 {id:"k8",v:2,sk:"call",p:"Analyst note: \"54% of impressions went to Ages 55+, a group with little interest.\" Best fix?",o:["Drop Ages 55+ from the audience","Add more age groups","Switch to the Awareness objective","Raise the budget"],x:"Cut the group that isn't buying so the money goes to people who will."}
];
BANK.forEach(q=>{q.ans=0});

/* ============================================================ HELPERS */
const $=s=>document.querySelector(s);
const app=$("#app");
const money=n=>"$"+Number(n).toLocaleString("en-US");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const COLORS=["var(--c0)","var(--c1)","var(--c2)","var(--c3)"],SHAPES=["▲","◆","●","■"];
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,r=Math.random){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function optHTML(v){
  if(v&&typeof v==="object")return `<span class="je"><span>Dr ${esc(v.dr)}</span><span>${money(v.amt)}</span><span class="cr">Cr ${esc(v.cr)}</span><span>${money(v.amt)}</span></span>`;
  if(typeof v==="number")return money(v);
  return esc(v);
}
function optText(v){if(v&&typeof v==="object")return `Dr ${v.dr} ${money(v.amt)}, Cr ${v.cr} ${money(v.amt)}`;if(typeof v==="number")return money(v);return v}
/* Build a question instance. Sort questions keep their fixed order; others shuffle with a seed so every device in a live game shows the same order. */
function inst(q,seed){
  if(q.t==="sort")return {...q,opts:q.o.slice(),ans:q.ans};
  const r=rng(hash(q.id+":"+seed));const idx=shuffle([0,1,2,3],r);
  return {...q,opts:idx.map(i=>q.o[i]),ans:idx.indexOf(0)};
}
/* qset: "new" = set 2 only, "orig" = set 1 only, anything else = both sets mixed */
function buildGame(perSkill,seed,qset){
  const r=rng(seed);const list=[];
  const inSet=q=>qset==="new"?q.v===2:qset==="orig"?!q.v:true;
  ORDER.forEach(sk=>{shuffle(BANK.filter(q=>q.sk===sk&&inSet(q)),r).slice(0,perSkill).forEach(q=>list.push(q.id))});
  return list;
}
const byId=Object.fromEntries(BANK.map(q=>[q.id,q]));
function points(ok,ms,secs){return ok?Math.round(600+400*Math.max(0,1-ms/(secs*1000))):0}
let timeMult=1;
const secsFor=q=>Math.round(SKILLS[q.sk].secs*timeMult);
function beep(f,d){try{const c=beep.c||(beep.c=new (window.AudioContext||window.webkitAudioContext)());const o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.value=.06;o.connect(g);g.connect(c.destination);const t=c.currentTime;g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d)}catch(e){}}

/* ============================================================ QUESTION SCREEN (solo, student device, practice) */
let TICK=null;
function stopTick(){clearInterval(TICK);TICK=null}
function renderQuestion(el,q,o){
  // o: {label, num, score, timed, secs, onAnswer(choice, ms), showText}
  stopTick();
  el.innerHTML=`<div class="qwrap">
    <div class="qhead"><span class="rd">${esc(o.label||"")}</span><span class="num">${esc(o.num||"")}</span>${o.score!=null?`<span class="score">${o.score.toLocaleString()} pts</span>`:""}</div>
    ${o.timed?`<div class="row" style="gap:10px"><div class="timer" style="flex:1"><i></i></div><span class="secs">${o.secs}</span></div>`:""}
    <div class="card"><p class="prompt">${esc(q.p)}</p>${q.d?`<table class="data">${q.d.map(([l,v])=>`<tr><td>${esc(l)}</td><td>${money(v)}</td></tr>`).join("")}</table>`:""}</div>
    <div class="opts">${q.opts.map((v,i)=>`<button class="opt" data-i="${i}" style="--oc:${COLORS[i]}"><span class="sh">${SHAPES[i]}</span><span>${optHTML(v)}</span></button>`).join("")}</div>
    <div class="fbbox"></div></div>`;
  const t0=performance.now();let done=false;
  const pick=(i)=>{if(done)return;done=true;stopTick();const ms=performance.now()-t0;o.onAnswer(i,ms)};
  el.querySelectorAll(".opt").forEach(b=>b.onclick=()=>pick(+b.dataset.i));
  if(o.timed){
    const bar=el.querySelector(".timer i"),sec=el.querySelector(".secs"),tm=el.querySelector(".timer");let last=o.secs;
    TICK=setInterval(()=>{const left=Math.max(0,o.secs-(performance.now()-t0)/1000);bar.style.transform=`scaleX(${left/o.secs})`;const c=Math.ceil(left);if(c!==last){last=c;sec.textContent=c;if(c<=3&&c>0)beep(880,.05)}tm.classList.toggle("low",left<=5);if(left<=0)pick(-1)},100);
  }
  KEYPICK=(i)=>{const b=el.querySelector(`.opt[data-i="${i}"]`);if(b&&!b.disabled)b.click()};
  if(!o.noFit){setFit(true);requestAnimationFrame(fitHost)}
  return {lock(){done=true;stopTick();el.querySelectorAll(".opt").forEach(b=>b.disabled=true)}};
}
function showAnswer(el,q,choice,ok,pts,extra){
  el.querySelectorAll(".opt").forEach((b,i)=>{b.disabled=true;if(i===q.ans)b.classList.add("right");else b.classList.add("dim");if(i===choice&&!ok)b.classList.add("pick")});
  const fb=el.querySelector(".fbbox");
  requestAnimationFrame(()=>{if(document.body.classList.contains("fit"))fitHost()});
  fb.innerHTML=`<div class="fb ${ok?"":"no"}">${pts!=null?`<span class="pts">+${pts}</span>`:""}<b>${ok?"Correct!":choice<0?"Time's up. Answer: "+esc(optText(q.opts[q.ans])):"Not quite. Answer: "+esc(optText(q.opts[q.ans]))}</b>${esc(q.x)}</div>${extra||""}`;
}
let KEYPICK=null,KEYNEXT=null;
document.addEventListener("keydown",e=>{
  if(e.target.tagName==="INPUT")return;
  const k=e.key.toLowerCase(),i="abcd".indexOf(k)>=0?"abcd".indexOf(k):"1234".indexOf(k);
  if(i>=0&&k.length===1&&KEYPICK){KEYPICK(i);return}
  if((e.key===" "||e.key==="Enter")&&KEYNEXT){e.preventDefault();KEYNEXT()}
});

/* ============================================================ HOME */
const CFG=window.LIVE_CONFIG||null;
const MOCK=/[?&]mock=1/.test(location.search);
const ROLE=window.BRL_ROLE||"student";
const GAME="adbuy"; // keeps each live game's codes separate
const hdr=()=>`<h1 class="title">Ad Buy <span>Live.</span></h1>
  <p class="lede">${ROLE==="teacher"?"Teacher screen. Put this on the projector, create a game, and students join on their devices with the code. Six rounds on social media advertising; right answers earn 600 points plus up to 400 for speed, and wrong answers cost a lot (set below), so students should never guess.":"Six quick rounds on social media advertising, run by your teacher. Right answers earn 600 points plus up to 400 more for speed. Wrong answers cost a lot of points, so never guess. If you are not sure, let the clock run out and you get 0. At the end you get a report on what to practice, and you can practice it right here."}</p>`;
function home(){
  stopTick();KEYPICK=KEYNEXT=null;setFit(false);$("#who").hidden=true;
  ROLE==="teacher"?hostSetup():joinForm();
}

/* ============================================================ SOLO */
let SOLO=null;
function soloStart(){
  app.innerHTML=`<div class="panel"><h2>What's your name?</h2><p>First name and last initial is perfect.</p>
    <input class="field" id="nm" maxlength="24" autocomplete="off" placeholder="Jordan M.">
    <div class="err" id="er"></div><button class="btn main" id="go">Start</button> <button class="btn" id="back">Back</button></div>`;
  const nm=$("#nm");nm.focus();
  const go=()=>{const n=nm.value.trim();if(!n){$("#er").textContent="Type your name first.";return}
    timeMult=1;SOLO={name:n,ids:buildGame(3,Math.floor(Math.random()*1e9)),seed:Math.floor(Math.random()*1e9),i:0,score:0,log:[]};
    $("#who").textContent=n;$("#who").hidden=false;soloNext()};
  $("#go").onclick=go;nm.onkeydown=e=>{if(e.key==="Enter")go()};$("#back").onclick=home;
}
function interstitial(sk,roundNo,total,cb){
  const S=SKILLS[sk];setFit(false);
  app.innerHTML=`<div class="interstitial"><div class="r">Round ${roundNo} of ${total}</div><h2>${esc(S.name)}</h2><p>${esc(S.desc)} ${secsLabel(sk)}</p><button class="btn main" id="go">Go</button></div>`;
  KEYPICK=null;KEYNEXT=()=>{KEYNEXT=null;cb()};$("#go").onclick=KEYNEXT;$("#go").focus();
}
const secsLabel=sk=>`${Math.round(SKILLS[sk].secs*timeMult)} seconds per question.`;
function soloNext(){
  const s=SOLO;if(s.i>=s.ids.length)return report(s.name,s.log,s.score,null);
  const q=inst(byId[s.ids[s.i]],s.seed);
  const first=s.i===0||byId[s.ids[s.i-1]].sk!==q.sk;
  const go=()=>{
    const secs=secsFor(q),per=s.ids.filter(id=>byId[id].sk===q.sk).length,k=s.ids.slice(0,s.i+1).filter(id=>byId[id].sk===q.sk).length;
    const view=renderQuestion(app,q,{label:SKILLS[q.sk].name,num:`Question ${k} of ${per}`,score:s.score,timed:true,secs,onAnswer:(c,ms)=>{
      const ok=c===q.ans,pts=points(ok,ms,secs);s.score+=pts;s.log.push({sk:q.sk,ok,ms});ok?beep(990,.15):beep(200,.3);
      showAnswer(app,q,c,ok,pts,`<div class="row next" style="justify-content:flex-end;margin-top:10px"><button class="btn main" id="nx">${s.i===s.ids.length-1?"See my report":"Next"}</button></div>`);
      app.querySelector(".score").textContent=s.score.toLocaleString()+" pts";
      KEYPICK=null;KEYNEXT=()=>{KEYNEXT=null;s.i++;soloNext()};$("#nx").onclick=KEYNEXT;$("#nx").focus({preventScroll:true});
    }});
  };
  if(first){const roundNo=ORDER.indexOf(q.sk)+1;interstitial(q.sk,roundNo,ORDER.length,go)}else go();
}

/* ============================================================ REPORT + PRACTICE */
function report(name,log,score,rank){
  stopTick();setFit(false);KEYPICK=null;
  const by={};ORDER.forEach(k=>by[k]={n:0,r:0,ms:0});
  log.forEach(a=>{const b=by[a.sk];if(!b)return;b.n++;if(a.ok)b.r++;b.ms+=a.ms});
  const n=log.length,r=log.filter(a=>a.ok).length,avg=n?log.reduce((t,a)=>t+a.ms,0)/n/1000:0;
  const weak=ORDER.filter(k=>by[k].n&&by[k].r<by[k].n).sort((a,b)=>(by[a].r/by[a].n)-(by[b].r/by[b].n)||by[b].n-by[a].n).slice(0,3);
  const slow=ORDER.filter(k=>by[k].n&&by[k].r===by[k].n).sort((a,b)=>(by[b].ms/by[b].n/SKILLS[b].secs)-(by[a].ms/by[a].n/SKILLS[a].secs))[0];
  const tips=weak.map(k=>`<div class="tip" data-sk="${k}"><div class="t"><b>${esc(SKILLS[k].short)}: ${by[k].r} of ${by[k].n} right</b>${esc(SKILLS[k].tip)} <span class="done" data-done="${k}"></span></div><button class="btn main prac" data-sk="${k}" style="font-size:19px;padding:8px 18px">Practice this now</button></div>`).join("");
  const perfect=!weak.length&&n;
  app.innerHTML=`<div class="rep">
    <h2>${esc(name)}: ${score.toLocaleString()} points</h2>
    <div class="stats">
      <div class="stat"><b>${r} / ${n}</b><span>Correct</span></div>
      <div class="stat"><b>${n?Math.round(r/n*100):0}%</b><span>Accuracy</span></div>
      <div class="stat"><b>${avg.toFixed(1)}s</b><span>Avg time</span></div>
      ${rank?`<div class="stat"><b>#${rank}</b><span>Class rank</span></div>`:""}
    </div>
    <div class="skills">${ORDER.filter(k=>by[k].n).map(k=>{const p=by[k].r/by[k].n;return `<div class="sk"><span><b>${esc(SKILLS[k].short)}</b></span><div class="bar"><i class="${p>=.99?"":p>=.5?"mid":"lo"}" style="width:${Math.max(4,p*100)}%"></i></div><span class="v">${by[k].r} / ${by[k].n}</span></div>`}).join("")}</div>
    <div class="todo"><h3>${perfect?"What to work on":"Practice these next"}</h3>
      ${perfect?`<div class="tip"><div class="t"><b>Every answer right. Nice work.</b>Your next goal is speed. ${slow?`Your slowest round was ${esc(SKILLS[slow].short)}. `:""}Next game, try to beat ${score.toLocaleString()}.</div></div>`:tips}
    </div>
    <div class="links">More practice on the site: <a href="/ad-buy-showdown/">Ad Buy Showdown Open Play</a> · <a href="/">All games and practices</a> · <a href="#" id="home2">Join another game</a></div>
  </div>`;
  app.querySelectorAll(".prac").forEach(b=>b.onclick=()=>practice(b.dataset.sk,()=>{report(name,log,score,rank);const pr=PRACTICED[b.dataset.sk];if(pr){const d=app.querySelector(`[data-done="${b.dataset.sk}"]`);if(d)d.textContent=`Practiced: ${pr.r} of ${pr.n} right.`}}));
  const ag=$("#again");if(ag)ag.onclick=soloStart;
  $("#home2").onclick=e=>{e.preventDefault();home()};
  // restore practice marks
  Object.entries(PRACTICED).forEach(([k,pr])=>{const d=app.querySelector(`[data-done="${k}"]`);if(d)d.textContent=`Practiced: ${pr.r} of ${pr.n} right.`});
  window.scrollTo(0,0);
}
const PRACTICED={};
function practice(sk,back){
  const ids=shuffle(BANK.filter(q=>q.sk===sk).map(q=>q.id)).slice(0,5);let i=0,r=0;const seed=Math.floor(Math.random()*1e9);
  const step=()=>{
    if(i>=ids.length){PRACTICED[sk]={r,n:ids.length};setFit(false);
      app.innerHTML=`<div class="interstitial"><div class="r">Practice: ${esc(SKILLS[sk].short)}</div><h2>${r} of ${ids.length}</h2><p>${r===ids.length?"All right. That skill is back on track.":"Read the tip once more, then try another set or head back."}</p><div class="row" style="justify-content:center"><button class="btn main" id="bk">Back to my report</button><button class="btn" id="more">Practice again</button></div></div>`;
      KEYPICK=null;KEYNEXT=()=>{KEYNEXT=null;back()};$("#bk").onclick=KEYNEXT;$("#more").onclick=()=>practice(sk,back);return}
    const q=inst(byId[ids[i]],seed);
    renderQuestion(app,q,{label:"Practice: "+SKILLS[sk].short,num:`${i+1} of ${ids.length} · no clock`,timed:false,onAnswer:(c)=>{
      const ok=c===q.ans;if(ok)r++;
      showAnswer(app,q,c,ok,null,`<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn main" id="nx">Next</button></div>`);
      KEYPICK=null;KEYNEXT=()=>{KEYNEXT=null;i++;step()};$("#nx").onclick=KEYNEXT;
    }});
  };
  step();
}

/* ============================================================ LIVE BACKEND */
function mockNet(){
  const KEY="adBuyLiveMock",bc=("BroadcastChannel" in window)?new BroadcastChannel(KEY):null,subs=[];
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return{}}};
  const write=t=>{localStorage.setItem(KEY,JSON.stringify(t));fire();if(bc)bc.postMessage(1)};
  const at=(t,p)=>p.split("/").filter(Boolean).reduce((o,k)=>o==null?undefined:o[k],t);
  const put=(t,p,v)=>{const ks=p.split("/").filter(Boolean);let o=t;ks.slice(0,-1).forEach(k=>{if(typeof o[k]!=="object"||o[k]===null)o[k]={};o=o[k]});if(v===null)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=v};
  const fire=()=>{const t=read();subs.forEach(s=>{const v=JSON.stringify(at(t,s.p)??null);if(v!==s.last){s.last=v;s.cb(JSON.parse(v))}})};
  if(bc)bc.onmessage=fire;window.addEventListener("storage",e=>{if(e.key===KEY)fire()});
  return{
    kind:"mock",
    get:async p=>at(read(),p)??null,
    set:async(p,v)=>{const t=read();put(t,p,v);write(t)},
    update:async(p,o)=>{const t=read();Object.entries(o).forEach(([k,v])=>put(t,p+"/"+k,v));write(t)},
    remove:async p=>{const t=read();put(t,p,null);write(t)},
    on:(p,cb)=>{const s={p,cb,last:undefined};subs.push(s);setTimeout(fire,0);return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1)}}
  };
}
async function vercelNet(){
  const call=async(op,path,v)=>{const r=await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({op,path,v})});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||r.status);return j};
  try{const p=await call("ping");if(!p.ok)return null}catch(e){return null}
  return{kind:"vercel",
    get:async p=>(await call("get",p)).v??null,
    set:(p,v)=>call("set",p,v),
    update:(p,o)=>call("update",p,o),
    remove:p=>call("remove",p),
    on:(p,cb)=>{let last,stop=false,t;
      const tick=async()=>{if(stop)return;
        if(!document.hidden){try{const v=(await call("get",p)).v??null,s=JSON.stringify(v);if(s!==last){last=s;cb(v)}}catch(e){}}
        if(!stop)t=setTimeout(tick,1200)};
      tick();return()=>{stop=true;clearTimeout(t)}}};
}
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
let NET=null;
async function net(){
  if(NET)return NET;
  if(MOCK){NET=mockNet();return NET}
  if(!CFG){NET=await vercelNet();return NET}
  await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
  await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js");
  const fb=window.firebase;if(!fb.apps.length)fb.initializeApp(CFG);const db=fb.database();
  NET={kind:"firebase",
    get:async p=>(await db.ref(p).get()).val(),
    set:(p,v)=>db.ref(p).set(v),
    update:(p,o)=>db.ref(p).update(o),
    remove:p=>db.ref(p).remove(),
    on:(p,cb)=>{const r=db.ref(p),h=s=>cb(s.val());r.on("value",h);return()=>r.off("value",h)}};
  return NET;
}
function needSetup(){
  app.innerHTML=`${hdr()}<div class="panel" style="margin-top:0">${ROLE==="teacher"?`<h2>Class games need a one-time setup</h2>
  <p>In Vercel, open this project, go to <b>Storage</b>, add <b>Upstash for Redis</b> (free plan), connect it to the project, then redeploy.</p>`:`<h2>The class game isn't open yet</h2><p>Wait for your teacher to start it, then reload this page.</p>`}
  <button class="btn main" id="b">Reload</button></div>`;$("#b").onclick=()=>location.reload();
}

/* ============================================================ LIVE: HOST */
let HOST=null;
let ZOOM=false;
function zoomApp(){const a=$("#app");a.style.zoom="";ZOOM=true;const R=document.documentElement;let lo=1,hi=2.4;
  for(let i=0;i<12;i++){const m=(lo+hi)/2;a.style.zoom=m.toFixed(3);(R.scrollHeight<=innerHeight+1&&R.scrollWidth<=innerWidth+1)?lo=m:hi=m}
  a.style.zoom=lo.toFixed(3)}
function setFit(on){document.body.classList.remove("host-reveal");ZOOM=false;document.body.classList.remove("wide");$("#app").style.zoom="";document.body.classList.toggle("fit",on);if(!on)document.documentElement.style.setProperty("--k",1)}
function fitHost(){
  if(!document.body.classList.contains("fit"))return;
  const R=document.documentElement;let lo=.6,hi=2.4;
  for(let i=0;i<12;i++){const m=(lo+hi)/2;R.style.setProperty("--k",m.toFixed(3));(R.scrollHeight<=innerHeight+1&&R.scrollWidth<=innerWidth+1)?lo=m:hi=m}
  R.style.setProperty("--k",lo.toFixed(3));
}
window.addEventListener("resize",()=>{clearTimeout(fitHost.t);fitHost.t=setTimeout(()=>{ZOOM?zoomApp():fitHost()},120)});
async function hostSetup(){
  const N=await net().catch(()=>null);if(!N)return needSetup();
  let per=3,mult=1,pen=1000,qset="new";
  app.innerHTML=`${hdr()}<div class="panel" style="margin-top:0"><h2>Host a class game</h2>
    <p>Question set:</p><div class="seg" id="qs"><button data-v="new" aria-pressed="true">New questions</button><button data-v="orig">Original questions</button><button data-v="mix">Mix of both</button></div>
    <p>Questions per round (6 rounds):</p><div class="seg" id="sp"><button data-v="2">2 (12 total)</button><button data-v="3" aria-pressed="true">3 (18 total)</button><button data-v="4">4 (24 total)</button></div>
    <p>Wrong answer:</p><div class="seg" id="pn"><button data-v="0">No penalty</button><button data-v="500">−500</button><button data-v="1000" aria-pressed="true">−1,000</button><button data-v="1500">−1,500</button></div>
    <p>Time:</p><div class="seg" id="st"><button data-v="1" aria-pressed="true">Standard</button><button data-v="1.5">Extra time (+50%)</button><button data-v="2">Double time</button></div>
    <p class="note">Standard: 20 seconds for most rounds, 25 for Make the Call, 30 for Run the Numbers.</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  const seg=(id,set)=>$(id).onclick=e=>{const b=e.target.closest("button");if(!b)return;[...$(id).children].forEach(x=>x.setAttribute("aria-pressed",x===b));set(+b.dataset.v)};
  seg("#sp",v=>per=v);seg("#st",v=>mult=v);seg("#pn",v=>pen=v);
  $("#qs").onclick=e=>{const b=e.target.closest("button");if(!b)return;[...$("#qs").children].forEach(x=>x.setAttribute("aria-pressed",x===b));qset=b.dataset.v};
  $("#go").onclick=async()=>{
    $("#go").disabled=true;
    try{
      let code;for(let t=0;t<20;t++){code=String(Math.floor(1000+Math.random()*9000));if(!(await N.get("games/"+code)))break}
      const seed=Math.floor(Math.random()*1e9),ids=buildGame(per,seed,qset);
      await N.set("games/"+code,{created:Date.now(),game:GAME,qset,seed,ids,mult,pen,state:{phase:"lobby",qi:-1}});
      HOST={N,code,seed,ids,mult,pen,players:{},state:{phase:"lobby",qi:-1}};timeMult=mult;
      HOST.off=N.on("games/"+code+"/players",v=>{HOST.players=v||{};hostRender()});
      hostRender();
    }catch(e){$("#er").textContent="Couldn't reach the live database. Check live-config.js and the database rules.";$("#go").disabled=false}
  };
}
function hostSet(state){HOST.state=state;HOST.N.set("games/"+HOST.code+"/state",state);hostRender()}
function playersArr(){return Object.entries(HOST.players).map(([id,p])=>({id,...p,score:p.score||0}))}
function activeArr(){return playersArr().filter(p=>!p.out)}
function answered(qi){return activeArr().filter(p=>p.a&&p.a[qi]).length}
function kickIdle(qi){ // anyone with no answer on 3 straight questions is taken out
  const H=HOST,gone=[];
  activeArr().forEach(p=>{const ans=Object.entries(p.a||{}).filter(([,x])=>x&&x.c>=0).map(([q])=>+q);
    const last=Math.max(p.base==null?-1:p.base,...ans);
    if(qi-last>=3){H.players[p.id]={...H.players[p.id],out:true};H.N.update(`games/${H.code}/players/${p.id}`,{out:true}).catch(()=>{});gone.push(p.name)}});
  return gone}
function hostRender(){
  const H=HOST,st=H.state;KEYPICK=null;
  if(st.phase==="lobby"){
    setFit(false);
    const ps=activeArr();
    const url=location.origin+"/ad-buy-live/?code="+H.code;
    if(!H.qr)H.qr=qrSvg(url);
    app.innerHTML=`<div class="lobby"><div class="lobtop"><div class="lobleft"><div class="join">Scan the code, or go to <b>Ad Buy Live</b> on the Intro to Business site and enter</div>
      <div class="code">${H.code}</div><div class="url">${esc(url.replace(/^https?:\/\//,""))}</div></div>
      ${H.qr?`<div class="qr" aria-label="QR code to join">${H.qr}<span>Scan to join</span></div>`:""}</div>
      <div class="count">${ps.length} player${ps.length===1?"":"s"} joined</div>
      <div class="names">${ps.map(p=>`<span>${esc(p.name)}</span>`).join("")||'<span style="opacity:.5">Waiting for players…</span>'}</div>
      <button class="btn main" id="start" ${ps.length?"":"disabled"}>Start game</button> <button class="btn" id="end">Cancel</button></div>`;
    $("#start").onclick=()=>hostQuestion(0);$("#end").onclick=hostErase;document.body.classList.add("wide");requestAnimationFrame(zoomApp);return;
  }
  if(st.phase==="intro"){
    setFit(false);const sk=byId[H.ids[st.qi]].sk;
    app.innerHTML=`<div class="interstitial"><div class="r">Round ${ORDER.indexOf(sk)+1} of ${ORDER.length}</div><h2>${esc(SKILLS[sk].name)}</h2><p>${esc(SKILLS[sk].desc)} ${secsLabel(sk)}</p><button class="btn main" id="go">Show question</button></div>`;
    KEYNEXT=()=>{KEYNEXT=null;hostSet({phase:"question",qi:st.qi,t:Date.now()})};$("#go").onclick=KEYNEXT;requestAnimationFrame(zoomApp);return;
  }
  const q=inst(byId[H.ids[st.qi]],H.seed),secs=secsFor(q),total=activeArr().length;
  if(st.phase==="question"){
    setFit(true);
    if(H.rq!==st.qi){H.rq=st.qi;H.qStart=performance.now();
      renderQuestion(app,q,{label:SKILLS[q.sk].name,num:`Question ${st.qi+1} of ${H.ids.length}`,timed:true,secs,onAnswer:()=>{}});
      app.querySelectorAll(".opt").forEach(b=>b.disabled=true);
      const fb=app.querySelector(".fbbox");fb.innerHTML=`<div class="row" style="justify-content:space-between"><span class="count" id="cnt"></span><button class="btn" id="skip">Show answer now</button></div>`;
      $("#skip").onclick=()=>hostSet({phase:"reveal",qi:st.qi});
      clearInterval(H.watch);H.watch=setInterval(()=>{if(H.state.phase!=="question"){clearInterval(H.watch);return}if((performance.now()-H.qStart)/1000>=secs+0.6)hostSet({phase:"reveal",qi:st.qi})},200);
      KEYNEXT=()=>hostSet({phase:"reveal",qi:st.qi});
      requestAnimationFrame(fitHost);
    }
    const a=answered(st.qi);const c=$("#cnt");if(c)c.innerHTML=`${a} of ${total} answered${H.kickMsg?`<span class="kick">${esc(H.kickMsg)}</span>`:""}`;
    if(total&&a>=total)hostSet({phase:"reveal",qi:st.qi});
    return;
  }
  if(st.phase==="reveal"){
    stopTick();clearInterval(H.watch);setFit(true);
    const counts=[0,0,0,0];activeArr().forEach(p=>{const x=p.a&&p.a[st.qi];if(x&&x.c>=0)counts[x.c]++});
    const mx=Math.max(1,...counts);
    renderQuestion(app,q,{label:SKILLS[q.sk].name,num:`Question ${st.qi+1} of ${H.ids.length}`,timed:false,onAnswer:()=>{}});
    showAnswer(app,q,-2,true,null,"");
    const fb=app.querySelector(".fb");fb.querySelector("b").textContent="Answer: "+optText(q.opts[q.ans]);
    const last=st.qi>=H.ids.length-1;
    // scoreboard: rank now vs. rank before this question, points earned this question
    const ps=activeArr().map(p=>{const x=p.a&&p.a[st.qi];return {...p,gain:x&&x.pts||0,prev:p.score-(x&&x.pts||0)}});
    const before={};[...ps].sort((a,b)=>b.prev-a.prev).forEach((p,i)=>before[p.id]=i+1);
    const now=[...ps].sort((a,b)=>b.score-a.score),top=now.slice(0,10),best=Math.max(1,now[0]?now[0].score:1);
    const anim=H.sbq!==st.qi;H.sbq=st.qi;
    {const ranks={};let r=0,prevS=null;now.forEach((p,i)=>{if(p.score!==prevS){r=i+1;prevS=p.score}ranks[p.id]=[r,before[p.id]]});
     const js=JSON.stringify(ranks);if(H.rk!==st.qi+js){H.rk=st.qi+js;H.state={...st,ranks,n:now.length};H.N.set("games/"+H.code+"/state",H.state).catch(()=>{})}}
    const right=counts[q.ans],tot=activeArr().length;
    app.querySelector(".fbbox").insertAdjacentHTML("beforeend",`
      <div class="dist">${counts.map((n,i)=>`<div class="${i===q.ans?"ok":"wrong"}" style="--oc:${COLORS[i]};--h:${Math.max(14,n/mx*100)}%"><b>${i===q.ans?"✓":SHAPES[i]} ${n}</b></div>`).join("")}</div>`);
    app.querySelector(".qwrap").insertAdjacentHTML("afterend",`<aside class="sb ${anim?"anim":""} ${top.length>5?"dense":""}">
      <div class="sbh"><span>Leaderboard</span><small>${right} of ${tot} got it</small></div>
      <div class="sbrows">${top.map((p,i)=>{const mv=before[p.id]-(i+1);
        return `<div class="sbr r${i+1}" style="--d:${i*80}ms">
          <span class="rk">${i+1}</span>
          <span class="nm"><b>${esc(p.name)}</b>${mv>0?`<i class="mv up">▲ ${mv}</i>`:mv<0?`<i class="mv dn">▼ ${-mv}</i>`:""}</span>
          <span class="sc"><b data-from="${anim?p.prev:p.score}" data-to="${p.score}">${(anim?p.prev:p.score).toLocaleString()}</b>${p.gain>0?`<em>+${p.gain}</em>`:p.gain<0?`<em class="neg">−${-p.gain}</em>`:`<em class="z">+0</em>`}</span>
          <span class="bar"><i style="--w:${Math.max(3,p.score/best*100)}%"></i></span>
        </div>`}).join("")||'<div class="sbr"><span class="nm"><b>No players yet</b></span></div>'}</div>
      <button class="btn main" id="nx">${last?"Final results":"Next question"} →</button>
    </aside>`);
    document.body.classList.add("host-reveal");
    if(anim){const t0=performance.now(),els=[...app.querySelectorAll(".sc b[data-to]")];
      const step=now=>{const k=Math.min(1,(now-t0-500)/1100);if(k<0){requestAnimationFrame(step);return}const e=1-Math.pow(1-k,3);
        els.forEach(el=>{const a=+el.dataset.from,b=+el.dataset.to;el.textContent=Math.round(a+(b-a)*e).toLocaleString()});if(k<1&&document.body.contains(els[0]||document.body))requestAnimationFrame(step)};
      requestAnimationFrame(step)}
    KEYNEXT=()=>{KEYNEXT=null;last?hostSet({phase:"end",qi:st.qi}):hostQuestion(st.qi+1)};$("#nx").onclick=KEYNEXT;
    requestAnimationFrame(fitHost);return;
  }
  if(st.phase==="end"){
    setFit(false);stopTick();
    if(H.endShown)return;H.endShown=true;
    finale(activeArr().sort((a,b)=>b.score-a.score));
  }

}
/* ---------- finale: top 5 podium with fireworks (projector) ---------- */
function rankOf(ps){let r=0,prev=null;return ps.map((p,i)=>{if(p.score!==prev){r=i+1;prev=p.score}return r})}
function qrSvg(text){
  try{if(!window.qrcode)return "";const q=qrcode(0,"M");q.addData(text);q.make();const n=q.getModuleCount(),m=2;let d="";
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c+m} ${r+m}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n+2*m} ${n+2*m}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`}catch(e){return ""}}
function finale(ps){
  const H=HOST,top=ps.slice(0,5),rk=rankOf(ps);
  const slot=(p,i,cls)=>p?`<div class="pod ${cls}" data-i="${i}"><div class="who"><div class="medal">${rk[i]}</div><div class="nm">${esc(p.name)}</div><div class="pts">${p.score.toLocaleString()}</div></div><div class="block"><span>${rk[i]===1?"1st":rk[i]===2?"2nd":rk[i]===3?"3rd":rk[i]+"th"}</span></div></div>`:`<div class="pod ${cls} empty"></div>`;
  const rows=top.slice(3).map((p,k)=>`<div class="row45" data-i="${k+3}"><span class="r">${rk[k+3]}</span><span class="n">${esc(p.name)}</span><span class="s">${p.score.toLocaleString()}</span></div>`).join("");
  document.body.classList.add("finale-on");
  app.innerHTML=`<div class="finale">
    <canvas id="fw"></canvas>
    <div class="rays"></div>
    <div class="fhead"><img class="lg" src="/logo-214.png" alt="District 214"><div class="kick">Ad Buy Live</div><h2>Top 5</h2></div>
    <div class="podium">${slot(top[1],1,"p2")}${slot(top[0],0,"p1")}${slot(top[2],2,"p3")}</div>
    <div class="rest">${rows}</div>
    <div class="fbar"><button class="btn" id="cr">Class results</button><button class="btn" id="again">Replay</button><button class="btn" id="erase">Erase game</button><button class="btn" id="home3">Done</button></div>
  </div>`;
  $("#erase").onclick=()=>{stopFireworks();hostErase()};$("#home3").onclick=()=>{stopFireworks();cleanupHost();home()};
  $("#cr").onclick=()=>{stopFireworks();classResults(ps)};$("#again").onclick=()=>{stopFireworks();finale(ps)};
  // reveal 5th -> 1st
  const order=[4,3,2,1,0].filter(i=>top[i]);
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const at=reduce?[0,0,0,0,0]:[900,1900,3100,4400,6200];
  FIN.forEach(clearTimeout);FIN=order.map((i,n)=>setTimeout(()=>{const el=app.querySelector(`.finale [data-i="${i}"]`);if(!el)return;el.classList.add("in");
    if(i===0){fanfare();startFireworks(reduce?0:1)}else beep(i<3?660:520,.12)},at[n+(5-top.length)]||at[n]));
}
function classResults(ps){
  const H=HOST;document.body.classList.remove("finale-on");
  const by={};ORDER.forEach(k=>by[k]={n:0,r:0});
  ps.forEach(p=>Object.entries(p.a||{}).forEach(([qi,x])=>{const sk=byId[H.ids[qi]]&&byId[H.ids[qi]].sk;if(sk){by[sk].n++;if(x.ok)by[sk].r++}}));
  const weak=ORDER.filter(k=>by[k].n).sort((a,b)=>by[a].r/by[a].n-by[b].r/by[b].n).slice(0,2);
  app.innerHTML=`<div class="rep"><h2 style="text-align:center">Class results</h2>
    <div class="endgrid"><div class="skills" style="margin:0"><div style="font-family:var(--display);font-size:22px;font-weight:600;padding:6px 0">By skill</div>
    ${ORDER.filter(k=>by[k].n).map(k=>{const p=by[k].r/by[k].n;return `<div class="sk"><span><b>${esc(SKILLS[k].short)}</b></span><div class="bar"><i class="${p>=.85?"":p>=.6?"mid":"lo"}" style="width:${Math.max(4,p*100)}%"></i></div><span class="v">${Math.round(p*100)}%</span></div>`}).join("")}</div>
    <div class="todo" style="margin:0"><h3>Reteach first</h3>${weak.map(k=>`<div class="tip"><div class="t"><b>${esc(SKILLS[k].short)}: ${Math.round(by[k].r/by[k].n*100)}% correct</b>${esc(SKILLS[k].tip)}</div></div>`).join("")}</div></div>
    <p class="note" style="text-align:center">${ps.length} player${ps.length===1?"":"s"}. Each student sees their own report and practice on their device.</p>
    <div class="row" style="justify-content:center"><button class="btn main" id="pod">Back to Top 5</button> <button class="btn" id="erase">Erase game</button> <button class="btn" id="home3">Done</button></div></div>`;
  $("#pod").onclick=()=>finale(ps);$("#erase").onclick=hostErase;$("#home3").onclick=()=>{cleanupHost();home()};
  document.body.classList.add("wide");requestAnimationFrame(zoomApp);
}
function fanfare(){[[523,0],[659,.12],[784,.24],[1047,.4]].forEach(([f,t])=>setTimeout(()=>beep(f,.35),t*1000))}
let FW=null,FIN=[];
function stopFireworks(){FIN.forEach(clearTimeout);FIN=[];if(FW){cancelAnimationFrame(FW.raf);clearTimeout(FW.t);FW=null}document.body.classList.remove("finale-on")}
function startFireworks(on){
  const cv=$("#fw");if(!cv)return;const cx=cv.getContext("2d");if(FW)cancelAnimationFrame(FW.raf);
  const dpr=Math.min(2,devicePixelRatio||1);const size=()=>{cv.width=innerWidth*dpr;cv.height=innerHeight*dpr};size();addEventListener("resize",size);
  const COLS=["#C1102F","#E8193C","#FFFFFF","#FFFFFF","#D9D9D9","#C1102F"];
  const rockets=[],parts=[];const t0=performance.now();let last=t0;
  const launch=()=>{const W=cv.width,Hh=cv.height;rockets.push({x:W*(.12+Math.random()*.76),y:Hh,vx:(Math.random()-.5)*1.2*dpr,vy:-(Hh*.0125+Math.random()*Hh*.004),ty:Hh*(.12+Math.random()*.35),c:COLS[Math.floor(Math.random()*COLS.length)]})};
  const burst=(r)=>{const n=70+Math.floor(Math.random()*40),sp=(2.2+Math.random()*2.2)*dpr,ring=Math.random()<.35;
    for(let k=0;k<n;k++){const a=Math.PI*2*k/n+Math.random()*.1,v=ring?sp:sp*(.35+Math.random()*.75);parts.push({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,d:.008+Math.random()*.01,c:Math.random()<.25?"#FFFFFF":r.c,s:(1.6+Math.random()*1.4)*dpr})}};
  FW={raf:0};
  const frame=(now)=>{if(!FW)return;const el=now-t0,dt=Math.min(40,now-last);last=now;
    const rate=el<7000?260:el<20000?900:1800; // busy at first, then a gentle show
    if(on&&now-(FW.lastL||0)>rate){FW.lastL=now;launch();if(el<7000&&Math.random()<.5)launch()}
    cx.globalCompositeOperation="destination-out";cx.fillStyle="rgba(0,0,0,.22)";cx.fillRect(0,0,cv.width,cv.height);cx.globalCompositeOperation="lighter";
    for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.x+=r.vx;r.y+=r.vy;r.vy+=.09*dpr;cx.fillStyle=r.c;cx.beginPath();cx.arc(r.x,r.y,2.2*dpr,0,7);cx.fill();if(r.y<=r.ty||r.vy>=0){burst(r);rockets.splice(i,1)}}
    for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.985;p.vy=p.vy*.985+.045*dpr;p.life-=p.d;if(p.life<=0){parts.splice(i,1);continue}
      cx.globalAlpha=Math.max(0,p.life);cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.s,0,7);cx.fill()}
    cx.globalAlpha=1;FW.raf=requestAnimationFrame(frame)};
  if(!on){ // reduced motion: one still burst of color
    [0,1,2].forEach(()=>{launch()});rockets.forEach(r=>{r.y=r.ty;burst(r)});rockets.length=0;parts.forEach(p=>{p.x+=p.vx*25;p.y+=p.vy*25});
    cx.globalCompositeOperation="lighter";parts.forEach(p=>{cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.s,0,7);cx.fill()});return}
  FW.raf=requestAnimationFrame(frame);
}
function hostQuestion(qi){
  if(qi>0){const g=kickIdle(qi-1);HOST.kickMsg=g.length?`Removed after 3 missed in a row: ${g.join(", ")} (they can rejoin)`:""}
  const prev=qi>0?byId[HOST.ids[qi-1]].sk:null,sk=byId[HOST.ids[qi]].sk;
  hostSet(prev!==sk?{phase:"intro",qi}:{phase:"question",qi,t:Date.now()});
}
function cleanupHost(){if(HOST){clearInterval(HOST.watch);HOST.off&&HOST.off()}}
async function hostErase(){if(!HOST)return home();cleanupHost();try{await HOST.N.remove("games/"+HOST.code)}catch(e){}HOST=null;home()}

/* ============================================================ LIVE: STUDENT */
let ME=null;
const SKEY="ablSession";
const saveSess=o=>{try{localStorage.setItem(SKEY,JSON.stringify(o))}catch(e){}};
const loadSess=()=>{try{return JSON.parse(localStorage.getItem(SKEY)||"null")}catch(e){return null}};
const baseFor=st=>!st||st.phase==="lobby"?-1:st.phase==="reveal"||st.phase==="end"?st.qi:st.qi-1;
function rejoinBtn(){const b=$("#rejoin");if(!b||ROLE==="teacher")return;b.hidden=false}
async function joinForm(){
  const N=await net().catch(()=>null);if(!N)return needSetup();
  const sv=loadSess(),qcode=(location.search.match(/[?&]code=(\d{4})/)||[])[1];
  app.innerHTML=`${hdr()}<div class="panel" style="margin-top:0"><h2>Join a class game</h2><p>${qcode?"Code filled in. Type your name (first name and last initial).":"Type the code on the board and your name (first name and last initial)."} Kicked out or closed the page? Join again with the same name and you keep your points.</p>
    <input class="field code" id="cd" inputmode="numeric" maxlength="4" placeholder="0000" autocomplete="off" value="${qcode||(sv?esc(sv.code):"")}">
    <input class="field" id="nm" maxlength="24" placeholder="Jordan M." autocomplete="off" value="${sv&&(!qcode||sv.code===qcode)?esc(sv.name):""}">
    <div class="err" id="er"></div><button class="btn main" id="go">Join</button></div>`;
  rejoinBtn();(qcode&&!$("#nm").value)?$("#nm").focus():sv?$("#go").focus():$("#cd").focus();
  const go=async()=>{
    const code=$("#cd").value.trim(),name=$("#nm").value.trim();
    if(!/^\d{4}$/.test(code)){$("#er").textContent="The code is 4 numbers.";return}
    if(!name){$("#er").textContent="Type your name.";return}
    $("#go").disabled=true;
    const err=await enterGame(N,code,name,null);
    if(err){$("#er").textContent=err;$("#go").disabled=false}
  };
  $("#go").onclick=go;$("#nm").onkeydown=e=>{if(e.key==="Enter")go()};
}
// Join or rejoin. Same code + same name on this device reuses the old seat, so score and answers carry over.
async function enterGame(N,code,name,forcePid){
  try{
    const g=await N.get("games/"+code);
    if(!g||(g.game||"bankrec")!==GAME)return "No game with that code. Check the board.";
    const sv=loadSess();
    const norm=x=>String(x||"").trim().toLowerCase().replace(/\s+/g," ");
    let pid=forcePid||(sv&&sv.code===code&&norm(sv.name)===norm(name)?sv.pid:null);
    if(!pid&&g.players){const hit=Object.entries(g.players).find(([,p])=>norm(p.name)===norm(name));if(hit)pid=hit[0]} // same name = same seat, on any device
    const rec=pid&&g.players&&g.players[pid];
    const base=baseFor(g.state);
    if(rec){name=rec.name||name;await N.update(`games/${code}/players/${pid}`,{out:false,base})}
    else{pid="p"+Math.random().toString(36).slice(2,10);await N.set(`games/${code}/players/${pid}`,{name,score:0,joined:Date.now(),base})}
    saveSess({code,pid,name});
    const answered={},log=[];let last=-1;
    Object.entries((rec&&rec.a)||{}).sort((x,y)=>+x[0]-+y[0]).forEach(([qi,x])=>{answered[qi]=x;const sk=byId[g.ids[qi]]&&byId[g.ids[qi]].sk;if(sk)log.push({sk,ok:!!x.ok,ms:x.ms||0});if(x.c>=0)last=Math.max(last,+qi)});
    if(ME&&ME.off)ME.off();
    ME={N,code,pid,name,seed:g.seed,ids:g.ids,score:(rec&&rec.score)||0,log,answered,state:null,base:Math.max(base,last),out:false,pen:+g.pen||0};timeMult=g.mult||1;
    $("#who").textContent=name;$("#who").hidden=false;rejoinBtn();
    ME.off=N.on(`games/${code}/state`,st=>{if(!ME)return;if(!st){joinGone();return}ME.state=st;joinRender()});
    return null;
  }catch(e){return "Couldn't connect. Try again."}
}
async function rejoin(){
  const N=await net().catch(()=>null);if(!N)return needSetup();
  if(ME&&!ME.out){ME.rq=null;try{const st=await ME.N.get(`games/${ME.code}/state`);if(st)ME.state=st}catch(e){}joinRender();return} // already in: re-sync the screen
  if(ME&&ME.out){const M=ME;M.out=false;M.base=baseFor(M.state);M.rq=null;
    try{await M.N.update(`games/${M.code}/players/${M.pid}`,{out:false,base:M.base})}catch(e){}
    rejoinBtn();joinRender();return}
  const sv=loadSess();if(!sv)return joinForm();
  const err=await enterGame(N,sv.code,sv.name,sv.pid);
  if(err){joinForm().then(()=>{const e=$("#er");if(e)e.textContent=err==="No game with that code. Check the board."?"That game has ended. Join a new one with the code on the board.":err})}
}
function joinGone(){stopTick();document.body.classList.remove("stu-live");if(ME&&ME.off)ME.off();const was=ME;ME=null;try{localStorage.removeItem(SKEY)}catch(e){}rejoinBtn();
  if(was&&was.log.length)report(was.name,was.log,was.score,null);else{app.innerHTML=`<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`;$("#h").onclick=home}}
const ord=n=>n+(n%100>=11&&n%100<=13?"th":["th","st","nd","rd"][n%10]||"th");
function placeHTML(st){const M=ME,x=st.ranks&&st.ranks[M.pid];if(!x)return `<div class="place wait-rank">Checking your place…</div>`;
  const [r,b]=x,mv=b-r;return `<div class="place${r<=3?" podium-"+r:""}"><span>You're in</span><b>${ord(r)}</b><span>of ${st.n}</span>${mv>0?`<i class="mv up">▲ ${mv}</i>`:mv<0?`<i class="mv dn">▼ ${-mv}</i>`:""}</div>`}
function kickedScreen(){
  const M=ME;stopTick();document.body.classList.remove("stu-live");setFit(false);M.rq="out";
  app.innerHTML=`<div class="wait"><h2>You were removed</h2><p>You missed 3 questions in a row, so you were taken out of the game. Your points are saved.</p><button class="btn main big-rejoin" id="rj">Rejoin the game</button></div>`;
  $("#rj").onclick=rejoin;rejoinBtn();
}
function joinRender(){
  const M=ME,st=M.state;if(!st)return;
  if(st.phase!=="question")setFit(false);
  // three straight misses (no answer) => out
  const doneQi=st.phase==="reveal"||st.phase==="end"?st.qi:st.qi-1;
  const lastAns=()=>Math.max(M.base,...Object.entries(M.answered).filter(([,x])=>x.c>=0).map(([q])=>+q));
  if(!M.out&&st.phase!=="lobby"&&st.phase!=="end"){
    const pending=st.phase==="reveal"&&!M.answered[st.qi]?st.qi:doneQi;
    if(pending-lastAns()>=3){M.out=true;M.N.update(`games/${M.code}/players/${M.pid}`,{out:true}).catch(()=>{})}
  }
  if(M.out&&st.phase!=="end"){if(M.rq!=="out")kickedScreen();return}
  const live=st.phase==="question"&&!M.answered[st.qi];
  if(!live)document.body.classList.remove("stu-live");
  if(st.phase==="lobby"){app.innerHTML=`<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. The game starts soon.</p></div>`;return}
  if(st.phase==="intro"){stopTick();const sk=byId[M.ids[st.qi]].sk;app.innerHTML=`<div class="wait"><div class="r" style="color:var(--accent);font-family:var(--display);letter-spacing:.1em">ROUND ${ORDER.indexOf(sk)+1}</div><h2>${esc(SKILLS[sk].name)}</h2><p>${esc(SKILLS[sk].desc)}</p><div class="big">${M.score.toLocaleString()}</div><p>points so far</p></div>`;M.rq=null;return}
  const q=inst(byId[M.ids[st.qi]],M.seed),secs=secsFor(q);
  if(st.phase==="question"){
    if(M.answered[st.qi]){if(M.rq!==st.qi+"w"){M.rq=st.qi+"w";setFit(false);app.innerHTML=`<div class="wait"><h2>Answer locked in</h2><p>Waiting for everyone else…</p></div>`}return}
    if(M.rq===st.qi)return;M.rq=st.qi;
    document.body.classList.add("stu-live");
    renderQuestion(app,q,{label:SKILLS[q.sk].name,num:`Question ${st.qi+1} of ${M.ids.length}`,score:M.score,timed:true,secs,noFit:true,onAnswer:(c,ms)=>{
      if(M.answered[st.qi]||M.out)return;
      if(c<0){document.body.classList.remove("stu-live");app.innerHTML=`<div class="wait"><h2>Time's up</h2><p>Waiting for the answer…</p></div>`;M.rq=st.qi+"w";return} // the reveal records the miss
      const ok=c===q.ans,old=M.score;M.score=old+(ok?points(ok,ms,secs):-M.pen);const pts=M.score-old;M.answered[st.qi]={c,ok,pts,ms};M.log.push({sk:q.sk,ok,ms});
      M.N.update(`games/${M.code}/players/${M.pid}`,{score:M.score,["a/"+st.qi]:{c,ok,ms:Math.round(ms),pts}});
      document.body.classList.remove("stu-live");setFit(false);app.innerHTML=`<div class="wait"><h2>Answer locked in</h2><p>Waiting for everyone else…</p></div>`;M.rq=st.qi+"w";
    }});
    return;
  }
  if(st.phase==="reveal"){
    stopTick();
    const rkKey=st.qi+"r"+(st.ranks&&st.ranks[M.pid]?st.ranks[M.pid].join("."):"");
    if(M.rq===rkKey)return;M.rq=rkKey;
    let a=M.answered[st.qi];
    if(!a){a={c:-1,ok:false,pts:0,ms:secs*1000};M.answered[st.qi]=a;M.log.push({sk:q.sk,ok:false,ms:secs*1000});M.N.update(`games/${M.code}/players/${M.pid}`,{["a/"+st.qi]:{c:-1,ok:false,ms:secs*1000,pts:0}})}
    app.innerHTML=`<div class="wait"><h2 style="color:${a.ok?"var(--good)":"var(--bad)"}">${a.ok?"Correct!":a.c<0?"Time's up":"Not quite"}</h2><div class="big" style="color:${a.pts<0?"var(--bad)":"inherit"}">${a.pts<0?"−"+(-a.pts).toLocaleString():"+"+a.pts.toLocaleString()}</div>${!a.ok&&a.c>=0&&M.pen?`<p>Wrong answers cost ${M.pen.toLocaleString()} points. If you are not sure, let the clock run out for 0.</p>`:""}<p>${a.ok?"":"Answer: "+esc(optText(q.opts[q.ans]))+"<br>"}${esc(q.x)}</p><p><b>${M.score.toLocaleString()}</b> points total</p>${placeHTML(st)}</div>`;
    return;
  }
  if(st.phase==="end"){
    stopTick();if(M.rq==="end")return;M.rq="end";
    const fin=()=>{try{localStorage.removeItem(SKEY)}catch(e){}};
    M.N.get(`games/${M.code}/players`).then(ps=>{const arr=Object.values(ps||{}).filter(p=>!p.out).map(p=>p.score||0).sort((a,b)=>b-a);const rank=arr.indexOf(M.score)+1;if(M.off)M.off();const keep=M;ME=null;fin();rejoinBtn();report(keep.name,keep.log,keep.score,rank||null)}).catch(()=>{const keep=M;ME=null;fin();rejoinBtn();report(keep.name,keep.log,keep.score,null)});
  }
}

$("#rejoin").onclick=rejoin;
home();
rejoinBtn();
