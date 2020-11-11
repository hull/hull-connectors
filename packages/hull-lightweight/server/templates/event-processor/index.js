import userUpdateHandler from "./user-update-handler";
import getEventsSchema from "./get-events-schema";

export { default as manifest } from "./manifest";
export const middlewares = [];
export const getHandlers = handler => ({
  subscriptions: {
    userUpdate: userUpdateHandler(handler)
  },
  json: {
    getEventsSchema
  }
});
