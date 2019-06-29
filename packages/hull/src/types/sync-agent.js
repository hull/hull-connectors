// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "./index";

export type HullSendResponse = Promise<*>;
export type HullSyncResponse = Promise<*>;
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
