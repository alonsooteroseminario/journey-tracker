import React from "react";
import { Composition } from "remotion";
import { GoalProgressVideo } from "./GoalProgressVideo";
import { StreakMilestoneVideo } from "./StreakMilestoneVideo";
import { ExamplePromo } from "./marketing/ExamplePromo";

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
    </>
  );
};
