import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { EC2Client } from '@aws-sdk/client-ec2';
import {
  startEc2Instance,
  stopEc2Instance,
  getEc2InstanceStatus,
} from '../../controllers/ec2Controller';

// Helper to mock Express response
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('ec2Controller', () => {
  const TEST_INSTANCE_ID = 'i-0123456789abcdef0';
  const TEST_REGION = 'us-east-1';

  describe('startEc2Instance', () => {
    it('should start an instance and return 200', async () => {
      const sendMock = jest.spyOn(EC2Client.prototype, 'send').mockResolvedValueOnce({
        StartingInstances: [
          {
            InstanceId: TEST_INSTANCE_ID,
            CurrentState: { Name: 'pending' },
            PreviousState: { Name: 'stopped' },
          },
        ],
      });

      const req = {
        body: { instanceId: TEST_INSTANCE_ID, region: TEST_REGION },
      };
      const res = mockRes();

      await startEc2Instance(req, res);

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId: TEST_INSTANCE_ID,
          state: 'pending',
        })
      );
    });

    it('should return 400 if instanceId is missing', async () => {
      const sendMock = jest.spyOn(EC2Client.prototype, 'send');

      const req = { body: { region: TEST_REGION } };
      const res = mockRes();

      await startEc2Instance(req, res);

      expect(sendMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getEc2InstanceStatus', () => {
    it('should return instance status with 200', async () => {
      const sendMock = jest.spyOn(EC2Client.prototype, 'send').mockResolvedValueOnce({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: TEST_INSTANCE_ID,
                State: { Name: 'running' },
                InstanceType: 't3.micro',
                Placement: { AvailabilityZone: 'us-east-1a' },
              },
            ],
          },
        ],
      });

      const req = {
        params: { instanceId: TEST_INSTANCE_ID },
        query: { region: TEST_REGION },
      };
      const res = mockRes();

      await getEc2InstanceStatus(req, res);

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId: TEST_INSTANCE_ID,
          state: 'running',
        })
      );
    });
  });
});
