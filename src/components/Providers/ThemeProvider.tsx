"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ComponentProps } from "react";
import { Toaster } from "../shadcnui/toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  return (
    <NextThemesProvider {...props}>
      {children}

      <Toaster timeout={2000} />
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="zips-toast"
      />
    </NextThemesProvider>
  );
};

export default ThemeProvider;
