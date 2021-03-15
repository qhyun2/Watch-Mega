import React from "react";
import type { AppProps } from "next/app";

import "../styles/globals.css";
import "../styles/toastify.css";
import "../styles/vjs-lime.css";

// fix font awesome icons flashing huge
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

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
    },
  },
  typography: {
    button: {
      textTransform: "none",
    },
  },
});

function App({ Component, pageProps }: AppProps) {
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
