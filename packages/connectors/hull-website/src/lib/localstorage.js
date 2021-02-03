export function getLocalStorage() {
  if (typeof Storage !== "undefined") {
    const response = JSON.parse(window.localStorage.getItem("hull_browser"));
    return response;
  }
  return {};
}
export function getLocalStorageId() {
  const response = getLocalStorage();
  const id = response?.user?.id;
  return id ? { id } : undefined;
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
