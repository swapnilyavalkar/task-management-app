import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listTasks } from '../graphql/queries';

const client = generateClient();

const TaskList = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const apiData = await client.graphql({ query: listTasks });
      console.log("Fetched tasks: ", apiData); // Added console log to verify data fetching
      const tasksFromAPI = apiData.data.listTasks.items;
      setTasks(tasksFromAPI);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  }

  return (
    <div>
      <h1>Task List</h1>
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.name}</h3>
          <p>{task.description}</p>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
