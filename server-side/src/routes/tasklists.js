const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticate = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/tasklists
 * Get all task lists for the authenticated user (owned + shared)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get owned task lists
    const ownedTaskLists = await prisma.taskList.findMany({
      where: { ownerId: userId },
      include: {
        tasks: true,
        shares: {
          include: {
            user: {
              select: { id: true, email: true }
            }
          }
        },
        owner: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get shared task lists
    const sharedTaskLists = await prisma.taskListShare.findMany({
      where: { userId },
      include: {
        taskList: {
          include: {
            tasks: true,
            owner: {
              select: { id: true, email: true }
            },
            shares: {
              include: {
                user: {
                  select: { id: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    // Format response
    const owned = ownedTaskLists.map(list => ({
      ...list,
      permission: 'owner',
      isOwner: true
    }));

    const shared = sharedTaskLists.map(share => ({
      ...share.taskList,
      permission: share.permission,
      isOwner: false
    }));

    res.json({
      owned,
      shared,
      all: [...owned, ...shared]
    });
  } catch (error) {
    console.error('Get task lists error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch task lists' 
    });
  }
});

/**
 * GET /api/tasklists/:id
 * Get a specific task list by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Find the task list
    const taskList = await prisma.taskList.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' }
        },
        owner: {
          select: { id: true, email: true }
        },
        shares: {
          include: {
            user: {
              select: { id: true, email: true }
            }
          }
        }
      }
    });

    if (!taskList) {
      return res.status(404).json({ 
        error: 'Task list not found' 
      });
    }

    // Check if user has access
    const isOwner = taskList.ownerId === userId;
    const share = taskList.shares.find(s => s.userId === userId);

    if (!isOwner && !share) {
      return res.status(403).json({ 
        error: 'You do not have access to this task list' 
      });
    }

    // Add permission info
    const response = {
      ...taskList,
      permission: isOwner ? 'owner' : share.permission,
      isOwner
    };

    res.json(response);
  } catch (error) {
    console.error('Get task list error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch task list' 
    });
  }
});

/**
 * POST /api/tasklists
 * Create a new task list
 */
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title } = req.body;
      const userId = req.user.id;

      // Create task list
      const taskList = await prisma.taskList.create({
        data: {
          title,
          ownerId: userId,
        },
        include: {
          owner: {
            select: { id: true, email: true }
          },
          tasks: true,
          shares: true
        }
      });

      res.status(201).json({
        message: 'Task list created successfully',
        taskList: {
          ...taskList,
          permission: 'owner',
          isOwner: true
        }
      });
    } catch (error) {
      console.error('Create task list error:', error);
      res.status(500).json({ 
        error: 'Failed to create task list' 
      });
    }
  }
);

/**
 * PUT /api/tasklists/:id
 * Update a task list
 */
router.put(
  '/:id',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title } = req.body;
      const userId = req.user.id;

      // Check if task list exists and user is the owner
      const taskList = await prisma.taskList.findUnique({
        where: { id }
      });

      if (!taskList) {
        return res.status(404).json({ 
          error: 'Task list not found' 
        });
      }

      if (taskList.ownerId !== userId) {
        return res.status(403).json({ 
          error: 'Only the owner can update the task list' 
        });
      }

      // Update task list
      const updatedTaskList = await prisma.taskList.update({
        where: { id },
        data: { title },
        include: {
          owner: {
            select: { id: true, email: true }
          },
          tasks: true,
          shares: {
            include: {
              user: {
                select: { id: true, email: true }
              }
            }
          }
        }
      });

      res.json({
        message: 'Task list updated successfully',
        taskList: {
          ...updatedTaskList,
          permission: 'owner',
          isOwner: true
        }
      });
    } catch (error) {
      console.error('Update task list error:', error);
      res.status(500).json({ 
        error: 'Failed to update task list' 
      });
    }
  }
);

/**
 * DELETE /api/tasklists/:id
 * Delete a task list (owner only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if task list exists and user is the owner
    const taskList = await prisma.taskList.findUnique({
      where: { id }
    });

    if (!taskList) {
      return res.status(404).json({ 
        error: 'Task list not found' 
      });
    }

    if (taskList.ownerId !== userId) {
      return res.status(403).json({ 
        error: 'Only the owner can delete the task list' 
      });
    }

    // Delete task list (cascade will delete tasks and shares)
    await prisma.taskList.delete({
      where: { id }
    });

    res.json({
      message: 'Task list deleted successfully'
    });
  } catch (error) {
    console.error('Delete task list error:', error);
    res.status(500).json({ 
      error: 'Failed to delete task list' 
    });
  }
});

module.exports = router;
