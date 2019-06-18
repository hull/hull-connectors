// @flow
export type HullElasticContext = {
  browser_major?: string,
  browser_name?: string,
  browser_version?: string,
  campaign_content?: string,
  campaign_medium?: string,
  campaign_name?: string,
  campaign_source?: string,
  campaign_term?: string,
  device_name?: string,
  ip?: string,
  location_city?: string,
  location_country?: string,
  location_countryname?: string,
  location_latitude?: string,
  location_longitude?: string,
  location_region?: string,
  location_regionname?: string,
  location_timezone?: string,
  location_zipcode?: string,
  os_name?: string,
  os_version?: string,
  page_host?: string,
  page_path?: string,
  page_url?: string,
  referrer_host?: string,
  referrer_path?: string,
  referrer_url?: string,
  useragent?: string
};

const unflatify = ({
  browser_major,
  browser_name,
  browser_version,
  campaign_content,
  campaign_medium,
  campaign_name,
  campaign_source,
  campaign_term,
  device_name,
  ip,
  location_city,
  location_country,
  location_countryname,
  location_latitude,
  location_longitude,
  location_region,
  location_regionname,
  location_timezone,
  location_zipcode,
  os_name,
  os_version,
  page_host,
  page_path,
  page_url,
  referrer_host,
  referrer_path,
  referrer_url,
  useragent
}: HullElasticContext = {}) => ({
  useragent,
  device: {
    name: device_name
  },
  referrer: {
    url: referrer_url,
    host: referrer_host,
    path: referrer_path
  },
  os: {
    name: os_name,
    version: os_version
  },
  browser: {
    major: browser_major,
    name: browser_name,
    version: browser_version
  },
  location: {
    country: location_country,
    city: location_city,
    timezone: location_timezone,
    longitude: location_longitude,
    latitude: location_latitude,
    region: location_region,
    countryname: location_countryname,
    regionname: location_regionname,
    zipcode: location_zipcode
  },
  campaign: {
    term: campaign_term,
    medium: campaign_medium,
    name: campaign_name,
    content: campaign_content,
    source: campaign_source
  },
  ip,
  page: {
    url: page_url,
    host: page_host,
    path: page_path
  }
});
export default unflatify;
