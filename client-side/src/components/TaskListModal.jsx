import React, { useState, useEffect } from "react";
import "../styles/modal.css";

const TaskListModal = ({ taskList, onClose, onSave }) => {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (taskList) {
      setTitle(taskList.title);
    }
  }, [taskList]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskList) {
      onSave(taskList.id, title);
    } else {
      onSave(title);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">
          {taskList ? "Edit Task List" : "Create Task List"}
        </h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Enter task list title"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {taskList ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskListModal;
