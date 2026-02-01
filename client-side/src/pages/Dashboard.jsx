import React, { useState, useEffect } from "react";
import { taskListAPI, taskAPI } from "../services/api";
import Navbar from "../components/Navbar";
import TaskListModal from "../components/TaskListModal";
import TaskModal from "../components/TaskModal";
import ShareModal from "../components/ShareModal";
import "../styles/dashboard.css";

const Dashboard = () => {
  const [taskLists, setTaskLists] = useState([]);
  const [selectedTaskList, setSelectedTaskList] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskListModal, setShowTaskListModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingTaskList, setEditingTaskList] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTaskLists();
  }, []);

  useEffect(() => {
    if (selectedTaskList) {
      fetchTasks(selectedTaskList.id);
    }
  }, [selectedTaskList]);

  const fetchTaskLists = async () => {
    try {
      const response = await taskListAPI.getAll();
      setTaskLists(response.data.all || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching task lists:", error);
      setLoading(false);
    }
  };

  const fetchTasks = async (taskListId) => {
    try {
      const response = await taskAPI.getAll(taskListId);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleCreateTaskList = async (title) => {
    try {
      await taskListAPI.create(title);
      fetchTaskLists();
      setShowTaskListModal(false);
    } catch (error) {
      console.error("Error creating task list:", error);
    }
  };

  const handleUpdateTaskList = async (id, title) => {
    try {
      await taskListAPI.update(id, title);
      fetchTaskLists();
      setShowTaskListModal(false);
      setEditingTaskList(null);
    } catch (error) {
      console.error("Error updating task list:", error);
    }
  };

  const handleDeleteTaskList = async (id) => {
    if (window.confirm("Are you sure you want to delete this task list?")) {
      try {
        await taskListAPI.delete(id);
        fetchTaskLists();
        if (selectedTaskList?.id === id) {
          setSelectedTaskList(null);
          setTasks([]);
        }
      } catch (error) {
        console.error("Error deleting task list:", error);
        alert(error.response?.data?.error || "Failed to delete task list");
      }
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await taskAPI.create(selectedTaskList.id, taskData);
      fetchTasks(selectedTaskList.id);
      setShowTaskModal(false);
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.response?.data?.error || "Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      await taskAPI.update(selectedTaskList.id, taskId, taskData);
      fetchTasks(selectedTaskList.id);
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      alert(error.response?.data?.error || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await taskAPI.delete(selectedTaskList.id, taskId);
        fetchTasks(selectedTaskList.id);
      } catch (error) {
        console.error("Error deleting task:", error);
        alert(error.response?.data?.error || "Failed to delete task");
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(selectedTaskList.id, taskId, newStatus);
      fetchTasks(selectedTaskList.id);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.response?.data?.error || "Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "in_progress":
        return "status-in_progress";
      default:
        return "status-pending";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      default:
        return "Pending";
    }
  };

  const canEdit =
    selectedTaskList &&
    (selectedTaskList.permission === "owner" ||
      selectedTaskList.permission === "edit");
  const isOwner = selectedTaskList && selectedTaskList.permission === "owner";

  if (loading) {
    return (
      <div className="dashboard">
        <Navbar />
        <div className="loading-state">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-grid">
          {/* Task Lists Sidebar */}
          <div>
            <div className="sidebar-card">
              <div className="sidebar-header">
                <h2 className="sidebar-title">Task Lists</h2>
                <button
                  onClick={() => setShowTaskListModal(true)}
                  className="btn-new"
                >
                  + New
                </button>
              </div>

              <div className="task-lists">
                {taskLists.length === 0 ? (
                  <p className="empty-state">No task lists yet</p>
                ) : (
                  taskLists.map((list) => (
                    <div
                      key={list.id}
                      className={`task-list-item ${
                        selectedTaskList?.id === list.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedTaskList(list)}
                    >
                      <div className="task-list-content">
                        <div className="task-list-info">
                          <h3 className="task-list-title">{list.title}</h3>
                          <div className="task-list-meta">
                            <span
                              className={`badge ${
                                list.isOwner ? "badge-owner" : "badge-shared"
                              }`}
                            >
                              {list.isOwner ? "Owner" : list.permission}
                            </span>
                            <span className="task-count">
                              {list.tasks?.length || 0} tasks
                            </span>
                          </div>
                        </div>
                        {list.isOwner && (
                          <div className="task-list-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTaskList(list);
                                setShowTaskListModal(true);
                              }}
                              className="icon-btn"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTaskList(list.id);
                              }}
                              className="icon-btn delete"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tasks Main Area */}
          <div>
            {selectedTaskList ? (
              <div className="main-card">
                <div className="main-header">
                  <div>
                    <h2 className="main-title">{selectedTaskList.title}</h2>
                    <p className="main-subtitle">
                      {selectedTaskList.isOwner
                        ? "You own this list"
                        : `Shared with ${selectedTaskList.permission} permission`}
                    </p>
                  </div>
                  <div className="main-actions">
                    {isOwner && (
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="btn-share"
                      >
                        👥 Share
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => setShowTaskModal(true)}
                        className="btn-add"
                      >
                        + Add Task
                      </button>
                    )}
                  </div>
                </div>

                <div className="tasks-container">
                  {tasks.length === 0 ? (
                    <p className="empty-state">
                      No tasks yet. Create one to get started!
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="task-card">
                        <div className="task-content">
                          <div className="task-info">
                            <h3 className="task-title">{task.title}</h3>
                            {task.description && (
                              <p className="task-description">
                                {task.description}
                              </p>
                            )}
                            <div className="task-meta">
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  handleStatusChange(task.id, e.target.value)
                                }
                                disabled={!canEdit}
                                className={`status-select ${getStatusColor(task.status)}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                              <span className="task-date">
                                {new Date(task.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="task-actions">
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setShowTaskModal(true);
                                }}
                                className="icon-btn"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="icon-btn delete"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="main-card">
                <p className="empty-state">Select a task list to view tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTaskListModal && (
        <TaskListModal
          taskList={editingTaskList}
          onClose={() => {
            setShowTaskListModal(false);
            setEditingTaskList(null);
          }}
          onSave={editingTaskList ? handleUpdateTaskList : handleCreateTaskList}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
        />
      )}

      {showShareModal && selectedTaskList && (
        <ShareModal
          taskList={selectedTaskList}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
