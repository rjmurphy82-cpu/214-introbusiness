/* Brand Crisis: the scenario packs, the crises, and the math. Shared by the student page, the teacher screen, and
   api/crisis-board.js (which re-scores finished games for the Hall of Fame).
   Round 1 (Strider Sneakers): every team is Strider's marketing team, one brand through six crises.
   Round 2 (Lakeshore Crisis Group): every team runs a crisis PR agency; each crisis is a different client company,
   and Trust is the agency's reputation. Each crisis has 8 responses. A response costs crisis budget
   and moves Trust (0-100) and weekly Sales (%). After everyone locks in, one random twist card ("what happened next")
   changes how some responses play out. Students who don't lock in "stayed quiet" (the silent option).
   Brand value = weekly sales x 52 x (trust / 100) + cash left. Trust multiplies everything. */
"use strict";
var CRISIS = (function () {
  const BRAND = {
    name: "Strider Sneakers",
    line: "Chicago sneaker brand · \"Built in Chicago\" · founded 2019",
    about: "Most buyers are 16 to 24 and pay with their own money. Parents buy back-to-school pairs. Strider's whole image is honest, local, and real.",
    start: { trust: 70, sales: 1000000, cash: 1000000 }
  };
  const LABELS = { trust: "Trust", sales: "Weekly sales", salesShort: "Sales", cash: "Crisis budget", value: "Brand value" };
  // o: [letter label is added on screen] t = text, cost = $ spent now, tr = trust change, sa = weekly sales change (%), tag = kind of response
  const CRISES = [
    {
      id: "creator", title: "The Creator Clip",
      story: "An old video of Strider's biggest sponsored creator (3 million followers) resurfaces. In it, he mocks people with disabilities. #DropStrider is trending.",
      opts: [
        { t: "Drop him today and post a short, clear apology.", cost: 0, tr: 4, sa: -2, tag: "apologize" },
        { t: "Stay quiet and wait for it to blow over.", cost: 0, tr: -12, sa: -6, tag: "silent" },
        { t: "Defend him: \"People change. That was years ago.\"", cost: 0, tr: -18, sa: -8, tag: "defend" },
        { t: "Drop him, apologize, and give $100,000 to an adaptive sports league whose athletes star in your next ad.", cost: 100000, tr: 10, sa: 2, tag: "fix" },
        { t: "Delete the angry comments and turn off replies.", cost: 0, tr: -15, sa: -5, tag: "hide" },
        { t: "Post a meme joking about the drama.", cost: 0, tr: -20, sa: -7, tag: "humor" },
        { t: "Pause every creator ad until a full review is done.", cost: 50000, tr: 2, sa: -6, tag: "pause" },
        { t: "Keep him, and let him post his own apology.", cost: 0, tr: -6, sa: -3, tag: "defend" }
      ],
      twists: [
        { t: "A reporter finds out Strider's team knew about the video last year.", note: "Hiding and defending look much worse now.", mods: { hide: { tr: -8 }, silent: { tr: -8 }, defend: { tr: -8 } } },
        { t: "The creator's own apology goes viral as sincere. Most fans forgive him.", note: "Keeping him and letting him apologize looks better.", mods: { defend: { tr: 8, sa: 3 } } },
        { t: "A bigger celebrity scandal takes over the news two days later.", note: "Staying quiet hurts less than usual.", mods: { silent: { tr: 7, sa: 3 } } }
      ]
    },
    {
      id: "soles", title: "Splitting Soles",
      story: "Soles on the new $140 Lakefront Runner are splitting after two weeks. #StriderSplit has 6 million views. You've sold 40,000 pairs.",
      opts: [
        { t: "Full recall: free replacement or refund for every pair.", cost: 300000, tr: 12, sa: -4, tag: "fix" },
        { t: "Replace pairs only for people who complain.", cost: 60000, tr: -4, sa: -3, tag: "partial" },
        { t: "Say it's \"a small batch\" and most pairs are fine.", cost: 0, tr: -10, sa: -6, tag: "deny" },
        { t: "Blame customers for \"improper use.\"", cost: 0, tr: -20, sa: -10, tag: "blame" },
        { t: "Give everyone 20% off their next pair.", cost: 40000, tr: -6, sa: -2, tag: "discount" },
        { t: "Founder video: shows what went wrong, the fix, a 1-year guarantee, and the full recall.", cost: 320000, tr: 16, sa: -2, tag: "fix" },
        { t: "Pay creators to post positive reviews of the shoe.", cost: 80000, tr: -14, sa: -4, tag: "fake" },
        { t: "Quietly stop selling the shoe.", cost: 0, tr: -8, sa: -7, tag: "silent" }
      ],
      twists: [
        { t: "Lawyers start a class-action lawsuit over the splitting soles.", note: "Denying, blaming, and silence now cost money and trust.", mods: { deny: { tr: -10, sa: -5 }, blame: { tr: -10, sa: -5 }, silent: { tr: -10, sa: -5 }, partial: { tr: -5 } } },
        { t: "Consumer Reports praises brands that recall fast this year.", note: "Full recalls get a bonus.", mods: { fix: { tr: 5, sa: 3 } } },
        { t: "Your replacement pairs ship three weeks late.", note: "Recalls lose some of their shine.", mods: { fix: { tr: -4 } } }
      ]
    },
    {
      id: "review", title: "The One-Star Video",
      story: "A customer's 2-minute video: her package was lost and support hung up on her twice. 4 million views. The comments are full of people with the same story.",
      opts: [
        { t: "Reply publicly within an hour, refund her, ship a new pair overnight, and DM her.", cost: 1000, tr: 6, sa: 1, tag: "fast" },
        { t: "Ignore it. It's one person.", cost: 0, tr: -8, sa: -3, tag: "silent" },
        { t: "Reply: \"We have no record of this order.\"", cost: 0, tr: -12, sa: -4, tag: "deny" },
        { t: "Fix support: hire 20 agents, promise 24-hour replies, and post the plan.", cost: 150000, tr: 12, sa: 3, tag: "fix" },
        { t: "Offer her free shoes for life if she deletes the video.", cost: 5000, tr: -10, sa: -2, tag: "hide" },
        { t: "Flood the comments with brand-friendly accounts.", cost: 20000, tr: -16, sa: -4, tag: "fake" },
        { t: "Invite her to Strider HQ to design a \"Customer Says\" pair.", cost: 40000, tr: 8, sa: 5, tag: "partner" },
        { t: "Post a funny video roasting the delivery company.", cost: 0, tr: -4, sa: 1, tag: "blame" }
      ],
      twists: [
        { t: "She posts a follow-up video about how Strider responded.", note: "Fast, fixing, and partnering responses get a boost. Asking her to delete it backfires.", mods: { fast: { tr: 4 }, fix: { tr: 4 }, partner: { tr: 4, sa: 2 }, hide: { tr: -8, sa: -3 } } },
        { t: "Customer-service horror stories start trending for every big brand.", note: "Brands that actually fixed support stand out.", mods: { fix: { tr: 3, sa: 4 } } },
        { t: "The delivery company apologizes and admits it lost thousands of packages.", note: "Pointing at the delivery company looks fair now.", mods: { blame: { tr: 8, sa: 2 } } }
      ]
    },
    {
      id: "attack", title: "The Attack Ad",
      story: "Rival brand Vantage runs an ad: \"Strider: $140 for 'Built in Chicago'? Same overseas factory as ours, half the price.\" It's partly true: some pairs are made overseas.",
      opts: [
        { t: "Ignore it.", cost: 0, tr: -4, sa: -4, tag: "silent" },
        { t: "Fire back with an attack ad mocking Vantage.", cost: 120000, tr: -6, sa: 2, tag: "attack" },
        { t: "Be honest: show which pairs are made where, and why.", cost: 30000, tr: 8, sa: -1, tag: "honest" },
        { t: "Cut prices 25% to match Vantage.", cost: 150000, tr: 0, sa: 6, tag: "discount" },
        { t: "Sue Vantage for false advertising.", cost: 200000, tr: -2, sa: -2, tag: "legal" },
        { t: "Move more production to Chicago and make that the new campaign.", cost: 250000, tr: 12, sa: 4, tag: "fix" },
        { t: "Post a funny video that admits it and pokes fun at Strider itself.", cost: 20000, tr: 6, sa: 3, tag: "humor" },
        { t: "Quietly remove \"Built in Chicago\" from the website.", cost: 0, tr: -10, sa: -3, tag: "hide" }
      ],
      twists: [
        { t: "A journalist confirms Vantage's claim with factory records.", note: "Hiding, ignoring, and suing look bad. Honesty gets credit.", mods: { hide: { tr: -8 }, silent: { tr: -6 }, legal: { tr: -8 }, honest: { tr: 4 } } },
        { t: "Viewers think Vantage's ad is mean. It flops.", note: "Ignoring it works, and firing back lands better than expected.", mods: { silent: { tr: 6, sa: 4 }, attack: { tr: 4 } } },
        { t: "Your self-roast gets picked up by sports radio.", note: "Humor pays off big.", mods: { humor: { tr: 4, sa: 4 } } }
      ]
    },
    {
      id: "factory", title: "The Factory Report",
      story: "A news report says one of Strider's overseas suppliers underpays workers and forces them to work overtime.",
      opts: [
        { t: "Deny it: \"We follow all laws.\"", cost: 0, tr: -14, sa: -5, tag: "deny" },
        { t: "Cut ties with the supplier today.", cost: 120000, tr: 6, sa: -5, tag: "cut" },
        { t: "Hire an outside auditor, publish the results, and fix pay with the supplier.", cost: 180000, tr: 14, sa: -1, tag: "honest" },
        { t: "Stay quiet.", cost: 0, tr: -10, sa: -4, tag: "silent" },
        { t: "Blame the supplier: \"We didn't know.\"", cost: 0, tr: -6, sa: -2, tag: "blame" },
        { t: "Launch a \"Fair Pair\" line: $10 of every pair goes to the workers.", cost: 60000, tr: 8, sa: 2, tag: "partner" },
        { t: "Donate $50,000 to a workers' rights group and say nothing else.", cost: 50000, tr: -2, sa: -1, tag: "donate" },
        { t: "Run a feel-good \"Chicago Pride\" ad to change the subject.", cost: 100000, tr: -12, sa: -2, tag: "distract" }
      ],
      twists: [
        { t: "A second report shows five other big brands use the same supplier.", note: "The heat spreads out. Every response hurts a little less.", mods: { deny: { tr: 5 }, silent: { tr: 5 }, blame: { tr: 5 }, distract: { tr: 4 } } },
        { t: "Students at 30 high schools organize a Strider boycott.", note: "Your young buyers are watching. Silence and spin cost more.", mods: { deny: { tr: -8, sa: -4 }, silent: { tr: -8, sa: -4 }, distract: { tr: -8, sa: -4 }, donate: { tr: -4 } } },
        { t: "The auditor finds the problem is real but already improving.", note: "Transparent and Fair Pair responses get extra credit.", mods: { honest: { tr: 4, sa: 2 }, partner: { tr: 3, sa: 2 } } }
      ]
    },
    {
      id: "breach", title: "The Data Breach",
      story: "Hackers stole 200,000 Strider customers' names, emails, and home addresses from your website.",
      opts: [
        { t: "Tell customers within 24 hours, explain what happened, and offer free identity protection.", cost: 200000, tr: 8, sa: -2, tag: "honest" },
        { t: "Wait three weeks until the lawyers are sure what happened.", cost: 0, tr: -14, sa: -5, tag: "silent" },
        { t: "Email a short notice with a 10% off code.", cost: 30000, tr: -8, sa: -1, tag: "discount" },
        { t: "Say \"No payment info was taken, so it's no big deal.\"", cost: 0, tr: -12, sa: -3, tag: "deny" },
        { t: "Hire a security firm, notify everyone, and post a CEO video with the fix plan.", cost: 260000, tr: 12, sa: -1, tag: "fix" },
        { t: "Blame the company that built your website.", cost: 0, tr: -8, sa: -3, tag: "blame" },
        { t: "Shut down the online store for a week to fix it.", cost: 150000, tr: 4, sa: -8, tag: "pause" },
        { t: "Post a meme: \"Even hackers want our shoes.\"", cost: 0, tr: -18, sa: -4, tag: "humor" }
      ],
      twists: [
        { t: "A state law requires telling customers within 7 days. Waiting brings a $100,000 fine.", note: "Waiting gets expensive.", mods: { silent: { tr: -10, cost: 100000 } } },
        { t: "The hackers post the stolen data online.", note: "Being upfront pays. Downplaying it backfires.", mods: { honest: { tr: 4 }, fix: { tr: 4 }, discount: { tr: -6 }, deny: { tr: -8 } } },
        { t: "A huge breach at a big-box store takes over the headlines.", note: "Everyone's response matters a little less.", mods: { silent: { tr: 5 }, deny: { tr: 4 }, blame: { tr: 4 } } }
      ]
    }
  ];

  /* ================================================================ ROUND 2: LAKESHORE CRISIS GROUP */
  const AGENCY = {
    name: "Lakeshore Crisis Group",
    line: "Crisis PR agency · Chicago · clients across the Midwest",
    about: "Companies call you on their worst day. Every crisis is a new client. Handle it well and your reputation grows, more clients sign on, and your fees go up. Handle it badly and clients walk.",
    start: { trust: 70, sales: 1000000, cash: 1000000 }
  };
  const AGENCY_LABELS = { trust: "Reputation", sales: "Weekly client fees", salesShort: "Fees", cash: "Crisis budget", value: "Agency value" };
  const AGENCY_CRISES = [
    {
      id: "mouse", client: "Frostbite Creamery", clientLine: "Ice cream shops · 14 Chicagoland stores", title: "The Mouse Video",
      story: "A customer films a mouse running behind the freezer at Frostbite's Schaumburg store. 2 million views by lunch, and the comments are tagging the health department.",
      opts: [
        { t: "Close the store today, bring in pest control and a health inspector, and post the inspection report when it's clean.", cost: 120000, tr: 12, sa: -3, tag: "fix" },
        { t: "Say it's an old video from another store.", cost: 0, tr: -16, sa: -6, tag: "deny" },
        { t: "Stay quiet and hope it fades.", cost: 0, tr: -10, sa: -5, tag: "silent" },
        { t: "Give everyone a free scoop this weekend.", cost: 80000, tr: -4, sa: 3, tag: "discount" },
        { t: "Owner video from the closed store: \"This isn't OK. Here's exactly what we're fixing.\"", cost: 10000, tr: 8, sa: -2, tag: "apologize" },
        { t: "Report the video so the platform takes it down.", cost: 0, tr: -14, sa: -4, tag: "hide" },
        { t: "Post a joke: \"Even mice can't resist our cookie dough.\"", cost: 0, tr: -18, sa: -5, tag: "humor" },
        { t: "Close all 14 stores for a deep clean and livestream it.", cost: 300000, tr: 14, sa: -8, tag: "pause" }
      ],
      twists: [
        { t: "The health department inspects other Frostbite stores and finds them spotless.", note: "Fixing the one store looks smart. Closing all 14 looks like overkill.", mods: { fix: { tr: 4, sa: 3 }, pause: { tr: -6, sa: -3 }, apologize: { tr: 3 } } },
        { t: "A second video shows a mouse at another Frostbite store.", note: "It's not one store anymore. Denying and joking blow up.", mods: { deny: { tr: -10, sa: -4 }, humor: { tr: -8 }, hide: { tr: -8 }, pause: { tr: 6, sa: 3 }, fix: { tr: -4 } } },
        { t: "The weather hits 95 degrees all weekend.", note: "Everyone wants ice cream. Freebies and open stores win.", mods: { discount: { tr: 4, sa: 5 }, silent: { tr: 4, sa: 3 }, pause: { sa: -5 } } }
      ]
    },
    {
      id: "launch", client: "Gridline Games", clientLine: "Video game studio · Chicago", title: "The Broken Launch",
      story: "Gridline's big new game, Skyline Raiders ($70), launched today full of bugs. Saves are deleting. It's #1 on the \"Most Refunded\" list and streamers are roasting it live.",
      opts: [
        { t: "Offer full refunds to anyone who wants one, no questions asked.", cost: 250000, tr: 10, sa: -6, tag: "refund" },
        { t: "Say \"most players are having a great time.\"", cost: 0, tr: -14, sa: -5, tag: "deny" },
        { t: "Post a dated fix plan, update players every week, and give everyone a free bonus pack.", cost: 120000, tr: 12, sa: 2, tag: "fix" },
        { t: "Blame the console makers' servers.", cost: 0, tr: -10, sa: -3, tag: "blame" },
        { t: "Pull the game from stores until it's fixed.", cost: 150000, tr: 6, sa: -10, tag: "pause" },
        { t: "Stay quiet and keep patching in the background.", cost: 0, tr: -10, sa: -5, tag: "silent" },
        { t: "Developers go live on stream to fix bugs in front of fans.", cost: 20000, tr: 8, sa: 3, tag: "honest" },
        { t: "Ban players who post bug videos from the game's forums.", cost: 0, tr: -20, sa: -6, tag: "hide" }
      ],
      twists: [
        { t: "A huge streamer says Gridline's dev stream \"is how every studio should act.\"", note: "Being open with fans gets a big boost.", mods: { honest: { tr: 8, sa: 5 }, fix: { tr: 3 } } },
        { t: "The first patch breaks the game even worse.", note: "Promises look shaky. Refunds look like the safe call.", mods: { fix: { tr: -6, sa: -3 }, honest: { tr: -3 }, refund: { tr: 5, sa: 3 }, pause: { tr: 4 } } },
        { t: "Players find out leaders knew the game wasn't ready.", note: "Denying, blaming, hiding, and silence look much worse.", mods: { deny: { tr: -8, sa: -3 }, blame: { tr: -8 }, hide: { tr: -6 }, silent: { tr: -6 } } }
      ]
    },
    {
      id: "storm", client: "Prairie Air", clientLine: "Regional airline · O'Hare and Midway", title: "Stranded at O'Hare",
      story: "A snowstorm cancels 400 Prairie Air flights over winter break. The rebooking app crashes. Families are sleeping on the airport floor and posting it all.",
      opts: [
        { t: "Pay for hotels and meals for every stranded passenger.", cost: 300000, tr: 12, sa: 2, tag: "fix" },
        { t: "Say: \"Weather isn't our fault. Check the app for updates.\"", cost: 0, tr: -12, sa: -4, tag: "blame" },
        { t: "Send 200 extra staff to the gates with snacks, cots, and phone chargers.", cost: 90000, tr: 8, sa: 1, tag: "people" },
        { t: "Give every affected passenger a $100 travel voucher for later.", cost: 60000, tr: 2, sa: 1, tag: "discount" },
        { t: "CEO video every 6 hours with honest updates on when planes will fly.", cost: 5000, tr: 7, sa: 0, tag: "honest" },
        { t: "Stay quiet until the storm clears.", cost: 0, tr: -10, sa: -5, tag: "silent" },
        { t: "Post a cheerful \"Let it snow!\" winter promo.", cost: 20000, tr: -20, sa: -6, tag: "humor" },
        { t: "Book stranded passengers on rival airlines at Prairie Air's cost.", cost: 220000, tr: 10, sa: -2, tag: "partner" }
      ],
      twists: [
        { t: "Rival airlines get back in the air a full day before Prairie Air.", note: "Your passengers compare. Waiting it out looks bad. Rebooking on rivals pays off.", mods: { silent: { tr: -6, sa: -3 }, blame: { tr: -6 }, partner: { tr: 5, sa: 3 }, honest: { tr: -2 } } },
        { t: "A video of a Prairie Air agent playing cards with stranded kids goes viral.", note: "Putting people at the gates pays off.", mods: { people: { tr: 8, sa: 4 }, fix: { tr: 2 } } },
        { t: "The government announces airlines must cover hotels during long delays.", note: "Hotels were required anyway. Vouchers and silence look stingy.", mods: { fix: { tr: -6 }, discount: { tr: -4 }, silent: { tr: -6, cost: 150000 } } }
      ]
    },
    {
      id: "caffeine", client: "PeakFuel", clientLine: "Energy drink brand · sold nationwide", title: "The Label Lab Test",
      story: "A university lab tests PeakFuel and finds 40% more caffeine than the can says. Doctors on TikTok are warning parents. PeakFuel is popular with high schoolers.",
      opts: [
        { t: "Recall the affected batches, fix the label, and fund an outside lab to test every batch.", cost: 280000, tr: 14, sa: -4, tag: "fix" },
        { t: "Say \"our cans are safe\" and attack the lab's testing.", cost: 0, tr: -16, sa: -5, tag: "deny" },
        { t: "Quietly update the label on new cans.", cost: 20000, tr: -10, sa: -2, tag: "hide" },
        { t: "Stop marketing to anyone under 18 and say so publicly.", cost: 40000, tr: 6, sa: -5, tag: "honest" },
        { t: "Pay fitness influencers to post that they drink it every day.", cost: 100000, tr: -14, sa: 2, tag: "fake" },
        { t: "Stay quiet and let the lawyers handle it.", cost: 0, tr: -12, sa: -4, tag: "silent" },
        { t: "Partner with doctors on a \"know your caffeine\" campaign for teens.", cost: 70000, tr: 9, sa: -1, tag: "partner" },
        { t: "Blame the factory that makes the cans.", cost: 0, tr: -8, sa: -3, tag: "blame" }
      ],
      twists: [
        { t: "The FDA opens an investigation into PeakFuel.", note: "Hiding and denying get very expensive.", mods: { deny: { tr: -10, sa: -4 }, hide: { tr: -10, sa: -3 }, silent: { tr: -8, sa: -3 }, fix: { tr: 4 } } },
        { t: "A second lab finds the first test was a little off. The real number is 15% over.", note: "Still over the label, but the panic cools down.", mods: { deny: { tr: 6 }, silent: { tr: 5 }, hide: { tr: 4 } } },
        { t: "Parents start a group pushing schools to ban energy drinks.", note: "Anything aimed at teens matters more.", mods: { honest: { tr: 6, sa: 2 }, partner: { tr: 5, sa: 2 }, fake: { tr: -6 } } }
      ]
    },
    {
      id: "payday", client: "Brightside Bank", clientLine: "Online bank · 300,000 customers", title: "Missing Paychecks",
      story: "A tech glitch at Brightside Bank delays paycheck deposits for two days. Customers can't pay rent or buy groceries, and #BrightsideBroke is trending.",
      opts: [
        { t: "Cover any late fees or overdraft charges customers get because of the delay.", cost: 150000, tr: 10, sa: 1, tag: "fix" },
        { t: "Give every affected customer a $500 advance now, before the deposits clear.", cost: 300000, tr: 13, sa: 3, tag: "people" },
        { t: "Say \"deposits are delayed\" and nothing else.", cost: 0, tr: -10, sa: -4, tag: "silent" },
        { t: "Blame the company that runs your computer systems.", cost: 0, tr: -8, sa: -3, tag: "blame" },
        { t: "CEO video: what broke, when the money arrives, and how it won't happen again.", cost: 10000, tr: 8, sa: 0, tag: "honest" },
        { t: "Offer a 5% interest bonus to customers who don't close their accounts.", cost: 80000, tr: -2, sa: 2, tag: "discount" },
        { t: "Post a meme: \"Patience is a virtue.\"", cost: 0, tr: -22, sa: -6, tag: "humor" },
        { t: "Turn off the app's comment and review features until it's fixed.", cost: 0, tr: -14, sa: -3, tag: "hide" }
      ],
      twists: [
        { t: "The fix takes four days, not two.", note: "Promises run out. Real help for customers matters most.", mods: { honest: { tr: -5 }, silent: { tr: -6, sa: -3 }, people: { tr: 4, sa: 2 }, fix: { tr: 3 } } },
        { t: "A news story shows a family whose rent check bounced because of the glitch.", note: "Covering fees and advances look like the right call.", mods: { fix: { tr: 4, sa: 2 }, people: { tr: 3 }, discount: { tr: -4 } } },
        { t: "The money arrives early, in just one day.", note: "The storm passes fast. Big spending looks like more than you needed.", mods: { people: { tr: -4 }, silent: { tr: 6, sa: 2 }, blame: { tr: 3 } } }
      ]
    },
    {
      id: "copied", client: "TrendThread", clientLine: "Online fashion brand · sells to ages 16 to 25", title: "The Copied Hoodie",
      story: "A small Chicago artist posts side-by-side photos: TrendThread's best-selling hoodie (50,000 sold) uses her design. She never got paid or asked. 5 million views.",
      opts: [
        { t: "Pull the hoodie, apologize, and pay the artist for every one sold.", cost: 200000, tr: 12, sa: -3, tag: "fix" },
        { t: "Say \"it's a coincidence\" and keep selling it.", cost: 0, tr: -14, sa: -2, tag: "deny" },
        { t: "Offer her a collab line with her name on it and half the profits.", cost: 60000, tr: 10, sa: 4, tag: "partner" },
        { t: "Have your lawyers send her a letter telling her to stop posting.", cost: 30000, tr: -22, sa: -6, tag: "legal" },
        { t: "Quietly change the design a little and keep selling it.", cost: 15000, tr: -10, sa: -2, tag: "hide" },
        { t: "Stay quiet.", cost: 0, tr: -8, sa: -3, tag: "silent" },
        { t: "Blame a freelance designer you hired.", cost: 0, tr: -6, sa: -2, tag: "blame" },
        { t: "Pull the hoodie and start a $100,000 fund that pays local artists for designs.", cost: 100000, tr: 8, sa: -1, tag: "honest" }
      ],
      twists: [
        { t: "Three more artists say TrendThread copied their work too.", note: "It's a pattern now. Excuses fall apart.", mods: { blame: { tr: -10, sa: -4 }, deny: { tr: -8, sa: -3 }, hide: { tr: -8 }, honest: { tr: 5 }, partner: { tr: -3 } } },
        { t: "The artist posts that she's thrilled with how TrendThread responded.", note: "Responses that made it right with her get a big boost.", mods: { partner: { tr: 6, sa: 5 }, fix: { tr: 4 }, honest: { tr: 3 } } },
        { t: "A copyright lawyer says she has a strong case in court.", note: "Fighting her gets expensive.", mods: { legal: { tr: -6, cost: 150000 }, deny: { tr: -4, cost: 50000 }, hide: { tr: -4 } } }
      ]
    }
  ];
  AGENCY_CRISES.forEach(c => c.pack = "agency");
  CRISES.forEach(c => c.pack = "strider");
  const PACKS = [
    { id: "strider", round: "Round 1", title: "Strider Sneakers", sub: "One brand, six crises", brand: BRAND, labels: LABELS, crises: CRISES,
      role: "the marketing team for Strider Sneakers" },
    { id: "agency", round: "Round 2", title: "Lakeshore Crisis Group", sub: "Your PR agency, six different clients", brand: AGENCY, labels: AGENCY_LABELS, crises: AGENCY_CRISES,
      role: "the crisis team at Lakeshore Crisis Group, a PR agency" }
  ];
  const packById = Object.fromEntries(PACKS.map(p => [p.id, p]));
  const ALL = PACKS.flatMap(p => p.crises);
  const byId = Object.fromEntries(ALL.map(c => [c.id, c]));
  const packOf = ids => packById[(byId[ids && ids[0]] || {}).pack] || PACKS[0];
  const SILENT = c => c.opts.findIndex(o => o.tag === "silent");

  // The outcome of option i once the twist is known.
  function outcome(c, i, twistIdx) {
    const o = c.opts[i], m = (twistIdx != null && c.twists[twistIdx] && c.twists[twistIdx].mods[o.tag]) || {};
    return { cost: o.cost + (m.cost || 0), tr: o.tr + (m.tr || 0), sa: o.sa + (m.sa || 0) };
  }
  const value = b => b.sales * 52 * (b.trust / 100) + b.cash;
  function apply(b, out) {
    return { trust: Math.max(0, Math.min(100, b.trust + out.tr)), sales: Math.max(0, b.sales * (1 + out.sa / 100)), cash: b.cash - out.cost };
  }
  // Replay a player's game. picks[r] = option index (or null = stayed quiet). twists[r] = the twist drawn that round.
  function run(ids, picks, twists, upto) {
    let b = { ...packOf(ids).brand.start };
    const log = [];
    for (let r = 0; r <= upto; r++) {
      const c = byId[ids[r]], raw = picks[r];
      let i = raw == null ? SILENT(c) : +raw;
      if (c.opts[i].cost > b.cash) i = SILENT(c); // couldn't afford it (the screen stops this, but just in case)
      const out = outcome(c, i, twists[r]), before = value(b);
      b = apply(b, out);
      log.push({ r, i, quiet: raw == null, out, delta: value(b) - before, b: { ...b } });
    }
    return { b, log, value: value(b) };
  }
  // The response that adds the most brand value this round, starting from the brand's state (for the reveal).
  function bestFor(c, twistIdx, b) {
    let top = -Infinity, best = 0;
    c.opts.forEach((o, i) => { if (o.cost > b.cash) return; const v = value(apply(b, outcome(c, i, twistIdx))) - value(b); if (v > top) { top = v; best = i; } });
    return best;
  }
  return { BRAND, CRISES, PACKS, packById, packOf, byId, SILENT, outcome, value, apply, run, bestFor };
})();
if (typeof module !== "undefined") module.exports = CRISIS;
