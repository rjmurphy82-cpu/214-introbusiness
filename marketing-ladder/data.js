/* Marketing Ladder: everything the game teaches. Shared by the student page, the teacher screen,
   and the study guide / deck build scripts (Node reads it with require).
   TERMS feed the "Define It" questions. BUYS are the "Make the Buy" client briefs.
   In each buy, V = most money the option can bring in, k = how fast it fills up (smaller k = fewer
   customers, so returns shrink sooner). Revenue from b blocks = V x (1 - e^(-b/k)). */
"use strict";
var LADDER = (function () {
  const TOPICS = {
    target:  { name: "Target Marketing", short: "Target marketing" },
    feel:    { name: "Emotional Marketing", short: "Emotional marketing" },
    media:   { name: "The Media Buy", short: "Media buy" },
    channel: { name: "Ad Channels", short: "Ad channels" },
    social:  { name: "Social Media Ads", short: "Social media ads" },
    lineup:  { name: "Market Segmentation", short: "Segmentation" }
  };

  /* ---------------------------------------------------------------- TERMS
     t = term, d = definition, ex = quick example (study guide and reveal screens) */
  const TERMS = [
    // target marketing
    { id: "tm", tp: "target", t: "Target market", d: "The specific group of customers a business aims its product and marketing at", ex: "Basecamp Bouldering's target market is young professionals who buy monthly memberships." },
    { id: "seg", tp: "target", t: "Market segmentation", d: "Splitting a large market into smaller groups of people who share traits and needs", ex: "A gym splits its market into teens, young professionals, parents, and companies." },
    { id: "mass", tp: "target", t: "Mass marketing", d: "One product and one message aimed at everyone", ex: "A single TV ad for table salt that runs during every show." },
    { id: "demo", tp: "target", t: "Demographic", d: "Describing customers by age, gender, and family stage", ex: "\"Ages 16 to 24, female\"" },
    { id: "socio", tp: "target", t: "Socioeconomic", d: "Describing customers by income, education, and job", ex: "\"Household income over $150,000\"" },
    { id: "geo", tp: "target", t: "Geographic", d: "Describing customers by where they live, work, or shop", ex: "\"Lives within 10 miles of the store\"" },
    { id: "psycho", tp: "target", t: "Psychographic", d: "Describing customers by values, interests, attitudes, and lifestyle", ex: "\"Loves adventure and posts outdoor photos\"" },
    { id: "behav", tp: "target", t: "Behavioral", d: "Describing customers by how they buy, use, and find a product", ex: "\"Bought 3+ times last month and found us on TikTok\"" },
    { id: "second", tp: "target", t: "Secondary target market", d: "A smaller group the data reveals that is still worth marketing to", ex: "Adults 35+ were only 15% of customers but spent nearly 4 times more per visit." },
    { id: "buyer", tp: "target", t: "Users vs. buyers", d: "The person who uses a product is not always the person who pays for it", ex: "Teens use the video game; parents' cards make 80% of purchases." },

    // emotional marketing
    { id: "emo", tp: "feel", t: "Emotional appeal", d: "Persuading by making people feel something and attaching that feeling to the brand", ex: "Nike's \"Dream Crazy\" sells pride and determination, not shoe features." },
    { id: "rat", tp: "feel", t: "Rational appeal", d: "Persuading with facts like price, features, performance, and proof", ex: "\"29 hours of battery life, 7 more than the leading phone.\"" },
    { id: "image", tp: "feel", t: "Brand image", d: "The personality and feelings people connect to a brand, separate from the product itself", ex: "Apple feels creative and simple; that feeling is its brand image." },
    { id: "assoc", tp: "feel", t: "Brand association", d: "When a brand becomes linked in your mind to a feeling", ex: "Coke = happiness. Nike = determination." },
    { id: "loyal", tp: "feel", t: "Brand loyalty", d: "When customers keep buying the same brand even when cheaper options exist", ex: "Buying Nike again even when a store brand is half the price." },
    { id: "nost", tp: "feel", t: "Nostalgia appeal", d: "An ad that makes you remember how good things used to be", ex: "Old songs, retro packaging, childhood memories." },
    { id: "fear", tp: "feel", t: "Fear / insecurity appeal", d: "An ad that suggests something is wrong with you and the product fixes it", ex: "Before-and-after acne ads, FOMO." },
    { id: "rebel", tp: "feel", t: "Rebellion / independence appeal", d: "An ad that says you are not like everyone else", ex: "Sprite's \"Image is nothing. Obey your thirst.\"" },

    // media buy
    { id: "mbuy", tp: "media", t: "Media buy", d: "Deciding where an advertising budget gets spent and how much goes to each place", ex: "Splitting $1,000,000 across six customer segments." },
    { id: "dimin", tp: "media", t: "Diminishing returns", d: "Each extra dollar spent in the same place brings in less than the dollar before it", ex: "The third $100K on teens won far fewer new customers than the first." },
    { id: "trap", tp: "media", t: "Trap segment", d: "A group with lots of interest or buzz that brings in very little money", ex: "Teens loved Pawprint's dog food video, but parents almost never subscribed." },
    { id: "gem", tp: "media", t: "Hidden gem", d: "A small group that is easy to miss but spends a lot per customer", ex: "Only 90 vet clinics, but each one sent about $7,000 of subscriptions a year." },
    { id: "repeat", tp: "media", t: "Repeat customer", d: "A customer who keeps coming back and buying again", ex: "Young professionals who climb four nights a week on a monthly membership." },
    { id: "saydo", tp: "media", t: "Said vs. did", d: "The gap between what people tell a survey and what they actually buy", ex: "84% of eco shoppers said they'd buy secondhand; 9% did." },

    // ad channels
    { id: "chan", tp: "channel", t: "Advertising channel", d: "A place where an ad runs, such as Instagram, a billboard, or a stadium", ex: "CTA trains, Google Search, the United Center." },
    { id: "reach", tp: "channel", t: "Reach", d: "How many different people see an ad", ex: "TikTok reaches about 90% of teens each week." },
    { id: "roi", tp: "channel", t: "ROI (return on investment)", d: "How much money comes back for every $1 spent", ex: "$250,000 earned from $100,000 spent is $2.50 per $1." },
    { id: "spons", tp: "channel", t: "Sponsorship", d: "Paying to attach your brand to an event, team, or venue", ex: "Booth and stage signs at Lollapalooza." },
    { id: "search", tp: "channel", t: "Search ads", d: "Ads shown when people search for what you sell", ex: "Google Search reaches people already looking to buy." },
    { id: "ooh", tp: "channel", t: "Out-of-home advertising", d: "Ads people see outside their homes, like billboards and transit posters", ex: "Kennedy Expressway billboards, CTA bus shelters." },

    // social media ads
    { id: "impr", tp: "social", t: "Impression", d: "One time an ad is shown on a screen", ex: "1,000 impressions = the ad appeared 1,000 times." },
    { id: "cpm", tp: "social", t: "CPM", d: "The cost to show an ad 1,000 times", ex: "$10 CPM: $2,000 buys 200,000 impressions." },
    { id: "ctr", tp: "social", t: "Click rate (CTR)", d: "Clicks divided by impressions", ex: "1,000 clicks from 50,000 impressions = 2%." },
    { id: "conv", tp: "social", t: "Conversion", d: "A click that turns into a sale", ex: "800 clicks at a 5% conversion rate = 40 sales." },
    { id: "roas", tp: "social", t: "ROAS", d: "Revenue divided by ad spend", ex: "$12,000 in sales from $3,000 of ads = 4x." },
    { id: "freq", tp: "social", t: "Frequency", d: "How many times the same person saw an ad", ex: "1,000 impressions with a reach of 250 = frequency of 4." },
    { id: "fatigue", tp: "social", t: "Ad fatigue", d: "When people see an ad so many times they stop paying attention", ex: "Frequency hits 12 and clicks fall off." },
    { id: "creator", tp: "social", t: "Creator partnership", d: "Paying an influencer to post about your product", ex: "Costs a 15% creator fee before any ads run." },

    // market segmentation (Build the Lineup)
    { id: "mseg", tp: "lineup", t: "Market segment", d: "One group inside a market whose people want the same things and differ from other groups", ex: "Maya's Weekend Wearers vs. her Collectors." },
    { id: "pline", tp: "lineup", t: "Product line", d: "A group of related versions of one product, such as basic, mid, and premium", ex: "Streaming with ads, no ads, and 4K." },
    { id: "ucost", tp: "lineup", t: "Unit cost", d: "What it costs to make one unit: the base cost plus every feature added", ex: "$5 base + $3 + $4 + $2 = $14 a pair." },
    { id: "wtp", tp: "lineup", t: "Willingness to pay", d: "The highest price a customer would pay; as price rises, fewer people buy", ex: "61% of Weekend Wearers would pay $30; 6% would pay $60." },
    { id: "must", tp: "lineup", t: "Must-have feature", d: "A feature 60% or more of a segment requires before they will buy", ex: "Leave one out and buyers are cut in half." },
    { id: "nice", tp: "lineup", t: "Nice-to-have feature", d: "A feature 30% to 59% of a segment wants that helps but isn't a deal-breaker", ex: "Each one adds 5% to Fit." },
    { id: "ppu", tp: "lineup", t: "Profit per unit", d: "Price minus unit cost: what the company keeps from each sale", ex: "$30 price − $14 cost = $16 a pair." },
    { id: "cannib", tp: "lineup", t: "Cannibalization", d: "When a company's cheaper version steals customers who would have paid for its pricier version", ex: "Collectors buying the basic package instead of the premium one." }
  ];
  const termById = Object.fromEntries(TERMS.map(t => [t.id, t]));

  /* ---------------------------------------------------------------- BUYS
     cols = the data columns students see; each option's cells line up with cols. */
  const BUYS = [
    {
      id: "rink", tp: "target", kind: "Customer segments",
      client: "Rink Rats Skate Center", what: "Roller skating rink in Arlington Heights",
      about: "Public skate nights, a party room, and an adult 21+ skate night on Thursdays. Admission is $14; party packages start at $350.",
      ask: "We have $100,000 for ads this year. Spend it on the people who will actually bring in money.",
      cols: ["Interest", "Customers you could win", "Spending per customer, per year"],
      opts: [
        { name: "Middle Schoolers (ages 11–14)", cells: ["82%", "1,000", "$60"], note: "\"Friday skate is the best. My mom pays at the door.\"", V: 60000, k: 6 },
        { name: "High Schoolers (ages 14–18)", cells: ["64%", "800", "$70"], note: "\"Fun with friends once or twice a year.\"", V: 56000, k: 6 },
        { name: "Parents Planning Kids' Parties", cells: ["48%", "360", "$420"], note: "\"Party package plus pizza. Easiest party ever.\"", V: 151000, k: 2.5 },
        { name: "Adults 21+ (Thursday skate night)", cells: ["22%", "600", "$180"], note: "\"We come every Thursday. It's our date night.\"", V: 108000, k: 3.5 },
        { name: "Schools and Youth Groups", cells: ["40%", "50 groups", "$2,400"], note: "\"Our fundraiser night there raised $1,100.\"", V: 120000, k: 1.3 }
      ],
      lesson: "Middle schoolers had the most interest but the least money behind it: a trap. Party parents and school groups spend far more per customer. Only 50 groups exist, so a few blocks reach most of them and more money there stops paying.",
      math: "Customers you could win x spending per customer = what a group is worth: parents 360 x $420 = $151,200, middle schoolers 1,000 x $60 = $60,000."
    },
    {
      id: "pie", tp: "feel", kind: "Ad emotions",
      client: "Hearthside Bakery", what: "Family bakery: holiday pies by preorder",
      about: "Hearthside sells $32 holiday pies made from the owner's grandmother's recipes. Almost every order comes from adults ages 35 to 60 who host family holiday dinners.",
      ask: "We made five versions of our holiday ad. Spend $100,000 running the ones that will actually sell pies to people who host the holidays.",
      cols: ["Emotion", "What the ad shows", "Test audience said"],
      opts: [
        { name: "Ad A: \"Grandma's Recipe\"", cells: ["Nostalgia", "Flour-dusted hands, an old recipe card, a 1980s kitchen", "\"That's my grandma's kitchen. I teared up.\""], note: "", V: 165000, k: 2.8 },
        { name: "Ad B: \"Everyone's Home\"", cells: ["Love / family", "A big family passing pie around a crowded table", "\"That's what the holidays are about.\""], note: "", V: 150000, k: 2.8 },
        { name: "Ad C: \"Pie Fails\"", cells: ["Humor / joy", "A bloopers reel of people dropping homemade pies", "\"Funny! Wait, what was it for?\""], note: "", V: 50000, k: 2.8 },
        { name: "Ad D: \"Don't Be That Host\"", cells: ["Fear / insecurity", "Guests whispering about a burnt store-bought pie", "\"Kind of mean. I felt judged.\""], note: "", V: 38000, k: 3.5 },
        { name: "Ad E: \"Pie First\"", cells: ["Rebellion", "Teens skipping dinner and eating dessert first", "\"My kids would love it. I host, though.\""], note: "", V: 28000, k: 2.5 }
      ],
      lesson: "Match the emotion to the target market. Holiday hosts ages 35 to 60 respond to nostalgia and family love. Humor got laughs but nobody remembered the brand, fear made people feel judged, and rebellion spoke to their kids instead of the buyer.",
      math: "Two strong ads beat one: once an ad's audience has seen it, more money on that same ad brings in less."
    },
    {
      id: "kayak", tp: "channel", kind: "Ad channels",
      client: "Lakefront Kayak Co.", what: "Kayak tours on the Chicago River",
      about: "90-minute architecture kayak tours, $65 a person. Best customers: young adults 23 to 34 who come in groups, and visitors planning a Chicago trip.",
      ask: "Spend $100,000 on the channels that reach the people who actually book.",
      cols: ["Reaches young adults 23–34 (worth $300K)", "Reaches trip planners (worth $250K)", "Reaches parents 35–54 (worth $60K)"],
      opts: [
        { name: "Instagram Ads", cells: ["70%", "30%", "50%"], note: "Photo and Reels ads", V: 157000, k: 3 },
        { name: "Google Search Ads", cells: ["40%", "75%", "45%"], note: "Shown to people searching \"things to do in Chicago\". Only so many people search.", V: 167000, k: 1.6 },
        { name: "Facebook Ads", cells: ["40%", "20%", "70%"], note: "Feed ads and community groups", V: 106000, k: 3 },
        { name: "CTA Train Posters", cells: ["60%", "25%", "20%"], note: "Seen daily by riders, one glance at a time", V: 76000, k: 3 },
        { name: "LinkedIn Ads", cells: ["15%", "5%", "8%"], note: "Targets people by job title", V: 31000, k: 3.5 }
      ],
      lesson: "A channel pays off when it reaches the customers who spend. Google reaches the most trip planners because they are already searching, but searches run out fast. Instagram reaches young adults best. Facebook's strength was parents, the group worth the least.",
      math: "Instagram: 70% of $300K + 30% of $250K + 50% of $60K = $315K of customers it can reach. LinkedIn reaches only $62K."
    },
    {
      id: "camp", tp: "social", kind: "Social platforms",
      client: "Lakeview Youth Soccer Camp", what: "Summer soccer camp for kids ages 8 to 13",
      about: "A one-week day camp, $299 per child. Kids love it, but parents ages 35 to 54 sign them up and pay.",
      ask: "Spend $100,000 on social ads that get parents to sign up.",
      cols: ["Weekly reach of parents 35–54", "Cost per 1,000 impressions (CPM)", "Best format there"],
      opts: [
        { name: "Facebook", cells: ["75%", "$8.50", "Single image or carousel"], note: "", V: 170000, k: 3 },
        { name: "YouTube", cells: ["85%", "$10.50", "15-second pre-roll"], note: "", V: 150000, k: 3 },
        { name: "Instagram", cells: ["45%", "$9.50", "Reels"], note: "", V: 90000, k: 2.8 },
        { name: "TikTok", cells: ["30%", "$7.50", "Short video"], note: "", V: 70000, k: 2.6 },
        { name: "Snapchat", cells: ["18%", "$5.50", "Story swipe-up"], note: "Cheapest views on the list", V: 40000, k: 4 }
      ],
      lesson: "Aim at the buyer, not the user. Parents pay for camp, and Facebook and YouTube reach the most parents. Snapchat had the cheapest views, but cheap impressions are wasted when they land on people who will never pay.",
      math: "Facebook: 75% reach at $8.50 per 1,000. Snapchat: only 18% reach. Cheap views of the wrong people still lose money."
    },
    {
      id: "pizza", tp: "media", kind: "Customer segments + news",
      client: "Cornerstone Pizza", what: "Pizza delivery and catering in the northwest suburbs",
      about: "Large pizzas are $18. Catering trays for offices and team parties run $90 to $400.",
      ask: "Spend $100,000 this year. Read the news first.",
      news: "This year's news: Big companies bring workers back to the office 4 days a week. Office lunch orders are booming.",
      cols: ["Interest", "Customers you could win", "Spending per customer, per year"],
      opts: [
        { name: "College Students", cells: ["80%", "800", "$90"], note: "\"Late-night slices are life. Whatever's cheapest.\"", V: 72000, k: 6 },
        { name: "Families with Kids", cells: ["58%", "500", "$300"], note: "\"Friday is pizza night. Every week.\"", V: 150000, k: 3 },
        { name: "Office Lunch Orders", cells: ["35%", "60 offices", "$3,600"], note: "\"We cater every team meeting now.\"", V: 216000, k: 1.5 },
        { name: "Youth Sports Teams", cells: ["44%", "120 teams", "$900"], note: "\"End-of-season party for 30 kids, every season.\"", V: 108000, k: 1.6 },
        { name: "High School Teens", cells: ["76%", "1,200", "$40"], note: "\"I'd get it if my parents paid.\"", V: 48000, k: 6 }
      ],
      lesson: "The news made office orders the hidden gem: only 60 offices, but $3,600 each. Small groups fill up fast, so the smart buy spreads the rest to families and sports teams. College students and teens had the buzz but little money: diminishing returns hit almost right away.",
      math: "Offices: 60 x $3,600 = $216,000. Teens: 1,200 x $40 = $48,000, even with 76% interest."
    },
    {
      id: "fest", tp: "channel", kind: "Ad channels",
      client: "Frontier Fest", what: "Two-day music festival in Arlington Heights",
      about: "Weekend passes are $129. Buyers are mostly ages 16 to 24, and most of them pay for their own tickets.",
      ask: "Spend $100,000 on the channels that sell passes.",
      cols: ["Reaches ages 16–24 (worth $300K)", "Reaches parents 35–54 (worth $50K)", "What it is"],
      opts: [
        { name: "TikTok Ads", cells: ["85%", "22%", "Short videos in the For You feed"], note: "", V: 160000, k: 3 },
        { name: "Instagram Ads", cells: ["75%", "45%", "Reels and Stories"], note: "", V: 148000, k: 3 },
        { name: "Spotify Audio Ads", cells: ["70%", "30%", "30-second ads between songs"], note: "Fewer listeners to reach", V: 135000, k: 2 },
        { name: "Facebook Ads", cells: ["15%", "70%", "Feed ads and local groups"], note: "", V: 48000, k: 3 },
        { name: "Expressway Billboards", cells: ["25%", "55%", "Digital billboards on I-90"], note: "One glance from a moving car", V: 31000, k: 3.5 }
      ],
      lesson: "The buyers are 16 to 24, so the money belongs where they scroll and listen: TikTok, Instagram, and Spotify. Spreading across three channels beats piling everything into one. Facebook and billboards mostly reach parents, who aren't buying passes.",
      math: "TikTok: 85% of $300K + 22% of $50K = about $266K of customers in reach. Billboards: 25% of $300K + 55% of $50K = about $102K, and one glance converts poorly."
    },
    {
      id: "cleats", tp: "lineup", kind: "Product lineup",
      client: "Kicklab Soccer", what: "Soccer cleat brand building a lineup for Chicagoland",
      about: "Kicklab can launch five versions of its cleat, each aimed at a different segment. Every $10,000 block pays to make and market more pairs of that version. Missing a must-have feature cuts a version's buyers in half.",
      ask: "Spend $100,000 launching the versions that will make the most profit.",
      cols: ["Segment size", "Price / unit cost", "Would buy at this price", "Must-haves"],
      opts: [
        { name: "Youth Rec (ages 6–12)", cells: ["15,000 families", "$45 / $20", "40%", "All included"], note: "Parents buy. Kids outgrow them every season.", V: 150000, k: 3 },
        { name: "Varsity Pro (high school)", cells: ["6,000 players", "$110 / $55", "48%", "All included"], note: "Ankle support and studs for turf and grass.", V: 158400, k: 2.5 },
        { name: "Varsity Lite (high school)", cells: ["6,000 players", "$80 / $35", "62%", "No ankle support"], note: "Cheaper, but missing a must-have.", V: 83700, k: 2.5 },
        { name: "Adult Rec League", cells: ["10,000 players", "$70 / $30", "38%", "All included"], note: "Weekend leagues. Comfort over speed.", V: 152000, k: 3 },
        { name: "Elite Loaded (every feature)", cells: ["6,000 players", "$260 / $140", "3%", "All included"], note: "Carbon plate, custom fit, every upgrade.", V: 21600, k: 1.5 }
      ],
      lesson: "A good lineup gives each segment the features it requires at a price it will pay. Elite Loaded has everything, but almost nobody pays $260. Varsity Lite is cheaper, but leaving out a must-have cut its buyers in half, and every Lite pair sold to a varsity player is a Pro sale lost (cannibalization). It's worth one block at most.",
      math: "Profit a version can make = segment size x % who'd buy x (price − unit cost). Varsity Pro: 6,000 x 48% = 2,880 x $55 = $158,400. Lite: 6,000 x 62% = 3,720, halved to 1,860, x $45 = $83,700. Elite: 6,000 x 3% = 180 x $120 = $21,600."
    }
  ];
  const buyById = Object.fromEntries(BUYS.map(b => [b.id, b]));

  /* ---------------------------------------------------------------- MATH */
  const BLOCKS = 10, BLOCK = 10000;
  const optRev = (o, b) => (b > 0 ? o.V * (1 - Math.exp(-b / o.k)) : 0);
  function revenue(buy, alloc) { return buy.opts.reduce((a, o, i) => a + optRev(o, +alloc[i] || 0), 0); }
  function spent(alloc) { return alloc.reduce((a, b) => a + (+b || 0), 0) * BLOCK; }
  function profit(buy, alloc) { return revenue(buy, alloc) - spent(alloc); }
  const bestCache = {};
  function best(buy) { // best way to use up to 10 blocks (leaving some unspent is allowed)
    if (bestCache[buy.id]) return bestCache[buy.id];
    const n = buy.opts.length, arr = new Array(n).fill(0); let top = null;
    (function rec(i, left) {
      if (i === n) { const p = profit(buy, arr); if (!top || p > top.profit) top = { profit: p, alloc: arr.slice(), revenue: revenue(buy, arr) }; return; }
      for (let c = 0; c <= left; c++) { arr[i] = c; rec(i + 1, left - c); }
    })(0, BLOCKS);
    return (bestCache[buy.id] = top);
  }
  const BUY_MAX = 600;       // points for matching the best possible profit
  // 600 for the best buy, falling off fast: piling everything into the worst option scores 0.
  const floorCache = {};
  function floor(buy) {
    if (floorCache[buy.id] == null) floorCache[buy.id] = Math.min(...buy.opts.map((_, j) => profit(buy, buy.opts.map((_, i) => (i === j ? BLOCKS : 0)))));
    return floorCache[buy.id];
  }
  function buyPoints(buy, alloc) {
    const p = profit(buy, alloc), b = best(buy).profit, f = floor(buy);
    return Math.round(BUY_MAX * Math.pow(Math.max(0, Math.min(1, (p - f) / (b - f))), 3));
  }

  /* ---------------------------------------------------------------- DEFINE IT questions
     Built from TERMS. Wrong options come from the same topic so none are giveaways. */
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
  // Some terms are too close to each other to share a question.
  const CLASH = { tm: ["second"], second: ["tm"], cpm: [], roi: ["roas"], roas: ["roi"], reach: ["freq"], freq: ["reach", "fatigue"], fatigue: ["freq"] };
  function defQuestion(termId, mode, seed) { // mode "d" = show definition, pick the term; "t" = show term, pick the definition
    const T = termById[termId], r = rng(hash(termId + mode + seed));
    const pool = TERMS.filter(x => x.tp === T.tp && x.id !== T.id && !(CLASH[T.id] || []).includes(x.id));
    const wrong = shuffle(pool, r).slice(0, 3);
    const raw = [T, ...wrong];
    const order = shuffle([0, 1, 2, 3], r);
    const opts = order.map(i => (mode === "d" ? raw[i].t : raw[i].d));
    return { id: termId + mode, tp: T.tp, term: T.t, p: mode === "d" ? T.d : T.t, ask: mode === "d" ? "Which term matches?" : "What does it mean?", opts, ans: order.indexOf(0), ex: T.ex, mode };
  }

  /* ---------------------------------------------------------------- GAME PLAN
     Round r uses BUYS in this order (a round's vocab comes from its buy's topic). */
  const ORDER = ["rink", "pie", "pizza", "kayak", "camp", "cleats", "fest"];
  // buys = the client briefs to play, in order (one round each). A round's vocab comes from its buy's topic.
  function plan(buys, perRound, seed) {
    const r = rng(seed), used = new Set(), out = [];
    buys.forEach((buy, i) => {
      const tp = buyById[buy].tp;
      const pick = shuffle(TERMS.filter(t => t.tp === tp && !used.has(t.id)), r).slice(0, perRound);
      if (pick.length < perRound) shuffle(TERMS.filter(t => !used.has(t.id) && !pick.includes(t)), r).slice(0, perRound - pick.length).forEach(t => pick.push(t));
      pick.forEach(t => used.add(t.id));
      out.push({ buy, defs: pick.map((t, j) => t.id + ((j + i) % 2 ? "t" : "d")) });
    });
    return out;
  }
  const question = (code, seed) => defQuestion(code.slice(0, -1), code.slice(-1), seed);

  return { TOPICS, TERMS, termById, BUYS, buyById, ORDER, BLOCKS, BLOCK, BUY_MAX, optRev, revenue, spent, profit, best, buyPoints, plan, question, defQuestion, rng, shuffle, hash };
})();
if (typeof module !== "undefined") module.exports = LADDER;
