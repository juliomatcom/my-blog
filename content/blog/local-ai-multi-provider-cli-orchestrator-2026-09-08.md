# Local AI multi-provider CLI orchestrator

![machine](/images/machine.jpeg)

*This post was co-authored with Claude.*

AI isn't a choice anymore. I go AI-first on everything now, and the harder the problem, the more reason to ask "what would Claude or Codex do here?" before I write a line. In the big scheme of things I still decide which direction we go, but the day-to-day moves are a conversation. There's no way back to coding straight from my head. That now feels like refusing to use a compiler.

But it's expensive. Every frontier provider wants a subscription, and the good ones want a real one. Most people I know pay for exactly one and then defend it like a football team. That's a bad deal. No provider is best at everything: one wins on hard reasoning, another on long mechanical edits, another is just cheaper for the stuff that doesn't need a genius. Lock into one and you're either overpaying for easy work or underpowered on the hard parts.

So I built [Baya](https://baya-cli.depre.net).

`baya` runs a list of coding tasks across the AI subscriptions you already have. Write the tasks in plain text, a markdown file, a `TODO.txt`, whatever, and run one command. It reads the list for intent, builds a dependency graph, sends each task to the model that fits it, runs the independent ones in parallel, makes the rest wait, and takes the whole thing to a report. Provider runs out of quota, or you hit Ctrl+C? It checkpoints and resumes later. No config format, no DSL, no separate API key. It just drives `codex`, `claude`, `copilot`, and `opencode`, already installed, already logged in.

*More on what it does: [baya-cli.depre.net/features](https://baya-cli.depre.net/features/).*

By the time I write the list the decisions are made. Baya automates the whole implementation phase from there: it runs the tasks in parallel across providers and reuses context instead of re-explaining the project to every model, so the run costs a fraction of the tokens doing it by hand would.

*How the parallelism, routing and context handoff work: [the docs](https://baya-cli.depre.net/docs/#how-it-works).*

## A few rules from the start

- It had to keep me in charge. The thinking happens upstream, in the list and the specs; Baya takes it from there and does the implementation. An orchestrator, not an autopilot.
- It had to be useful to me. Not a demo, not a portfolio piece, a tool I reach for on a normal Tuesday. If I'd stop using it after a week, it failed. That keeps the scope honest.
- Simple and efficient. Zero config: it asks once which provider to default to, then never again. The expensive parts, planning, model selection, context handoff, process reuse, happen once per run, not once per task. Compatible tasks share one process, so you're not paying setup and discovery over and over.
- Open source, MIT, built in public. Code on GitHub, issues public, design records in the repo. I'd rather people watch it get figured out than land on a polished thing with no seams.
- Sustainable. The website is static on GitHub Pages, no server, no bill. And it's LLM-first: the source of truth is a set of token-optimized wiki pages written for the agents that work on the code, and the human docs come from those. One place to keep correct.

Funny part is: using Baya to build Baya.

Once the skeleton worked I started feeding it its own task lists. "Design the recovery protocol, then implement checkpointing, then write the integration test." It planned that, sent the hard design to a strong model and the plumbing to a cheap one, ran them in order, handed me a report. When two designs looked equally good I ran `baya consensus` on them and let the models argue it out. What better test than making the tool responsible for its own next feature? Every rough edge hit me first.

*The task list is any UTF-8 text; the planner reads it for intent: [how task lists work](https://baya-cli.depre.net/docs/#task-lists).*

## So what can you do with it?

If you pay for two or more AI subscriptions (they all ship a CLI now), `baya` is the layer that makes them work together instead of you tab-switching all day. Write the morning's work as a list, run `baya`, come back to a report. Point it at a refactor across ten files and let it fan out. Hand it a bug and a repro, let the right model chew on it while a cheaper one writes the test. The list is just text, so keep it in the repo, generate it, or paste it from a ticket.

*Pin a model per task or let Baya route: [model routing](https://baya-cli.depre.net/docs/#models).*

## AI Consensus
The feature I didn't expect to love.

`baya consensus` takes one thing, a spec, a diff, a plan, a hard question, and hands it to several of your models at once. They review it blind, no one sees anyone else's answer, because a model shown another model's opinion just anchors on it and stops thinking. A moderator reconciles what comes back and tells you where they agree and where they don't. It never decides the answer itself: not a judge, doesn't vote, doesn't pick a winner. That's my call. It just lays out where the models line up and where they split, and I take it from there. Three models independently landing on the same worry in your design beats any single model's confidence. When they split, that's the signal too: you just found the part that's actually hard.

*The blind rounds, the moderator's limits, and why it never votes: [baya-cli.depre.net/ai-consensus](https://baya-cli.depre.net/ai-consensus/).*

Where it goes next: more providers, because people use more than four CLIs. Smarter cost routing, spending the expensive tokens only where they change the outcome. And getting more people on board, the hardest part by far. Most developers just use whatever provider their company hands them and never think about it. The ones who pay their own way, like me, are the ones who actually feel the bill and the ceiling of a single subscription. That's who Baya is for, and there aren't many of us yet. But the ones who try it keep it.

*Why Baya sits alongside your CLIs and what it does for your bill: [the FAQ](https://baya-cli.depre.net/faq/).*

If you pay for your own AI subscriptions, [give it a look](https://baya-cli.depre.net). And if you try it, say hi.
