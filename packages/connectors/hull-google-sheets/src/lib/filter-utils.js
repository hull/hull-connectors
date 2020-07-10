// @flow
import _ from "lodash";
import hasInvalidCharacters from "./has-invalid-characters";
import type { AttributeMapping, ClaimsType } from "../../types";

const filterSource = (source?: string) => (a: string): boolean =>
  source ? a.indexOf(`${source}/`) === 0 : true;

const filterSources = (source?: string, attributes: Array<string>) =>
  attributes.filter(filterSource(source));

const removeSource = (source?: string) => (a: string): string =>
  source ? a.replace(new RegExp(`^${source}/`), "") : a;

const removeSources = (
  source?: string,
  attributes: Array<string>
): Array<string> =>
  source ? attributes.map(removeSource(source)) : attributes;

export const filterMapping = (
  source?: string,
  mapping: AttributeMapping
): AttributeMapping => {
  if (!source) {
    return mapping;
  }
  const remove = removeSource(source);
  return mapping.map(({ hull, column }) => ({
    hull: remove(hull),
    column
  }));
};

export const addSource = (source?: string, attribute: string) =>
  source ? `${source}/${attribute}` : attribute;

export const filterAttributes = (source?: string, attributes: Array<string>) =>
  removeSources(source, filterSources(source, attributes));

export const toOptions = (value: string) => ({ value, label: value });

export const isOptionDisabled = (mapping: AttributeMapping) => ({
  value
}: {
  value: string
}): boolean => !!_.some(mapping, { hull: value });

export const validationErrors = ({ hull }) => {
  if (!hull) return ["Attribute is empty"];
  return hasInvalidCharacters(hull);
};

export const validateMapping = (mapping: AttributeMapping) =>
  _.compact(_.map(mapping, validationErrors));

export const isValidMapping = (mapping: AttributeMapping) =>
  _.flattenDeep(validateMapping(mapping) || []).length === 0;

export const isValidClaims = (claims: ClaimsType) => _.some(claims, v => !!v);
