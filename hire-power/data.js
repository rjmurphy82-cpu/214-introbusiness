/* Hire Power: content and the hiring engine. Shared by the student page and the teacher screen.

   THE GAME. Every pair is the CEO and HR director of a different company. They build a hiring plan in four stages:
     1 Who we hire: three traits from the list below, plus one sentence ("We hire people who...")
     2 Skills:      for each of the company's 4 jobs, the 3 skills they want and an experience level
     3 Interview:   up to 6 hours of interview steps per candidate
     4 Hire:        rank the 4 candidates for each job, 1 to 4
   Then they present the auto-built slideshow and every other student grades them on a 5-row rubric.
   THE TWIST: the graders get the grade. The engine scores every plan, and each grader is scored on how close
   their ratings came to the engine's.

   THE ENGINE (five dimensions, 0 to 100 each)
     type      Traits vs. the company's hidden ideal three: ideal +34, neutral +10, clash -25.
     skills    Per job: 80 x (key skills hit / 3) + 20 for the right experience level (10 if one level off).
     interview Three things can go wrong with a candidate, and specific steps catch them:
                 padded resume  -> Skills test or Work sample
                 bad references -> Reference check
                 acts different -> Behavioral interview or Team panel
               Phone screen, personality quiz, and coffee chat catch nothing. Score by how many of the three are
               covered: 0 -> 10, 1 -> 40, 2 -> 70, 3 -> 100.
     hires     Measured against the pair's OWN plan, using only what their interview steps showed them.
               Each candidate's fit = 20 per skill they asked for + 10 per trait they asked for + 20 for the
               experience level they asked for (10 if one off) - 25 if references came back bad.
               Per job: 50 if their #1 is the best fit (25 if within 10 points) + 50 x the share of the 6 candidate
               pairs they put in the right order (pairs within 5 points count as right).
     overlap   100 - 25 for every extra job asking for the same skill - 15 for every key skill two #1 hires share.
   Hiring score = the average of the five.
   Rubric bands: 85+ = 4, 65 to 84 = 3, 40 to 64 = 2, under 40 = 1.
   Grader accuracy per row: same band = 100, one off = 60, two off = 20, three off = 0. A grader's score is the
   average over every shop they were supposed to rate (a shop they skipped counts 0).

   THE CANDIDATES are built from each job's data so every pool has the same shape (shown in shuffled order):
     A  the match:      2 of 3 key skills, two ideal traits, the right experience
     B  the star:       all 3 key skills (plus, when B hides a problem, one from the next job: overlap), one ideal trait and one clash, more experience
     C  the rising one: 1 key skill, two ideal traits, less experience
     D  the wrong fit:  the next job's skills plus one key skill, a clash trait
   One candidate per job hides a problem only the right interview step finds (which one rotates by job). */
"use strict";
var HP = (function () {
  const HOURS = 6;
  const TRAITS = [
    { id: "self", name: "Self-starter", sub: "Gets going without being told" },
    { id: "team", name: "Team player", sub: "Covers for others and shares credit" },
    { id: "detail", name: "Detail-oriented", sub: "Catches the small mistakes" },
    { id: "creative", name: "Creative", sub: "Comes up with new ideas" },
    { id: "calm", name: "Calm under pressure", sub: "Steady when things go wrong" },
    { id: "people", name: "People person", sub: "Makes others feel welcome" },
    { id: "learner", name: "Quick learner", sub: "Picks up new things fast" },
    { id: "rules", name: "Follows the rules", sub: "Does it by the book, every time" },
    { id: "risk", name: "Risk-taker", sub: "Tries bold things, even if they fail" },
    { id: "depend", name: "Dependable", sub: "Always shows up, always on time" },
    { id: "compete", name: "Competitive", sub: "Wants to be number one" },
    { id: "flex", name: "Flexible", sub: "Rolls with changes in plans" }
  ];
  const EXP = ["Entry level", "Some experience", "Seasoned"];
  const EXP_SUB = ["0 to 1 year", "2 to 4 years", "5+ years"];
  const STEPS = [
    { id: "phone", name: "Phone screen", hrs: 1, finds: null, does: "A 15-minute call to check the basics" },
    { id: "skills", name: "Skills test", hrs: 2, finds: "pad", does: "Candidates prove the skills on their resume" },
    { id: "sample", name: "Work sample", hrs: 3, finds: "pad", does: "Do a real piece of the job for a few hours" },
    { id: "refs", name: "Reference check", hrs: 1, finds: "ref", does: "Call two past managers" },
    { id: "behave", name: "Behavioral interview", hrs: 2, finds: "fit", does: "“Tell me about a time when...” questions" },
    { id: "panel", name: "Team panel interview", hrs: 2, finds: "fit", does: "Future coworkers ask the questions" },
    { id: "quiz", name: "Online personality quiz", hrs: 1, finds: null, does: "A 20-question quiz that gives a personality type" },
    { id: "coffee", name: "Coffee chat with the CEO", hrs: 1, finds: null, does: "A casual talk to see if you like them" }
  ];
  const FINDS = { pad: "Real skills", ref: "Track record", fit: "How they act at work" };

  // jobs: t title, e ideal experience, r responsibilities, s key skills, bg backgrounds for candidates A, B, C, D
  const COMPANIES = [
    { id: "lakeshore", name: "Lakeshore Climb Co.", ind: "Indoor climbing gym", ideal: ["depend", "people", "calm"], clash: ["risk", "compete"],
      desc: "An indoor climbing gym in Chicago with 1,400 members, and half of them have never climbed before. Members say they keep coming back because the staff knows their names and talks them through their first scary climb. One missed safety check could put someone in the hospital, and last spring a staffer who panicked during a fall nearly cost the gym its insurance.",
      extra: ["Spreadsheets", "Cold-call sales", "Graphic design", "Inventory tracking"],
      jobs: [
        { t: "Route Setter", e: 1, r: ["Design new climbing routes every week", "Bolt holds to the wall safely", "Grade routes from beginner to expert"], s: ["Route design", "Power-tool safety", "Climbing technique"],
          bg: ["Route setter at a college climbing wall", "Head setter at a national gym chain", "Competition climber, sets routes on weekends", "Front desk worker at a climbing gym"] },
        { t: "Front Desk Lead", e: 1, r: ["Check in members and sell day passes", "Explain waivers and gym rules to new climbers", "Handle billing questions and complaints"], s: ["Customer service", "Point-of-sale systems", "Conflict resolution"],
          bg: ["Front desk lead at a fitness club", "Hotel front office manager", "Movie theater cashier", "Kids' climbing camp counselor"] },
        { t: "Youth Program Coach", e: 1, r: ["Run after-school climbing classes for kids 8 to 14", "Keep every kid roped in and safe", "Talk with parents about progress"], s: ["Teaching kids", "First aid / CPR", "Belay certification"],
          bg: ["Summer camp counselor and swim instructor", "Former pro climber, competition coach", "Babysitter and youth soccer helper", "Event and video assistant at a sports brand"] },
        { t: "Marketing Coordinator", e: 0, r: ["Post climbing videos and events on social media", "Plan a monthly bouldering competition", "Grow memberships with local schools"], s: ["Social media content", "Event planning", "Video editing"],
          bg: ["Social media intern at a sports brand", "Marketing manager at a big ad agency", "High school yearbook editor", "Route setter at a bouldering gym"] }
      ] },
    { id: "pixelforge", name: "Pixel Forge Games", ind: "Indie video game studio", ideal: ["creative", "self", "team"], clash: ["rules", "compete"],
      desc: "A 12-person video game studio in a converted warehouse in Pilsen. There are no managers and no set hours. Every Friday anyone can pitch an idea, and the best ones go into the game; their last hit started as a junior artist's doodle. A big studio offered to buy them, and they said no because they don't want quotas, rule books, or people fighting over credit.",
      extra: ["Spreadsheets", "Cold-call sales", "Contract law", "Bookkeeping"],
      jobs: [
        { t: "Game Designer", e: 1, r: ["Invent levels, puzzles, and game rules", "Playtest builds and fix what isn't fun", "Pitch new features to the team"], s: ["Level design", "Playtesting", "Storytelling"],
          bg: ["Junior designer at a mobile game studio", "Lead designer at a giant shooter studio", "Made two free games online", "Freelance animator"] },
        { t: "3D Artist", e: 1, r: ["Model characters and worlds", "Animate characters", "Match the game's art style"], s: ["3D modeling", "Character animation", "Concept art"],
          bg: ["3D artist at an animation studio", "Senior artist on a blockbuster movie", "Art school student with a strong portfolio", "Game programmer"] },
        { t: "Gameplay Programmer", e: 1, r: ["Write the code that makes the game run", "Fix bugs before each release", "Make the game run fast on old laptops"], s: ["C# programming", "Debugging", "Performance tuning"],
          bg: ["Programmer at a small game studio", "Senior engineer at a big tech company", "Computer science grad with a game jam win", "Community manager for a gaming streamer"] },
        { t: "Community Manager", e: 0, r: ["Run the game's Discord and social accounts", "Collect player feedback for the team", "Plan livestreams and launch events"], s: ["Discord moderation", "Player feedback surveys", "Livestream hosting"],
          bg: ["Moderator for a popular Discord server", "Social media director at a soda brand", "Streams games to 300 followers", "Writer and playtester for a board game company"] }
      ] },
    { id: "secondshift", name: "Second Shift Coffee", ind: "Coffee shops, 3 locations", ideal: ["team", "calm", "depend"], clash: ["risk", "creative"],
      desc: "Three coffee shops near Metra stations that serve 400 commuters between 6 and 9 a.m. During the rush, five people work behind a counter built for three, and one person out of rhythm backs up the whole line. Regulars want the exact same oat latte every day at every location, and the owner says a shift that starts late is a shift that fails.",
      extra: ["Graphic design", "Social media", "Bookkeeping", "Inventing new drinks"],
      jobs: [
        { t: "Shift Supervisor", e: 1, r: ["Run the floor during the morning rush", "Assign stations and cover call-offs", "Count the register and close the shop"], s: ["Scheduling", "Cash handling", "Coaching a crew"],
          bg: ["Shift lead at a bagel shop", "Store manager at a big coffee chain", "Barista for one year, wants to lead", "Head barista at a downtown cafe"] },
        { t: "Head Barista", e: 1, r: ["Make every drink to the recipe card", "Train new baristas on the espresso machine", "Keep drink times under 3 minutes"], s: ["Espresso craft", "Drink speed", "Recipe consistency"],
          bg: ["Barista at a busy airport cafe", "Barista champion, 8 years at specialty cafes", "Smoothie shop worker", "Roastery assistant"] },
        { t: "Roaster", e: 2, r: ["Roast 600 pounds of beans a week", "Taste-test every batch", "Keep the roaster clean and safe"], s: ["Coffee roasting", "Taste testing", "Equipment maintenance"],
          bg: ["Roaster at a small coffee company", "Master roaster for a national brand", "Brewery assistant who roasts at home", "Office catering driver"] },
        { t: "Catering Coordinator", e: 0, r: ["Take orders for office coffee deliveries", "Load and deliver catering by 8 a.m.", "Follow up with business customers"], s: ["Order taking", "Delivery routing", "Customer follow-up"],
          bg: ["Order desk clerk at a bakery", "Catering sales manager at a hotel", "Pizza delivery driver", "Assistant manager at a fast-food restaurant"] }
      ] },
    { id: "northshore", name: "Northshore Animal Hospital", ind: "Veterinary clinic", ideal: ["detail", "calm", "depend"], clash: ["risk", "compete"],
      desc: "A busy animal hospital in Evanston that sees 60 dogs and cats a day, plus emergencies that come through the door bleeding. One wrong dose or a mixed-up chart can kill a pet, so everything gets double-checked. Owners arrive scared and sometimes angry, and the clinic's reviews keep mentioning a staff that stays steady when things go wrong.",
      extra: ["Dog grooming", "Social media", "Pet photography", "Sales"],
      jobs: [
        { t: "Vet Technician", e: 1, r: ["Give medications and vaccines", "Prep animals for surgery", "Take X-rays and blood samples"], s: ["Animal handling", "Dosage math", "Surgery prep"],
          bg: ["Vet tech at a small-town clinic", "Emergency vet tech at a 24-hour hospital", "Shelter volunteer finishing vet tech school", "Dental office receptionist"] },
        { t: "Client Coordinator", e: 0, r: ["Check in pets and update records", "Explain bills and treatment costs", "Calm down worried owners"], s: ["Medical records", "Explaining costs", "Calming upset people"],
          bg: ["Front desk at a children's doctor's office", "Office manager at a dental practice", "Pet store cashier", "Doggy daycare attendant"] },
        { t: "Kennel Lead", e: 0, r: ["Feed and walk boarding pets", "Clean and disinfect every kennel", "Notice when an animal seems sick"], s: ["Cleaning protocols", "Spotting illness", "Feeding schedules"],
          bg: ["Kennel attendant at a boarding resort", "Zookeeper for 6 years", "Dog walker with 15 clients", "Assistant manager at a pet supply store"] },
        { t: "Practice Manager", e: 2, r: ["Order medicine and supplies", "Build the staff schedule", "Track the budget each month"], s: ["Inventory ordering", "Staff scheduling", "Budget tracking"],
          bg: ["Office manager at a dental clinic", "Regional manager for 8 pet stores", "Assistant manager at a vet clinic", "Vet technician"] }
      ] },
    { id: "freshfold", name: "FreshFold", ind: "Laundry pickup app (startup)", ideal: ["flex", "learner", "self"], clash: ["rules", "detail"],
      desc: "A six-month-old app that picks up laundry from college students and returns it folded the next day. The company changed its prices twice last month, added dry cleaning on a Tuesday, and dropped it on a Friday. With only nine people, nobody has a manual or a boss checking in, and the founder says she'd rather try ten rough ideas than polish one perfect one.",
      extra: ["Accounting", "Legal contracts", "Dry cleaning chemistry", "Five-year planning"],
      jobs: [
        { t: "Operations Lead", e: 1, r: ["Run the warehouse where laundry gets washed and folded", "Fix problems when pickups run late", "Try new ways to speed up turnaround"], s: ["Process improvement", "Problem solving", "Running a warehouse"],
          bg: ["Shift lead at a package warehouse", "Operations director at a big delivery company", "Started a dorm snack delivery business", "Coding bootcamp grad"] },
        { t: "App Developer", e: 1, r: ["Build new app features every week", "Fix crashes reported by users", "Connect the app to payment systems"], s: ["Mobile app coding", "Bug fixing", "Payment systems"],
          bg: ["Developer at a food-delivery startup", "Senior engineer at a bank", "Built an app for their school's club fair", "Brand ambassador for an energy drink"] },
        { t: "Campus Rep", e: 0, r: ["Sign up students at 6 campuses", "Run promo booths and giveaways", "Text customers about deals"], s: ["Peer sales", "Promo events", "Text marketing"],
          bg: ["Campus rep for a textbook rental app", "Sales manager at a phone carrier", "Student council treasurer", "Rideshare dispatcher"] },
        { t: "Driver Coordinator", e: 0, r: ["Hire and schedule part-time drivers", "Plan pickup routes each night", "Handle complaints about late orders"], s: ["Route planning", "Driver scheduling", "Complaint handling"],
          bg: ["Dispatcher for a food-delivery app", "Fleet manager at a moving company", "Delivery driver for a pizza chain", "Warehouse shift lead"] }
      ] },
    { id: "prairiesun", name: "Prairie Sun Solar", ind: "Rooftop solar installer", ideal: ["rules", "detail", "depend"], clash: ["risk", "flex"],
      desc: "A solar company that installs panels on homes across the suburbs. Every job means crews on steep roofs, live electrical wiring, and a city inspector who checks every bolt against the building code. One shortcut can mean a fall, a fire, or a failed inspection that costs $5,000, and customers sign 20-year contracts, so they expect crews exactly when promised.",
      extra: ["Graphic design", "Drone photography", "Social media", "Improvising on the job"],
      jobs: [
        { t: "Installer", e: 1, r: ["Mount panels on roofs", "Work safely 30 feet up", "Follow the install plan exactly"], s: ["Roof safety", "Panel mounting", "Reading blueprints"],
          bg: ["Roofer for a home repair company", "Crew chief at a commercial solar company", "Construction trade school student", "Apprentice electrician"] },
        { t: "Electrician", e: 2, r: ["Wire panels to the home's power", "Pass city electrical inspections", "Find and fix wiring problems"], s: ["Electrical wiring", "Building codes", "Troubleshooting"],
          bg: ["Electrician for a home builder", "Master electrician, 15 years", "Electrician apprentice, year 3", "Car dealership salesperson"] },
        { t: "Sales Consultant", e: 1, r: ["Visit homes and explain how solar saves money", "Calculate each home's savings", "Answer questions about 20-year contracts"], s: ["In-home sales", "Savings calculations", "Explaining contracts"],
          bg: ["Sales rep for a window company", "Top salesperson at a car dealership", "Retail associate at a home store", "City hall clerk"] },
        { t: "Permit Coordinator", e: 0, r: ["File permits with 12 different towns", "Schedule city inspections", "Track every document for each job"], s: ["Permit filing", "Inspection scheduling", "Document tracking"],
          bg: ["Permit clerk at a home builder", "Office manager at a construction firm", "Receptionist at a law office", "Roofing crew member"] }
      ] },
    { id: "rapidfix", name: "Rapid Fix", ind: "Phone repair kiosks", ideal: ["compete", "self", "learner"], clash: ["team", "rules"],
      desc: "Phone repair kiosks in eight malls. Each tech works alone at a kiosk all day and earns a bonus for every repair, and a leaderboard ranks all eight kiosks every week. New phone models come out every few months, so techs have to figure out repairs nobody has taught them yet, and the top kiosk last year fixed twice as many phones as the bottom one.",
      extra: ["Event planning", "Graphic design", "Following a set script", "Bookkeeping"],
      jobs: [
        { t: "Repair Tech", e: 1, r: ["Replace cracked screens and batteries", "Diagnose water-damaged phones", "Finish most repairs in under an hour"], s: ["Screen replacement", "Micro-soldering", "Diagnosing damage"],
          bg: ["Tech at an independent repair shop", "Certified tech at an electronics store, 7 years", "Fixes friends' phones from online videos", "Phone store salesperson"] },
        { t: "Kiosk Sales Lead", e: 0, r: ["Sell cases and screen protectors", "Quote repair prices to walk-up customers", "Hit weekly sales targets"], s: ["Upselling", "Price quoting", "Hitting sales goals"],
          bg: ["Sales associate at a phone carrier store", "Car salesperson of the year", "Cashier at a sneaker store", "Warehouse parts clerk"] },
        { t: "Parts Buyer", e: 1, r: ["Order parts for all eight kiosks", "Find cheaper suppliers", "Track which parts run out"], s: ["Supplier negotiation", "Inventory tracking", "Cost comparison"],
          bg: ["Buyer for an electronics store", "Purchasing director at a factory", "Resells sneakers and electronics online", "Tech school instructor"] },
        { t: "Training Lead", e: 2, r: ["Teach techs how to fix new phone models", "Make quick how-to videos", "Check repair quality at each kiosk"], s: ["Teaching adults", "How-to videos", "Quality checks"],
          bg: ["Trainer at a repair shop chain", "Engineering professor", "Top tech at a repair kiosk", "Repair technician"] }
      ] },
    { id: "brightpath", name: "BrightPath Tutoring", ind: "Tutoring center", ideal: ["people", "flex", "depend"], clash: ["compete", "risk"],
      desc: "A tutoring center in Schaumburg for middle and high school students. Most kids who walk in are frustrated and a little embarrassed about their grades, and many have had tutors who made them feel dumb. Sessions get moved around constantly for sports and family plans, and parents pay ahead for 20 sessions, so a tutor who cancels last minute loses the family.",
      extra: ["Debate coaching", "Graphic design", "Coding", "Cold-call sales"],
      jobs: [
        { t: "Math Tutor", e: 1, r: ["Tutor students in algebra through calculus", "Explain one problem five different ways", "Track each student's progress"], s: ["Algebra and calculus", "Explaining concepts", "Progress tracking"],
          bg: ["Math tutor at a community college", "Math professor and contest coach", "College sophomore, engineering major", "High school English teacher"] },
        { t: "Reading and Writing Tutor", e: 1, r: ["Help students with essays and reading", "Prep students for the ACT", "Build confidence in struggling readers"], s: ["Essay feedback", "Test prep", "Reading strategies"],
          bg: ["Writing center tutor at a university", "Published author and ACT prep expert", "Library teen program volunteer", "Assistant principal"] },
        { t: "Center Director", e: 2, r: ["Meet with parents about goals and progress", "Hire and schedule tutors", "Grow the center's enrollment"], s: ["Parent communication", "Tutor scheduling", "Enrollment growth"],
          bg: ["Director of a learning center", "Principal of a large high school", "Lead tutor who wants to run a center", "Camp registration coordinator"] },
        { t: "Enrollment Coordinator", e: 0, r: ["Answer calls from parents", "Match each student with a tutor", "Run the front desk and billing"], s: ["Phone etiquette", "Student matching", "Billing"],
          bg: ["Front desk at a music school", "Admissions director at a college", "Babysitter and camp counselor", "Math tutor"] }
      ] },
    { id: "windycity", name: "Windy City Eats", ind: "Food truck fleet", ideal: ["flex", "calm", "team"], clash: ["rules", "compete"],
      desc: "Four food trucks that work street festivals, ballgames, and office parks. Every day is a different spot, a different crowd, and sometimes a generator that dies in the middle of lunch. Four people share a kitchen the size of a hallway, so the crew lives or dies by covering for each other, and the biggest festival days bring a line of 200 people.",
      extra: ["Fine dining plating", "Five-year planning", "Accounting", "Writing policies"],
      jobs: [
        { t: "Line Cook", e: 1, r: ["Cook tacos and bowls fast in a tiny kitchen", "Prep food safely before each shift", "Keep orders moving when the line is long"], s: ["Fast cooking", "Food safety", "Prep work"],
          bg: ["Line cook at a busy diner", "Sous chef at a fancy restaurant", "Fast-food crew member", "Concession stand manager"] },
        { t: "Truck Manager", e: 1, r: ["Run each truck's daily setup and teardown", "Handle money and the card reader", "Fix problems on the spot"], s: ["Setup and teardown", "Cash handling", "Thinking on your feet"],
          bg: ["Manager of a ballpark concession stand", "General manager of a restaurant", "Server at a sports bar", "Wedding venue coordinator"] },
        { t: "Events Booker", e: 0, r: ["Book trucks at festivals and office parks", "Negotiate fees with event organizers", "Keep the calendar full"], s: ["Booking events", "Negotiating fees", "Calendar planning"],
          bg: ["Booking agent for local bands", "Event sales director at a hotel", "Organized school fundraisers", "Social media intern at a pizza chain"] },
        { t: "Social Media Lead", e: 0, r: ["Post where each truck will be today", "Run contests and specials", "Reply to reviews"], s: ["Daily posting", "Running contests", "Review replies"],
          bg: ["Social media for a bakery", "Digital marketing manager at a big brand", "Runs a food review page with 4,000 followers", "Line cook"] }
      ] },
    { id: "threadink", name: "Thread & Ink", ind: "Custom T-shirt print shop", ideal: ["creative", "detail", "self"], clash: ["risk", "compete"],
      desc: "A small shop that designs and prints custom shirts and hoodies for schools, teams, and bands. Customers walk in with a rough idea, so the shop has to turn it into a design they love, and one typo on a 500-shirt order means printing all 500 again. The owner works the front counter, so employees run their own projects without anyone chasing them.",
      extra: ["Sewing", "Cold-call sales", "Accounting", "Machine repair"],
      jobs: [
        { t: "Graphic Designer", e: 1, r: ["Turn customer ideas into print-ready designs", "Make three options for every order", "Fix artwork so it prints cleanly"], s: ["Design software", "Logo design", "Color separation"],
          bg: ["Designer at a sign shop", "Art director at an ad agency", "Sells stickers of their art online", "Press operator at a print shop"] },
        { t: "Screen Printer", e: 1, r: ["Run the screen printing press", "Mix ink to match exact colors", "Check every shirt for flaws"], s: ["Press operation", "Ink mixing", "Quality inspection"],
          bg: ["Press operator at a T-shirt factory", "Production manager at a big print company", "Prints shirts in the garage", "Project coordinator at a sign company"] },
        { t: "Customer Project Manager", e: 1, r: ["Meet with customers about their orders", "Proofread every design before printing", "Hit every deadline"], s: ["Proofreading", "Deadline tracking", "Customer meetings"],
          bg: ["Account manager at a print shop", "Project director at a marketing firm", "Yearbook editor", "Runs an online sneaker resale store"] },
        { t: "Online Store Manager", e: 0, r: ["Run the shop's online store", "Photograph new products", "Pack and ship online orders"], s: ["Online store setup", "Product photography", "Shipping"],
          bg: ["Online store assistant at a boutique", "E-commerce director at a clothing brand", "Sells thrifted clothes online", "Graphic designer"] }
      ] },
    { id: "summit", name: "Summit Events", ind: "Wedding and event planner", ideal: ["detail", "calm", "people"], clash: ["risk", "compete"],
      desc: "A planning company that runs 80 weddings and company parties a year in hotel ballrooms and barns. Clients spend their savings on one day, and there is no do-over if the cake shows up at the wrong venue. Something always goes wrong (a storm, a missing DJ, a crying bride), and the best planners fix it quietly while making the client feel like everything is perfect.",
      extra: ["Photography", "Cooking", "Social media", "Accounting"],
      jobs: [
        { t: "Event Planner", e: 2, r: ["Plan every detail of the event with the client", "Build the minute-by-minute timeline", "Run the event on the day"], s: ["Timeline planning", "Client meetings", "Day-of coordination"],
          bg: ["Wedding planner at a hotel", "Celebrity event producer in Los Angeles", "Planned their sister's wedding", "Vendor manager for a restaurant group"] },
        { t: "Vendor Coordinator", e: 1, r: ["Book caterers, DJs, and florists", "Confirm every vendor the week before", "Compare prices to stay on budget"], s: ["Vendor booking", "Confirmation calls", "Price comparison"],
          bg: ["Purchasing assistant at a catering company", "Supply chain manager at a factory", "Restaurant host", "Florist and lighting tech"] },
        { t: "Decor Designer", e: 1, r: ["Design table settings, lighting, and flowers", "Set up and tear down decor", "Match the client's color theme"], s: ["Decor design", "Lighting setup", "Color matching"],
          bg: ["Florist and decorator for a party store", "Set designer for a theater", "Makes party decor and sells it online", "Hotel sales assistant"] },
        { t: "Sales Coordinator", e: 0, r: ["Answer inquiries from engaged couples", "Give venue tours", "Send proposals and contracts"], s: ["Responding to leads", "Giving tours", "Writing proposals"],
          bg: ["Sales assistant at a banquet hall", "Sales director at a hotel chain", "Retail associate at a bridal shop", "Assistant wedding planner"] }
      ] },
    { id: "greenline", name: "Green Line Landscaping", ind: "Lawn care and landscaping", ideal: ["depend", "team", "rules"], clash: ["risk", "compete"],
      desc: "A landscaping company with 300 weekly lawn customers in the suburbs. Crews of four ride in one truck, run mowers and trimmers that can take off a finger, and start at 6:30 a.m. sharp. Customers expect the same day every week, and when one crew member doesn't show up, the rest of the crew can't finish the route.",
      extra: ["Social media", "Cold-call sales", "Coding", "Graphic design"],
      jobs: [
        { t: "Crew Leader", e: 1, r: ["Lead a crew of four on the daily route", "Train new crew members", "Make sure every yard looks right before leaving"], s: ["Leading a crew", "Equipment safety", "Quality walk-throughs"],
          bg: ["Crew member for 3 years at a lawn company", "Golf course grounds manager", "Mowed lawns all through high school", "Auto shop mechanic"] },
        { t: "Equipment Mechanic", e: 1, r: ["Fix mowers, trimmers, and blowers", "Keep trucks and trailers road-ready", "Order replacement parts"], s: ["Small engine repair", "Truck maintenance", "Parts ordering"],
          bg: ["Repair desk mechanic at a hardware store", "Diesel mechanic for a trucking company", "Fixes dirt bikes as a hobby", "Garden center associate"] },
        { t: "Landscape Designer", e: 1, r: ["Design new gardens and patios", "Draw plans customers can approve", "Pick plants that survive Chicago winters"], s: ["Garden design", "Drawing plans", "Plant knowledge"],
          bg: ["Designer at a garden center", "Landscape architect for city parks", "Horticulture student", "Dispatcher for a plumbing company"] },
        { t: "Route Scheduler", e: 0, r: ["Plan crew routes for 300 customers", "Reschedule after rainouts", "Answer customer calls"], s: ["Route scheduling", "Rain-day planning", "Customer calls"],
          bg: ["Dispatcher for a cleaning company", "Logistics manager at a shipping company", "Receptionist at a car wash", "Landscape crew leader"] }
      ] },
    { id: "neonlanes", name: "Neon Lanes", ind: "Bowling alley and arcade", ideal: ["people", "flex", "creative"], clash: ["rules", "compete"],
      desc: "A bowling alley and arcade that is packed on Friday nights, weekends, and with birthday parties for 8-year-olds. The owner wants every visit to feel like a party, so staff invent theme nights like glow bowling and '80s night. Shifts change week to week, and when someone calls off, whoever is free jumps in at the snack bar, the party room, or the prize counter.",
      extra: ["Accounting", "Writing policies", "Legal contracts", "Data analysis"],
      jobs: [
        { t: "Party Host", e: 0, r: ["Run birthday parties for kids", "Lead games and keep the energy up", "Handle parents' special requests"], s: ["Entertaining kids", "Leading games", "Parent requests"],
          bg: ["Party host at a trampoline park", "Children's theater director", "Summer camp counselor", "Promotions intern at a radio station"] },
        { t: "Events and Promotions Lead", e: 1, r: ["Invent theme nights and leagues", "Book school and company group outings", "Make flyers and posts"], s: ["Theme night ideas", "Group sales", "Flyer design"],
          bg: ["Promotions coordinator at a movie theater", "Marketing director at a theme park", "Runs their school's spirit week", "Arcade repair technician"] },
        { t: "Lane and Arcade Tech", e: 1, r: ["Fix pinsetters and arcade games", "Keep lanes oiled and working", "Order replacement parts"], s: ["Machine repair", "Lane maintenance", "Ordering parts"],
          bg: ["Arcade technician at a family fun center", "Factory machine engineer", "Fixes old pinball machines as a hobby", "Fast-food shift lead"] },
        { t: "Snack Bar Lead", e: 0, r: ["Run the grill and snack bar", "Keep food safe and the counter clean", "Handle the cash register"], s: ["Grill cooking", "Food safety", "Cash handling"],
          bg: ["Grill cook at a pool snack bar", "Kitchen manager at a restaurant", "Movie theater concession worker", "Birthday party entertainer"] }
      ] },
    { id: "ridgeline", name: "Ridgeline Outfitters", ind: "Outdoor gear store and guided trips", ideal: ["people", "learner", "calm"], clash: ["compete", "risk"],
      desc: "An outdoor store in Naperville that sells $600 tents and $300 hiking boots and runs weekend kayak and camping trips in Wisconsin. Customers trust the staff because they actually know the gear, and the gear changes every season. On trips, guides deal with storms and lost campers far from help, and the store pays no commission because the owner hates pushy sales.",
      extra: ["Commission sales", "Accounting", "Graphic design", "Coding"],
      jobs: [
        { t: "Gear Specialist", e: 1, r: ["Help customers pick the right tents, boots, and packs", "Learn every new product each season", "Fit boots and packs properly"], s: ["Product knowledge", "Boot and pack fitting", "Helping customers choose"],
          bg: ["Sales associate at a running store", "Gear buyer for a big sporting goods chain", "Eagle Scout and weekend backpacker", "Summer camp kayak instructor"] },
        { t: "Trip Guide", e: 2, r: ["Lead kayak and camping trips", "Keep groups safe in bad weather", "Teach beginners outdoor skills"], s: ["Wilderness first aid", "Kayak instruction", "Weather judgment"],
          bg: ["Canoe guide in the Boundary Waters", "Mountain guide in Colorado for 12 years", "Camp counselor with lifeguard training", "Bike rental shop worker"] },
        { t: "Rental and Repair Tech", e: 0, r: ["Check and repair rental tents and kayaks", "Track what's rented and returned", "Clean gear between trips"], s: ["Gear repair", "Rental tracking", "Gear cleaning"],
          bg: ["Bike rental shop mechanic", "Repair manager at a big outdoor brand", "Fixes their family's camping gear", "Outdoor blogger"] },
        { t: "Online Content Creator", e: 0, r: ["Write gear reviews and trip guides", "Film how-to videos", "Run the store's email newsletter"], s: ["Gear reviews", "How-to filming", "Email newsletters"],
          bg: ["Writes for a hiking blog", "Video producer at a travel channel", "Posts camping videos for 900 followers", "Running store salesperson"] }
      ] }
  ];

  const RUBRIC = [
    { id: "type", name: "Employee type", q: "The kind of employee they want fits this company." },
    { id: "skills", name: "Skills and experience", q: "The skills and experience they picked fit each job's responsibilities." },
    { id: "interview", name: "Interview process", q: "Their interview steps check what matters: real skills, past track record, and how people act at work." },
    { id: "hires", name: "Hires", q: "Their rankings follow what they said they were looking for." },
    { id: "overlap", name: "No overlap", q: "Each job asks for different skills, and the top hires don't double up." }
  ];
  const SCALE = [["1", "Weak"], ["2", "Some of it"], ["3", "Mostly"], ["4", "Strong"]];
  const DIM_NAMES = { type: "Employee type", skills: "Skills and experience", interview: "Interview process", hires: "Hires", overlap: "No overlap" };

  const FIRST = ["Aaliyah", "Marcus", "Sofia", "Jayden", "Priya", "Diego", "Hannah", "Malik", "Elena", "Tyler", "Mei", "Andre", "Grace", "Omar", "Lucia", "Ethan", "Zoe", "Kwame",
    "Nadia", "Brandon", "Isabel", "Jamal", "Chloe", "Mateo", "Fatima", "Ryan", "Leah", "Darius", "Ana", "Connor", "Imani", "Kevin", "Yasmin", "Luis", "Megan", "Tariq",
    "Rosa", "Owen", "Keisha", "Victor", "Lily", "Sam", "Noor", "Gabriel", "Tessa", "Hiro", "Bianca", "Xavier", "Jordan", "Riley", "Camila", "Dev"];
  const LAST = ["Ruiz", "Patel", "Okafor", "Nguyen", "Kowalski", "Johnson", "Garcia", "Kim", "Rossi", "Williams", "Haddad", "Lopez", "Chen", "Novak", "Brooks", "Singh",
    "Alvarez", "Kaminski", "Washington", "Park", "Morales", "Ali", "O'Brien", "Santos", "Bennett", "Reyes", "Foster", "Ivanova", "Coleman", "Diaz", "Mendez", "Sato"];

  const byId = arr => { const o = {}; arr.forEach(x => o[x.id] = x); return o; };
  const traitById = byId(TRAITS), stepById = byId(STEPS);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const skillPool = comp => { const out = []; comp.jobs.forEach(j => j.s.forEach(s => out.push(s))); comp.extra.forEach(s => out.push(s)); return out; };
  const hours = steps => (steps || []).reduce((t, id) => t + ((stepById[id] || {}).hrs || 0), 0);
  const canAdd = (steps, id) => !(steps || []).includes(id) && hours(steps) + stepById[id].hrs <= HOURS;

  /* ---------------- candidates (deterministic per company) ---------------- */
  const CACHE = {};
  function pool(ci) {
    if (CACHE[ci]) return CACHE[ci];
    const comp = COMPANIES[ci], R = rng(9173 + ci * 131), used = new Set();
    const neutral = TRAITS.map(t => t.id).filter(t => !comp.ideal.includes(t) && !comp.clash.includes(t));
    const nameFor = () => { for (;;) { const n = FIRST[Math.floor(R() * FIRST.length)] + " " + LAST[Math.floor(R() * LAST.length)], f = n.split(" ")[0]; if (!used.has(f)) { used.add(f); return n; } } };
    const yrsFor = e => e === 0 ? (R() < 0.5 ? 0 : 1) : e === 1 ? 2 + Math.floor(R() * 3) : 5 + Math.floor(R() * 8);
    const [i0, i1, i2] = comp.ideal, [c0, c1] = comp.clash;
    const out = comp.jobs.map((job, j) => {
      const I = job.s, nx = comp.jobs[(j + 1) % 4].s, X = comp.extra, v = (ci + j) % 4;
      const base = [
        { k: 0, skills: [I[0], I[1], X[j % 4]], traits: [i0, i1], e: job.e },
        { k: 1, skills: [I[0], I[1], I[2], v === 0 ? nx[0] : X[(j + 2) % 4]], traits: [i2, c0], e: Math.min(2, job.e + 1) },
        { k: 2, skills: [I[2], X[(j + 1) % 4]], traits: [i1, i2], e: Math.max(0, job.e - 1) },
        { k: 3, skills: [nx[1], nx[2], I[2]], traits: [neutral[j % neutral.length], c1], e: job.e }
      ];
      base.forEach(c => { c.bg = job.bg[c.k]; c.name = nameFor(); c.yrs = c.e === 2 && c.k === 1 ? yrsFor(2) + 3 : yrsFor(c.e); });
      // the hidden problem, rotating by job
      if (v === 0) base[1].flag = { type: "pad", skill: I[2] };
      if (v === 1) base[0].flag = { type: "ref" };
      if (v === 2) { base[1].flag = { type: "fit", shown: i0, real: c0 }; base[1].traits = [i2, i0]; }
      if (v === 3) { base[0].flag = { type: "fit", shown: i1, real: c1 }; }
      const sh = base.slice(); for (let a = sh.length - 1; a > 0; a--) { const b = Math.floor(R() * (a + 1)); [sh[a], sh[b]] = [sh[b], sh[a]]; }
      return { job, cands: base, show: sh.map(c => c.k) };
    });
    return (CACHE[ci] = out);
  }
  const yrsText = y => y === 0 ? "Less than 1 year" : y === 1 ? "1 year" : y + " years";

  // what the hiring team can see, given its interview steps
  function view(c, steps) {
    const S = new Set(steps || []), f = c.flag || {}, notes = [];
    const has = t => STEPS.some(s => s.finds === t && S.has(s.id));
    const pad = f.type === "pad" && has("pad"), ref = f.type === "ref" && has("ref"), fit = f.type === "fit" && has("fit");
    const skills = c.skills.map(n => ({ n, bad: pad && n === f.skill }));
    const traits = c.traits.map(t => (fit && t === f.shown ? { id: f.real, rev: true } : { id: t }));
    STEPS.forEach(s => { if (!S.has(s.id)) return;
      if (s.id === "phone") notes.push({ s: s.name, t: "Clear, polite, and on time." });
      if (s.id === "quiz") notes.push({ s: s.name, t: `Result: "${["The Achiever", "The Explorer", "The Connector", "The Builder"][(c.k + c.name.length) % 4]}."` });
      if (s.id === "coffee") notes.push({ s: s.name, t: ["Easy to talk to. You liked them.", "A little nervous, but nice.", "Very confident. Great stories.", "Quiet, but friendly."][(c.k + c.name.length) % 4] });
      if (s.finds === "pad") notes.push(f.type === "pad" ? { s: s.name, t: `Couldn't do ${f.skill}. The resume overstated it.`, bad: true } : { s: s.name, t: "Solid on every skill listed." });
      if (s.finds === "ref") notes.push(f.type === "ref" ? { s: s.name, t: "Two past managers said they missed shifts and deadlines.", bad: true } : { s: s.name, t: "Past managers would hire them again." });
      if (s.finds === "fit") notes.push(f.type === "fit" ? { s: s.name, t: `Comes across as "${traitById[f.real].name}," not "${traitById[f.shown].name}."`, bad: true } : { s: s.name, t: "Matches what the resume says." });
    });
    const seen = new Set(); const nd = notes.filter(n => { const k = n.t; if (seen.has(k) && !n.bad) return false; seen.add(k); return true; });
    return { skills, traits, notes: nd, refBad: ref, caught: pad || ref || fit, hidden: !!c.flag && !(pad || ref || fit) };
  }
  function fitTo(cv, c, crit) {
    const want = new Set((crit.s || [])), tw = new Set(crit.traits || []);
    let f = 0;
    cv.skills.forEach(x => { if (!x.bad && want.has(x.n)) f += 20; });
    cv.traits.forEach(x => { if (tw.has(x.id)) f += 10; });
    if (crit.e != null) { const d = Math.abs(c.e - crit.e); f += d === 0 ? 20 : d === 1 ? 10 : 0; }
    if (cv.refBad) f -= 25;
    return f;
  }
  const band = v => v >= 85 ? 4 : v >= 65 ? 3 : v >= 40 ? 2 : 1;
  const ACC = [100, 60, 20, 0];
  const acc = (rating, engine) => ACC[Math.abs(+rating - band(engine))];

  /* ---------------- the score ---------------- */
  // plan = { type:{traits:[], text}, skills:{j0:{s:[], e}, ...}, intv:{steps:[]}, hire:{j0:{k: rank}, ...} }
  function score(plan, ci) {
    const comp = COMPANIES[ci], P = pool(ci), d = {}, notes = {}, missed = [];
    const traits = ((plan.type || {}).traits || []);
    let t = 0; traits.forEach(x => t += comp.ideal.includes(x) ? 34 : comp.clash.includes(x) ? -25 : 10);
    d.type = Math.round(clamp(t, 0, 100));
    notes.type = [`Best fit for ${comp.name}: ${comp.ideal.map(x => traitById[x].name).join(", ")}.`];
    const hitC = traits.filter(x => comp.clash.includes(x)); if (hitC.length) notes.type.push(`${hitC.map(x => traitById[x].name).join(" and ")} works against this company.`);
    // skills
    let sk = 0; notes.skills = [];
    comp.jobs.forEach((job, j) => { const p = (plan.skills || {})["j" + j] || {}, s = p.s || [], hit = s.filter(x => job.s.includes(x)).length;
      const de = p.e == null ? 9 : Math.abs(p.e - job.e), v = 80 * hit / 3 + (de === 0 ? 20 : de === 1 ? 10 : 0); sk += v;
      const miss = job.s.filter(x => !s.includes(x));
      notes.skills.push(`${job.t}: ${hit} of 3 key skills${miss.length ? ` (missed ${miss.join(", ")})` : ""}${de === 0 ? "" : `; best experience: ${EXP[job.e].toLowerCase()}`}.`); });
    d.skills = Math.round(sk / 4);
    // interview
    const steps = (plan.intv || {}).steps || [], cov = ["pad", "ref", "fit"].filter(x => STEPS.some(s => s.finds === x && steps.includes(s.id)));
    d.interview = [10, 40, 70, 100][cov.length];
    notes.interview = [cov.length ? `Checked: ${cov.map(x => FINDS[x].toLowerCase()).join(", ")}.` : "Nothing in this process checks real skills, track record, or behavior."];
    const unc = ["pad", "ref", "fit"].filter(x => !cov.includes(x)); if (unc.length) notes.interview.push(`Never checked: ${unc.map(x => FINDS[x].toLowerCase()).join(", ")}.`);
    const fluff = steps.filter(id => !stepById[id].finds); if (fluff.length) notes.interview.push(`${fluff.map(id => stepById[id].name).join(" and ")} didn't catch anything.`);
    // hires (against their own plan, with what they could see)
    let hs = 0; notes.hires = []; const tops = [];
    P.forEach((pj, j) => {
      const rk = ((plan.hire || {})["j" + j]) || {}, crit = { ...(((plan.skills || {})["j" + j]) || {}), traits };
      const full = pj.cands.every(c => rk[c.k]) && new Set(pj.cands.map(c => rk[c.k])).size === 4;
      const vs = pj.cands.map(c => ({ c, v: view(c, steps) })); vs.forEach(o => o.f = fitTo(o.v, o.c, crit));
      if (!full) { notes.hires.push(`${pj.job.t}: ranking not finished.`); tops.push(null); return; }
      const best = Math.max(...vs.map(o => o.f)), me = vs.find(o => rk[o.c.k] === 1);
      let v = me.f === best ? 50 : me.f >= best - 10 ? 25 : 0, agree = 0;
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) { const A = vs[a], B = vs[b];
        if (Math.abs(A.f - B.f) < 5 || (A.f > B.f) === (rk[A.c.k] < rk[B.c.k])) agree++; }
      v += 50 * agree / 6; hs += v; tops.push(me);
      const top = vs.slice().sort((a, b) => b.f - a.f)[0];
      notes.hires.push(me.f >= best ? `${pj.job.t}: hired ${me.c.name}, the best match for their own plan.` : `${pj.job.t}: hired ${me.c.name}, but their own plan points to ${top.c.name}.`);
      if (me.v.hidden) missed.push(`${pj.job.t}: ${me.c.name} ${me.c.flag.type === "pad" ? `can't actually do ${me.c.flag.skill}. A skills test or work sample would have caught it.` : me.c.flag.type === "ref" ? "has a history of missing shifts. A reference check would have caught it." : `turned out to be "${traitById[me.c.flag.real].name}," not "${traitById[me.c.flag.shown].name}." A behavioral or panel interview would have caught it.`}`);
    });
    d.hires = Math.round(hs / 4);
    // overlap
    const cnt = {}; comp.jobs.forEach((job, j) => (((plan.skills || {})["j" + j] || {}).s || []).forEach(x => cnt[x] = (cnt[x] || 0) + 1));
    const critDup = Object.values(cnt).reduce((t, n) => t + Math.max(0, n - 1), 0), dupNames = Object.keys(cnt).filter(x => cnt[x] > 1);
    const key = new Set(comp.jobs.flatMap(j => j.s)), tc = {}; tops.forEach(o => { if (o) o.v.skills.filter(x => !x.bad && key.has(x.n)).forEach(x => tc[x.n] = (tc[x.n] || 0) + 1); });
    const teamDup = Object.values(tc).reduce((t, n) => t + Math.max(0, n - 1), 0), teamNames = Object.keys(tc).filter(x => tc[x] > 1);
    d.overlap = Math.round(clamp(100 - 25 * critDup - 15 * teamDup, 0, 100));
    notes.overlap = [];
    if (dupNames.length) notes.overlap.push(`Asked for in more than one job: ${dupNames.join(", ")}.`);
    if (teamNames.length) notes.overlap.push(`Top hires double up on: ${teamNames.join(", ")}.`);
    if (!notes.overlap.length) notes.overlap.push("Every job asks for different skills, and every top hire brings something new.");
    const total = Math.round(RUBRIC.reduce((t, r) => t + d[r.id], 0) / RUBRIC.length);
    return { d, notes, missed, total, bands: Object.fromEntries(RUBRIC.map(r => [r.id, band(d[r.id])])) };
  }
  return { HOURS, TRAITS, EXP, EXP_SUB, STEPS, FINDS, COMPANIES, RUBRIC, SCALE, DIM_NAMES, traitById, stepById,
    skillPool, hours, canAdd, pool, view, fitTo, yrsText, band, acc, score };
})();
if (typeof module !== "undefined") module.exports = HP;
