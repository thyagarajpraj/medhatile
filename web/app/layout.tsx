import type { Metadata } from "next";
import "../src/index.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "MedhaTile - Memory Training Game",
  description: "A cognitive training web app for memory and focus using timed tile recall.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeScript = `
    (() => {
      try {
        const supportedThemes = ["neo-brutalist", "soft-minimal", "dark-focus", "playful-pastel", "glass-gradient"];
        const storedTheme = localStorage.getItem("medhatile_theme");
        const nextTheme = supportedThemes.includes(storedTheme || "") ? storedTheme : "neo-brutalist";
        document.documentElement.setAttribute("data-theme", nextTheme);
        document.documentElement.style.colorScheme = nextTheme === "dark-focus" ? "dark" : "light";
      } catch {
        document.documentElement.setAttribute("data-theme", "neo-brutalist");
        document.documentElement.style.colorScheme = "light";
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
