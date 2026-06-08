import type { Metadata } from "next";
import React from "react";

import Providers from "../providers";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Cheffelo take-home test",
};

type Props = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: Props) => {
  return (
    <html lang="en">
      <body className="max-w-screen-lg mx-auto">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
