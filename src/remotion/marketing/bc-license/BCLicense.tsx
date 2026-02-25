import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { VideoFormat } from "../ninety-days/shared/types";
import { OpeningHook } from "./OpeningHook";
import { Scene1Chaos } from "./Scene1Chaos";
import { Scene2Dashboard } from "./Scene2Dashboard";
import { Scene3Build } from "./Scene3Build";
import { Scene4Kanban } from "./Scene4Kanban";
import { Scene5Grind } from "./Scene5Grind";
import { Scene6Feed } from "./Scene6Feed";
import { Scene7Marketplace } from "./Scene7Marketplace";
import { Scene8Victory } from "./Scene8Victory";
import { Scene9Profile } from "./Scene9Profile";
import { Scene10CTA } from "./Scene10CTA";

interface BCLicenseProps {
  format: VideoFormat;
}

/*
 * Scene timeline (60s = 1800 frames @ 30fps):
 *
 *  Opening Hook:      0s –  4s   (frames    0 –  120)
 *  Scene 1 Chaos:     4s –  6.5s (frames  120 –  195)
 *  Scene 2 Dashboard: 6.5s– 12s  (frames  195 –  360)
 *  Scene 3 Build:    12s – 22s   (frames  360 –  660)
 *  Scene 4 Kanban:   22s – 25s   (frames  660 –  750)
 *  Scene 5 Grind:    25s – 33s   (frames  750 –  990)
 *  Scene 6 Feed:     33s – 38s   (frames  990 – 1140)
 *  Scene 7 Market:   38s – 42s   (frames 1140 – 1260)
 *  Scene 8 Victory:  42s – 50s   (frames 1260 – 1500)
 *  Scene 9 Profile:  50s – 53.5s (frames 1500 – 1605)
 *  Scene 10 CTA:     53.5s– 60s  (frames 1605 – 1800)
 */

export const BCLicense: React.FC<BCLicenseProps> = ({ format }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Sequence from={0} durationInFrames={120}>
        <OpeningHook format={format} />
      </Sequence>

      <Sequence from={120} durationInFrames={75}>
        <Scene1Chaos format={format} />
      </Sequence>

      <Sequence from={195} durationInFrames={165}>
        <Scene2Dashboard format={format} />
      </Sequence>

      <Sequence from={360} durationInFrames={300}>
        <Scene3Build format={format} />
      </Sequence>

      <Sequence from={660} durationInFrames={90}>
        <Scene4Kanban format={format} />
      </Sequence>

      <Sequence from={750} durationInFrames={240}>
        <Scene5Grind format={format} />
      </Sequence>

      <Sequence from={990} durationInFrames={150}>
        <Scene6Feed format={format} />
      </Sequence>

      <Sequence from={1140} durationInFrames={120}>
        <Scene7Marketplace format={format} />
      </Sequence>

      <Sequence from={1260} durationInFrames={240}>
        <Scene8Victory format={format} />
      </Sequence>

      <Sequence from={1500} durationInFrames={105}>
        <Scene9Profile format={format} />
      </Sequence>

      <Sequence from={1605} durationInFrames={195}>
        <Scene10CTA format={format} />
      </Sequence>
    </AbsoluteFill>
  );
};
