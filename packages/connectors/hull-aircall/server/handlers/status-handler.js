// @flow
import type { HullContext, HullStatusResponse } from "hull";
const crypto = require('crypto');
const apiSecret = 'YOUR_API_SECRET';

function validateFrontSignature(data, signature) {
    var hash = crypto.createHmac('sha1', apiSecret)
                     .update(JSON.stringify(data))
                     .digest('base64');

   return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}


export default async function statusCheck(
  ctx: HullContext
): HullStatusResponse {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  return { messages: [], status: "ok" };
}
