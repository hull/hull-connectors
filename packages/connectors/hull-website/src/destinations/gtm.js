// @flow
// global dataLayer
import type { PublicUpdate } from "../../types";

// https://developers.google.com/tag-manager/devguide
// https://developers.google.com/tag-manager/reference#reference
const gtm = ({ user, events }: PublicUpdate) => {
  if (window.dataLayer) {
    window.dataLayer.push(user);
    events.map(event => window.dataLayer.push({ event }));
  }
};
export default gtm;
