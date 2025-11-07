import "./globals.css";

export const metadata = {
  title: "DevConnect",
  description: "Developer Social Feed",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}