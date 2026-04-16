# Portfolio Risk Platform — Presentation Script

**Total runtime: ~10 minutes**
**Tone: conversational, warm, confident. Pause often. Let jokes breathe.**

---

## SLIDE 1 — Title

**Visual:** Project name, your name, Furman Fellows logo.

**Script:**

> "Hey everyone. My name is Pratik. For the past semester, I've been building a portfolio risk platform — basically, an app that helps regular people invest without being terrified of losing their money. But before I show you what I built, I want to tell you why I built it."

*(pause, click)*

---

## SLIDE 2 — The Hook (Childhood)

**Visual:** Simple text slide, or a family photo if you have one.

**Script:**

> "I grew up with not a lot. My parents worked hard. We were happy. But money was tight — or so I thought.
>
> Then somewhere around middle school, things got... comfortable. And I was *convinced* my parents had been secretly rich the whole time — and were just making us eat lentils to build character.

*(pause for laugh — don't rush)*

> Turns out, no. When I was 12, my mom sat me down and taught me how to invest. And after that, dinner in our house was never the same. It wasn't 'how was school.' It was — *(parent voice)* 'Did you see what the Fed did today? Should we sell Apple?'

*(pause for laugh)*

> So I'd go to school the next day, excited, and start talking about stocks with my friends. And they would look at me — like I was speaking Klingon.

*(pause for laugh — act out the confused face)*

> But here's the thing that stuck with me. It wasn't that they didn't care. They were **scared.** Scared of losing money their families didn't have much of to begin with.

*(slow down — quiet tone)*

> And I remember thinking — the people who need investing the most are the ones most afraid to try it."

*(hold the silence for a full second)*

---

## SLIDE 3 — The Problem (Mag Seven)

**Visual:** Pie chart showing 7 companies highlighted inside the S&P 500.

**Script:**

> "Fast forward a few years. I come to the US. I study. I end up working in New York — finally in the room where the money moves.
>
> And in finance, there's one piece of advice everyone gives: *(advisor voice)* 'Just buy the S&P 500. It's 500 companies. You're diversified. You're safe.'
>
> But when you actually look at it — **seven companies** make up nearly a third of that index. Apple. Microsoft. Nvidia. Google. Amazon. Meta. Tesla.

*(slow, count on fingers)*

> So people who think they're buying 500 stocks are really betting on **seven.**
>
> That's not diversification. That's concentration risk, dressed up as safety. And it's the exact kind of hidden risk that scares people away from investing in the first place.
>
> I wanted to build something that exposed this. The **Furman Fellowship** gave me the shot. One semester. To turn the problem into a tool."

*(pause, click)*

---

## SLIDE 4 — Meet Sarah

**Visual:** Photo of a regular-looking 20-something, name "Sarah" on screen.

**Script:**

> "Let me show you how the app works through one person. Meet Sarah. She's 26. She has five thousand dollars saved. And she's scared to invest — because she doesn't know what happens if things go wrong.
>
> Let me walk you through what happens when she opens the app."

---

## SLIDE 5 — Questionnaire

**Visual:** Screenshot of the questionnaire screen.

**Script:**

> "First, the app asks her about *herself.* Not about the market — about her.
>
> How old are you? When do you need this money? If the market dropped 30 percent tomorrow, would you sell, hold, or buy more?
>
> Most investing apps skip this part. Mine doesn't — because your risk isn't about the market. It's about **you.** Your goals, your timeline, your stomach.
>
> Those answers become a risk profile the rest of the app is built around."

---

## SLIDE 6 — Portfolio

**Visual:** Screenshot of the recommended portfolio — pie chart, asset breakdown.

**Script:**

> "Based on her answers, the app builds her a portfolio. Not just 'buy the S&P 500' — a real mix. Stocks, bonds, different sectors, chosen to fit *her.*
>
> And here's the important part — it deliberately spreads her **away** from the Mag Seven trap we just talked about. So when one of those companies has a bad quarter, her whole future doesn't move with it.
>
> She sees exactly what she owns, and why."

---

## SLIDE 7 — Trading

**Visual:** Screenshot of the trade confirmation screen.

**Script:**

> "Then — and this is what most school projects skip — she can actually **buy** it. One click. The app connects the advice to the action.
>
> Because the gap between 'knowing what to invest in' and 'actually investing' is where most beginners give up. I wanted to close that gap."

*(pause, click — tone shifts)*

---

## SLIDE 8 — How Does It Pick the Mix? (HRP + Markowitz)

**Visual:** Two-column comparison of Markowitz vs HRP.

**Script:**

> "So that's the app. Three steps — questions, portfolio, trade. But none of it matters if the math underneath is wrong.
>
> When the app builds Sarah's portfolio, it has to answer one question: how do I split her money across stocks to give her the best deal for the risk she's taking?
>
> There are two classic ways to do this. Both are flawed. So I use both.
>
> The first is called **Markowitz.** It's almost 75 years old — it won a Nobel Prize. The idea: look at how stocks behaved in the past, and mathematically find the *perfect mix.* Beautiful math. One problem — it trusts history too much. One weird month of data and it gives you a crazy portfolio. Mathematically optimal. Practically fragile.
>
> The second is newer — from 2016. It's called **HRP.** Instead of one giant optimization, it groups stocks that behave alike — tech with tech, banks with banks — and spreads the money across the groups. It's not perfect. But it's **stable.**
>
> So the app runs both and blends the answers. **Markowitz gives the textbook answer. HRP gives the answer that survives Monday morning. I use both.**"

---

## SLIDE 9 — How Do I Know The Math Is Right? (Backtest + Stress Test)

**Visual:** Chart — predicted loss vs actual loss for 2020 and 2022.

**Script:**

> "But having two algorithms isn't enough. I had to prove the whole thing actually works.
>
> So I did what engineers call a **backtest.** I took the model back in time — to January 2020, right before COVID crashed the market. I fed it a normal portfolio. I asked it: *'what's the worst case this year?'* Then I let time run forward and checked what actually happened.
>
> My model predicted the worst-case loss within **[X] percent** of reality. I did the same for 2022 — another rough year. Same result.
>
> I also **stress-tested** it — asked it: *'what if 2008 happened again?'* — and made sure the model didn't fall apart under extreme pressure.
>
> That's the test I ran so Sarah doesn't have to. That's how I earned the right to put a number in front of a real user."

*(pause — that's your big line, let it sit)*

---

## SLIDE 10 — Simulation (Monte Carlo)

**Visual:** A spaghetti chart of simulated portfolio paths — hundreds of lines.

**Script:**

> "There's one more piece. History only tells you what *did* happen. It can't tell you what *could.*
>
> So the app also runs **ten thousand possible futures** — a technique called Monte Carlo simulation. Imagine replaying the next year of the market ten thousand times, with slightly different luck each time. Some runs are great. Some are disasters. I care about the disasters.
>
> Then I blend both signals — what history showed, and what simulation predicts — **40 percent history, 60 percent simulation.** That number wasn't a guess. I tested dozens of blends. That one predicted real crashes best.
>
> History is real but old. Simulation is flexible but made-up. Neither alone is enough. Together, they tell you the truth."

---

## SLIDE 11 — What's Next

**Visual:** Three gaps / three boxes.

**Script:**

> "I'm proud of what I built. But I'm also honest about what it isn't yet.
>
> There are three gaps I want to close next.
>
> **First — the risk view is still too technical.** Right now the app shows numbers. Next I want to show **feelings.** 'On your worst day, you could lose the price of a used car.' Something Sarah can actually picture.
>
> **Second — more rigor.** More backtests across more crises — 2008, 2011, the dot-com bust. And different simulation methods, because real markets don't behave like the textbook says they do.
>
> **Third — real money.** Eventually, real trades with real dollars. But that means licensing, regulation, reputation — things you can't shortcut. Before any of that, the next step is small: **10 real users.** Watch them use it. Learn what I got wrong. That's the next milestone."

*(pause)*

---

## SLIDE 12 — What I Learned + Close

**Visual:** Clean slide — maybe one line of text, or a childhood photo tied to the hook.

**Script:**

> "Three things I learned doing this.
>
> **Technically** — you can't trust any single model. Blending beats perfection. Every time.
>
> **Personally** — the scariest number in investing — your worst day — turns out to be the most useful one. Because once you can see it, you can plan for it.
>
> **And about my path** — I started this project wanting to build an app.
>
> I ended up building something my 12-year-old self would've shown his friends.

*(pause — smile)*

> Thank you."

*(stop. don't fill the silence. wait for applause / questions.)*

---

# Delivery Cheat Sheet

## The Five Lines To Memorize Cold
1. *"The people who need investing most are the most afraid to try."*
2. *"Not diversification. Concentration dressed up as safety."*
3. *"Markowitz gives the textbook answer. HRP gives the answer that survives Monday morning."*
4. *"That's how I earned the right to put a number in front of a user."*
5. *"I ended up building something my 12-year-old self would've shown his friends."*

## Pauses That Matter
- After "build character" — let the laugh breathe
- After "Klingon" — physical face, pause
- After "They were scared" — full second of silence
- After "betting on **seven**" — let it sink in
- After "Thank you" — do NOT fill the silence

## Voice Shifts
- **Parent voice** when impersonating your mom
- **Advisor voice** when saying "Just buy the S&P 500"
- **Drop to quiet** on "They were scared"
- **Confident + slow** on "I earned the right"

## If Something Breaks
- Demo fails → skip to screenshots, stay calm
- Forget a line → skip, don't backtrack, nobody knows
- Run long → cut Slide 10's intro, compress Slide 11 to one bullet

## Pre-Talk Checklist
- [ ] Replace **[X] percent** on Slide 9 with the real backtest number
- [ ] Rehearse the hook 5 times out loud — time it
- [ ] Rehearse the close 5 times — the last line is everything
- [ ] Water nearby
- [ ] Phone on silent

---

**Total word count: ~1,400 words. At a comfortable 150 wpm, that's ~9:20. Perfect for a 10-min slot.**
