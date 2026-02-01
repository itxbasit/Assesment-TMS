const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticate = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/shares/:taskListId
 * Share a task list with another user
 */
router.post(
  '/:taskListId',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('permission')
      .isIn(['view', 'edit'])
      .withMessage('Permission must be either "view" or "edit"'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { taskListId } = req.params;
      const { email, permission } = req.body;
      const userId = req.user.id;

      // Check if task list exists and user is the owner
      const taskList = await prisma.taskList.findUnique({
        where: { id: taskListId }
      });

      if (!taskList) {
        return res.status(404).json({ 
          error: 'Task list not found' 
        });
      }

      if (taskList.ownerId !== userId) {
        return res.status(403).json({ 
          error: 'Only the owner can share the task list' 
        });
      }

      // Find the user to share with
      const userToShareWith = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true }
      });

      if (!userToShareWith) {
        return res.status(404).json({ 
          error: 'User with this email is not registered in the system' 
        });
      }

      // Can't share with yourself
      if (userToShareWith.id === userId) {
        return res.status(400).json({ 
          error: 'You cannot share a task list with yourself' 
        });
      }

      // Check if already shared
      const existingShare = await prisma.taskListShare.findUnique({
        where: {
          taskListId_userId: {
            taskListId,
            userId: userToShareWith.id
          }
        }
      });

      if (existingShare) {
        return res.status(400).json({ 
          error: 'Task list is already shared with this user' 
        });
      }

      // Create share
      const share = await prisma.taskListShare.create({
        data: {
          taskListId,
          userId: userToShareWith.id,
          permission,
        },
        include: {
          user: {
            select: { id: true, email: true }
          }
        }
      });

      res.status(201).json({
        message: 'Task list shared successfully',
        share
      });
    } catch (error) {
      console.error('Share task list error:', error);
      res.status(500).json({ 
        error: 'Failed to share task list' 
      });
    }
  }
);

/**
 * GET /api/shares/:taskListId
 * Get all users a task list is shared with
 */
router.get('/:taskListId', async (req, res) => {
  try {
    const { taskListId } = req.params;
    const userId = req.user.id;

    // Check if task list exists and user is the owner
    const taskList = await prisma.taskList.findUnique({
      where: { id: taskListId }
    });

    if (!taskList) {
      return res.status(404).json({ 
        error: 'Task list not found' 
      });
    }

    if (taskList.ownerId !== userId) {
      return res.status(403).json({ 
        error: 'Only the owner can view shared users' 
      });
    }

    // Get all shares for this task list
    const shares = await prisma.taskListShare.findMany({
      where: { taskListId },
      include: {
        user: {
          select: { id: true, email: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      shares
    });
  } catch (error) {
    console.error('Get shares error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shared users' 
    });
  }
});

/**
 * PUT /api/shares/:taskListId/:shareId
 * Update permission level for a shared user
 */
router.put(
  '/:taskListId/:shareId',
  [
    body('permission')
      .isIn(['view', 'edit'])
      .withMessage('Permission must be either "view" or "edit"'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { taskListId, shareId } = req.params;
      const { permission } = req.body;
      const userId = req.user.id;

      // Check if task list exists and user is the owner
      const taskList = await prisma.taskList.findUnique({
        where: { id: taskListId }
      });

      if (!taskList) {
        return res.status(404).json({ 
          error: 'Task list not found' 
        });
      }

      if (taskList.ownerId !== userId) {
        return res.status(403).json({ 
          error: 'Only the owner can update permissions' 
        });
      }

      // Check if share exists
      const share = await prisma.taskListShare.findUnique({
        where: { id: shareId }
      });

      if (!share) {
        return res.status(404).json({ 
          error: 'Share not found' 
        });
      }

      if (share.taskListId !== taskListId) {
        return res.status(400).json({ 
          error: 'Share does not belong to this task list' 
        });
      }

      // Update permission
      const updatedShare = await prisma.taskListShare.update({
        where: { id: shareId },
        data: { permission },
        include: {
          user: {
            select: { id: true, email: true }
          }
        }
      });

      res.json({
        message: 'Permission updated successfully',
        share: updatedShare
      });
    } catch (error) {
      console.error('Update permission error:', error);
      res.status(500).json({ 
        error: 'Failed to update permission' 
      });
    }
  }
);

/**
 * DELETE /api/shares/:taskListId/:shareId
 * Remove a user's access to a shared task list
 */
router.delete('/:taskListId/:shareId', async (req, res) => {
  try {
    const { taskListId, shareId } = req.params;
    const userId = req.user.id;

    // Check if task list exists and user is the owner
    const taskList = await prisma.taskList.findUnique({
      where: { id: taskListId }
    });

    if (!taskList) {
      return res.status(404).json({ 
        error: 'Task list not found' 
      });
    }

    if (taskList.ownerId !== userId) {
      return res.status(403).json({ 
        error: 'Only the owner can remove access' 
      });
    }

    // Check if share exists
    const share = await prisma.taskListShare.findUnique({
      where: { id: shareId }
    });

    if (!share) {
      return res.status(404).json({ 
        error: 'Share not found' 
      });
    }

    if (share.taskListId !== taskListId) {
      return res.status(400).json({ 
        error: 'Share does not belong to this task list' 
      });
    }

    // Delete share
    await prisma.taskListShare.delete({
      where: { id: shareId }
    });

    res.json({
      message: 'Access removed successfully'
    });
  } catch (error) {
    console.error('Remove access error:', error);
    res.status(500).json({ 
      error: 'Failed to remove access' 
    });
  }
});

module.exports = router;
