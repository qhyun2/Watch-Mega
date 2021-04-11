import React from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

import "../styles/toastify.css";
import "../styles/vjs-lime.css";
import "../styles/loadingbar.css";

// loading bar
import { useRouter } from "next/router";
import NProgress from "nprogress";

const theme = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#680e8b",
    },
    secondary: {
      main: "#34a3a3",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.7)",
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

function App({ Component, pageProps }: AppProps): JSX.Element {
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
    jssStyles?.parentElement?.removeChild(jssStyles);
  }, []);
  return (
    <React.Fragment>
      <Head>
        <title>Watch Mega</title>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </React.Fragment>
  );
}

export default App;
