/* global window, */

import { Promise } from "es6-promise";

export function getLocalStorage() {
  return new Promise(function getId(resolve) {
    if (typeof Storage !== "undefined") {
      const response = JSON.parse(window.localStorage.getItem("hull_browser"));
      if (!response) return resolve({});
      return resolve(response);
    }
    return resolve({});
  });
}
export function getLocalStorageId(){
  const response = getLocalStorage();
  return response && response.user && response.user.id;
}

export function setLocalStorage(value) {
  if (typeof Storage !== "undefined") {
    window.localStorage.setItem("hull_browser", JSON.stringify(value));
  }
}

export function deleteLocalStorage() {
  if (typeof Storage !== "undefined") {
    window.localStorage.setItem("hull_browser", undefined);
  }
}
