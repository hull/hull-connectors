import ready from "domready";
import { hot } from "react-hot-loader/root";
import ReactDOM from "react-dom";
import OutgoingUI from "./app";
import Engine from "./engine";

const renderApp = ({ empty, notFound, title }) => {
  const render = Component => {
    const root = document.getElementById("app");
    const engine = new Engine();
    ReactDOM.render(
      <Component
        engine={engine}
        strings={{
          leftColumnTitle: title,
          leftColumnPreview: empty,
          leftColumnEmpty: notFound
        }}
      />,
      root
    );
  };

  ready(() => render(hot(OutgoingUI)));
};

export default renderApp;
