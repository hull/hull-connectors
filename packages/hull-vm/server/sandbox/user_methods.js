import _ from "lodash";

const isInSegment = (segments = []) => (name: string) =>
  _.includes(_.map(segments, "name"), name);

const enteredSegment = (changes = {}) => (name: string) =>
  _.find(_.get(changes, "segments.entered"), s => s.name === name);

const leftSegment = (changes = {}) => (name: string) =>
  _.find(_.get(changes, "segments.entered"), s => s.name === name);

export default function scopedUserMethods({ segments, changes }) {
  return {
    isInSegment: isInSegment(segments),
    enteredSegment: enteredSegment(changes),
    leftSegment: leftSegment(changes)
  };
}
