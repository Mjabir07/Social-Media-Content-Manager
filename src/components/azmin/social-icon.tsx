import type { ReactNode } from "react";

/**
 * Brand-colored channel logo tiles, used anywhere a social channel appears
 * (inbox, connections, publishing). Glyphs are simple inline SVG so there are no
 * external assets or CSP issues. Swap in official brand SVGs later if desired.
 */

export const SOCIAL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp", MESSENGER: "Messenger", INSTAGRAM: "Instagram", META_PAGE: "Facebook",
  FACEBOOK: "Facebook", LINKEDIN: "LinkedIn", YOUTUBE: "YouTube", EMAIL: "Email", TELEGRAM: "Telegram", WEBHOOK: "Webhook",
};

const BG: Record<string, string> = {
  WHATSAPP: "#25D366", MESSENGER: "#0084FF", META_PAGE: "#1877F2", FACEBOOK: "#1877F2",
  LINKEDIN: "#0A66C2", YOUTUBE: "#FF0000", EMAIL: "#EA4335", TELEGRAM: "#229ED9", WEBHOOK: "#FF4F00",
};

function glyph(channel: string): ReactNode {
  const w = "#fff";
  switch (channel) {
    case "WHATSAPP":
      return <path fill={w} d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3zm0 2a7 7 0 1 1-3.6 13l-.3-.2-2 .5.6-1.9-.2-.3A7 7 0 0 1 12 5zm-2.6 3.3c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.9 4.5 3.9 2.2.9 2.6.7 3.1.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3l-1.6-.8c-.2-.1-.4-.1-.6.1l-.6.8c-.1.2-.3.2-.5.1-.7-.3-1.4-.6-2-1.4-.5-.6-.8-1.2-.9-1.4-.1-.2 0-.3.1-.4l.4-.5c.1-.1.1-.3.2-.4 0-.1 0-.3-.1-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4z" />;
    case "MESSENGER":
      return <path fill={w} d="M12 4C7.3 4 4 7.5 4 11.8c0 2.4 1.1 4.5 2.9 5.9V21l2.7-1.5c.7.2 1.5.3 2.4.3 4.7 0 8-3.5 8-7.8S16.7 4 12 4zm.8 10.5-2-2.2-4 2.2 4.4-4.7 2 2.1 4-2.1-4.4 4.7z" />;
    case "INSTAGRAM":
      return <><rect x="6" y="6" width="12" height="12" rx="4" fill="none" stroke={w} strokeWidth="1.8" /><circle cx="12" cy="12" r="3" fill="none" stroke={w} strokeWidth="1.8" /><circle cx="15.6" cy="8.4" r="1" fill={w} /></>;
    case "META_PAGE":
    case "FACEBOOK":
      return <path fill={w} d="M13.5 21v-7h2.3l.4-2.7h-2.7V9.6c0-.8.3-1.3 1.4-1.3h1.4V5.9c-.7-.1-1.5-.2-2.2-.2-2.2 0-3.7 1.3-3.7 3.8v1.8H8v2.7h2.3V21h3.2z" />;
    case "LINKEDIN":
      return <path fill={w} d="M8.1 9.5H5.6V18h2.5V9.5zM6.8 5.8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM18.4 18h-2.5v-4.2c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7V18H10.7s0-7.6 0-8.5h2.5v1.2c.3-.5 1-1.3 2.3-1.3 1.7 0 2.9 1.1 2.9 3.4V18z" />;
    case "YOUTUBE":
      return <><rect x="4" y="7.5" width="16" height="9" rx="2.5" fill={w} /><polygon points="10.5,10 15,12 10.5,14" fill={BG.YOUTUBE} /></>;
    case "TELEGRAM":
      return <path fill={w} d="M20 5.5 3.8 11.4c-.8.3-.8 1.4 0 1.6l3.9 1.2 1.5 4.5c.2.6.9.7 1.3.3l2-2 3.6 2.7c.5.4 1.2.1 1.4-.5L21 6.5c.2-.7-.4-1.3-1-1zM9.3 13.8l7-4.4-5.6 5.1c-.2.2-.3.4-.3.7l-.2 2-.9-3.4z" />;
    case "EMAIL":
      return <><rect x="4" y="6.5" width="16" height="11" rx="2" fill="none" stroke={w} strokeWidth="1.8" /><path d="M5 8l7 5 7-5" fill="none" stroke={w} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
    case "WEBHOOK":
      return <path fill={w} d="M13 4 6 13h4l-1 7 7-9h-4l1-7z" />;
    default:
      return <circle cx="12" cy="12" r="4" fill={w} />;
  }
}

export function SocialIcon({ channel, size = 26, rounded = "0.6em" }: { channel: string; size?: number; rounded?: string }) {
  const bg = BG[channel] ?? "#94A3B8";
  const gradient = channel === "INSTAGRAM";
  return (
    <span className="grid shrink-0 place-items-center" style={{ width: size, height: size, borderRadius: rounded, background: gradient ? "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)" : bg }} title={SOCIAL_LABEL[channel] ?? channel}>
      <svg width={Math.round(size * 0.82)} height={Math.round(size * 0.82)} viewBox="0 0 24 24" aria-hidden>{glyph(channel)}</svg>
    </span>
  );
}
