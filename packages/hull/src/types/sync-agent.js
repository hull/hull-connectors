// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "./index";

export interface HullSyncAgent {
  constructor(ctx: HullContext): void;
  sendUserUpdateMessages(
    messages: Array<HullUserUpdateMessage>
  ): HullSendResponse;
  sendAccountUpdateMessages(
    messages: Array<HullAccountUpdateMessage>
  ): HullSendResponse;
  syncConnectorUpdateMessage(): HullSyncResponse;
  syncSegmentUpdateMessage(): HullSyncResponse;
}

export type HullSendResponse = Promise<*>;
export type HullSyncResponse = Promise<*>;
