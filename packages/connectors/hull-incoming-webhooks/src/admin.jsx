import ready from "domready";
import { hot } from "react-hot-loader/root";
import ReactDOM from "react-dom";
import Engine from "./app/engine";
import App from "./app";

const render = Component => {
  const root = document.getElementById("app");
  const engine = new Engine();
  ReactDOM.render(
    <Component
      engine={engine}
      strings={{
        modalTitle: "Configure your incoming webhook",
        leftColumnTitle: "Recent",
        centerColumnCurrentTab: "Current Code",
        centerColumnPreviousTab: "At Webhook Reception"
      }}
    />,
    root
  );
};

ready(() => render(hot(App)));
