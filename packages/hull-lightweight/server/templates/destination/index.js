import userUpdateHandler from "./user-update-handler";

export { default as manifest } from "./manifest";
export const middlewares = [];
export const getHandlers = handler => ({
  subscriptions: {
    userUpdate: userUpdateHandler(handler)
  }
});
