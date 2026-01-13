import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:3001';

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  // Attempt to parse JSON even on errors (FastAPI returns JSON detail)
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.detail || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// PUBLIC_INTERFACE
function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [error, setError] = useState('');

  const remainingCount = useMemo(
    () => tasks.filter(t => !t.completed).length,
    [tasks]
  );

  const loadTasks = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/tasks', { method: 'GET' });
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const onAdd = async e => {
    e.preventDefault();
    setError('');
    const title = newTitle.trim();
    if (!title) {
      setError('Title is required.');
      return;
    }
    try {
      const created = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description: newDescription.trim() }),
      });
      setTasks(prev => [created, ...prev]);
      setNewTitle('');
      setNewDescription('');
    } catch (e2) {
      setError(e2.message || 'Failed to create task');
    }
  };

  const startEdit = task => {
    setError('');
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const saveEdit = async taskId => {
    setError('');
    const title = editTitle.trim();
    if (!title) {
      setError('Title is required.');
      return;
    }
    try {
      const updated = await apiRequest(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          description: editDescription.trim(),
        }),
      });
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      cancelEdit();
    } catch (e) {
      setError(e.message || 'Failed to update task');
    }
  };

  const toggleCompleted = async task => {
    setError('');
    try {
      const updated = await apiRequest(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed }),
      });
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
    } catch (e) {
      setError(e.message || 'Failed to toggle completion');
    }
  };

  const removeTask = async taskId => {
    setError('');
    try {
      await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (editingId === taskId) cancelEdit();
    } catch (e) {
      setError(e.message || 'Failed to delete task');
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <h1 className="title">To‑Do List</h1>
          <p className="subtitle">
            {remainingCount} remaining • {tasks.length} total
          </p>
        </div>
      </header>

      <main className="container">
        <section className="card">
          <h2 className="section-title">Add a task</h2>

          <form onSubmit={onAdd} className="form" aria-label="Add task form">
            <div className="form-row">
              <label className="label" htmlFor="newTitle">
                Title
              </label>
              <input
                id="newTitle"
                className="input"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g., Buy groceries"
                maxLength={200}
              />
            </div>

            <div className="form-row">
              <label className="label" htmlFor="newDescription">
                Description (optional)
              </label>
              <input
                id="newDescription"
                className="input"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="e.g., Eggs, milk, bread"
                maxLength={2000}
              />
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                Add task
              </button>
              <button className="btn btn-ghost" type="button" onClick={loadTasks}>
                Refresh
              </button>
            </div>

            {error ? <div className="alert" role="alert">{error}</div> : null}
          </form>
        </section>

        <section className="card">
          <h2 className="section-title">Tasks</h2>

          {loading ? (
            <div className="muted">Loading…</div>
          ) : tasks.length === 0 ? (
            <div className="muted">No tasks yet. Add one above.</div>
          ) : (
            <ul className="list" aria-label="Task list">
              {tasks.map(task => {
                const isEditing = editingId === task.id;

                return (
                  <li key={task.id} className={`item ${task.completed ? 'item-completed' : ''}`}>
                    <div className="item-left">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={!!task.completed}
                        onChange={() => toggleCompleted(task)}
                        aria-label={`Mark task ${task.title} as ${task.completed ? 'not completed' : 'completed'}`}
                      />
                    </div>

                    <div className="item-main">
                      {isEditing ? (
                        <div className="edit">
                          <input
                            className="input"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            maxLength={200}
                            aria-label="Edit title"
                          />
                          <input
                            className="input"
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            maxLength={2000}
                            aria-label="Edit description"
                          />
                          <div className="row">
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => saveEdit(task.id)}
                            >
                              Save
                            </button>
                            <button className="btn btn-ghost" type="button" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="item-title">{task.title}</div>
                          {task.description ? (
                            <div className="item-desc">{task.description}</div>
                          ) : null}
                          <div className="meta">
                            Updated: {task.updated_at?.replace('T', ' ')?.replace('+00:00', ' UTC')}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="item-actions">
                      {!isEditing ? (
                        <button className="btn btn-secondary" type="button" onClick={() => startEdit(task)}>
                          Edit
                        </button>
                      ) : null}
                      <button className="btn btn-danger" type="button" onClick={() => removeTask(task.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="footer">
          <div className="footer-inner">
            <span className="muted">
              Backend: <code>{API_BASE}</code>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
