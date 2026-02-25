import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { VideoFormat } from "./shared/types";
import { OpeningHook } from "./OpeningHook";
import { Scene1Landing } from "./Scene1Landing";
import { Scene2Dashboard } from "./Scene2Dashboard";
import { Scene3Build } from "./Scene3Build";
import { Scene4Kanban } from "./Scene4Kanban";
import { Scene5Feed } from "./Scene5Feed";
import { Scene6Marketplace } from "./Scene6Marketplace";
import { Scene7Profile } from "./Scene7Profile";
import { Scene8CompletedBoard } from "./Scene8CompletedBoard";
import { Scene9CTA } from "./Scene9CTA";

interface NinetyDaysProps {
  format: VideoFormat;
}

/*
 * Scene timeline (60s = 1800 frames @ 30fps):
 *
 *  Opening Hook:    0s -  3s  (frames    0 -   90)
 *  Scene 1 Landing: 3s -  7s  (frames   90 -  210)
 *  Scene 2 Dash:    7s - 12s  (frames  210 -  360)
 *  Scene 3 Build:  12s - 20s  (frames  360 -  600)
 *  Scene 4 Kanban: 20s - 28s  (frames  600 -  840)
 *  Scene 5 Feed:   28s - 34s  (frames  840 - 1020)
 *  Scene 6 Market: 34s - 40s  (frames 1020 - 1200)
 *  Scene 7 Profile:40s - 48s  (frames 1200 - 1440)
 *  Scene 8 Board:  48s - 54s  (frames 1440 - 1620)
 *  Scene 9 CTA:    54s - 60s  (frames 1620 - 1800)
 */

export const NinetyDays: React.FC<NinetyDaysProps> = ({ format }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Opening Hook: 0s - 3s */}
      <Sequence from={0} durationInFrames={90}>
        <OpeningHook format={format} />
      </Sequence>

      {/* Scene 1: Landing Page — 3s - 7s */}
      <Sequence from={90} durationInFrames={120}>
        <Scene1Landing format={format} />
      </Sequence>

      {/* Scene 2: Empty Dashboard + AI Awakens — 7s - 12s */}
      <Sequence from={210} durationInFrames={150}>
        <Scene2Dashboard format={format} />
      </Sequence>

      {/* Scene 3: THE BUILD — 12s - 20s */}
      <Sequence from={360} durationInFrames={240}>
        <Scene3Build format={format} />
      </Sequence>

      {/* Scene 4: Kanban Board Montage — 20s - 28s */}
      <Sequence from={600} durationInFrames={240}>
        <Scene4Kanban format={format} />
      </Sequence>

      {/* Scene 5: Activity Feed — 28s - 34s */}
      <Sequence from={840} durationInFrames={180}>
        <Scene5Feed format={format} />
      </Sequence>

      {/* Scene 6: Template Marketplace — 34s - 40s */}
      <Sequence from={1020} durationInFrames={180}>
        <Scene6Marketplace format={format} />
      </Sequence>

      {/* Scene 7: Profile + Heatmap — 40s - 48s */}
      <Sequence from={1200} durationInFrames={240}>
        <Scene7Profile format={format} />
      </Sequence>

      {/* Scene 8: Completed Board — 48s - 54s */}
      <Sequence from={1440} durationInFrames={180}>
        <Scene8CompletedBoard format={format} />
      </Sequence>

      {/* Scene 9: CTA — 54s - 60s */}
      <Sequence from={1620} durationInFrames={180}>
        <Scene9CTA format={format} />
      </Sequence>
    </AbsoluteFill>
  );
};
