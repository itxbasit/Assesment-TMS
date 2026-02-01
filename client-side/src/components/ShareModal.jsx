import React, { useState, useEffect } from "react";
import { shareAPI } from "../services/api";
import "../styles/modal.css";

const ShareModal = ({ taskList, onClose }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      const response = await shareAPI.getShares(taskList.id);
      setShares(response.data.shares || []);
    } catch (error) {
      console.error("Error fetching shares:", error);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await shareAPI.create(taskList.id, email, permission);
      setEmail("");
      setPermission("view");
      fetchShares();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to share task list");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (shareId, newPermission) => {
    try {
      await shareAPI.updatePermission(taskList.id, shareId, newPermission);
      fetchShares();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to update permission");
    }
  };

  const handleRemoveAccess = async (shareId) => {
    if (
      window.confirm("Are you sure you want to remove access for this user?")
    ) {
      try {
        await shareAPI.removeAccess(taskList.id, shareId);
        fetchShares();
      } catch (error) {
        alert(error.response?.data?.error || "Failed to remove access");
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-wide">
        <div className="modal-header">
          <h2 className="modal-title">Share "{taskList.title}"</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        {/* Share Form */}
        <form onSubmit={handleShare} className="share-form">
          {error && <div className="error-message">{error}</div>}

          <div className="share-form-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input share-email-input"
              placeholder="Enter user email"
              required
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="form-input share-permission-select"
            >
              <option value="view">View</option>
              <option value="edit">Edit</option>
            </select>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Sharing..." : "Share"}
            </button>
          </div>
          <p className="share-hint">
            User must be registered in the system to receive access
          </p>
        </form>

        {/* Shared Users List */}
        <div>
          <h3 className="shares-list-title">Shared with ({shares.length})</h3>
          {shares.length === 0 ? (
            <p className="empty-state">Not shared with anyone yet</p>
          ) : (
            <div className="shares-list">
              {shares.map((share) => (
                <div key={share.id} className="share-item">
                  <div className="share-user-info">
                    <div className="share-avatar">
                      <span className="share-avatar-text">
                        {share.user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="share-user-email">{share.user.email}</p>
                      <p className="share-date">
                        Shared on{" "}
                        {new Date(share.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="share-actions">
                    <select
                      value={share.permission}
                      onChange={(e) =>
                        handleUpdatePermission(share.id, e.target.value)
                      }
                      className="share-permission-select"
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                    </select>
                    <button
                      onClick={() => handleRemoveAccess(share.id)}
                      className="btn-remove-access"
                      title="Remove access"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="permissions-info">
          <h4 className="permissions-info-title">Permission Levels:</h4>
          <ul className="permissions-info-list">
            <li>
              <strong>View:</strong> Can only view tasks
            </li>
            <li>
              <strong>Edit:</strong> Can create, edit, and delete tasks
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
