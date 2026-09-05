"use client";

export default function GlobalStyles() {
    return (
        <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Space+Grotesk:wght@500;700&display=swap");

      :root {
        --bg-paper: #fcfaf6;
        --bg-card: #ffffff;
        --bg-bento: #f5f2eb;
        --text-main: #1e293b;
        --text-muted: #64748b;
        --border-color: #e2e8f0;
        --accent-primary: #ff5a36;
        --accent-secondary: #0ea5e9;
        --accent-tertiary: #10b981;
        --accent-gold: #f59e0b;
        --washi-teal: rgba(45, 212, 191, 0.75);
        --washi-coral: rgba(255, 113, 91, 0.75);
        --washi-yellow: rgba(251, 191, 36, 0.75);
        --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        --shadow-float: 0 20px 25px -5px rgba(0, 0, 0, 0.08),
          0 8px 10px -6px rgba(0, 0, 0, 0.04);
      }

      .theme-night {
        --bg-paper: #0f172a;
        --bg-card: #1e293b;
        --bg-bento: #162032;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --border-color: #334155;
        --accent-primary: #ff6b4a;
        --accent-secondary: #38bdf8;
        --washi-teal: rgba(20, 184, 166, 0.65);
        --washi-coral: rgba(244, 63, 94, 0.65);
        --washi-yellow: rgba(245, 158, 11, 0.65);
        --shadow-float: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      }

      body {
        background-color: var(--bg-paper);
        color: var(--text-main);
        font-family: "Plus Jakarta Sans", sans-serif;
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      /* Dot Grid Paper Texture */
      .paper-grid {
        background-image: radial-gradient(
          var(--border-color) 1px,
          transparent 1px
        );
        background-size: 24px 24px;
      }

      .font-hand {
        font-family: "Caveat", cursive;
      }
      .font-display {
        font-family: "Space Grotesk", sans-serif;
      }

      /* Custom Scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: var(--text-muted);
        border-radius: 99px;
        opacity: 0.5;
      }

      /* Washi Tape Effect */
      .washi-tape {
        position: absolute;
        height: 22px;
        background-color: var(--washi-color, var(--washi-teal));
        opacity: 0.85;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(2px);
      }
      .washi-tape::after {
        content: "";
        position: absolute;
        left: -6px;
        right: -6px;
        top: 0;
        bottom: 0;
        background: inherit;
        clip-path: polygon(
          0% 0%, 5% 10%, 0% 20%, 5% 30%, 0% 40%, 5% 50%, 0% 60%, 5% 70%, 0% 80%, 5% 90%, 0% 100%,
          100% 100%, 95% 90%, 100% 80%, 95% 70%, 100% 60%, 95% 50%, 100% 40%, 95% 30%, 100% 20%, 95% 10%, 100% 0%
        );
      }
    `}</style>
    );
}