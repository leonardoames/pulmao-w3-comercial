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

    // Display scaling: fit the canvas into ~400px wide preview
    const displayScale = 400 / dims.width;

    return (
      <div style={{ width: 400, margin: '0 auto' }}>
        {/* CANVAS — export target, fixed output dimensions, NO scale */}
        <div
          ref={ref}
          style={{
            width: dims.width,
            height: dims.height,
            background: isDark ? '#000000' : '#ffffff',
            transform: `scale(${displayScale})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
          }}
        >
          {/* STAGE — centering container */}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* TWEET BASE — real tweet layout, scale slider applies HERE only */}
            <div
              style={{
                width: 550,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
              }}
            >
              <TweetPreview profile={profile} text={text} theme={theme} scale={1} />
            </div>
          </div>
        </div>
        {/* Spacer for correct layout after CSS transform */}
        <div style={{ height: dims.height * displayScale }} />
      </div>
    );
  }
);

TwitterFrame.displayName = 'TwitterFrame';
export default TwitterFrame;
