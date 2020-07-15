/* @flow */
import parseDomain from "parse-domain";
import _ from "lodash";

/**
 * @param  {String} domain
 * @return {String}
 */
export function normalize(domain: string = ""): string {
  let parsedDomain;
  let normalizedDomain;

  // remove spaces
  domain = domain.replace(" ", "");
  domain = _.trim(domain, ",;");

  try {
    // if we have "," or ";" inside the string,
    // that's surely not a valid domain name,
    // let's give it a chance and treat that as a list
    // of domains/urls with separators
    if (domain.includes(",")) {
      parsedDomain = domain.split(",")[0];
    } else if (domain.includes(";")) {
      parsedDomain = domain.split(";")[0];
    }
  } finally {
    if (!parsedDomain) {
      parsedDomain = domain;
    }
  }

  try {
    const parsed = parseDomain(parsedDomain);
    normalizedDomain = `${parsed.domain}.${parsed.tld}`;
  } catch (e) {
    normalizedDomain = domain;
  }

  return normalizedDomain;
}

/**
 * @param  {String} domain
 * @return {Boolean}
 */
export function verify(domain: string): boolean {
  return /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/.test(
    domain
  );
}
