// @flow
import type { HullSegment } from "hull";
import type {
  HubspotSchema,
  HubspotPropertyGroup,
  HubspotProperty,
  HubspotPropertyWrite,
  ServiceType
} from "../../types";

const _ = require("lodash");
const Promise = require("bluebird");

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

class HubspotPropertyUtil {
  hubspotClient: Object;

  logger: Object;

  metric: Object;

  segments: Array<HullSegment>;

  hubspotProperties: Array<HubspotPropertyGroup>;

  serviceType: ServiceType;

  constructor({
    logger,
    metric,
    hubspotClient,
    segments,
    hubspotProperties,
    serviceType
  }: Object) {
    this.hubspotClient = hubspotClient;
    this.logger = logger;
    this.metric = metric;
    this.segments = segments;
    this.serviceType = serviceType;
    this.hubspotProperties = hubspotProperties;
  }

  sync(outboundMapping: Array<HubspotSchema>): Promise<*> {
    const uniqueSegments = _.uniqBy(this.segments, "name");
    const expectedPropertiesList = this.getPropertiesList(
      uniqueSegments,
      outboundMapping
    );
    return this.ensureHullGroup(this.hubspotProperties)
      .then(() =>
        this.ensureCustomProperties(
          this.hubspotProperties,
          expectedPropertiesList
        )
      )
      .catch(err => {
        this.logger.error("connector.sync.error", {
          error: err.response && err.response.body && err.response.body.message
        });
      });
  }

  ensureHullGroup(hubspotProperties: Array<HubspotPropertyGroup>) {
    const group = _.find(hubspotProperties, g => g.name === "hull");
    if (group) {
      return Promise.resolve(group);
    }
    if (this.serviceType === "contact") {
      return this.hubspotClient.postContactPropertyGroups();
    }
    if (this.serviceType === "company") {
      return this.hubspotClient.postCompanyPropertyGroups();
    }

    return [];
  }

  ensureCustomProperties(
    hubspotGroupProperties: Array<HubspotPropertyGroup>,
    expectedPropertiesList: Array<HubspotPropertyWrite>
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
        `${_.upperFirst(this.serviceType)}Property.ensureCustomProperties`,
        _.map(props[0], p => p.name)
      )
    );
  }

  shouldUpdateProperty(
    currentValue: HubspotProperty,
    newValue: HubspotPropertyWrite
  ): boolean {
    if (newValue.name === "hull_segments") {
      const currentSegmentNames = (currentValue.options || [])
        .map(o => o.label)
        .sort();
      const newSegmentNames = (newValue.options || []).map(o => o.label).sort();
      return !_.isEqual(currentSegmentNames, newSegmentNames);
    }
    return false;
  }

  ensureProperty(
    groupProperties: { [string]: HubspotProperty },
    property: HubspotPropertyWrite
  ) {
    const existing =
      groupProperties[property.name] ||
      groupProperties[property.name.replace(/^hull_/, "")];
    if (existing) {
      if (this.shouldUpdateProperty(existing, property)) {
        if (this.serviceType === "contact") {
          return this.hubspotClient.updateContactProperty(property);
        }
        if (this.serviceType === "company") {
          return this.hubspotClient.updateCompanyProperty(property);
        }
      }
      return Promise.resolve(existing);
    }

    // TODO remove hubspot_entity_id from attribute mapping
    if (property.name !== "hubspot_entity_id") {
      if (this.serviceType === "contact") {
        return this.hubspotClient.createContactProperty(property);
      }
      if (this.serviceType === "company") {
        return this.hubspotClient.createCompanyProperty(property);
      }
    }

    return [];
  }

  getPropertiesList(
    segments: Array<HullSegment> = [],
    outboundMapping: Array<HubspotSchema>
  ): Array<HubspotPropertyWrite> {
    return _.reduce(
      outboundMapping,
      (props, mapping, propertyName) => {
        let {
          name,
          label,
          displayOrder,
          fieldType,
          type,
          options = [],
          description
        } = mapping;
        if (!type && /_(at|date)$/.test(name)) {
          type = "date";
        }
        let propType = type ? TYPES_MAPPING[type] : TYPES_MAPPING.string;

        if (propertyName === "hull_segments") {
          if (_.isEmpty(segments)) {
            return props;
          }
          const segmentProperty = this.getHullSegmentsProperty(segments);
          options = segmentProperty.options;
          description = segmentProperty.description;
          label = segmentProperty.label;
          fieldType = segmentProperty.fieldType;
          name = segmentProperty.name;
          type = segmentProperty.type;
          displayOrder = segmentProperty.displayOrder;
          propType = { type, fieldType };
        }

        props.push({
          name,
          label,
          description,
          options,
          fieldType,
          displayOrder,
          formField: false,
          calculated: false,
          groupName: "hull",
          ...propType
        });
        return props;
      },
      []
    );
  }

  getHullSegmentsProperty(segments: Array<HullSegment> = []) {
    const options = _.map(segments, (s, i: number) =>
      this.optionsHash(s.name, i)
    );
    return {
      options,
      description: "All the Segments the entity belongs to in Hull",
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

module.exports = HubspotPropertyUtil;
