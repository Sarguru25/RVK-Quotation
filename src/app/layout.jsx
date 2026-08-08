import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Providers from "./providers";

export const metadata = {
  title: "Quotation Manager",
  description: "Lightweight quotation system with Zoho sync",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}