/* @flow */
import type { HullSegment, HullContext } from "hull";
// import shipAppFactory from "../ship-app-factory";

const Promise = require("bluebird");
const _ = require("lodash");

export type TSegmentStats = {
  hullSegmentId: string,
  hullSegmentName: string,
  hullSegmentCount: number,
  hullSubscribedCount: number,
  hullOtherStatusCount: number,
  hullMissCount: number,
  mailchimpInterestGroupId: string,
  mailchimpStaticSegmentId: string,
  mailchimpInterestGroupCount: number,
  mailchimpStaticSegmentCount: number,
  mailchimpInterestGroupPercentage: number,
  mailchimpStaticSegmentPercentage: number
};

export type TAudit = {
  segmentsStats: Array<TSegmentStats>,
  meanSyncPercentage: number
};

class AuditUtil {
  segments: Array<HullSegment>;

  hullClient: Object;

  mailchimpClient: Object;

  interestCatId: string;

  segmentMapping: Object;

  interestMapping: Object;

  synchronizedSegments: Array<string>;

  constructor(ctx: HullContext, mailchimpClient) {
    this.segments = _.get(ctx, "segments", []);
    this.hullClient = ctx.client;
    this.mailchimpClient = mailchimpClient;
    this.interestCatId = _.get(
      ctx,
      "connector.private_settings.interest_category_id",
      ""
    );
    this.segmentMapping = _.get(
      ctx,
      "connector.private_settings.segment_mapping",
      {}
    );
    this.interestMapping = _.get(
      ctx,
      "connector.private_settings.interests_mapping",
      {}
    );
    this.synchronizedSegments = _.get(
      ctx,
      "connector.private_settings.synchronized_user_segments",
      _.get(ctx, "connector.private_settings.synchronized_segments", [])
    );
  }

  getAudit(): Promise<TAudit> {
    return this.fetchData().then(result => this.handleResponse(result));
  }

  /**
   * method returns aggregations to be send to `search/user_reports` endpoint
   */
  getAggregations(): Object {
    return this.segments.reduce((obj, segment) => {
      const filter =
        _.get(segment, "query.constant_score.filter") ||
        _.get(segment, "query.filtered.filter");
      if (filter) {
        _.set(obj, `segment_${segment.id}`, { filter });
      }
      return obj;
    }, {});
  }

  postSearchUserReports(query: Object): Promise<Object> {
    const aggs = this.getAggregations();
    return this.hullClient.post("search/user_reports", {
      query,
      search_type: "count",
      aggs
    });
  }

  fetchData(): Promise<Object> {
    return Promise.all([
      this.postSearchUserReports({
        term: { "traits_mailchimp/status.raw": "subscribed" }
      }),
      this.postSearchUserReports({
        bool: {
          must_not: {
            exists: { field: "traits_mailchimp/status" }    
          }
        }
      }),
      this.postSearchUserReports({
        bool: {
          filter: [
            { exists: { field: "traits_mailchimp/status" } },
            { bool: { must_not: { term: { "traits_mailchimp/status.raw": "subscribed" } } } }
          ]
        }
      }),
      this.mailchimpClient
        .get(
          "/lists/{{listId}}/interest-categories/{{interestCatId}}/interests"
        )
        .tmplVar({ interestCatId: this.interestCatId })
        .ok(result => result.status === 200)
        .query({
          fields: "interests.id,interests.name,interests.subscriber_count",
          count: 500
        })
        .then(result => _.get(result, "body.interests", [])),
      this.mailchimpClient
        .get("/lists/{{listId}}/segments")
        .ok(result => result.status === 200)
        .query({
          fields: "segments.id,segments.name,segments.member_count",
          type: "static",
          count: 500
        })
        .then(result => _.get(result, "body.segments", []))
    ]).then((results: Array<any>) => {
      const [
        matchResponses: Object,
        missingResponses: Object,
        otherStatusResponses: Object,
        interestGroups,
        staticSegments
      ] = results;
      return {
        matchResponses,
        missingResponses,
        otherStatusResponses,
        interestGroups,
        staticSegments
      };
    });
  }

  parseUserReportsResponse(
    response: Object,
    segments: Array<HullSegment>
  ): Array<Object> {
    const aggregations: Array<Object> = response.aggregations;
    return _.map(segments, segment => {
      const aggregation = _.get(aggregations, `segment_${segment.id}`);
      return {
        segmentId: segment.id,
        usersCount: _.get(aggregation, "doc_count", 0)
      };
    });
  }

  findAggregation(
    aggregationResponses: Object,
    segment: HullSegment
  ): Object | void {
    const aggregations: Array<Object> = aggregationResponses.aggregations;
    return _.get(aggregations, `segment_${segment.id}`);
  }

  findInterestGroup(
    interestGroups: Array<Object>,
    segment: HullSegment
  ): Object | void {
    const interestId = _.get(this.interestMapping, segment.id);
    return _.find(interestGroups, { id: interestId });
  }

  findStaticSegment(
    staticSegments: Array<Object>,
    segment: HullSegment
  ): Object | void {
    const staticSegmentId = _.get(this.segmentMapping, segment.id);
    return _.find(staticSegments, { id: staticSegmentId });
  }

  calculatePercentage(
    hullCount: string | number,
    mailchimpCount: string | number
  ) {
    hullCount = parseInt(hullCount, 10);
    mailchimpCount = parseInt(mailchimpCount, 10);
    if (hullCount === 0 && mailchimpCount === 0) {
      return 100;
    }
    if (hullCount === 0 && mailchimpCount !== 0) {
      return 0;
    }
    return (mailchimpCount / hullCount) * 100;
  }

  handleResponse(result: Object): TAudit {
    const {
      matchResponses,
      missingResponses,
      otherStatusResponses,
      interestGroups,
      staticSegments
    } = result;

    const segmentsStats = this.segments.reduce(
      (agg: Array<Object>, segment: HullSegment) => {
        const matchResponse = this.findAggregation(matchResponses, segment);
        const missingResponse = this.findAggregation(missingResponses, segment);
        const otherStatusResponse = this.findAggregation(
          otherStatusResponses,
          segment
        );
        const interestGroup = this.findInterestGroup(interestGroups, segment);
        const staticSegment = this.findStaticSegment(staticSegments, segment);

        agg.push({
          hullSegmentId: segment.id,
          hullSegmentName: segment.name,
          mailchimpInterestGroupId: _.get(interestGroup, "id"),
          mailchimpStaticSegmentId: _.get(staticSegment, "id"),
          mailchimpInterestGroupExists: !_.isUndefined(interestGroup),
          mailchimpStaticSegmentExists: !_.isUndefined(staticSegment),
          shouldBeSynchronized:
            this.synchronizedSegments.length === 0 ||
            _.includes(this.synchronizedSegments, segment.id),
          hullSegmentCount: _.get(segment, "stats.users", 0),
          hullSubscribedCount: _.get(matchResponse, "doc_count", 0),
          hullOtherStatusCount: _.get(otherStatusResponse, "doc_count", 0),
          hullMissCount: _.get(missingResponse, "doc_count", 0),
          mailchimpInterestGroupCount: parseInt(
            _.get(interestGroup, "subscriber_count", 0),
            10
          ),
          mailchimpStaticSegmentCount: parseInt(
            _.get(staticSegment, "member_count", 0),
            10
          ),
          mailchimpInterestGroupPercentage: this.calculatePercentage(
            _.get(matchResponse, "doc_count", 0),
            _.get(interestGroup, "subscriber_count", 0)
          ),
          mailchimpStaticSegmentPercentage: this.calculatePercentage(
            _.get(matchResponse, "doc_count", 0),
            _.get(staticSegment, "member_count", 0)
          )
        });
        return agg;
      },
      []
    );

    return {
      meanSyncPercentage: this.getMeanSyncPercentage(segmentsStats),
      segmentsStats
    };
  }

  getMeanSyncPercentage(segmentStats: Array<Object>) {
    const synchronizedSegmentsStats =
      this.synchronizedSegments.length === 0
        ? segmentStats
        : _.intersectionBy(
            segmentStats,
            this.synchronizedSegments.map(s => ({ hullSegmentId: s })),
            "hullSegmentId"
          );

    const meanSyncPercentage =
      (_.meanBy(synchronizedSegmentsStats, "mailchimpInterestGroupPercentage") +
        _.meanBy(
          synchronizedSegmentsStats,
          "mailchimpStaticSegmentPercentage"
        )) /
      2;
    return meanSyncPercentage;
  }
}

module.exports = AuditUtil;
