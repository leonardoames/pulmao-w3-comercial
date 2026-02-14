export interface TwitterProfile {
  name: string;
  handle: string;
  avatarUrl: string;
}

export interface TweetSlide {
  id: string;
  text: string;
}

export type TweetTheme = 'light' | 'dark';
export type FrameFormat = '1:1' | '4:5' | '9:16';

export const FORMAT_DIMENSIONS: Record<FrameFormat, { width: number; height: number }> = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
};
