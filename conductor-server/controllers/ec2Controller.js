// controllers/ec2Controller.js

import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';

// ---------- Helpers ----------

// Simple instance-id validator (not perfect, but catches obvious mistakes)
function isValidInstanceId(id) {
  return typeof id === 'string' && /^i-[a-f0-9]{8,}$/.test(id);
}

function getRegionFromRequest(req) {
  return (
    (req.body && req.body.region) ||
    (req.query && req.query.region) ||
    process.env.AWS_REGION ||
    'us-east-1'
  );
}

function makeDefaultEc2Client(region) {
  return new EC2Client({ region });
}

function mapEc2ErrorToHttp(error) {
  // Map common instance ID issues to 400-level
  if (
    error?.name === 'InvalidInstanceID.Malformed' ||
    error?.name === 'InvalidInstanceID.NotFound'
  ) {
    return { status: 400, body: { error: 'invalid_instance_id' } };
  }

  // Fallback: 500 for generic AWS failures
  return { status: 500, body: { error: 'aws_ec2_error' } };
}

// ---------- Factory ----------
//
// This mirrors makeAttendanceController: you can inject a custom EC2 client
// for testing, or let it create a default one.
//

export function makeEc2Controller({ ec2Client } = {}) {
  // lazy client: created per-request region if not injected
  function getClient(region) {
    return ec2Client || makeDefaultEc2Client(region);
  }

  // ---------- 1. Start EC2 instance ----------
  //
  // POST /api/ec2/start
  // body: { instanceId, region? }
  //
  async function startEc2Instance(req, res) {
    const { instanceId } = req.body || {};
    const region = getRegionFromRequest(req);

    if (!isValidInstanceId(instanceId)) {
      return res.status(400).json({ error: 'invalid_instance_id' });
    }

    try {
      const client = getClient(region);
      const cmd = new StartInstancesCommand({
        InstanceIds: [instanceId],
      });
      const result = await client.send(cmd);

      const first = result.StartingInstances?.[0];
      const state = first?.CurrentState?.Name || 'unknown';

      return res.status(200).json({
        instanceId,
        state,
        region,
      });
    } catch (err) {
      console.error('startEc2Instance error:', err);
      const mapped = mapEc2ErrorToHttp(err);
      return res.status(mapped.status).json(mapped.body);
    }
  }

  // ---------- 2. Stop EC2 instance ----------
  //
  // POST /api/ec2/stop
  // body: { instanceId, region? }
  //
  async function stopEc2Instance(req, res) {
    const { instanceId } = req.body || {};
    const region = getRegionFromRequest(req);

    if (!isValidInstanceId(instanceId)) {
      return res.status(400).json({ error: 'invalid_instance_id' });
    }

    try {
      const client = getClient(region);
      const cmd = new StopInstancesCommand({
        InstanceIds: [instanceId],
      });
      const result = await client.send(cmd);

      const first = result.StoppingInstances?.[0];
      const state = first?.CurrentState?.Name || 'unknown';

      return res.status(200).json({
        instanceId,
        state,
        region,
      });
    } catch (err) {
      console.error('stopEc2Instance error:', err);
      const mapped = mapEc2ErrorToHttp(err);
      return res.status(mapped.status).json(mapped.body);
    }
  }

  // ---------- 3. Get EC2 instance status ----------
  //
  // GET /api/ec2/:instanceId/status?region=...
  //
  async function getEc2InstanceStatus(req, res) {
    const instanceId = req.params?.instanceId;
    const region = getRegionFromRequest(req);

    if (!isValidInstanceId(instanceId)) {
      return res.status(400).json({ error: 'invalid_instance_id' });
    }

    try {
      const client = getClient(region);
      const cmd = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const result = await client.send(cmd);

      const reservation = result.Reservations?.[0];
      const instance = reservation?.Instances?.[0];

      if (!instance) {
        return res.status(404).json({ error: 'instance_not_found' });
      }
