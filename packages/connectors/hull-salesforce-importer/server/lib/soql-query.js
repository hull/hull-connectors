// @flow
const _ = require("lodash");
const { parseQuery, composeQuery } = require("soql-parser-js");

const UNALIASABLE_FIELD_TYPES = ["Field", "FieldRelationship"];

class SoqlQuery {
  constructor(query) {
    this.query = query;
  }

  replaceNamedParameters(sql, values): string {
    return sql.replace(/:+(?!\d)(\w+)/g, (value, key) => values[key]);
  }

  getQuery(): string {
    return this.query;
  }

  getQueryObj(): Object {
    if (this.queryObj) {
      return this.queryObj;
    }

    const parsableQuery = this.getParsableQuery();
    this.queryObj = parseQuery(parsableQuery);
    return this.queryObj;
  }

  getValidQueryObj(): Object {
    const queryObj = _.cloneDeep(this.getQueryObj());
    const { fields = [] } = queryObj;
    _.forEach(fields, field => {
      const { type, alias } = field;
      if (!!alias && _.includes(UNALIASABLE_FIELD_TYPES, type)) {
        _.unset(field, "alias");
      }
    });

    return queryObj;
  }

  getParsableQuery(): string {
    return this.query.replace(/\sas\s/gi, " ").replace(/\//g, ".");
  }

  getExecutableQuery(): string {
    return composeQuery(this.getValidQueryObj());
  }

  getAttributeMapping(soqlField) {
    const { rawValue, field, alias } = soqlField;
    const hullFieldName = alias || field;
    const serviceFieldName = rawValue || field;
    return {
      hull: _.toLower(hullFieldName.replace(/\./g, "/")),
      service: _.toLower(serviceFieldName.replace(/\./g, "_"))
    };
  }

  getAttributeMappings() {
    const queryObj = _.cloneDeep(this.getQueryObj());
    const { fields: soqlFields } = queryObj;
    return _.reduce(
      soqlFields,
      (mappings, field) => {
        const { type, alias } = field;
        if (!!alias && _.includes(UNALIASABLE_FIELD_TYPES, type)) {
          mappings.push(this.getAttributeMapping(field));
        }
        return mappings;
      },
      []
    );
  }
}
exports.SoqlQuery = SoqlQuery;
