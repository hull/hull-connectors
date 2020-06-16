const _ = require("lodash");

function toXML(name, value) {
  if (_.isObject(name)) {
    value = name;
    name = null;
  }
  if (_.isArray(value)) {
    return _.map(value, function (v) { return toXML(name, v); }).join(""); // eslint-disable-line
  }
  const attrs = [];
  const elems = [];
  if (_.isObject(value)) {
    for (let k in value) { // eslint-disable-line
      const v = value[k];
      if (k[0] === "@") {
        k = k.substring(1);
        attrs.push(`${k}="${v}"`);
      } else {
        elems.push(toXML(k, v));
      }
    }
    value = elems.join("");
  } else {
    value = String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
  const startTag = name ? `<${name}${attrs.length > 0 ? " " + attrs.join(" ") : ""}>` : ""; // eslint-disable-line
  const endTag = name ? `</${name}>` : "";
  return startTag + value + endTag;
}

module.exports = (responseName, responseBody) => {
  return `<?xml version="1.0" encoding="utf-8"?>
          <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                            xmlns="urn:partner.soap.sforce.com">
            <soapenv:Body>
              ${toXML(responseName, responseBody)}
            </soapenv:Body>
          </soapenv:Envelope>`;
};
