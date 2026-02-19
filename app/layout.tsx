import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://www.fakesheets.douglasluz.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Fakesheets — Fake Spreadsheet Generator",
    template: "%s | Fakesheets",
  },
  description:
    "Generate fake CSV and XLSX spreadsheets with up to 1,000,000 rows of realistic data. Powered by Faker.js — 100% client-side, no data leaves your browser.",
  keywords: [
    "fake data generator",
    "mock csv generator",
    "test data generator",
    "dummy data generator",
    "faker js online",
    "seed data generator",
    "bulk data generator",
    "csv test data",
    "xlsx fake data",
    "random data generator",
    "sample data generator",
    "mock spreadsheet",
    "fake spreadsheet generator",
    "developer tools",
    "QA test data",
  ],
  authors: [{ name: "Douglas Luz", url: BASE_URL }],
  creator: "Douglas Luz",
  publisher: "Douglas Luz",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    title: "Fakesheets — Fake Spreadsheet Generator",
    description:
      "Generate fake CSV and XLSX spreadsheets with up to 1,000,000 rows of realistic data. Powered by Faker.js — 100% client-side, no data leaves your browser.",
    locale: "en_US",
    siteName: "Fakesheets",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Fakesheets — Fake Spreadsheet Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fakesheets — Fake Spreadsheet Generator",
    description:
      "Generate fake CSV and XLSX spreadsheets with up to 1,000,000 rows of realistic data. 100% client-side.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Fakesheets",
  url: BASE_URL,
  description:
    "Generate fake CSV and XLSX spreadsheets with up to 1,000,000 rows of realistic data. Powered by Faker.js — 100% client-side, no data leaves your browser.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Generate up to 1,000,000 rows of fake data",
    "Export as CSV or XLSX",
    "12 column types powered by Faker.js",
    "Shareable URLs with reproducible seeds",
    "100% client-side — no data leaves your browser",
    "Multi-language support (English, Português)",
  ],
  screenshot: `${BASE_URL}/opengraph-image`,
  creator: {
    "@type": "Person",
    name: "Douglas Luz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
