const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticate = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Helper function to check user's permission for a task list
 */
async function getUserPermission(taskListId, userId) {
  const taskList = await prisma.taskList.findUnique({
    where: { id: taskListId },
    include: {
      shares: {
        where: { userId }
      }
    }
  });

  if (!taskList) {
    return { hasAccess: false, permission: null, taskList: null };
  }

  const isOwner = taskList.ownerId === userId;
  const share = taskList.shares[0];

  if (isOwner) {
    return { hasAccess: true, permission: 'owner', taskList, isOwner: true };
  }

  if (share) {
    return { hasAccess: true, permission: share.permission, taskList, isOwner: false };
  }

  return { hasAccess: false, permission: null, taskList: null };
}

/**
 * GET /api/tasks/:taskListId
 * Get all tasks in a task list
 */
router.get('/:taskListId', async (req, res) => {
  try {
    const { taskListId } = req.params;
    const userId = req.user.id;

    // Check access
    const { hasAccess, permission } = await getUserPermission(taskListId, userId);

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'You do not have access to this task list' 
      });
    }

    // Get tasks
    const tasks = await prisma.task.findMany({
      where: { taskListId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      tasks,
      permission
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks' 
    });
  }
});

/**
 * POST /api/tasks/:taskListId
 * Create a new task in a task list
 */
router.post(
  '/:taskListId',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed'])
      .withMessage('Invalid status'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { taskListId } = req.params;
      const { title, description, status } = req.body;
      const userId = req.user.id;

      // Check access - need edit permission
      const { hasAccess, permission } = await getUserPermission(taskListId, userId);

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'You do not have access to this task list' 
        });
      }

      if (permission === 'view') {
        return res.status(403).json({ 
          error: 'You need edit permission to add tasks' 
        });
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          title,
          description: description || null,
          status: status || 'pending',
          taskListId,
        }
      });

      res.status(201).json({
        message: 'Task created successfully',
        task
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ 
        error: 'Failed to create task' 
      });
    }
  }
);

/**
 * PUT /api/tasks/:taskListId/:taskId
 * Update a task
 */
router.put(
  '/:taskListId/:taskId',
  [
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Title cannot be empty')
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed'])
      .withMessage('Invalid status'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { taskListId, taskId } = req.params;
      const { title, description, status } = req.body;
      const userId = req.user.id;

      // Check access - need edit permission
      const { hasAccess, permission } = await getUserPermission(taskListId, userId);

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'You do not have access to this task list' 
        });
      }

      if (permission === 'view') {
        return res.status(403).json({ 
          error: 'You need edit permission to update tasks' 
        });
      }

      // Check if task exists and belongs to the task list
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!existingTask) {
        return res.status(404).json({ 
          error: 'Task not found' 
        });
      }

      if (existingTask.taskListId !== taskListId) {
        return res.status(400).json({ 
          error: 'Task does not belong to this task list' 
        });
      }

      // Build update data
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;

      // Update task
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData
      });

      res.json({
        message: 'Task updated successfully',
        task: updatedTask
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ 
        error: 'Failed to update task' 
      });
    }
  }
);

/**
 * PATCH /api/tasks/:taskListId/:taskId/status
 * Update task status (for quick status changes)
 */
router.patch(
  '/:taskListId/:taskId/status',
  [
    body('status')
      .isIn(['pending', 'in_progress', 'completed'])
      .withMessage('Invalid status'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { taskListId, taskId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Check access - need edit permission
      const { hasAccess, permission } = await getUserPermission(taskListId, userId);

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'You do not have access to this task list' 
        });
      }

      if (permission === 'view') {
        return res.status(403).json({ 
          error: 'You need edit permission to update task status' 
        });
      }

      // Check if task exists and belongs to the task list
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!existingTask) {
        return res.status(404).json({ 
          error: 'Task not found' 
        });
      }

      if (existingTask.taskListId !== taskListId) {
        return res.status(400).json({ 
          error: 'Task does not belong to this task list' 
        });
      }

      // Update task status
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { status }
      });

      res.json({
        message: 'Task status updated successfully',
        task: updatedTask
      });
    } catch (error) {
      console.error('Update task status error:', error);
      res.status(500).json({ 
        error: 'Failed to update task status' 
      });
    }
  }
);

/**
 * DELETE /api/tasks/:taskListId/:taskId
 * Delete a task
 */
router.delete('/:taskListId/:taskId', async (req, res) => {
  try {
    const { taskListId, taskId } = req.params;
    const userId = req.user.id;

    // Check access - need edit permission
    const { hasAccess, permission } = await getUserPermission(taskListId, userId);

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'You do not have access to this task list' 
      });
    }

    if (permission === 'view') {
      return res.status(403).json({ 
        error: 'You need edit permission to delete tasks' 
      });
    }

    // Check if task exists and belongs to the task list
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    if (existingTask.taskListId !== taskListId) {
      return res.status(400).json({ 
        error: 'Task does not belong to this task list' 
        });
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId }
    });

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      error: 'Failed to delete task' 
    });
  }
});

module.exports = router;
