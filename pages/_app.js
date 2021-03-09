import "../styles/globals.css";
import "../styles/toastify.css";
import "../styles/vjs-lime.css";

// fix font awesome icons flashing huge
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default App;
