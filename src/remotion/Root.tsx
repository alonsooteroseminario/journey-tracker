import React from "react";
import { Composition } from "remotion";
import { GoalProgressVideo } from "./GoalProgressVideo";
import { StreakMilestoneVideo } from "./StreakMilestoneVideo";
import { ExamplePromo } from "./marketing/ExamplePromo";
import { HeroOverview } from "./marketing/HeroOverview";
import { StreakStory } from "./marketing/StreakStory";
import { AIAgent } from "./marketing/AIAgent";
import { UserJourney } from "./marketing/UserJourney";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="goal-progress"
        component={GoalProgressVideo as any}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          goalTitle: "Learn TypeScript",
          progress: 75,
          tasksCompleted: 15,
          totalTasks: 20,
          userName: "John Doe",
        }}
      />
      <Composition
        id="streak-milestone"
        component={StreakMilestoneVideo as any}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          userName: "John Doe",
          streakCount: 30,
          milestone: 30,
        }}
      />
      {/* Marketing compositions — landscape */}
      <Composition
        id="example-promo-landscape"
        component={ExamplePromo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          headline: "Track Your Goals",
          subtext: "The journey of a thousand miles begins with a single step.",
          format: "landscape" as const,
        }}
      />
      {/* Marketing compositions — square */}
      <Composition
        id="example-promo-square"
        component={ExamplePromo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          headline: "Track Your Goals",
          subtext: "The journey of a thousand miles begins with a single step.",
          format: "square" as const,
        }}
      />
      {/* Marketing compositions — vertical (Stories/Reels) */}
      <Composition
        id="example-promo-vertical"
        component={ExamplePromo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          headline: "Track Your Goals",
          subtext: "The journey of a thousand miles begins with a single step.",
          format: "vertical" as const,
        }}
      />

      {/* HeroOverview — Product overview promo */}
      <Composition
        id="hero-overview-landscape"
        component={HeroOverview}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ format: "landscape" as const }}
      />
      <Composition
        id="hero-overview-square"
        component={HeroOverview}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ format: "square" as const }}
      />
      <Composition
        id="hero-overview-vertical"
        component={HeroOverview}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ format: "vertical" as const }}
      />

      {/* StreakStory — Streak emotional journey */}
      <Composition
        id="streak-story-landscape"
        component={StreakStory}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ format: "landscape" as const }}
      />
      <Composition
        id="streak-story-square"
        component={StreakStory}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ format: "square" as const }}
      />
      <Composition
        id="streak-story-vertical"
        component={StreakStory}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ format: "vertical" as const }}
      />

      {/* AIAgent — AI feature highlight */}
      <Composition
        id="ai-agent-landscape"
        component={AIAgent}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ format: "landscape" as const }}
      />
      <Composition
        id="ai-agent-square"
        component={AIAgent}
        durationInFrames={270}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ format: "square" as const }}
      />
      <Composition
        id="ai-agent-vertical"
        component={AIAgent}
        durationInFrames={270}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ format: "vertical" as const }}
      />

      {/* UserJourney — Alex's story */}
      <Composition
        id="user-journey-landscape"
        component={UserJourney}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ format: "landscape" as const }}
      />
      <Composition
        id="user-journey-square"
        component={UserJourney}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ format: "square" as const }}
      />
      <Composition
        id="user-journey-vertical"
        component={UserJourney}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ format: "vertical" as const }}
      />
    </>
  );
};
