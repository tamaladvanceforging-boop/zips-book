import ThemeProvider from "@/components/Providers/ThemeProvider";
import { geistMono, geistSans, interHeading } from "@/lib/fonts";
import { LayoutProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/Layout/AppLayout";
import "./globals.css";

export const metadata = {
  title: "ZIPS-Book | Tally-Style GST Billing & Accounting ERP",
  description:
    "Enterprise-grade modern classic GST billing, invoicing, double-entry bookkeeping and accounting system",
};

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        interHeading.variable
      )}
      suppressHydrationWarning
    >
      <body className="overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
