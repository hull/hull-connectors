/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");
const Promise = require("bluebird");

const settingsUpdate = require("../../../src/helpers/settings-update");

describe("settingsUpdate", () => {
  it("should call utils.settings.update in the background", async () => {
    const updateStub = sinon.stub().returns(Promise.resolve({}));
    const ship = await settingsUpdate({
      client: {
        utils: {
          settings: { update: updateStub }
        }
      }
    })({});
    expect(updateStub.called).to.be.ok;
    expect(updateStub.calledWith({}, false)).to.be.true;
  });

  it("should refresh settings if specified", async () => {
    const updateStub = sinon.stub().returns(Promise.resolve({}));
    const ship = await settingsUpdate({
      client: {
        utils: {
          settings: { update: updateStub }
        }
      }
    }, true)({});
    expect(updateStub.called).to.be.ok;
    expect(updateStub.calledWith({}, true)).to.be.true;
  });

  it("should clear cache if possible", async () => {
    const cacheStub = sinon.stub().returns(Promise.resolve({}));
    const ship = await settingsUpdate({
      client: {
        utils: {
          settings: { update: () => Promise.resolve({}) }
        }
      },
      cache: {
        del: cacheStub
      }
    })({});
    expect(cacheStub.called).to.be.ok;
  });

});
