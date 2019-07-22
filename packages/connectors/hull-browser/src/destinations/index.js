import ga from "./google-analytics";

export default function handleDestinations(emitter) {
  emitter.on("user.update", update => {
    ga(update);
  });
}
