import { forwardRef } from 'react';
import { TwitterProfile, TweetTheme, FrameFormat, FORMAT_DIMENSIONS } from './types';
import TweetPreview from './TweetPreview';

interface Props {
  profile: TwitterProfile;
  text: string;
  theme: TweetTheme;
  format: FrameFormat;
  scale: number;
}

const TwitterFrame = forwardRef<HTMLDivElement, Props>(
  ({ profile, text, theme, format, scale }, ref) => {
    const dims = FORMAT_DIMENSIONS[format];
    const isDark = theme === 'dark';

    // Render at a fixed internal size, scaled down for display via CSS
    const displayWidth = 400;
    const aspectRatio = dims.width / dims.height;
    const displayHeight = displayWidth / aspectRatio;

    return (
      <div style={{ width: displayWidth, margin: '0 auto' }}>
        {/* This is what we screenshot — full resolution */}
        <div
          ref={ref}
          style={{
            width: dims.width,
            height: dims.height,
            background: isDark ? '#000000' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            boxSizing: 'border-box',
            transform: `scale(${displayWidth / dims.width})`,
            transformOrigin: 'top left',
          }}
        >
          <div style={{ width: '100%', maxWidth: 600 }}>
            <TweetPreview profile={profile} text={text} theme={theme} scale={scale} />
          </div>
        </div>
        {/* Spacer to keep layout correct after transform scale */}
        <div style={{ height: displayHeight, marginTop: -dims.height * (displayWidth / dims.width) + displayHeight }} />
      </div>
    );
  }
);

TwitterFrame.displayName = 'TwitterFrame';
export default TwitterFrame;
