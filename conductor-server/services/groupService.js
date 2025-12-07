import { makeQueryService } from './queryService.js';
import { pool } from '../db.js';

const queryService = makeQueryService({ pool });

/**
 *
 * @param {string} courseId - The ID of the course
 * @returns {Promise<Array>} - A promise that resolves to an array of groups for the course
 */
export async function getCourseGroups(courseId) {
  const sql = `
    SELECT g.group_id, g.name, g.logo, g.mantra, g.slack, g.repository_link,ARRAY_AGG(gu.user_id) AS members
    FROM groups g
    JOIN course_groups cg ON g.group_id = cg.group_id
    LEFT JOIN group_users gu ON g.group_id = gu.group_id
    WHERE cg.course_id = $1
    GROUP BY g.group_id;
  `;
  const rows = await queryService.executeRawQuery(sql, [courseId]);
  // if the group doesn't exist, return an empty array
  if (rows.length === 0) {
    return [];
  }
  return rows.map((row) => ({
    group_id: row.group_id,
    name: row.name,
    logo: row.logo,
    mantra: row.mantra,
    slack: row.slack,
    repository_link: row.repository_link,
    members: row.members.filter((member) => member !== null) // Remove nulls if no members
  }));
}

/**
 *
 * @param {string} courseId - The ID of the course
 * @param {Object} param1 - The group details
 * @param {string} param1.name - The name of the group
 * @param {Array} param1.members - The array of user IDs who are members of the group
 * @returns {Promise<Object>} - A promise that resolves to the newly created group
 */
export async function createCourseGroup(courseId, { name, members }) {
  // if the group already exists for the course, throw an error
  const existingGroupQuery = `
      SELECT g.group_id
      FROM groups g
      JOIN course_groups cg ON g.group_id = cg.group_id
      WHERE cg.course_id = $1 AND g.name = $2;
    `;
  const existingGroups = await queryService.executeRawQuery(existingGroupQuery, [courseId, name]);
  if (existingGroups.length > 0) {
    throw new Error('Group with this name already exists for the course');
  }
  const query = `
      INSERT INTO groups (name)
      VALUES ($1)
      RETURNING group_id, name, logo, mantra, slack, repository_link;
    `;
  const groupResult = await queryService.executeRawQuery(query, [name]);
  const newGroup = groupResult[0];
  if (members && members.length > 0) {
    const values = members.map((_, i) => `($1, $${i + 2})`).join(', ');
    const memberInsertQuery = `
      INSERT INTO group_users (group_id, user_id)
      VALUES ${values};
    `;
    await queryService.executeRawQuery(memberInsertQuery, [newGroup.group_id, ...members]);
  }
  const courseGroupQuery = `
      INSERT INTO course_groups (group_id, course_id)
      VALUES ($1, $2);
  `;
  await queryService.executeRawQuery(courseGroupQuery, [newGroup.group_id, courseId]);
  return { ...newGroup, members };
}

/**
 *
 * @param {string} courseId - The ID of the course
 * @param {string} groupId - The ID of the group to update
 * @param {Object} param2 - The group details to update
 * @param {string} param2.name - The new name of the group
 * @param {Array} param2.members - The new array of user IDs who are members of the group
 * @returns {Promise<Object>} - A promise that resolves to the updated group
 */
export async function updateCourseGroup(courseId, groupId, { name, members }) {
  if (!groupId) {
    throw new Error('Group ID is required for updating a group');
  }
  // if name is provided, update it
  if (name) {
    const updateGroupQuery = `
          UPDATE groups
          SET name = $1
          WHERE group_id = $2;
      `;
    await queryService.executeRawQuery(updateGroupQuery, [name, groupId]);
  }
  // Ensure the group is associated with the course
  const courseGroupCheckQuery = `
      SELECT *
      FROM course_groups
      WHERE group_id = $1 AND course_id = $2;
  `;
  const courseGroupRows = await queryService.executeRawQuery(courseGroupCheckQuery, [
    groupId, 
    courseId
  ]);
  if (courseGroupRows.length === 0) {
    const insertCourseGroupQuery = `
          INSERT INTO course_groups (group_id, course_id)
          VALUES ($1, $2);
      `;
    await queryService.executeRawQuery(insertCourseGroupQuery, [groupId, courseId]);
  }

  if (members && members.length > 0) {
    // First, remove existing members
    const deleteMembersQuery = `
        DELETE FROM group_users
        WHERE group_id = $1;
    `;
    await queryService.executeRawQuery(deleteMembersQuery, [groupId]);
    // Then, add the new members
    const values = members.map((_, i) => `($1, $${i + 2})`).join(', ');
    const memberInsertQuery = `
      INSERT INTO group_users (group_id, user_id)
      VALUES ${values};
    `;
    await queryService.executeRawQuery(memberInsertQuery, [groupId, ...members]);
  }
  // Return the updated group
  const getUpdatedGroupQuery = `
      SELECT g.group_id, g.name, g.logo, g.mantra, g.slack, g.repository_link,
              ARRAY_AGG(gu.user_id) AS members
      FROM groups g
      LEFT JOIN group_users gu ON g.group_id = gu.group_id
      WHERE g.group_id = $1
      GROUP BY g.group_id;
  `;
  const updatedGroupResult = await queryService.executeRawQuery(getUpdatedGroupQuery, [groupId]);
  return updatedGroupResult[0];
};

/**
 * 
 * @param {string} courseId - The ID of the course
 * @param {string} groupId - The ID of the group to delete
 * @returns {Promise<void>} - A promise that resolves when the group is deleted
 */
export async function deleteCourseGroup(courseId, groupId) {
  // First, remove the association with the course
  const deleteGroupQuery = `
      DELETE FROM groups
      WHERE group_id = $1 
      AND group_id IN (
          SELECT group_id 
          FROM course_groups 
          WHERE course_id = $2
          );
      `;
  const result = await queryService.executeRawQuery(deleteGroupQuery, [groupId, courseId]);
    
  if (result.rowCount === 0) {
    throw new Error('Group not found or does not belong to this course');
  }

};