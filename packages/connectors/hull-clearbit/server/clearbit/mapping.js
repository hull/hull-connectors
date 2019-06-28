import _ from "lodash";
import ObjectMapper from "object-mapper";
import Mappings from "../mappings";

function getMapping(key) {
  return Mappings[key];
  // return {
  //   ...Mappings.Company,
  //   ...
  // };
}

// const setIfNull = value => ({ operation: "setIfNull", value });

const getTraits = mapping => entity =>
  _.omitBy(ObjectMapper(entity, {}, mapping), _.isNil);

export const getAccountTraitsFromCompany = company =>
  getTraits(Mappings.Company)(company);

/**
 * Builds the list of traits to apply on the user
 * from data pulled from Clearbit
 * @param  {Object({ user, person })} payload - Hull/User and Clearbit/Person objects
 * @param  {mappings} mappings - mappings to user
 * @return {Object}
 */
export function getUserTraitsFrom(entity, mappingName) {
  return getTraits(getMapping(mappingName))(entity);
}
