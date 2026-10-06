import "./globals.css";

export const metadata = {
  title: "Aquora — Smart Borewell Management",
  description: "Farmer-friendly borewell, water, telemetry and ML dashboard."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
