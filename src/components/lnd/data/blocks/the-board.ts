import type { McqBlockData } from "../types";

export const THE_BOARD: McqBlockData = {
  id: "the-board",
  name: "The Board",
  framework: "Self-awareness → Self-compassion",
  source: {
    type: "text",
    title: "The Board — Self-awareness → Self-compassion",
    content:
      "The critical voice was installed. It is not yours.\n\n" +
      "Three zones shape how you process setbacks:\n\n" +
      "Fears — \"I'm not good enough,\" \"I should have figured this out by now,\" \"What if people judge me\"\n\n" +
      "Gratitude — \"I kept showing up even when it was hard,\" \"I tried something new and it didn't work — and that's okay\"\n\n" +
      "Build — \"I want to build something that outlasts me,\" \"I want to lead without needing credit\"\n\n" +
      "The self-compassion shift doesn't mean ignoring failure. It means processing failure without a shame spiral — acknowledging what happened, recognizing the effort, and redirecting energy toward what you're building.",
  },
  questions: [
    {
      id: 1,
      prompt:
        "You presented a recommendation to a client. Halfway through, you realize there's a flaw in your analysis — the numbers don't add up. The room notices. What happens in your head first?",
      options: [
        { key: "A", text: "\"I'm an idiot. How did I miss this.\"", weight: 1 },
        { key: "B", text: "\"This is going to follow me. They'll never trust my work again.\"", weight: 2 },
        { key: "C", text: "\"I need to fix this before anyone else notices the full extent of the error.\"", weight: 3 },
        { key: "D", text: "\"Okay, I made an error. Let me acknowledge it and correct it right now.\"", weight: 6 },
        { key: "E", text: "\"The analysis has 40 data points. One is wrong. That's fixable.\"", weight: 7 },
        { key: "F", text: "\"I'll flag the error, correct it, and note what I'll check differently next time.\"", weight: 8 },
        { key: "G", text: "\"I caught it live, which means my instinct to verify is working. The process held.\"", weight: 9 },
        { key: "H", text: "\"Mistakes in live settings are how I've learned every major lesson. This is one more.\"", weight: 10 },
      ],
      gridCells: ["self-default", "self-judge"],
    },
    {
      id: 2,
      prompt:
        "A deliverable was due Friday. It's Monday and it's still not done — partly because the scope grew, partly because you underestimated the effort. Your manager asks for a status update. What do you say?",
      options: [
        { key: "A", text: "Avoid the conversation as long as possible.", weight: 1 },
        { key: "B", text: "\"I'm behind. I should have managed this better. I'll get it done ASAP.\"", weight: 2 },
        { key: "C", text: "\"The scope changed and I didn't flag it early enough. That's on me.\"", weight: 4 },
        { key: "D", text: "\"I underestimated the effort. Here's what's left and when I'll finish.\"", weight: 6 },
        { key: "E", text: "\"The scope grew beyond the original estimate. Here's what I've completed, what's remaining, and the revised timeline.\"", weight: 7 },
        { key: "F", text: "\"I missed the deadline. Here's why, here's what I've learned about my estimation patterns, and here's my adjusted plan.\"", weight: 8 },
        { key: "G", text: "\"I underestimated this. But the work done so far is solid. Let me walk you through where I am and what I need.\"", weight: 9 },
        { key: "H", text: "\"I'd rather deliver something excellent late than something mediocre on time. Here's the tradeoff I'm making and why.\"", weight: 5 },
      ],
      gridCells: ["self-default", "thinking-judge", "people-do"],
    },
    {
      id: 3,
      prompt:
        "A colleague who joined six months after you just got promoted. You've been working harder, longer hours, taking on more. You hear the news. What's your first reaction?",
      options: [
        { key: "A", text: "\"The system is broken. Politics wins over merit.\"", weight: 2 },
        { key: "B", text: "\"What's wrong with me that I keep getting passed over.\"", weight: 1 },
        { key: "C", text: "\"Good for them. But what am I missing?\"", weight: 5 },
        { key: "D", text: "\"I need to understand what they demonstrated that I haven't. Not to copy — to learn.\"", weight: 7 },
        { key: "E", text: "\"Their growth doesn't diminish mine. We're on different paths.\"", weight: 8 },
        { key: "F", text: "\"I'll ask my manager directly: what evidence do I need to demonstrate for the next level?\"", weight: 9 },
        { key: "G", text: "\"I'm glad someone on the team is growing. Let me see what I can learn from how they operate.\"", weight: 10 },
        { key: "H", text: "\"I should just keep my head down and work harder.\"", weight: 3 },
      ],
      gridCells: ["self-default", "people-default", "self-judge"],
    },
    {
      id: 4,
      prompt:
        "You're asked to lead a cross-functional initiative that's above your current level. You've never done this before. Your inner voice starts. What does it say?",
      options: [
        { key: "A", text: "\"I'm going to fail and everyone will see it.\"", weight: 1 },
        { key: "B", text: "\"Why did they pick me? There must be no one else available.\"", weight: 2 },
        { key: "C", text: "\"I'll say yes but keep a low profile so the stakes feel smaller.\"", weight: 3 },
        { key: "D", text: "\"I'll do it. If it doesn't work out, at least I tried.\"", weight: 5 },
        { key: "E", text: "\"I don't know how to do this yet. But I know how to figure things out.\"", weight: 7 },
        { key: "F", text: "\"They picked me because they've seen something. Let me trust that signal.\"", weight: 8 },
        { key: "G", text: "\"This is exactly the kind of thing I was afraid of six months ago. The fact that I'm considering it means I've already grown.\"", weight: 9 },
        { key: "H", text: "\"I'll map what I know vs. what I need, ask for specific support, and commit to a timeline.\"", weight: 10 },
      ],
      gridCells: ["self-default", "self-judge", "thinking-default"],
    },
    {
      id: 5,
      prompt:
        "Friday evening. Nothing went as planned this week. A proposal was rejected, a team conflict surfaced, and you dropped the ball on a commitment. You're sitting with it. What do you do?",
      options: [
        { key: "A", text: "Replay every failure in detail. Figure out exactly where you went wrong with each one.", weight: 2 },
        { key: "B", text: "Push it aside. Start fresh Monday. Don't look back.", weight: 3 },
        { key: "C", text: "Vent to someone. Get it off your chest.", weight: 4 },
        { key: "D", text: "Write down what happened and what you'd do differently. Close the notebook.", weight: 6 },
        { key: "E", text: "Separate what was in your control from what wasn't. Accept the second category.", weight: 7 },
        { key: "F", text: "Name one thing that took courage this week, even if it didn't work out.", weight: 8 },
        { key: "G", text: "\"Three things went wrong. But I showed up for all three. That's not nothing.\"", weight: 9 },
        { key: "H", text: "\"This week broke a few things open. Next week I'll be better resourced to handle them because now I've seen the shape of the problem.\"", weight: 10 },
      ],
      gridCells: ["self-default", "self-judge", "thinking-judge"],
    },
  ],
};
