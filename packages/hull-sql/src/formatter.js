const formatter = value =>
  typeof value === "object" && value !== null
    ? `<pre style='min-width:200px'><code>${JSON.stringify(value)}</code></pre>`
    : value;

export default formatter;
