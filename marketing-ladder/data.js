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

  /* ================================================================ SET 2
     Seven new client companies for the buys, and a bank of scenario questions (no term matching).
     Each bank question: p = prompt, o = options with the correct one FIRST (shuffled on screen), x = why. */
  const BUYS2 = [
    {
      id: "swim", tp: "target", kind: "Customer segments",
      client: "Tidewater Swim School", what: "Indoor swim school in Palatine",
      about: "Group lessons, private lessons, and a heated pool you can rent. A 10-week lesson session is $160; private coaching is $60 an hour.",
      ask: "We have $100,000 for ads this year. Put it where the money is.",
      cols: ["Interest", "Customers you could win", "Spending per customer, per year"],
      opts: [
        { name: "High Schoolers (ages 14–18)", cells: ["70%", "1,000", "$50"], note: "\"Open swim with friends sounds fun. Maybe once.\"", V: 50000, k: 6 },
        { name: "Parents of Kids 5–12", cells: ["52%", "500", "$320"], note: "\"Two sessions a year, every year, until she can swim laps.\"", V: 160000, k: 3 },
        { name: "Adult Beginners", cells: ["18%", "300", "$360"], note: "\"I never learned. I'm finally doing it at 38.\"", V: 108000, k: 3 },
        { name: "Triathletes", cells: ["12%", "80", "$900"], note: "\"Private coaching twice a month. Worth every penny.\"", V: 72000, k: 1.3 },
        { name: "Summer Camps and Scout Troops", cells: ["35%", "40 groups", "$3,000"], note: "\"We book a pool party every week of camp.\"", V: 120000, k: 1.3 }
      ],
      lesson: "High schoolers had the most interest and the least money behind it: a trap. Parents of young swimmers come back session after session. Camps and triathletes are small groups that spend a lot, so one or two blocks reach most of them and more money there stops paying.",
      math: "What a group is worth = customers you could win x spending per customer. Parents: 500 x $320 = $160,000. High schoolers: 1,000 x $50 = $50,000, even with 70% interest."
    },
    {
      id: "haven", tp: "feel", kind: "Ad emotions",
      client: "Haven Pet Insurance", what: "Pet health insurance, $35 a month",
      about: "Haven pays vet bills when a dog or cat gets sick or hurt. Nearly all buyers are pet owners ages 30 to 55 who call their pet \"part of the family.\"",
      ask: "We made five versions of our ad. Spend $100,000 running the ones that will sign up pet owners.",
      cols: ["Emotion", "What the ad shows", "Test audience said"],
      opts: [
        { name: "Ad A: \"Part of the Family\"", cells: ["Love", "A family's dog growing up alongside their kids", "\"I hugged my dog after watching it.\""], note: "", V: 160000, k: 2.8 },
        { name: "Ad B: \"The 2 a.m. Vet Bill\"", cells: ["Fear / insecurity", "An owner staring at a $4,000 emergency bill", "\"That's my worst nightmare. I'd sign up.\""], note: "", V: 125000, k: 2.5 },
        { name: "Ad C: \"Puppy Bloopers\"", cells: ["Humor / joy", "Puppies tripping over their own paws", "\"So cute! What was it selling?\""], note: "", V: 50000, k: 2.8 },
        { name: "Ad D: \"Your First Dog\"", cells: ["Nostalgia", "Grown-ups remembering their childhood dog", "\"Made me miss Buster. Sad, though.\""], note: "", V: 70000, k: 2.8 },
        { name: "Ad E: \"Rules Are for Cats\"", cells: ["Rebellion", "A dog breaking every house rule", "\"Funny, but it doesn't fit insurance.\""], note: "", V: 28000, k: 3.5 }
      ],
      lesson: "Love fits people who treat their pet like family. Fear is usually risky, but insurance is one product where a little fear fits: the buyer is protecting against a real problem. Humor got laughs and no one remembered the brand, and rebellion fought against what insurance is for.",
      math: "Split your money between the two ads that fit the buyer. Once an ad's audience has seen it, more money on that same ad brings in less."
    },
    {
      id: "glide", tp: "media", kind: "Customer segments + news",
      client: "Glide Driving School", what: "Driver's ed and lessons in the northwest suburbs",
      about: "Teen driver's ed is $450. Adult lessons are $500. Companies pay $3,000 a year to train their delivery drivers.",
      ask: "Spend $100,000 this year. Read the news first.",
      news: "This year's news: Illinois car insurers announce a big discount for teens who finish a certified driving course.",
      cols: ["Interest", "Customers you could win", "Spending per customer, per year"],
      opts: [
        { name: "Teens Ages 15–16", cells: ["85%", "1,500", "$40"], note: "\"I want my license so bad. My parents pick the school.\"", V: 60000, k: 6 },
        { name: "Parents of 15-Year-Olds", cells: ["50%", "400", "$450"], note: "\"The insurance discount pays for half the course.\"", V: 180000, k: 3 },
        { name: "Adults Getting a First License", cells: ["30%", "300", "$500"], note: "\"I moved to the suburbs. I need to drive now.\"", V: 150000, k: 3 },
        { name: "Delivery Companies", cells: ["25%", "40 companies", "$3,000"], note: "\"Safer drivers mean fewer accidents for us.\"", V: 120000, k: 1.4 },
        { name: "Seniors (Refresher Course)", cells: ["20%", "400", "$120"], note: "\"Only if it lowers my insurance.\"", V: 48000, k: 4 }
      ],
      lesson: "The news made parents of 15-year-olds the place to be: they pay $450 and the insurance discount gives them a reason to sign up now. Delivery companies are the hidden gem: only 40, but $3,000 each. Teens had the most interest but spend the least.",
      math: "Parents: 400 x $450 = $180,000. Delivery companies: 40 x $3,000 = $120,000. Teens: 1,500 x $40 = $60,000."
    },
    {
      id: "vet", tp: "channel", kind: "Ad channels",
      client: "Northside Animal Hospital", what: "Vet clinic in Arlington Heights",
      about: "Checkups, shots, and emergency care. A typical pet costs its owner about $600 a year at the vet.",
      ask: "Spend $100,000 on the channels that reach pet owners nearby.",
      cols: ["Reaches pet owners 30–60 (worth $250K)", "Reaches new pet owners 20–35 (worth $150K)", "What it is"],
      opts: [
        { name: "Google Search Ads", cells: ["70%", "55%", "Shown when people search \"vet near me\""], note: "Only so many people search each week.", V: 170000, k: 1.6 },
        { name: "Nextdoor Ads", cells: ["60%", "25%", "Neighborhood app for local recommendations"], note: "", V: 150000, k: 2.5 },
        { name: "Facebook Ads", cells: ["65%", "35%", "Feed ads and local pet groups"], note: "", V: 140000, k: 3 },
        { name: "TikTok Ads", cells: ["15%", "60%", "Short videos in the For You feed"], note: "", V: 70000, k: 3 },
        { name: "WGN Radio Ads", cells: ["40%", "10%", "30-second spots during drive time"], note: "Heard once, while driving", V: 45000, k: 3.5 }
      ],
      lesson: "People pick a vet when they need one, so Google Search catches them at the exact moment they're looking, but those searches run out fast. Nextdoor and Facebook reach local pet owners 30 to 60, the group worth the most. TikTok reaches new owners, a smaller money group.",
      math: "Google: 70% of $250K + 55% of $150K = about $258K of customers in reach. Radio: 40% of $250K + 10% of $150K = $115K, heard once in a car."
    },
    {
      id: "prom", tp: "social", kind: "Social platforms",
      client: "Ridgeline Formalwear", what: "Prom tux and dress rentals",
      about: "Rentals run about $180. Most students pick their own look, and many pay for part of it themselves.",
      ask: "Spend $100,000 on social ads before prom season.",
      cols: ["Weekly reach of ages 16–17", "Weekly reach of parents 35–54", "Cost per 1,000 impressions (CPM)"],
      opts: [
        { name: "Instagram", cells: ["68%", "45%", "$9.50"], note: "Reels and outfit photos", V: 160000, k: 3 },
        { name: "TikTok", cells: ["65%", "30%", "$7.50"], note: "\"Get ready with me\" videos", V: 140000, k: 3 },
        { name: "Snapchat", cells: ["62%", "18%", "$5.50"], note: "Story ads with a swipe-up", V: 130000, k: 2.8 },
        { name: "Pinterest", cells: ["30%", "40%", "$6.00"], note: "Prom style boards", V: 90000, k: 2 },
        { name: "Facebook", cells: ["25%", "75%", "$8.50"], note: "Feed ads", V: 55000, k: 3 }
      ],
      lesson: "Students choose the look, so the money goes where 16- and 17-year-olds scroll: Instagram, TikTok, and Snapchat. Pinterest is small but full of people planning outfits. Facebook reaches parents, who may help pay but don't pick the tux or dress.",
      math: "Spread across the three teen platforms. Each one fills up, so a fourth or fifth block on the same platform earns less than a first block somewhere else."
    },
    {
      id: "pulse", tp: "lineup", kind: "Product lineup",
      client: "Pulse Wireless", what: "Phone carrier building a lineup of plans",
      about: "Pulse can launch five plans, each aimed at a different segment. Every $10,000 block markets one plan. Leaving out a must-have feature cuts a plan's buyers in half.",
      ask: "Spend $100,000 launching the plans that will make the most profit.",
      cols: ["Segment size", "Price / cost per month", "Would buy at this price", "Must-haves"],
      opts: [
        { name: "Student Plan", cells: ["16,000", "$25 / $10", "45%", "All included"], note: "Unlimited texts, 10 GB data", V: 108000, k: 3 },
        { name: "Family Plan (4 lines)", cells: ["10,000 families", "$120 / $60", "35%", "All included"], note: "Parental controls, shared data", V: 210000, k: 3 },
        { name: "Unlimited Pro", cells: ["8,000", "$85 / $40", "40%", "All included"], note: "Unlimited data and hotspot", V: 144000, k: 2.5 },
        { name: "Basic Unlimited", cells: ["8,000", "$60 / $30", "60%", "No hotspot"], note: "Cheaper, but missing a must-have.", V: 72000, k: 2.5 },
        { name: "Platinum Everything", cells: ["8,000", "$200 / $110", "2%", "All included"], note: "Every feature, international, a new phone each year", V: 14400, k: 1.5 }
      ],
      lesson: "Each segment gets the plan it needs at a price it will pay. Families are the biggest money. Platinum has everything, but almost nobody pays $200. Basic Unlimited is missing a must-have, which cuts its buyers in half, and it pulls customers away from Unlimited Pro (cannibalization).",
      math: "Profit = segment size x % who'd buy x (price − cost). Family: 10,000 x 35% = 3,500 x $60 = $210,000. Basic: 8,000 x 60% = 4,800, halved to 2,400, x $30 = $72,000. Platinum: 8,000 x 2% = 160 x $90 = $14,400."
    },
    {
      id: "camp2", tp: "channel", kind: "Ad channels",
      client: "Wildwood Summer Camp", what: "Day camp for kids ages 6 to 12",
      about: "A week of camp is $350. Parents sign up and pay. Teens ages 14 to 17 can apply as counselors-in-training.",
      ask: "Spend $100,000 on the channels that fill the camp.",
      cols: ["Reaches parents of kids 6–12 (worth $280K)", "Reaches teens 14–17 (worth $40K)", "What it is"],
      opts: [
        { name: "Facebook Ads", cells: ["70%", "10%", "Feed ads and local parent groups"], note: "", V: 160000, k: 3 },
        { name: "School Email Newsletters", cells: ["85%", "20%", "A paid spot in elementary school emails"], note: "Only so many schools and emails", V: 150000, k: 1.8 },
        { name: "Instagram Ads", cells: ["45%", "65%", "Reels and Stories"], note: "", V: 110000, k: 3 },
        { name: "Spotify Audio Ads", cells: ["30%", "70%", "30-second ads between songs"], note: "", V: 70000, k: 2.5 },
        { name: "Park District Flyers", cells: ["40%", "15%", "Posters at parks and pools"], note: "", V: 60000, k: 3 }
      ],
      lesson: "Parents pay for camp, so the money goes where they are: Facebook and school newsletters. Newsletters reach the most parents, but there are only so many schools, so they fill up fast. Spotify mostly reaches teens, who aren't buying camp.",
      math: "Newsletters: 85% of $280K + 20% of $40K = $246K of customers in reach. Spotify: 30% of $280K + 70% of $40K = $112K."
    }
  ];
  BUYS.push(...BUYS2);

  const QBANK = [
    // target marketing
    { id: "t1", tp: "target", p: "A taco truck targets \"people who work within 5 blocks of downtown.\" Which lens is that?", o: ["Geographic", "Demographic", "Behavioral", "Psychographic"], x: "Where people live, work, or shop is geographic." },
    { id: "t2", tp: "target", p: "A gym targets \"people who bought a gym membership in the last year.\" Which lens is that?", o: ["Behavioral", "Psychographic", "Socioeconomic", "Geographic"], x: "What people have bought and how they buy is behavioral." },
    { id: "t3", tp: "target", p: "A luxury watch brand aims at households earning over $250,000. Which lens is that?", o: ["Socioeconomic", "Demographic", "Psychographic", "Behavioral"], x: "Income, education, and job are socioeconomic." },
    { id: "t4", tp: "target", p: "A hiking boot brand targets people who \"love the outdoors and post trail photos.\" Which lens is that?", o: ["Psychographic", "Behavioral", "Geographic", "Demographic"], x: "Values, interests, and lifestyle are psychographic." },
    { id: "t5", tp: "target", p: "Which of these is mass marketing?", o: ["One paper towel TV ad shown to everyone", "A TikTok ad shown only to college runners", "A mailer sent to new parents in Schaumburg", "A Google ad shown when someone searches \"prom tux\""], x: "Mass marketing is one product and one message aimed at everyone." },
    { id: "t6", tp: "target", p: "Group A: 1,000 customers spend $20 a year. Group B: 150 customers spend $200 a year. Which group is worth more?", o: ["Group B: $30,000 vs. $20,000", "Group A: more customers always wins", "They're worth the same", "Group A: $20,000 vs. $3,000"], x: "Customers x spending: 150 x $200 = $30,000; 1,000 x $20 = $20,000." },
    { id: "t7", tp: "target", p: "A sneaker brand splits its buyers into collectors, athletes, and everyday wearers. What is it doing?", o: ["Market segmentation", "Mass marketing", "Building brand loyalty", "Cannibalization"], x: "Splitting a market into groups that share needs is segmentation." },
    // emotional marketing
    { id: "e1", tp: "feel", p: "A soup ad shows a grandma's kitchen from the 1970s. Which emotion is it using?", o: ["Nostalgia", "Fear / insecurity", "Rebellion", "Pride"], x: "Looking back at \"the good old days\" is nostalgia." },
    { id: "e2", tp: "feel", p: "A deodorant ad shows a teen embarrassed at a school dance. Which emotion is it using?", o: ["Fear / insecurity", "Belonging", "Love", "Gratitude"], x: "\"Something's wrong with you, and this fixes it\" is a fear appeal." },
    { id: "e3", tp: "feel", p: "A truck ad says \"0 to 60 in 5.4 seconds and tows 12,000 pounds.\" What kind of appeal is that?", o: ["Rational", "Emotional", "Nostalgia", "Belonging"], x: "Facts, numbers, and features are a rational appeal." },
    { id: "e4", tp: "feel", p: "Two bottled waters taste the same. Why does one spend millions on ads about \"living your best life\"?", o: ["When products are alike, the feeling sets the brand apart", "The law requires it", "Feelings are cheaper to film than facts", "To lower its price"], x: "If the product can't stand out, the feeling attached to the brand can." },
    { id: "e5", tp: "feel", p: "Fans keep buying the same brand even when a cheaper one is right next to it. That's...", o: ["Brand loyalty", "Mass marketing", "Unit cost", "Reach"], x: "Choosing a brand again and again over cheaper options is brand loyalty." },
    { id: "e6", tp: "feel", p: "A video game ad shows friends cheering together online: \"Your squad is waiting.\" Which emotion is it using?", o: ["Belonging", "Fear / insecurity", "Nostalgia", "Gratitude"], x: "\"You're part of the group\" is belonging." },
    { id: "e7", tp: "feel", p: "Which ad matches its emotion to its target best?", o: ["Pride in a running shoe ad for high school athletes", "Rebellion in a retirement savings ad for 60-year-olds", "Humor in a hospital's cancer center ad", "Fear in a birthday party ad for 6-year-olds"], x: "Pride fits young athletes. The others clash with the buyer or the product." },
    // media buy
    { id: "m1", tp: "media", p: "Lots of teens love a $5 phone game, but almost none of them spend money in it. For your ad budget, that group is...", o: ["A trap: lots of interest, little money", "A hidden gem", "The best place for most of the budget", "Your repeat customers"], x: "High interest with little money behind it is a trap." },
    { id: "m2", tp: "media", p: "Only 40 hospitals buy a $50,000 software license each year. That segment is...", o: ["A hidden gem: few buyers, big money each", "A trap", "Mass marketing", "Not worth anything because it's small"], x: "40 x $50,000 = $2,000,000. Small groups can be worth the most." },
    { id: "m3", tp: "media", p: "News: a rival dog food brand recalls millions of bags. Which customers should get MORE of your budget?", o: ["Worried dog owners who can afford premium food", "Teens who share dog videos", "Cat owners", "No one. News doesn't change the plan"], x: "The news sends worried owners with money looking for a food they trust." },
    { id: "m4", tp: "media", p: "News: a rival opens next to the college campus. What should happen to your college budget?", o: ["Cut it. The rival will take many of those customers", "Double it", "Nothing. News doesn't matter", "Move your whole budget there"], x: "When news shrinks a segment, move money to segments that are still growing." },
    { id: "m5", tp: "media", p: "How do you figure out what a customer segment is worth?", o: ["Customers you could win x spending per customer", "Interest % x number of ads", "Ad budget ÷ number of customers", "How many people like your posts"], x: "Customers x what each spends is the money behind a segment." },
    { id: "m6", tp: "media", p: "Climbers who come four nights a week on a monthly plan are valuable because they're...", o: ["Repeat customers who keep paying", "A trap", "A mass market", "Cheap to advertise to"], x: "Repeat customers bring in money every month, not just once." },
    { id: "m7", tp: "media", p: "Before splitting an ad budget, what should you look at first?", o: ["Who spends the most and how many of them you could win", "Which group has the most followers", "Which ad looks coolest", "What your competitors spent"], x: "The money behind each group decides where the budget goes." },
    // ad channels
    { id: "c1", tp: "channel", p: "Which channel reaches people at the exact moment they're looking to buy?", o: ["Google Search ads", "A Lollapalooza sponsorship", "CTA train posters", "TikTok ads"], x: "Search ads show up when someone types what they want to buy." },
    { id: "c2", tp: "channel", p: "A channel brought in $80,000 from $100,000 of spending. What's its ROI?", o: ["$0.80 per $1. It lost money", "$1.80 per $1", "$80 per $1", "It broke even"], x: "$80,000 ÷ $100,000 = $0.80 back for every $1." },
    { id: "c3", tp: "channel", p: "Which channel best reaches business owners and HR managers?", o: ["LinkedIn", "Snapchat", "TikTok", "Lollapalooza"], x: "LinkedIn targets people by job title and company." },
    { id: "c4", tp: "channel", p: "A brand pays to put its name on a stadium's scoreboard. That's a...", o: ["Sponsorship", "Search ad", "Conversion", "Creator partnership"], x: "Paying to attach your brand to a team, event, or venue is a sponsorship." },
    { id: "c5", tp: "channel", p: "Why can a channel with huge reach still lose money?", o: ["It reaches lots of people who will never buy", "Big reach always makes money", "Reach is free", "ROI is always negative"], x: "Reach only pays when it reaches the customers who spend." },
    { id: "c6", tp: "channel", p: "A dog daycare's best customers are adults 35 to 54. Which channel reaches them best?", o: ["Facebook", "TikTok", "Snapchat", "Lollapalooza"], x: "Facebook reaches about 70% of parents and older adults." },
    { id: "c7", tp: "channel", p: "Channel A: $300,000 back from $100,000. Channel B: $150,000 back from $50,000. Which has the better ROI?", o: ["They're the same: $3 back per $1", "A, because it made more", "B, because it cost less", "You can't tell"], x: "$300K ÷ $100K = 3 and $150K ÷ $50K = 3." },
    { id: "c8", tp: "channel", p: "A TikTok ban scare sends teens to Instagram Reels. Teens are your best customers. Where should money move?", o: ["From TikTok to Instagram", "From Instagram to TikTok", "Into Facebook", "Nowhere"], x: "Follow your customers to where they moved." },
    // social media ads
    { id: "s1", tp: "social", p: "$4,000 at an $8 CPM buys how many impressions?", o: ["500,000", "50,000", "32,000", "5,000,000"], x: "$4,000 ÷ $8 x 1,000 = 500,000." },
    { id: "s2", tp: "social", p: "200,000 impressions at a 1.5% click rate gives how many clicks?", o: ["3,000", "300", "30,000", "1,500"], x: "200,000 x 0.015 = 3,000." },
    { id: "s3", tp: "social", p: "2,000 people click and 3% of them buy. How many sales?", o: ["60", "600", "6", "2,003"], x: "2,000 x 0.03 = 60." },
    { id: "s4", tp: "social", p: "$2,500 of ads brings in $10,000 of sales. What's the ROAS?", o: ["4x", "0.25x", "2.5x", "$7,500"], x: "ROAS = revenue ÷ ad spend = $10,000 ÷ $2,500 = 4." },
    { id: "s5", tp: "social", p: "Each sale earns $25 profit. Ads cost $5,000. How many sales to break even?", o: ["200", "125", "2,000", "50"], x: "$5,000 ÷ $25 = 200 sales." },
    { id: "s6", tp: "social", p: "An ad's reach is 25,000 and its frequency is 4. How many impressions?", o: ["100,000", "6,250", "25,004", "29,000"], x: "Impressions = reach x frequency." },
    { id: "s7", tp: "social", p: "Which format fits Snapchat best?", o: ["A full-screen story with a swipe-up", "A 30-second pre-roll video", "A single photo with a long caption", "A LinkedIn article"], x: "Snapchat is built around full-screen stories you tap through." },
    { id: "s8", tp: "social", p: "Frequency hits 14 and clicks start falling. What's happening?", o: ["Ad fatigue", "Conversion", "Too much reach", "High ROAS"], x: "People have seen it so often they stop noticing it." },
    // market segmentation
    { id: "l1", tp: "lineup", p: "Base cost is $8. You add features that cost $2, $3, and $1. What's the unit cost?", o: ["$14", "$8", "$6", "$22"], x: "Unit cost = base cost + every feature: $8 + $2 + $3 + $1." },
    { id: "l2", tp: "lineup", p: "A version sells for $50 and costs $32 to make. What's the profit per unit?", o: ["$18", "$82", "$32", "$50"], x: "Price − unit cost = $50 − $32." },
    { id: "l3", tp: "lineup", p: "A segment has 1,000 people and 40% would buy at your price. No must-haves are missing. How many buyers?", o: ["400", "40", "1,040", "600"], x: "1,000 x 40% x 100% Fit = 400." },
    { id: "l4", tp: "lineup", p: "A version would get 800 buyers, but it leaves out one must-have feature. Now how many buyers?", o: ["400", "800", "200", "720"], x: "Each missing must-have cuts buyers in half." },
    { id: "l5", tp: "lineup", p: "Your $30 basic plan pulls customers away from your $60 premium plan. That's...", o: ["Cannibalization", "Willingness to pay", "Brand loyalty", "Mass marketing"], x: "Your cheaper version eating your pricier version's sales is cannibalization." },
    { id: "l6", tp: "lineup", p: "45% of a segment wants a feature. What kind of feature is it?", o: ["Nice-to-have", "Must-have", "Don't care", "Unit cost"], x: "30% to 59% is nice-to-have. 60% or more is must-have." },
    { id: "l7", tp: "lineup", p: "At $30, 366 people buy and each earns $16. At $60, 36 buy and each earns $46. Which price makes more profit?", o: ["$30: $5,856 vs. $1,656", "$60, because each one earns more", "They tie", "Neither makes money"], x: "366 x $16 = $5,856. 36 x $46 = $1,656." },
    { id: "l8", tp: "lineup", p: "Why do companies sell good, better, and best versions of one product?", o: ["Different segments want different features at different prices", "Three products are cheaper to make than one", "The law requires choices", "To confuse shoppers"], x: "Each version is built for a different segment and priced for it." }
  ];
  const qById = Object.fromEntries(QBANK.map(q => [q.id, q]));
  function bankQuestion(qid, seed) {
    const Q = qById[qid], r = rng(hash(qid + ":" + seed)), order = shuffle([0, 1, 2, 3], r);
    return { id: "q:" + qid, key: "q:" + qid, tp: Q.tp, p: Q.p, ask: TOPICS[Q.tp].name, opts: order.map(i => Q.o[i]), ans: order.indexOf(0), mode: "q",
      head: "Answer: " + Q.o[0], body: Q.x, missText: Q.p, missAns: Q.o[0] };
  }
  const ORDER2 = ["swim", "haven", "glide", "vet", "prom", "pulse", "camp2"];
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
    return { id: termId + mode, key: termId, tp: T.tp, term: T.t, p: mode === "d" ? T.d : T.t, ask: mode === "d" ? "Which term matches?" : "What does it mean?", opts, ans: order.indexOf(0), ex: T.ex, mode,
      head: T.t + ": " + T.d, body: "Example: " + T.ex, missText: T.t, missAns: T.d };
  }

  /* ---------------------------------------------------------------- GAME PLAN
     Round r uses BUYS in this order (a round's vocab comes from its buy's topic). */
  const ORDER = ["rink", "pie", "pizza", "kayak", "camp", "cleats", "fest"];
  // buys = the client briefs to play, in order (one round each). A round's questions come from its buy's topic.
  // Set 1 asks term/definition questions; Set 2 asks scenario questions from QBANK (codes start with "q:").
  function plan(buys, perRound, seed, set) {
    const r = rng(seed), used = new Set(), out = [], bank = set === 2;
    const pool = bank ? QBANK : TERMS, idOf = x => x.id;
    buys.forEach((buy, i) => {
      const tp = buyById[buy].tp;
      const pick = shuffle(pool.filter(t => t.tp === tp && !used.has(idOf(t))), r).slice(0, perRound);
      if (pick.length < perRound) shuffle(pool.filter(t => !used.has(idOf(t)) && !pick.includes(t)), r).slice(0, perRound - pick.length).forEach(t => pick.push(t));
      pick.forEach(t => used.add(idOf(t)));
      out.push({ buy, defs: pick.map((t, j) => bank ? "q:" + t.id : t.id + ((j + i) % 2 ? "t" : "d")) });
    });
    return out;
  }
  const SETS = { 1: { name: "Set 1", sub: "Term and definition questions", order: ORDER }, 2: { name: "Set 2", sub: "Scenario questions, seven new companies", order: ORDER2 } };
  const question = (code, seed) => (code.startsWith("q:") ? bankQuestion(code.slice(2), seed) : defQuestion(code.slice(0, -1), code.slice(-1), seed));

  return { TOPICS, TERMS, termById, QBANK, SETS, ORDER2, BUYS, buyById, ORDER, BLOCKS, BLOCK, BUY_MAX, optRev, revenue, spent, profit, best, buyPoints, plan, question, defQuestion, rng, shuffle, hash };
})();
if (typeof module !== "undefined") module.exports = LADDER;
