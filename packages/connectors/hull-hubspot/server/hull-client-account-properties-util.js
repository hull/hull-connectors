// @flow
import type { HullProperties, HullContext } from "hull";

const _ = require("lodash");

type HullPropertiesRawResponseTreeItemChild = {
  id: string,
  text: string,
  type: string
};

type HullPropertiesRawResponseTreeItem = {
  text: string,
  children: Array<HullPropertiesRawResponseTreeItemChild>
};

type HullPropertiesRawResponse = {
  version: string,
  tree: Array<HullPropertiesRawResponseTreeItem>
};

function getProperties(
  raw: HullPropertiesRawResponse | HullPropertiesRawResponseTreeItem,
  path?: Array<string>,
  id_path?: Array<string>
): {
  properties: HullProperties,
  tree: Array<*>
} {
  const properties = {};
  const tree = [];

  _.each(raw, props => {
    const title = props.text || props.name;
    const key = props.id || props.key;
    const node = {
      ...props,
      id_path,
      path,
      title,
      key
    };

    if (key) {
      properties[key] = node;
    } else if (node.children) {
      const path_id =
        node.ship_id ||
        node.app_id ||
        node.platform_id ||
        node.resource_id ||
        title;

      const lpath = (path || []).concat([title]);
      const ipath = (id_path || []).concat([path_id]);
      const result = getProperties(node.children, lpath, ipath);
      node.children = result.tree;
      Object.assign(properties, result.properties);
    }

    tree.push(node);
  });

  return { properties, tree };
}

/**
 * Fetches and returns all existing properties in the organization along with their metadata
 * @public
 * @memberof Utils
 * @method   properties.get
 * @return   {Promise<Object>}
 */
function get({
  client
}: {
  client: $PropertyType<HullContext, "client">
}): Promise<HullProperties> {
  return client
    .get("search/account_reports/bootstrap")
    .then(({ tree }) => getProperties(tree).properties);
}

module.exports = get;
