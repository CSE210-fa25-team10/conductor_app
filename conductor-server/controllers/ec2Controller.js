// controllers/ec2Controller.js
import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';

const DEFAULT_REGION = process.env.AWS_REGION || 'us-east-1';

// ---------- Helpers ----------

// Create an EC2 client for a given region (or default)
function createEc2Client(region) {
  const finalRegion = region || DEFAULT_REGION;
  return new EC2Client({ region: finalRegion });
}

// Basic validation for an EC2 instance ID
function normalizeInstanceId(rawId) {
  if (!rawId || typeof rawId !== 'string') return null;
  const id = rawId.trim();
  // Very simple check: real EC2 IDs are like "i-0123abcd..."
  const re = /^i-[0-9a-fA-F]+$/;
  if (!re.test(id)) return null;
  return id;
}

// Map AWS EC2 errors to HTTP status + error payload
function mapEc2Error(err) {
  const name = err?.name || '';

  if (name === 'InvalidInstanceID.Malformed' || name === 'InvalidInstanceID.NotFound') {
    return {
      status: 400,
      body: { error: 'invalid_instance_id', message: err.message },
    };
  }

  // Fallback: internal error
  return {
    status: 500,
    body: { error: 'aws_ec2_error', message: err.message || 'Unknown EC2 error' },
  };
}

// ---------- 1. Start EC2 instance ----------
//
// POST /api/ec2/start
// body: { instanceId, region? }
//
export async function startEc2Instance(req, res) {
  const { instanceId: rawInstanceId, region } = req.body || {};

  const instanceId = normalizeInstanceId(rawInstanceId);
  if (!instanceId) {
    return res.status(400).json({ error: 'invalid_instance_id' });
  }

  try {
    const client = createEc2Client(region);
    const cmd = new StartInstancesCommand({
      InstanceIds: [instanceId],
    });

    const resp = await client.send(cmd);
    const starting = resp.StartingInstances?.[0];
    const state = starting?.CurrentState?.Name || 'unknown';

    return res.status(200).json({
      instanceId,
      state,
      previousState: starting?.PreviousState?.Name || null,
      region: region || DEFAULT_REGION,
    });
  } catch (err) {
    console.error('startEc2Instance error:', err);
    const { status, body } = mapEc2Error(err);
    return res.status(status).json(body);
  }
}

// ---------- 2. Stop EC2 instance ----------
//
// POST /api/ec2/stop
// body: { instanceId, region? }
//
export async function stopEc2Instance(req, res) {
  const { instanceId: rawInstanceId, region } = req.body || {};

  const instanceId = normalizeInstanceId(rawInstanceId);
  if (!instanceId) {
    return res.status(400).json({ error: 'invalid_instance_id' });
  }

  try {
    const client = createEc2Client(region);
    const cmd = new StopInstancesCommand({
      InstanceIds: [instanceId],
    });

    const resp = await client.send(cmd);
    const stopping = resp.StoppingInstances?.[0];
    const state = stopping?.CurrentState?.Name || 'unknown';

    return res.status(200).json({
      instanceId,
      state,
      previousState: stopping?.PreviousState?.Name || null,
      region: region || DEFAULT_REGION,
    });
  } catch (err) {
    console.error('stopEc2Instance error:', err);
    const { status, body } = mapEc2Error(err);
    return res.status(status).json(body);
  }
}

// ---------- 3. Get EC2 instance status ----------
//
// GET /api/ec2/status/:instanceId?region=us-east-1
//
export async function getEc2InstanceStatus(req, res) {
  const rawInstanceId = req.params?.instanceId || req.query?.instanceId;
  const region = req.query?.region;

  const instanceId = normalizeInstanceId(rawInstanceId);
  if (!instanceId) {
    return res.status(400).json({ error: 'invalid_instance_id' });
  }

  try {
    const client = createEc2Client(region);
    const cmd = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });

    const resp = await client.send(cmd);
    const reservation = resp.Reservations?.[0];
    const instance = reservation?.Instances?.[0];

    if (!instance) {
      return res.status(404).json({ error: 'instance_not_found' });
    }

    const state = instance.State?.Name || 'unknown';
    const type = instance.InstanceType || null;
    const az = instance.Placement?.AvailabilityZone || null;

    return res.status(200).json({
      instanceId,
      state,
      instanceType: type,
      availabilityZone: az,
      region: region || DEFAULT_REGION,
    });
  } catch (err) {
    console.error('getEc2InstanceStatus error:', err);
    const { status, body } = mapEc2Error(err);
    return res.status(status).json(body);
  }
}

// ---------- Factory (similar to makeAttendanceController) ----------
//
// This lets you follow the same pattern as the attendance controller:
//   const { startEc2Instance, stopEc2Instance, getEc2InstanceStatus } = makeEc2Controller();
//
export function makeEc2Controller() {
  return Object.freeze({
    startEc2Instance,
    stopEc2Instance,
    getEc2InstanceStatus,
  });
}
