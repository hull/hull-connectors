(function onEmbedWrapper() {
  // you can use async/await
  async function testAsync() {
    await Promise.resolve();
  }
  testAsync();

  if (window.Hull) {
    // you can use object spread syntax
    const a = { a: 1 };
    const b = { b: 2 };
    const c = { ...a, ...b, c: 3 };

    Hull.onEmbed(function onEmbed(rootNode, deployment, hull) {
      window.c = c;
      window.hull = hull;
      console.log("test");
    });
  }
})();
