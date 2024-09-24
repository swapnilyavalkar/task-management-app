const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Fetch all users to populate the assigned_to dropdown
app.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT user_id, name FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new task
app.post('/tasks', async (req, res) => {
  const { title, description, priority, status, assigned_to, start_date, end_date, dependencies } = req.body;

  try {
    // Log incoming task data
  console.log('Received Task Data:', req.body);
    const result = await db.query(
      'INSERT INTO tasks (title, description, priority, status, assigned_to, start_date, end_date, dependencies, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *',
      [title, description, priority, status, assigned_to, start_date, end_date, dependencies]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Fetch notes for a task or a specific note by note_id
app.get('/notes', async (req, res) => {
  const { task_id, note_id } = req.query;

  try {
    let result;
    if (note_id) {
      result = await db.query('SELECT * FROM notes WHERE note_id = $1', [note_id]);
    } else if (task_id) {
      result = await db.query('SELECT * FROM notes WHERE task_id = $1 ORDER BY created_at DESC', [task_id]);
    } else {
      return res.status(400).json({ error: 'Either task_id or note_id is required' });
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Update a task by ID, only update the columns that are provided in the request body
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, assigned_to, start_date, end_date, dependencies, notes } = req.body;
  const currentUser = 1; // Placeholder for current user

  try {
    const currentTask = await db.query('SELECT * FROM tasks WHERE task_id = $1', [id]);

    if (!currentTask.rows.length) {
      return res.status(404).json({ message: "Task not found" });
    }

    const currentTaskData = currentTask.rows[0];
    const taskUpdates = {};

    for (let key in req.body) {
      if (req.body[key] !== currentTaskData[key] && key !== 'notes') {
        taskUpdates[key] = req.body[key];
      }
    }

    if (Object.keys(taskUpdates).length > 0) {
      const fieldsToUpdate = Object.keys(taskUpdates).map((key, index) => `${key} = $${index + 1}`).join(', ');
      const values = Object.values(taskUpdates).concat([id]);

      await db.query(`UPDATE tasks SET ${fieldsToUpdate} WHERE task_id = $${values.length}`, values);
    }

    if (notes) {
      const newNote = {
        task_id: id,
        username: "CurrentUser", 
        note_text: notes,
        created_by: currentUser,
        updated_by: currentUser,
      };

      await db.query('INSERT INTO notes (task_id, username, note_text, created_by, updated_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())', [
        id,
        newNote.username,
        newNote.note_text,
        newNote.created_by,
        newNote.updated_by
      ]);
    }

    // Log task changes
    const logTaskChanges = async (taskId, updates, currentTaskData, userId) => {
      const auditEntries = [];

      for (let key in updates) {
        if (updates[key] !== currentTaskData[key]) {
          auditEntries.push({
            task_id: taskId,
            field_name: key,
            old_value: currentTaskData[key] === null ? "None" : currentTaskData[key],
            new_value: updates[key],
            changed_by: userId,
          });
        }
      }

      if (auditEntries.length > 0) {
        for (let entry of auditEntries) {
          await db.query(
            'INSERT INTO audit_log (task_id, field_name, old_value, new_value, changed_by, change_date) VALUES ($1, $2, $3, $4, $5, NOW())',
            [entry.task_id, entry.field_name, entry.old_value, entry.new_value, entry.changed_by]
          );
        }
      }
    };

    await logTaskChanges(id, taskUpdates, currentTaskData, currentUser);

    res.json({ message: "Task updated successfully" });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Insert a new note for a task
app.post('/notes', async (req, res) => {
  const { task_id, username, note_text, created_by, updated_by } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO notes (task_id, username, note_text, created_by, updated_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [task_id, username, note_text, created_by, updated_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to insert note' });
  }
});

// Delete a task and log the action in the audit log
app.delete('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const { user_id } = req.body;

  try {
    const taskQuery = await db.query('SELECT * FROM tasks WHERE task_id = $1', [taskId]);
    const task = taskQuery.rows[0];

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await db.query(
      `INSERT INTO audit_log (task_id, field_name, old_value, new_value, changed_by, change_date)
      VALUES ($1, $2, $3, $4, $5, NOW())`,
      [taskId, 'Task Deleted', JSON.stringify(task), null, user_id]
    );

    await db.query('DELETE FROM tasks WHERE task_id = $1', [taskId]);

    res.status(200).json({ message: 'Task deleted and logged in audit' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Fetch tasks with optional filters for archived tasks
app.get('/tasks', async (req, res) => {
  try {
    const { statusFilter, startDateFilter, endDateFilter } = req.query;

    let query = 'SELECT * FROM tasks WHERE is_deleted = FALSE';
    const values = [];

    if (statusFilter) {
      query += ` AND status = $1`;
      values.push(statusFilter);
    }

    if (startDateFilter && endDateFilter) {
      query += ` AND start_date >= $2 AND end_date <= $3`;
      values.push(new Date(startDateFilter), new Date(endDateFilter));
    }

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Route to fetch audit log for a specific task
app.get('/audit_log', async (req, res) => {
  const { task_id } = req.query;

  if (!task_id) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    const result = await db.query('SELECT * FROM audit_log WHERE task_id = $1', [task_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching audit log:', err);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
