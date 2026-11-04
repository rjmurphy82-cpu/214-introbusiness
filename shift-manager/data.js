/* Shift Manager: everything the game teaches. Shared by the student page and the teacher screen.
   Situational Leadership: read the employee's development level (D1 to D4), then use the matching style (S1 to S4).
   Each EMPLOYEE is one round at Sole Revival, Maya's sneaker restoration shop:
     d       the true development level (1 to 4) for THIS task
     lines   four opening lines, one per style (s = 1 to 4), each with the employee's reaction
     follow  three follow-up moves worth 2, 1, or 0 points, each with a reaction
   Scoring per round (10 max): diagnosis 3 / 1 / 0, style 3 / 1 / 0 (exact / off by one / further),
   opening line 2 / 1 / 0 (matches the level / off by one / further), follow-up 2 / 1 / 0. */
"use strict";
var SHIFT = (function () {
  const LEVELS = {
    1: { code: "D1", name: "Enthusiastic Beginner", sub: "Low skill, high commitment" },
    2: { code: "D2", name: "Disillusioned Learner", sub: "Some skill, low commitment" },
    3: { code: "D3", name: "Capable but Cautious", sub: "High skill, variable commitment" },
    4: { code: "D4", name: "Self-Reliant Achiever", sub: "High skill, high commitment" }
  };
  const STYLES = {
    1: { code: "S1", name: "Directing", sub: "Tell what, how, and when. Check often." },
    2: { code: "S2", name: "Coaching", sub: "Direct, but explain why and ask for ideas." },
    3: { code: "S3", name: "Supporting", sub: "Listen and encourage. They make the calls." },
    4: { code: "S4", name: "Delegating", sub: "Hand over the work and the decisions." }
  };
  const PTS = { diag: [3, 1, 0], style: [3, 1, 0], line: [2, 1, 0] };

  const EMPLOYEES = [
    { id: "lena", name: "Lena", role: "New restorer", d: 1,
      see: "It's Lena's first day on the airbrush station. She watched restoration videos all weekend and can't stop smiling. She has never painted a real pair.",
      need: "Clear, step-by-step direction and someone to check her first pair. Her motivation is already high.",
      lines: [
        { s: 1, t: "Let me show you the five steps for prepping a pair. Watch me do one, then you do the next and I'll check it.", react: "“Yes! Can I take notes? I want to get it exactly right.”" },
        { s: 2, t: "Here's how we prep a pair and why each step matters. What do you think will be the hardest part?", react: "“Um, honestly I don't know enough yet to guess. Can you just show me?”" },
        { s: 3, t: "You've clearly done your homework. How do you want to start? I'm here if you need me.", react: "“I really don't know where to start. Which paint do I even use?”" },
        { s: 4, t: "Here's a pair. Do it however you think is best and bring it to me when you're done.", react: "She freezes, then quietly asks a coworker for help. The pair comes back with paint on the soles." }
      ],
      follow: [
        { t: "Stay close and check her work after each step today.", pts: 2, react: "Her first pair passes inspection. She asks to do another." },
        { t: "Tell her she's going to be great at this and walk away.", pts: 1, react: "She feels good, but she's still guessing on the hard parts." },
        { t: "Ask her to design a new paint process for the team.", pts: 0, react: "“A new process? I just learned the old one ten minutes ago.”" }
      ] },
    { id: "tasha", name: "Tasha", role: "Restorer, 2 months", d: 2,
      see: "Tasha is getting faster, but three of her pairs were sent back this week. She's standing at her station with her arms crossed and just said, “Maybe I'm not cut out for this.”",
      need: "Still needs direction on what went wrong, AND encouragement and a voice. Her confidence dropped.",
      lines: [
        { s: 1, t: "Three returns is too many. Redo them using the checklist, exactly as written, starting now.", react: "“Fine.” She stares at the floor and gets to work without another word." },
        { s: 2, t: "Let's look at those three pairs together. I'll show you what went wrong, and I want to hear what you think happened. You're closer than you think.", react: "She uncrosses her arms. “I think I rushed the drying. Can you show me how long you wait?”" },
        { s: 3, t: "Rough week. You know how to do this. What do you think you should change?", react: "“If I knew, I wouldn't keep messing up.”" },
        { s: 4, t: "Everybody has bad weeks. Fix them however you want and keep going.", react: "She nods, then sends a fourth pair back to herself an hour later." }
      ],
      follow: [
        { t: "Set a quick check-in at the end of each shift this week to review one pair together.", pts: 2, react: "By Friday she has zero returns and asks to try a harder suede pair." },
        { t: "Post the return numbers on the wall so she sees where she stands.", pts: 0, react: "She sees her name at the bottom and starts looking at job listings." },
        { t: "Pair her with Marcus for a day so she can watch someone faster.", pts: 1, react: "She picks up a few tricks, but still isn't sure what she did wrong." }
      ] },
    { id: "omar", name: "Omar", role: "Restorer, 1 year", d: 3,
      see: "Omar is skilled and reliable. Maya asked him to run the PM shift alone for the first time tonight. He said, “Are you sure? What if something goes wrong?”",
      need: "Confidence and someone to listen. He already knows how to do the work, so instructions feel like doubt.",
      lines: [
        { s: 1, t: "Here's the full closing checklist. Do it in this order and text me after each step.", react: "“I know how to close. I've done it a hundred times with Kenji.”" },
        { s: 2, t: "Let me walk you through each part of the shift, then tell me your ideas for running it.", react: "“OK... but I already know all of this. I'm just nervous about being the one in charge.”" },
        { s: 3, t: "You already know how to run this shift. What part worries you the most? Let's talk it through.", react: "He relaxes. “Honestly, just handling an angry customer by myself. What would you do?”" },
        { s: 4, t: "You'll be fine. See you tomorrow!", react: "“Yeah... I guess.” He looks at the door after you leave." }
      ],
      follow: [
        { t: "Tell him you trust his judgment and he can call you if he needs to.", pts: 2, react: "He handles a tough customer on his own and texts you a thumbs up at closing." },
        { t: "Stay for the first hour of his shift just in case.", pts: 1, react: "He's grateful, but wonders if you really trust him." },
        { t: "Remind him that mistakes will show up in his review.", pts: 0, react: "Now he's twice as nervous and second-guesses every decision." }
      ] },
    { id: "marcus", name: "Marcus", role: "Lead restorer, 2 years", d: 4,
      see: "Marcus is the best restorer in the shop. He trains new hires without being asked and just finished his work early again. A big rush order came in.",
      need: "Freedom and ownership. A real challenge, then step back.",
      lines: [
        { s: 1, t: "For this order, use the standard process exactly, and check in with me every hour.", react: "“Every hour? I've done this two hundred times.” He updates his resume that night." },
        { s: 2, t: "Let me explain how I want this order handled, and then I want your input.", react: "“Sure.” He's polite, but clearly bored." },
        { s: 3, t: "How are you feeling about taking on the rush order? I'm here to support you.", react: "“I feel great. Just tell me if it's mine.”" },
        { s: 4, t: "This rush order is yours. Plan it however you want and tell me what you need.", react: "“I've got it. I'll have a plan in an hour and update you Friday.”" }
      ],
      follow: [
        { t: "Give him the budget and authority to call in extra help if he needs it.", pts: 2, react: "He finishes a day early and trains two restorers along the way." },
        { t: "Give a long pep talk about how important this order is.", pts: 0, react: "He checks his phone halfway through." },
        { t: "Ask him to send a quick update at the end of each day.", pts: 1, react: "He does it, but wonders why you need it." }
      ] },
    { id: "dev", name: "Dev", role: "Front counter, 1 week", d: 1,
      see: "Dev started at the front counter last week. Customers love him and he talks sneakers with everyone. He has entered five orders wrong this week.",
      need: "A clear checklist and close follow-up. He's motivated; he just doesn't know the system yet.",
      lines: [
        { s: 1, t: "Here's the five-step checklist for every order. Let's enter the next one together, then I'll watch you do one.", react: "“Oh, that helps a lot. I didn't know about the color code step.”" },
        { s: 2, t: "Orders have been wrong. Why do you think that's happening? Here's what I'd suggest.", react: "He shrugs. “Maybe I'm just going too fast? I'm not sure.”" },
        { s: 3, t: "Customers love you! How do you want to handle the order mix-ups?", react: "“Be more careful, I guess?” He keeps smiling and makes the same mistake an hour later." },
        { s: 4, t: "You'll figure out the system. Just keep doing your thing.", react: "Two more orders go out wrong by closing." }
      ],
      follow: [
        { t: "Check his next five orders before they're sent to the back.", pts: 2, react: "He gets all five right and starts checking himself." },
        { t: "Write him up for the mistakes.", pts: 0, react: "His smile disappears. Customers notice." },
        { t: "Tell him to ask a coworker if he gets stuck.", pts: 1, react: "He asks once, but doesn't want to bother anyone again." }
      ] },
    { id: "rosa", name: "Rosa", role: "Suede specialist, 3 years", d: 3,
      see: "Rosa is the shop's suede expert. Lately she's slower, seems bored, and skipped the last two team meetings.",
      need: "To be heard, involved, and recognized. Her skill is high; her commitment dropped.",
      lines: [
        { s: 1, t: "You need to finish 12 suede pairs a day starting tomorrow, and attend every meeting.", react: "“Sure,” she says in a flat voice. Her work gets slower, not faster." },
        { s: 2, t: "Here's what I need from you, and here's why. What ideas do you have?", react: "“Fine. I guess I could work faster.” She doesn't sound convinced." },
        { s: 3, t: "You're the best suede restorer we have. I've noticed you seem off lately. What would make the work interesting again?", react: "“Honestly? I'd love to teach a suede class for the newer people.”" },
        { s: 4, t: "You're the expert, so I'll stay out of your way.", react: "She says nothing and keeps looking out the window." }
      ],
      follow: [
        { t: "Let her run a monthly suede workshop for the team.", pts: 2, react: "She's first in the door every day the week of the workshop." },
        { t: "Give her a $50 gift card for her years of service.", pts: 1, react: "“Thanks,” she says. It's nice, but nothing about the work changes." },
        { t: "Add her meeting absences to her file.", pts: 0, react: "She starts leaving right at closing, never a minute later." }
      ] },
    { id: "ava", name: "Ava", role: "Online lead", d: 4,
      see: "Ava runs the online shop. She hits her numbers every month, suggests new ideas, and rarely needs help. She wants to launch a cleaning-kit product line.",
      need: "Authority to decide and the resources to do it.",
      lines: [
        { s: 1, t: "Write up every step of the launch plan and I'll approve each piece before you do it.", react: "“Do you not trust me with this?”" },
        { s: 2, t: "I'll lay out how I'd do the launch, then you tell me what you'd change.", react: "“I already have a plan. I was hoping you'd want to see mine.”" },
        { s: 3, t: "That sounds exciting. How are you feeling about it? What support do you need from me?", react: "“I feel ready. I mostly need the go-ahead and a budget.”" },
        { s: 4, t: "Run with the launch. Here's the budget. Update me at the end of the month.", react: "“I'll have it live by spring.” She's already sketching the packaging." }
      ],
      follow: [
        { t: "Let her choose her own launch date and supplier.", pts: 2, react: "The kits sell out in three weeks." },
        { t: "Ask for a weekly progress report.", pts: 1, react: "She sends it, but it eats an hour she'd rather spend on the launch." },
        { t: "Tell her you'll think about it and get back to her.", pts: 0, react: "She sighs. Three weeks later she's still waiting." }
      ] },
    { id: "kenji", name: "Kenji", role: "New shift lead", d: 2,
      see: "Kenji is a great restorer who was just promoted to shift lead. His first schedule left the AM shift two people short, and he's frustrated with himself.",
      need: "Coaching: clear direction on scheduling, plus support because his confidence dropped.",
      lines: [
        { s: 1, t: "I'll redo the schedule myself. Just follow it next week.", react: "“So I guess I can't do this part of the job.”" },
        { s: 2, t: "Let's build next week's schedule together. I'll explain each choice, and I want your ideas on what went wrong.", react: "“That makes sense. I think I forgot to check who requested time off.”" },
        { s: 3, t: "You're a great restorer. What do you think you should do about the schedule?", react: "“I already tried. That's the problem.”" },
        { s: 4, t: "You'll figure it out. You're the shift lead now.", react: "He stays until 9 p.m. trying, and the schedule is still wrong." }
      ],
      follow: [
        { t: "Give him a simple scheduling template and review his next draft with him.", pts: 2, react: "His next schedule is perfect, and he shows it to you with a grin." },
        { t: "Remind him that he's great at restoring, so not to worry.", pts: 1, react: "He feels a little better, but the schedule problem isn't solved." },
        { t: "Tell the AM shift it was Kenji's mistake.", pts: 0, react: "The AM shift stops trusting his decisions." }
      ] },
    { id: "marcus2", name: "Marcus", role: "Twist: same person, new task", d: 1, twist: "Same Person, New Task",
      see: "Maya asks Marcus, her best restorer, to take over Sole Revival's TikTok account. He's excited, but he has never made a video or posted for a business.",
      need: "For THIS task, Marcus is a beginner. Development level is about the task, not the person, so he needs directing.",
      lines: [
        { s: 1, t: "Here's our posting checklist and three example videos. Let's make the first one together this afternoon.", react: "“Perfect. I had no idea where to start, honestly.”" },
        { s: 2, t: "Here's how we want the account to feel and why. What kind of videos are you thinking?", react: "“Maybe restorations? I don't really know what works on TikTok.”" },
        { s: 3, t: "You're great at everything. How do you want to approach it?", react: "“I mean, I'm great at shoes. This is totally different.”" },
        { s: 4, t: "You're my best guy. The account is yours, post whatever you want.", react: "His first video is 4 minutes long, sideways, and gets 11 views." }
      ],
      follow: [
        { t: "Review his first three posts before they go live.", pts: 2, react: "His third video hits 20,000 views." },
        { t: "Tell him he'll pick it up fast like he always does.", pts: 1, react: "He appreciates it, but he's still guessing." },
        { t: "Leave him alone. He's an expert.", pts: 0, react: "Two weeks later the account has three blurry posts." }
      ] },
    { id: "omar2", name: "Omar", role: "Twist: rush order", d: 3, twist: "Rush Order",
      see: "A customer needs 20 pairs by tomorrow morning and Omar is running the PM shift. He knows exactly how to do the work, but he says, “Twenty? Tonight? I don't know if we can.”",
      need: "Urgency doesn't change his level. He's skilled but worried, so he still needs support, not orders.",
      lines: [
        { s: 1, t: "Here's the exact plan: you do 8, Jordan does 6, Lena does 6. Start now and text me hourly.", react: "“I could have split it up myself.” He does it, but stops thinking for himself." },
        { s: 2, t: "Here's how I'd split the work and why. What would you change?", react: "“Your plan works, I guess. I was mostly worried about burning out the team.”" },
        { s: 3, t: "You know this shift better than anyone. What's worrying you? How would you split it up?", react: "“If I put Lena on cleaning only, we can make it. Can you approve some overtime?”" },
        { s: 4, t: "It's your shift. Figure it out.", react: "He panics and calls Maya at 10 p.m." }
      ],
      follow: [
        { t: "Approve the overtime he asked for and tell him you trust his plan.", pts: 2, react: "All 20 pairs are boxed by 7 a.m." },
        { t: "Come in yourself to help restore.", pts: 1, react: "It helps, but Omar wonders if you thought he couldn't do it." },
        { t: "Tell him the customer will leave a bad review if he fails.", pts: 0, react: "The pressure makes him rush. Two pairs come back." }
      ] }
  ];
  const byId = {}; EMPLOYEES.forEach(e => byId[e.id] = e);
  const DEFAULT = ["lena", "tasha", "omar", "marcus", "rosa", "marcus2"];
  // the four lines in a fixed shuffled order per game, so the S1 line isn't always first
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function lineOrder(seed, r) { const a = [0, 1, 2, 3], rnd = rng(seed + r * 7919); for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function followOrder(seed, r) { const a = [0, 1, 2], rnd = rng(seed + r * 104729); for (let i = 2; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function score(emp, pick) {
    if (!pick) return { diag: 0, style: 0, line: 0, follow: 0, total: 0 };
    const tier = (arr, a, b) => (a == null ? 0 : arr[Math.min(2, Math.abs(a - b))]);
    const diag = tier(PTS.diag, pick.d, emp.d), style = tier(PTS.style, pick.s, emp.d);
    const line = pick.o == null ? 0 : tier(PTS.line, emp.lines[pick.o].s, emp.d);
    const follow = pick.f == null ? 0 : emp.follow[pick.f].pts;
    return { diag, style, line, follow, total: diag + style + line + follow };
  }
  return { LEVELS, STYLES, PTS, EMPLOYEES, byId, DEFAULT, lineOrder, followOrder, score, MAX: 10 };
})();
