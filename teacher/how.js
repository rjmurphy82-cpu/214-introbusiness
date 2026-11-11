/* How to run panel on /teacher. One entry per game, grouped by unit.
   learn, tell, strat print on the student one-pager. steps, need, tip are teacher only.
   Button names in <b> match the host screens, so update them here if a game's buttons change. */
"use strict";
const KAHOOT_TELL = [
  "Right answers earn 600 to 1,000 points. Faster right answers earn more.",
  "Wrong answers cost points (the default is −1,000), so don't just tap something.",
  "Read the whole question. Some need math."
];
const KAHOOT_STRAT = [
  "A careful right answer beats a fast wrong one: speed adds at most 400, a wrong answer costs 1,000.",
  "On math questions, work it out instead of guessing."
];
const KAHOOT_STEPS = (name) => [
  "Open " + name + ", pick questions per round, the penalty, and the time, then click <b>Create game</b>.",
  "Students open <b>" + name + "</b> on the student site and type the code and their name. Click <b>Start game</b>.",
  "Each question: <b>Show question</b>, <b>Show answer now</b>, then the next question.",
  "At the end, show the <b>Top 5</b>, then <b>Class results</b> for what to reteach first."
];
const CONSOLE_STEPS = (name, open, close) => [
  "Open the " + name + " console, go to <b>Games</b>, pick <b>Class game</b>, name it for the period, choose <b>Live</b> and a company, then click <b>Create and make active</b>.",
  "Students open <b>" + name + "</b> on the student site, tap <b>Join class game</b>, and create or join a team.",
  "On <b>Control</b>, click <b>" + open + "</b>. Put the brief on the board from its tab.",
  "When teams are in, click <b>" + close + "</b>, then <b>Standings so far</b>.",
  "Open the next round. After the last one, click <b>Show final standings</b>."
];
const HOW = [
 { id:"boss", name:"Boss Moves", unit:"Management", href:"/boss-moves/teacher",
   who:"Pairs, one student per iPad. New partner every round.", go:"Boss Moves",
   learn:[
    "The 10 leadership styles, and which one fits a real workplace problem.",
    "Reading a team's Situational Leadership level: how skilled and how committed they are.",
    "Saying it the way a leader would: one clear statement to the team."
   ],
   tell:[
    "Each round you get a new partner and a new workplace situation.",
    "Pick the leadership style that fits. The best style earns 300, a good fit earns 150.",
    "Write the statement you'd give your team. Then everyone votes for the class statement closest to the Perfect Statement.",
    "Each vote your statement gets is +50, the top statement is +200, and voting earns +25. Both partners get the pair's points."
   ],
   strat:[
    "Read the team first: new and excited, skilled but unsure, or experts who need room?",
    "Match the style to the problem, not to the style you like best.",
    "Write a statement with a goal, a reason, and what happens next. Vague statements don't get votes.",
    "Vote for the statement closest to the Perfect Statement, not your friend's."
   ],
   steps:[
    "Open Boss Moves, pick the situations and timers, then click <b>Create game</b>.",
    "Students open <b>Boss Moves</b> and enter the code. Click <b>Pair everyone up</b>.",
    "Click <b>Everyone's with a partner: start Round 1</b>. Use <b>Close it now</b> if pairs are done early.",
    "Reveal the best style and Perfect Statement, then <b>Open voting →</b> and <b>Close voting now</b>.",
    "Click <b>New partners for Round 2 →</b>. After the last round, <b>Final results →</b>."
   ],
   need:["About 8 minutes a round. Pick fewer situations for a short block."],
   tip:"Use ✕ to remove an absent student or hide a statement. Students who come back rejoin with the same name and keep their points."},
 { id:"culture", name:"Culture Launch", unit:"Management", href:"/culture-launch/teacher",
   who:"Random pairs (one group of 3 if odd), one device each.", go:"Culture Launch",
   learn:[
    "Organizational culture: how tone, leadership style, values, spending, policies, and discipline fit together.",
    "Why every choice has to match the culture you promise your crew.",
    "Presenting a plan and judging someone else's against a rubric."
   ],
   tell:[
    "You and your partner are the management team of a brand-new Sole Revival shop.",
    "Five stages: pick your tone, style, and values; spend up to $8,000 and 12 manager hours; set seven policies; build a discipline ladder; handle a crisis.",
    "The game turns your choices into an 8-slide deck. You present it from the board.",
    "Your score is alignment (how well every choice matches your tone, 0 to 100) plus the audience rubric (0 to 100)."
   ],
   strat:[
    "Pick your tone first and test every later choice against it.",
    "A strict policy can fit a friendly tone if you explain why. Choices that fight your tone cost alignment.",
    "Spend on what your tone promises. A \"we invest in people\" shop with no training budget won't add up.",
    "When you score other pairs, ask: do these policies match the tone they promised?"
   ],
   steps:[
    "Open Culture Launch, set the minutes for each stage, and click <b>Create game</b>. Students join with the code.",
    "Make the pairs, then click <b>Open Stage 1: Found it →</b>.",
    "Open each stage when the class is ready. Use <b>+2 minutes</b> if they need time.",
    "Click <b>Start presentations →</b>. Pairs present, the class scores, then <b>Next shop →</b>.",
    "After the last shop, click <b>Six months later →</b> for the alignment reveal and Top 5."
   ],
   need:["Building takes about 35 minutes. Presentations take about 2 minutes per pair.","Print the audience rubric backup in case devices act up."],
   tip:"Games last 14 days. Build one day, then click <b>Resume game</b> the next day to present."},
 { id:"motive", name:"Motivation Live", unit:"Management", href:"/motivation-live/teacher",
   who:"1 student per iPad (Kahoot style).", go:"Motivation Live",
   learn:["Intrinsic vs. extrinsic motivation, Maslow's hierarchy, and Herzberg's hygiene factors and motivators.","Theory X and Theory Y managers.","Reading motivation data and making the manager's call."],
   tell: KAHOOT_TELL, strat: KAHOOT_STRAT.concat(["Herzberg: fixing a hygiene factor stops complaints, but only a motivator makes people want to work harder."]),
   steps: KAHOOT_STEPS("Motivation Live"),
   need:["Play it after Keep the Crew."],
   tip:"Each game draws a fresh mix of the 42 questions. A student who drops taps <b>Rejoin</b>."},
 { id:"crew", name:"Keep the Crew", unit:"Management", href:"/keep-the-crew/teacher",
   who:"Pairs (one group of 3 if odd). Same partner all six months.", go:"Keep the Crew",
   learn:[
    "Herzberg's two factors: hygiene factors stop people from quitting, motivators make them want to work.",
    "Intrinsic vs. extrinsic motivation.",
    "Different people need different things: Maslow's needs show up in every employee."
   ],
   tell:[
    "You and your partner run a Sole Revival shop for six months.",
    "Each month, read the crew survey and what each employee says, then make two moves within a $1,500 budget.",
    "Label each move Hygiene or Motivator, and Extrinsic or Intrinsic. Every correct label is +5.",
    "Each month you score profit ÷ 100 plus average crew morale. Anyone under 35 morale two months running quits (−25)."
   ],
   strat:[
    "Read the quotes. Each employee tells you what they need.",
    "Fix the complaints first. Motivators don't work while a hygiene problem is still hurting someone.",
    "Expensive moves aren't always better. Some cheap moves raise morale the most.",
    "Watch anyone near 35. One more bad month and they're gone."
   ],
   steps:[
    "Open Keep the Crew, pick 3, 4, or 5 minutes per month, and click <b>Create game</b>. Students join with the code.",
    "Make the groups, then click <b>Everyone's with a partner: open Month 1</b>.",
    "When shops are in, click <b>Close the month now</b> and talk through the results and any resignations.",
    "Click <b>Open Month 2 →</b>. After Month 6, <b>Final results →</b>.",
    "Click <b>Download scores (CSV)</b> for the gradebook."
   ],
   need:["About 40 minutes for six months."],
   tip:"Absent students can play solo later. Every student can print a Shop Report with the Exit Interview Memo."},
 { id:"shift", name:"Shift Manager", unit:"Management", href:"/shift-manager/teacher",
   who:"Pairs (one group of 3 if odd). New partners every two rounds.", go:"Shift Manager",
   learn:[
    "Situational leadership: reading an employee's development level, D1 to D4.",
    "Matching the style, S1 Directing to S4 Delegating, to that level.",
    "What a manager actually says to get someone going."
   ],
   tell:[
    "Each round your group manages one Sole Revival employee.",
    "Diagnose their level (3 points), pick the style (3), choose an opening line (2) and a follow-up (2). Close picks get partial credit.",
    "Then write your own one-liner to motivate them.",
    "The class votes for the line closest to the Perfect Line: +1 per vote, +3 for the top line, +1 for voting."
   ],
   strat:[
    "Two questions: can they do it, and do they want to? That gives you the level.",
    "New and excited needs direction. Skilled but unsure needs support, not more instructions.",
    "Your first two picks lock once you speak, so diagnose before you talk.",
    "Watch for the twist rounds: the same person on a new task may be a different level."
   ],
   steps:[
    "Open Shift Manager, pick the minutes per round and the vote time, then click <b>Create game</b>.",
    "Students join with the code. Make the groups, then click <b>Everyone's with a partner: start Round 1</b>.",
    "Click <b>Close it now</b> when groups are done, then reveal the true level.",
    "Click <b>The Perfect Line and the vote →</b>, then <b>Close voting now</b>.",
    "Go on to the next round. After the last, <b>Final results →</b>."
   ],
   need:["3 to 5 minutes a round plus a 45 to 90 second vote."],
   tip:"Use ✕ to hide a line during the vote."},
 { id:"blitz", name:"Marketing Blitz", unit:"Marketing", href:"/marketing-blitz/",
   who:"2 to 12 teams. Projector only, no devices.", go:"Nothing. Students watch the projector.",
   learn:["Review of the whole marketing unit: target marketing, emotional marketing, the media buy, ad channels, social media ads, and segmentation.","The math: CPM, impressions, cost per sale, and profit."],
   tell:["Your team agrees on ONE answer and writes it on your whiteboard.","Each right answer is 1,000. Gold questions are worth double: 2,000.","Streaks: +100 for each right answer in a row after the first, up to +500."],
   strat:["Do the math on paper. Most of the hard questions need it.","Profit is the score, not impressions or clicks.","Don't break your streak by rushing. A right answer every time adds up fast."],
   steps:[
    "Open Marketing Blitz, set the number of teams and their names, and click <b>Start game</b>.",
    "Read each question. Use <b>+10 seconds</b> or pause if teams need time.",
    "Click <b>Reveal answer</b>, then tap each team that got it right (or <b>All correct</b>).",
    "Click <b>Leaderboard</b> after each question. The podium shows at the end."
   ],
   need:["A whiteboard and marker for each team.","Calculators."],
   tip:"If the browser closes, click <b>Resume saved game</b> to pick up where you left off."},
 { id:"showdown", noqr:true, name:"Ad Buy Showdown", unit:"Marketing", href:"/ad-buy-showdown/teacher",
   who:"Agencies of 2 or 3, one device each.", go:"Ad Buy Showdown",
   learn:["Building a social media ad buy: objective, location, age groups, interests, creative format, and budget split.","Matching the platform and the targeting to the client's customers."],
   tell:["Six clients, six rounds. Each round you read a client brief and build their ad buy.","Every agency's campaign launches at the same time.","You're graded on each decision against the model answer."],
   strat:["Read the brief twice. The right audience is hiding in it.","Narrow targeting beats broad when the client sells to a specific group.","Put the budget where the customers are, not split evenly by default."],
   steps:[
    "Open the console, go to <b>Games</b>, pick <b>Class game</b>, name it for the period, and click <b>Create and make active</b>.",
    "Students open <b>Ad Buy Showdown</b>, tap <b>Join class game</b>, and create or join an agency.",
    "On <b>Control</b>, click <b>Open Round 1</b>. Use <b>Show the client brief</b> on the board.",
    "When agencies lock in, click <b>Close and launch</b>, then <b>Review every buy</b>.",
    "Open the next round. After Round 6, <b>Show final standings</b>."
   ],
   need:["The launch deck and opener worksheet from Schoology or Drive."],
   tip:"The <b>Review</b> tab grades every agency's buy decision by decision, with the model answer."},
 { id:"crisis", name:"Brand Crisis", unit:"Marketing", href:"/brand-crisis/teacher",
   who:"Pairs, one iPad per team.", go:"Brand Crisis",
   learn:["How a company protects its brand when something goes wrong.","Why trust matters more than one week of sales.","Weighing the cost of a response against what it saves."],
   tell:[
    "Round 1: you run Strider Sneakers. Round 2: you run a crisis PR agency, and every crisis is a new client.",
    "Each crisis has 8 responses. Pick one and lock in. Then a twist card shows what happened next.",
    "Trust, sales, and your crisis budget carry over to the next crisis.",
    "Brand value = weekly sales × 52 × trust + cash left. The top 3 teams make the Hall of Fame."
   ],
   strat:["Trust multiplies everything. Losing trust costs more than spending money.","The cheapest response isn't always the best, and the most expensive one isn't either.","Saying nothing sometimes works and sometimes blows up. Ask how bad the story will get."],
   steps:[
    "Open Brand Crisis, pick Round 1 or Round 2, the crises, the time to decide, and a class name, then click <b>Create game</b>.",
    "Pairs open <b>Brand Crisis</b>, type both first names, and tap <b>Join as a team</b>.",
    "Click <b>Start: first crisis</b>. When teams lock in, <b>Close voting now</b>, then <b>See the results →</b>.",
    "Click <b>Next crisis →</b>. After the last, <b>Final results</b>, then <b>Hall of Fame</b>."
   ],
   need:[],
   tip:"The Hall of Fame is at <b>/brand-crisis/winners</b>. Show it at the start to raise the stakes."},
 { id:"ladder", name:"Marketing Ladder", unit:"Marketing", href:"/marketing-ladder/teacher",
   who:"Tables of 3, one student per iPad.", go:"Marketing Ladder",
   learn:["Review of the whole marketing unit, segmentation included.","Set 1: terms and definitions. Set 2: scenario questions with new companies.","Making a $100,000 buy across segments, channels, platforms, or ad emotions."],
   tell:[
    "Each round: vocab questions, then a $100,000 buy in $10,000 blocks, then results.",
    "You compete against the two people at your table. 1st gets +150, 2nd gets +75.",
    "1st places move together, 2nds together, 3rds together. Points add up all game."
   ],
   strat:["Every block has to earn back more than $10,000. Unspent blocks are kept, not lost.","Don't put it all in one place. Returns shrink as an option fills up.","Speed counts on vocab, but a wrong answer costs more than a slow one."],
   steps:[
    "Open Marketing Ladder, pick the set, rounds, vocab per round, timers, and <b>Ladder</b> or <b>Regroup by place</b>, then click <b>Create game</b>.",
    "Students join with their first name. Click <b>Seat the tables</b>.",
    "Click <b>Everyone's seated: start Round 1</b>. Use <b>Show answer now</b> on each vocab question.",
    "Click <b>Close buys now</b>, then <b>Table results →</b>.",
    "Click <b>Seat Round 2 →</b>. After the last round, <b>Final results →</b>."
   ],
   need:["Tables numbered. <b>Print table signs</b> in the lobby makes them for you."],
   tip:"Use ✕ to remove an absent student. They rejoin with the same name and keep their points."},
 { id:"adlive", name:"Ad Buy Live", unit:"Marketing", href:"/ad-buy-live/teacher",
   who:"1 student per iPad (Kahoot style).", go:"Ad Buy Live",
   learn:["Social media ad terms and the math: CPM, impressions, clicks, and cost per sale.","Platform audiences, targeting, ad formats, and campaign calls."],
   tell: KAHOOT_TELL, strat: KAHOOT_STRAT.concat(["Impressions = budget ÷ CPM × 1,000."]),
   steps: KAHOOT_STEPS("Ad Buy Live"),
   need:["Play it after Ad Buy Showdown."],
   tip:"A student who drops taps <b>Rejoin</b> on their iPad."},
 { id:"lineup", noqr:true, name:"Build the Lineup", unit:"Marketing", href:"/build-the-lineup/teacher",
   who:"Teams of 2 or 3, one device each.", go:"Build the Lineup",
   learn:["Market segmentation: one product, three kinds of customers.","Building a version of a product for each segment and pricing it.","Fixing a lineup after seeing how customers reacted."],
   tell:["Read the case file. It describes three customer segments.","Build a version for each segment: pick its features and set its price.","Launch 1 shows how each segment reacted. Fix your lineup for Launch 2.","Most profit wins."],
   strat:["Give each segment its must-have features first. Without them, they won't buy.","A low price doesn't win if you lose money on every sale.","Use Launch 1 to learn. Check which segment didn't buy and why."],
   steps: CONSOLE_STEPS("Build the Lineup", "Open Launch 1", "Close and reveal"),
   need:["The launch deck and student guide from Class files below.","Print the case file for the company you pick."],
   tip:"Self-paced games let teams work through several companies and send you a report."},
 { id:"mediabuy", noqr:true, name:"Million Dollar Media Buy", unit:"Marketing", href:"/media-buy/teacher",
   who:"Teams of 2 or 3, one device each.", go:"Media Buy",
   learn:["Target marketing: picking which customer segments are worth the money.","Reading a brief to find the customers who actually buy."],
   tell:["Each year you split $1,000,000 across customer segments in $100,000 chips.","Four years. Each year brings news that changes the market.","Highest return wins."],
   strat:["Read the brief for who buys the most, not who sounds biggest.","Read each year's news before you buy. What worked last year may not work now.","Spread out a little. Market luck can swing any one segment."],
   steps: CONSOLE_STEPS("Media Buy", "Open Year 1 buying", "Close buying and reveal"),
   need:[],
   tip:"Put <b>The Brief</b> tab on the board while teams buy."},
 { id:"windy", noqr:true, name:"Windy City Ad Buy", unit:"Marketing", href:"/windy-city/teacher",
   who:"Teams of 2 or 3, one device each.", go:"Windy City",
   learn:["Advertising channels: which Chicago channels reach which customers.","Comparing the return on each channel."],
   tell:["Spend $1,000,000 across nine Chicago ad channels in $100,000 chips.","Four years. Each year brings news that changes the market.","Highest return wins."],
   strat:["Match the channel to where the company's customers actually are.","The biggest audience isn't the best buy if they won't buy the product.","Read each year's news before you buy."],
   steps: CONSOLE_STEPS("Windy City", "Open Year 1 buying", "Close buying and reveal"),
   need:[],
   tip:"Put <b>The Brief</b> tab on the board so everyone can see the nine channels."}
];
(function () {
  const sel = document.getElementById("howSel"), body = document.getElementById("howBody");
  if (!sel || !body) return;
  const groups = {};
  HOW.forEach(g => { (groups[g.unit] = groups[g.unit] || []).push(g); });
  sel.innerHTML = Object.keys(groups).map(u => '<optgroup label="' + u + '">' + groups[u].map(g => '<option value="' + g.id + '">' + g.name + '</option>').join("") + '</optgroup>').join("");
  const li = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join("") + '</ul>';
  function show(id) {
    const g = HOW.find(x => x.id === id) || HOW[0]; sel.value = g.id;
    const go = g.go.startsWith("Nothing") ? g.go : '<strong>' + g.go + '</strong> on the student site' + (g.noqr ? '' : ', or scan the QR');
    body.innerHTML = '<div class="ttl">' + g.name + '</div>' +
      '<div class="meta"><div><b>Who plays</b>' + g.who + '</div><div><b>Students go to</b>' + go + '</div></div>' +
      '<h3><span class="scr">What they learn</span><span class="prt">What you will learn</span></h3>' + li(g.learn) +
      '<h3><span class="scr">Tell them before you start</span><span class="prt">Before you start</span></h3>' + li(g.tell) +
      '<h3><span class="scr">Strategy to share</span><span class="prt">Strategy</span></h3>' + li(g.strat) +
      '<div class="tchr"><h3>Steps</h3><ol>' + g.steps.map(x => '<li>' + x + '</li>').join("") + '</ol>' +
      (g.need.length ? '<h3>Before class</h3>' + li(g.need) : '') +
      '<div class="tip">' + g.tip + '</div></div>' +
      '<a class="open" href="' + g.href + '">Open ' + g.name + ' →</a>';
    try { localStorage.setItem("ibHowGame", g.id); } catch (e) {}
  }
  sel.onchange = () => show(sel.value);
  let saved = null; try { saved = localStorage.getItem("ibHowGame"); } catch (e) {}
  show(saved || HOW[0].id);
})();
