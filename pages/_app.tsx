import React from "react";
import type { AppProps } from "next/app";

import "../styles/globals.css";
import "../styles/toastify.css";
import "../styles/vjs-lime.css";

// fix font awesome icons flashing huge
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

// loading bar
import { useRouter } from "next/router";
import NProgress from "nprogress";

import CssBaseline from "@material-ui/core/CssBaseline";
import { createMuiTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/core/styles";

const theme = createMuiTheme({
  palette: {
    type: "dark",
    text: {
      primary: "#FFFFFF",
      secondary: "#34a3a3",
    },
    primary: {
      main: "#680e8b",
    },
    secondary: {
      main: "#680e8b",
    },
    background: {
      default: "#212529",
      paper: "#353535",
    },
  },
  typography: {
    button: {
      textTransform: "none",
    },
  },
});

function App({ Component, pageProps }: AppProps) {
  // loading bar
  NProgress.configure({ trickleSpeed: 50 });
  NProgress.configure({ showSpinner: false });

  const router = useRouter();
  React.useEffect(() => {
    const routeChangeStart = () => NProgress.start();
    const routeChangeComplete = () => NProgress.done();

    router.events.on("routeChangeStart", routeChangeStart);
    router.events.on("routeChangeComplete", routeChangeComplete);
    router.events.on("routeChangeError", routeChangeComplete);
    return () => {
      router.events.off("routeChangeStart", routeChangeStart);
      router.events.off("routeChangeComplete", routeChangeComplete);
      router.events.off("routeChangeError", routeChangeComplete);
    };
  }, []);

  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default App;
