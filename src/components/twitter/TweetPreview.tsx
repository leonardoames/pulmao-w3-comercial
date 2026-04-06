import { useRef, useEffect, forwardRef } from 'react';
import DOMPurify from 'dompurify';
import { TwitterProfile, TweetTheme } from './types';

interface TweetPreviewProps {
  profile: TwitterProfile;
  text: string;
  theme: TweetTheme;
  scale: number;
}

function parseEmojis(text: string): string {
  if (typeof (window as any).twemoji !== 'undefined') {
    return (window as any).twemoji.parse(text, {
      folder: 'svg',
      ext: '.svg',
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
    });
  }
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const TweetPreview = forwardRef<HTMLDivElement, TweetPreviewProps>(
  ({ profile, text, theme, scale }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (contentRef.current) {
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const parsed = parseEmojis(escaped);
        const sanitized = DOMPurify.sanitize(parsed, {
          ALLOWED_TAGS: ['img', 'span'],
          ALLOWED_ATTR: ['src', 'alt', 'class', 'draggable', 'style'],
        });
        contentRef.current.innerHTML = sanitized;
      }
    }, [text]);

    const isDark = theme === 'dark';
    const bg = isDark ? '#000000' : '#ffffff';
    const textColor = isDark ? '#e7e9ea' : '#0f1419';
    const secondaryColor = isDark ? '#71767b' : '#536471';

    const tweetFontFamily = `'Chirp', system-ui, -apple-system, 'Segoe UI', Roboto, 'Inter', Arial, sans-serif`;

    return (
      <div
        ref={ref}
        style={{
          background: bg,
          padding: `${24 * scale}px`,
          borderRadius: 0,
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: tweetFontFamily,
        }}
      >
        <div style={{ display: 'flex', gap: `${12 * scale}px` }}>
          {/* Avatar */}
          <div
            style={{
              width: `${48 * scale}px`,
              height: `${48 * scale}px`,
              borderRadius: '50%',
              background: isDark ? '#333639' : '#cfd9de',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {profile.avatarUrl && (
              <img
                src={profile.avatarUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                crossOrigin="anonymous"
              />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: `${4 * scale}px`, lineHeight: `${20 * scale}px` }}>
              <span style={{ fontWeight: 700, fontSize: `${15 * scale}px`, color: textColor }}>
                {profile.name}
              </span>
              <span style={{ fontSize: `${15 * scale}px`, color: secondaryColor }}>
                {profile.handle}
              </span>
            </div>

            {/* Body */}
            <div
              ref={contentRef}
              style={{
                fontSize: `${15 * scale}px`,
                lineHeight: `${20 * scale}px`,
                color: textColor,
                marginTop: `${4 * scale}px`,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

TweetPreview.displayName = 'TweetPreview';
export default TweetPreview;
