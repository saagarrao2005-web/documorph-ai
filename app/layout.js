export const metadata = {
  title: 'DocuMorph AI',
  description: 'File conversion made easy',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}