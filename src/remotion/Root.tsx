import React from "react";
import { Composition } from "remotion";
import { GoalProgressVideo } from "./GoalProgressVideo";
import { StreakMilestoneVideo } from "./StreakMilestoneVideo";

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
    </>
  );
};
