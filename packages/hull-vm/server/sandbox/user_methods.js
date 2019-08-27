// @flow
import _ from "lodash";
import type {
  HullUserSegment,
  HullAccountSegment,
  HullUserChanges
} from "hull";

const isInSegment = (segments = []) => (name: string) =>
  _.includes(_.map(segments, "name"), name);

const enteredSegment = (changes = {}) => (name: string) =>
  !!_.find(_.get(changes, "entered"), s => s.name === name);

const leftSegment = (changes = {}) => (name: string) =>
  !!_.find(_.get(changes, "left"), s => s.name === name);

export default function scopedUserMethods({
  account_segments,
  segments,
  changes = {}
}: {
  account_segments: Array<HullAccountSegment>,
  segments: Array<HullUserSegment>,
  changes: HullUserChanges
}) {
  return {
    isInAccountSegment: isInSegment(account_segments),
    enteredAccountSegment: enteredSegment(changes.account_segments),
    leftAccountSegment: leftSegment(changes.account_segments),
    isInSegment: isInSegment(segments),
    enteredSegment: enteredSegment(changes.segments),
    leftSegment: leftSegment(changes.segments)
  };
}
