const req = async (z, { url, body, method = "POST" }) => {
  const response = await z.request({
    url,
    body,
    method
  });
  return response.json;
};

const post = async (z, opts) => req(z, { method: "POST", ...opts });
const del = async (z, opts) => req(z, { method: "DELETE", ...opts });
const get = async (z, opts) => req(z, { method: "POST", ...opts });

module.exports = {
  post,
  del,
  get
};
