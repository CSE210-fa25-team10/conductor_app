import {
  getCourseGroups,
  createCourseGroup,
  updateCourseGroup,
  deleteCourseGroup,
  getUserNamesByIds
} from '../services/groupService.js';

export function makeGroupController() {
  /**
   * GET /api/groups/:courseId
   * Get all student groups for a course
   */
  async function getGroupsByCourse(req, res) {
    const courseId = req.params.courseId;
    try {
      const groups = await getCourseGroups(courseId);
      res.json({ groups });
    } catch (err) {
      console.error('getGroupsByCourse error:', err);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  }

  /**
   * POST /api/groups/:courseId
   * Create a new student group in a course
   */
  async function createGroup(req, res) {
    const courseId = req.params.courseId;
    const { name, members } = req.body;
    try {
      const newGroup = await createCourseGroup(courseId, { name, members });
      res.status(201).json({ group: newGroup });
    } catch (err) {
      console.error('createGroup error:', err);
      res.status(500).json({ error: 'Failed to create group' });
    }
  }

  /**
   * PUT /api/groups/:courseId/:groupId
   * Update a student group
   */
  async function updateGroup(req, res) {
    const courseId = req.params.courseId;
    const groupId = req.params.groupId;
    const { name, members } = req.body;
    try {
      const updatedGroup = await updateCourseGroup(courseId, groupId, { name, members });
      res.json({ group: updatedGroup });
    } catch (err) {
      console.error('updateGroup error:', err);
      res.status(500).json({ error: 'Failed to update group' });
    }
  }

  /**
   * DELETE /api/groups/:courseId/:groupId
   * Delete a student group
   */
  async function deleteGroup(req, res) {
    const courseId = req.params.courseId;
    const groupId = req.params.groupId;
    try {
      await deleteCourseGroup(courseId, groupId);
      res.status(204).send();
    } catch (err) {
      console.error('deleteGroup error:', err);
      res.status(500).json({ error: 'Failed to delete group' });
    }
  }

  /**
   * GET /api/groups/:courseId/my-group
   * Get the group of the authenticated student in a course
   */
  async function getMyGroup(req, res) {
    const courseId = req.params.courseId;
    const userId = req.user?.user_id || req.session?.user?.user_id;
    try {
      const groups = await getCourseGroups(courseId);
      const myGroup = groups.find((group) => group.members.includes(userId));
      if (!myGroup) {
        return res.status(404).json({ error: 'Group not found for the student' });
      }
      res.json({ group: myGroup });
    } catch (err) {
      console.error('getMyGroup error:', err);
      res.status(500).json({ error: 'Failed to fetch student group' });
    }
  }

  async function getUsersByIds(req, res) {
    // Expecting a comma-separated list of IDs in the route param
    const userIds = req.params.userIds.split(',');
    try {
      const users = await getUserNamesByIds(userIds);
      res.json({ users });
    } catch (err) {
      console.error('getUsersByIds error:', err);
      res.status(500).json({ error: 'Failed to fetch user names' });
    }
  }

  async function getUserIdofCurrentUser(req, res) {
    const userId = req.user?.user_id || req.session?.user?.user_id;
    console.log('current id of user inside group controller', userId);
    if (!userId) {
        return res.status(401).json({ error: 'User ID not found in session/token' });
    }
    res.json({ user_id: userId });
  }

  return {
    getGroupsByCourse,
    createGroup,
    updateGroup,
    deleteGroup,
    getMyGroup,
    getUsersByIds,
    getUserIdofCurrentUser,
  };
}
