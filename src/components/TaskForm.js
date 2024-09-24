import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { createTask, updateTask } from '../graphql/mutations';

const client = generateClient();

const TaskForm = ({ selectedTask }) => {
  const [task, setTask] = useState(selectedTask || {});

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      priority: form.get("priority"),
      status: form.get("status"),
      assignedTo: form.get("assignedTo"),
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      notes: form.get("notes"),
      dependencies: form.get("dependencies"),
    };

    try {
      await client.graphql({
        query: task.id ? updateTask : createTask,
        variables: { input: data },
      });

      setTask({});
    } catch (error) {
      console.error("Error creating/updating task: ", error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Task Name" defaultValue={task.name || ''} required />
      <input name="description" placeholder="Task Description" defaultValue={task.description || ''} required />
      <button type="submit">{task.id ? "Update Task" : "Add Task"}</button>
    </form>
  );
};

export default TaskForm;
