/* Leadership Lab: the secret leader cards. Shared by the student page and the teacher screen.
   Each round one person in every group of 2 or 3 leads the paper tower build with a secret leadership style.
   Teammates privately rate how it felt and guess the style. The teacher screen compares height and
   satisfaction by style across the class. */
"use strict";
var LAB = (function () {
  const STYLES = {
    autocratic: { name: "Autocratic", short: "Auto",
      card: ["You make every decision. Do not ask for ideas.", "Assign each person a specific job in the first 30 seconds.", "If someone suggests a change, say: “We're doing it my way.”"] },
    laissez: { name: "Laissez-Faire", short: "L-F",
      card: ["Say: “You all know what to do. I trust you.”", "Then step back. Give no instructions.", "Only help if someone asks you a direct question, and keep the answer short."] },
    democratic: { name: "Democratic", short: "Dem",
      card: ["Spend the first 2 minutes collecting an idea from every person.", "Have the group vote on a design. You break ties.", "Check in once halfway: “Is this still working?”"] },
    coaching: { name: "Coaching", short: "Coach",
      card: ["Ask each person what they're good at, then match jobs to strengths.", "Give quick feedback often: “Nice, now try folding it tighter.”", "Let people try their ideas even if they might fail."] },
    pacesetter: { name: "Pacesetter", short: "Pace",
      card: ["Build fast yourself and expect your group to keep up.", "Call out the time every minute: “Six minutes left, move faster!”", "Set a target height out loud and push hard to beat it."] },
    bureaucratic: { name: "Bureaucratic", short: "Bur",
      card: ["Before building, read the four rules on the board out loud.", "Every new piece of tape needs your approval.", "Stop the build if anyone breaks a rule."] },
    servant: { name: "Servant", short: "Serv",
      card: ["Ask: “What do you need from me?”", "Your job is to hand out materials, hold pieces, and clear problems.", "Never tell anyone what to build. Support whatever they choose."] },
    transactional: { name: "Transactional", short: "Trans",
      card: ["Announce a deal: every 10 cm of height earns the group 1 bonus point.", "Track points out loud as the tower grows.", "Take away 1 point for every dropped or wasted sheet."] }
  };
  const ORDER = Object.keys(STYLES);
  const RULES = ["Build the tallest freestanding tower you can.", "It must stand on its own for 10 seconds after time is called.", "Only the materials given. No taping to the table, wall, or floor.", "The leader may not touch the materials unless their card says so."];
  const MATERIALS = "Each group: 20 sheets of scrap paper, 1 meter of masking tape, scissors. One meter stick for the room.";
  const PTS = { height: 10, guess: 3, leader: 2 };
  return { STYLES, ORDER, RULES, MATERIALS, PTS };
})();
