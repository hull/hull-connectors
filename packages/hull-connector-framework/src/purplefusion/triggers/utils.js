/* @flow */

function getStandardAttributeName(attributeName): string {
  if (/\[\d+\]$/.test(attributeName)) {
    return attributeName.substr(0, attributeName.lastIndexOf("["));
  }

  return attributeName;
}

module.exports = {
  getStandardAttributeName
};
