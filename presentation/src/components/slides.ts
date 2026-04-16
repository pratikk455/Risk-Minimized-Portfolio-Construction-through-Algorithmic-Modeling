import Slide01Title from "@/slides/01-Title";
import Slide02Hook from "@/slides/02-Hook";
import Slide03Problem from "@/slides/03-Problem";
import Slide04Sarah from "@/slides/04-Sarah";
import Slide05Questionnaire from "@/slides/05-Questionnaire";
import Slide06Portfolio from "@/slides/06-Portfolio";
import Slide07Trading from "@/slides/07-Trading";
import Slide08Algorithms from "@/slides/08-Algorithms";
import Slide09Backtest from "@/slides/09-Backtest";
import Slide10MonteCarlo from "@/slides/10-MonteCarlo";
import Slide11Future from "@/slides/11-Future";
import Slide12Close from "@/slides/12-Close";
import Slide13Thanks from "@/slides/13-Thanks";
import type { ComponentType } from "react";

export type SlideProps = {
  step: number;
  isActive: boolean;
  advanceStep: () => void;
};

export type SlideDefinition = {
  id: string;
  title: string;
  component: ComponentType<SlideProps>;
  maxStep: number;
  notes: string[];
};

export const slides: SlideDefinition[] = [
  {
    id: "title",
    title: "Title",
    component: Slide01Title,
    maxStep: 0,
    notes: [
      "Hey everyone. My name is Pratik.",
      "For the past semester, I've been building a portfolio risk platform: an app that helps regular people invest without being terrified of losing their money.",
      "But before I show you what I built, I want to tell you why I built it.",
    ],
  },
  {
    id: "hook",
    title: "The Hook",
    component: Slide02Hook,
    maxStep: 4,
    notes: [
      "I grew up with not a lot. Parents worked hard, we were happy. Or so I thought.",
      "Middle school: things got comfortable. I was convinced they were secretly rich (lentils / build character, pause for laugh).",
      "At 12, Mom taught me to invest. Dinner became Fed news and stock picks (parent voice).",
      "Friends looked at me like I was speaking Klingon.",
      "They weren't uninterested. They were SCARED. The people who need investing most are the most afraid to try.",
    ],
  },
  {
    id: "problem",
    title: "The Problem",
    component: Slide03Problem,
    maxStep: 3,
    notes: [
      "NYC. Finance. One piece of advice: buy the S&P 500, you're safe.",
      "Reveal: 7 companies make up ~33% of the index. Apple, Microsoft, Nvidia, Google, Amazon, Meta, Tesla.",
      "People think they own 500. They're betting on 7. Concentration dressed up as safety.",
      "Furman Fellowship gave me the shot to build the fix.",
    ],
  },
  {
    id: "sarah",
    title: "Meet Sraddha",
    component: Slide04Sarah,
    maxStep: 1,
    notes: [
      "Meet Sraddha. 23. $5,000 saved. Scared to invest.",
      "Let me walk you through what happens when she opens the app.",
    ],
  },
  {
    id: "questionnaire",
    title: "Questionnaire",
    component: Slide05Questionnaire,
    maxStep: 0,
    notes: [
      "First, the app asks about HER, not the market.",
      "Age, timeline, how she'd react to a 30% drop.",
      "Your risk isn't about the market. It's about you.",
    ],
  },
  {
    id: "portfolio",
    title: "Portfolio",
    component: Slide06Portfolio,
    maxStep: 0,
    notes: [
      "Based on her answers, the app builds her portfolio.",
      "Real mix: stocks, bonds, sectors. Spreads her AWAY from the Mag Seven trap.",
      "She sees exactly what she owns, and why.",
    ],
  },
  {
    id: "trading",
    title: "Trading",
    component: Slide07Trading,
    maxStep: 0,
    notes: [
      "Then, she can actually BUY it. One click.",
      "Closes the gap between advice and action, where most beginners give up.",
    ],
  },
  {
    id: "algorithms",
    title: "HRP + Markowitz",
    component: Slide08Algorithms,
    maxStep: 3,
    notes: [
      "The app picks the mix using two classic methods. Both flawed. So I use both.",
      "Markowitz (1952, Nobel): precise. But fragile. Trusts history too much.",
      "HRP (2016): groups similar stocks, spreads across groups. Stable, humble.",
      "Markowitz gives the textbook answer. HRP gives the answer that survives Monday morning. I use both.",
    ],
  },
  {
    id: "backtest",
    title: "Backtest",
    component: Slide09Backtest,
    maxStep: 2,
    notes: [
      "How do I know the math is right? I took it back in time.",
      "Sent the model to Jan 2019, let time run forward.",
      "Max drawdown: -26.5% vs S&P -33.7%. Sharpe: 0.97 vs 0.93. Tested in 2020 COVID + 2022 bear.",
      "That's how I earned the right to put a number in front of a user.",
    ],
  },
  {
    id: "montecarlo",
    title: "Monte Carlo",
    component: Slide10MonteCarlo,
    maxStep: 2,
    notes: [
      "History tells you what did happen. Simulation tells you what COULD.",
      "10,000 possible futures. Some great, some disasters. I care about the disasters.",
      "Blend: 40% history, 60% simulation. Not a guess. Tested dozens of blends.",
      "79.2% of simulated portfolios beat the S&P on Sharpe. 100% had lower drawdown.",
    ],
  },
  {
    id: "future",
    title: "What's Next",
    component: Slide11Future,
    maxStep: 3,
    notes: [
      "Three honest gaps.",
      "1. Risk view is too technical. Show FEELINGS, not numbers. 'You could lose the price of a used car.'",
      "2. More rigor: more crises, different simulation methods.",
      "3. Real money, eventually. First milestone: 10 real users. Watch them. Learn what I got wrong.",
    ],
  },
  {
    id: "close",
    title: "Close",
    component: Slide12Close,
    maxStep: 2,
    notes: [
      "Technically: you can't trust any single model. Blending beats perfection.",
      "Personally: the scariest number is the most useful one. Once you see it, you can plan for it.",
      "I started wanting to build an app. I ended up building something my 12-year-old self would've shown his friends.",
    ],
  },
  {
    id: "thanks",
    title: "Thanks",
    component: Slide13Thanks,
    maxStep: 1,
    notes: [
      "Any questions? Three QR codes: paper, poster, app source. Scan whichever you want to dig into.",
      "Thank you.",
    ],
  },
];
