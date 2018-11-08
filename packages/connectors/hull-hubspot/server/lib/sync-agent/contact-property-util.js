// @flow
import type { HullSegment } from "hull";
import type {
  HubspotContactOutgoingMapping,
  HubspotContactProperty,
  HullProperty,
  HubspotContactPropertyGroup,
  HubspotContactPropertyWrite
} from "../../types";

const _ = require("lodash");
const Promise = require("bluebird");
const debug = require("debug")("hull-hubspot:contact-property-util");

const TYPES_MAPPING = {
  string: { type: "string", fieldType: "text" },
  number: { type: "number", fieldType: "text" },
  date: { type: "datetime", fieldType: "text" },
  boolean: {
    type: "bool",
    fieldType: "booleancheckbox",
    options: [
      {
        description: null,
        doubleData: 0,
        label: "Yes",
        displayOrder: -1,
        hidden: false,
        readOnly: false,
        value: true
      },
      {
        description: null,
        doubleData: 0,
        label: "No",
        displayOrder: -1,
        hidden: false,
        readOnly: false,
        value: false
      }
    ]
  }
};

class ContactPropertyUtil {
  hubspotClient: Object;

  logger: Object;

  metric: Object;

  usersSegments: Array<HullSegment>;

  hubspotProperties: Array<HubspotContactPropertyGroup>;

  hullProperties: Array<HullProperty>;

  constructor({
    logger,
    metric,
    hubspotClient,
    usersSegments,
    hubspotProperties,
    hullProperties
  }: Object) {
    this.hubspotClient = hubspotClient;
    this.logger = logger;
    this.metric = metric;
    this.usersSegments = usersSegments;

    this.hubspotProperties = hubspotProperties;
    this.hullProperties = hullProperties;
  }

  sync(outboundMapping: Array<HubspotContactOutgoingMapping>): Promise<*> {
    debug("outboundMapping %o", outboundMapping);
    const uniqueSegments = _.uniqBy(this.usersSegments, "name");
    debug("uniqueSegments %o", uniqueSegments.map(s => s.name));
    const expectedPropertiesList = [
      this.getHullSegmentsProperty(uniqueSegments)
    ].concat(this.getPropertiesList(outboundMapping));
    debug("expectedPropertiesList %o", expectedPropertiesList);
    return this.ensureHullGroup(this.hubspotProperties)
      .then(() =>
        this.ensureCustomProperties(
          this.hubspotProperties,
          expectedPropertiesList
        )
      )
      .catch(err => {
        debug("sync error", err);
        this.logger.error("connector.sync.error", {
          error: err.response && err.response.body && err.response.body.message
        });
        // this.metric.event({
        //   title: "connector.sync.error",
        //   text: JSON.stringify(err.response && err.response.body)
        // });
      });
  }

  ensureHullGroup(hubspotProperties: Array<HubspotContactPropertyGroup>) {
    const group = _.find(hubspotProperties, g => g.name === "hull");
    if (group) {
      return Promise.resolve(group);
    }
    return this.hubspotClient.agent
      .post("/contacts/v2/groups")
      .send({
        name: "hull",
        displayName: "Hull Properties",
        displayOrder: 1
      })
      .then(res => res.body);
  }

  ensureCustomProperties(
    hubspotGroupProperties: Array<HubspotContactPropertyGroup>,
    expectedPropertiesList: Array<HubspotContactPropertyWrite>
  ) {
    const flattenProperties = _.flatten(
      hubspotGroupProperties.map(g => g.properties)
    ).reduce((props, prop) => {
      return Object.assign(props, { [prop.name]: prop });
    }, {});
    return Promise.all(
      expectedPropertiesList.map(property =>
        this.ensureProperty(flattenProperties, property)
      )
    ).then((...props) =>
      this.logger.debug(
        "ContactProperty.ensureCustomProperties",
        _.map(props[0], p => p.name)
      )
    );
  }

  shouldUpdateProperty(
    currentValue: HubspotContactProperty,
    newValue: HubspotContactPropertyWrite
  ): boolean {
    if (newValue.name === "hull_segments") {
      debug("shouldUpdateProperty", currentValue.name, newValue.name);
      const currentSegmentNames = (currentValue.options || [])
        .map(o => o.label)
        .sort();
      const newSegmentNames = (newValue.options || []).map(o => o.label).sort();
      return !_.isEqual(currentSegmentNames, newSegmentNames);
    }
    return false;
  }

  ensureProperty(
    groupProperties: { [string]: HubspotContactProperty },
    property: HubspotContactPropertyWrite
  ) {
    const existing =
      groupProperties[property.name] ||
      groupProperties[property.name.replace(/^hull_/, "")];
    debug("ensureProperty %o", existing);
    if (existing) {
      if (this.shouldUpdateProperty(existing, property)) {
        debug("ensureProperty %o", property);
        return this.hubspotClient.agent
          .put(`/contacts/v2/properties/named/${property.name}`)
          .send(property)
          .then(res => res.body);
      }
      return Promise.resolve(existing);
    }

    return this.hubspotClient.agent
      .post("/contacts/v2/properties")
      .send(property)
      .then(res => res.body);
  }

  getPropertiesList(
    outboundMapping: Array<HubspotContactOutgoingMapping>
  ): Array<HubspotContactPropertyWrite> {
    return outboundMapping.map(mappingEntry => {
      const name = mappingEntry.hubspot_property_name;
      const label = mappingEntry.hubspot_property_label;
      const displayOrder = mappingEntry.hubspot_property_display_order;
      const propType = mappingEntry.hubspot_property_type
        ? TYPES_MAPPING[mappingEntry.hubspot_property_type]
        : TYPES_MAPPING.string;
      return {
        ...propType,
        name,
        label,
        displayOrder,
        calculated: false,
        groupName: "hull",
        formField: false
      };
    });
  }

  getHullSegmentsProperty(segments: Array<HullSegment> = []) {
    const options = _.map(segments, (s, i) => this.optionsHash(s.name, i));
    return {
      options,
      description: "All the Segments the User belongs to in Hull",
      label: "Hull Segments",
      groupName: "hull",
      fieldType: "checkbox",
      formField: false,
      name: "hull_segments",
      type: "enumeration",
      displayOrder: 0
    };
  }

  optionsHash(name: string, i: any) {
    return {
      hidden: false,
      description: null,
      value: _.trim(name),
      readOnly: false,
      doubleData: 0.0,
      label: name,
      displayOrder: i
    };
  }
}

module.exports = ContactPropertyUtil;
