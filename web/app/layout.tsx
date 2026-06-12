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
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
