import React, { useState, useEffect } from "react";
import './index.css';
import "@aws-amplify/ui-react/styles.css";
import TaskModal from './TaskModal';
import HistoryModal from './HistoryModal';
import { FiPlus, FiEdit, FiTrash, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Button, Flex, Heading, Text, View, Card, Table, TableBody, TableHead, TableRow, TableCell, Menu, MenuItem, SelectField, Pagination, SearchField, DateField } from "@aws-amplify/ui-react";

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

const App = ({ signOut }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [showArchived, setShowArchived] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const tasksPerPage = 10;

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, statusFilter, searchQuery, currentPage, showArchived, startDateFilter, endDateFilter]);

  async function fetchTasks() {
    try {
      const response = await fetch('http://localhost:5000/tasks');
      const tasksFromAPI = await response.json();
      
      const activeTasks = tasksFromAPI.filter(task => task.is_deleted === false);
      const archivedTasks = tasksFromAPI.filter(task => task.status === 'Completed' || task.status === 'Overdue');

      const tasksWithNotesAndUsers = await Promise.all(
        activeTasks.map(async task => {
          const notesResponse = await fetch(`http://localhost:5000/notes?task_id=${task.task_id}`);
          const notes = await notesResponse.json();
          const assignedUser = users.find(user => user.user_id === task.assigned_to);  // Fetch the assigned user's name

          return {
            ...task,
            notes: notes || [],
            assigned_to_name: assignedUser ? assignedUser.name : "Unknown"  // Use "Unknown" if user is not found
          };
        })
      );
  
      setTasks(tasksWithNotesAndUsers);
      setFilteredTasks(tasksWithNotesAndUsers);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch('http://localhost:5000/users');
      const usersFromAPI = await response.json();
      setUsers(usersFromAPI);
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  }

  const applyFilters = () => {
    let updatedTasks = tasks;

    if (statusFilter !== "All") {
      updatedTasks = updatedTasks.filter(task => task.status === statusFilter);
    }

    if (searchQuery) {
      updatedTasks = updatedTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (startDateFilter && endDateFilter) {
      updatedTasks = updatedTasks.filter(task => 
        new Date(task.start_date) >= new Date(startDateFilter) &&
        new Date(task.end_date) <= new Date(endDateFilter)
      );
    }

    if (showArchived) {
      updatedTasks = updatedTasks.filter(task => task.status === 'Completed' || task.status === 'Overdue');
    }

    const startIndex = (currentPage - 1) * tasksPerPage;
    const paginatedTasks = updatedTasks.slice(startIndex, startIndex + tasksPerPage);

    setFilteredTasks(paginatedTasks);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (e, type) => {
    const value = e.target.value;
    if (type === 'start') {
      setStartDateFilter(value);
    } else {
      setEndDateFilter(value);
    }
  };

  const toggleRowExpansion = (task_id) => {
    setExpandedRows(prevState => ({
      ...prevState,
      [task_id]: !prevState[task_id]
    }));
  };

  async function handleTaskSubmit(event) {
    event.preventDefault();
  
    const form = new FormData(event.target);
    const isUpdating = selectedTask !== null;
    const currentUser = 1; // Assuming this represents the current logged-in user
  
    const taskData = {
      title: form.get("name") || selectedTask.title,
      description: form.get("description") || selectedTask.description,
      priority: form.get("priority") || selectedTask.priority,
      status: form.get("status") || selectedTask.status,
      assigned_to: form.get("assignedTo") || selectedTask.assigned_to,
      dependencies: form.get("dependencies") || selectedTask.dependencies,
      start_date: new Date(form.get("startDate")).toISOString() || selectedTask.start_date,
      end_date: new Date(form.get("endDate")).toISOString() || selectedTask.end_date,
      notes: form.get("notes") || ''
    };    
  
    try {
      if (isUpdating) {
        const taskId = selectedTask.task_id;
  
        await fetch(`http://localhost:5000/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        });
      }
  
      fetchTasks(); // Refresh tasks
      setSelectedTask(null); // Reset selected task
      setShowModal(false); // Close the modal
    } catch (error) {
      console.error("Error saving task: ", error);
    }
  }
  

  async function deleteTask({ task_id }) {
    try {
      const currentUser = 1;
      const response = await fetch(`http://localhost:5000/tasks/${task_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser })
      });

      if (response.ok) {
        fetchTasks();
      } else {
        console.error("Error deleting task:", await response.json());
        alert('Failed to delete task');
      }
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  }

  const handleUpdate = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedTaskForHistory(null);
  };

  const handleShowNotesHistory = async (task) => {
    try {
      const auditResponse = await fetch(`http://localhost:5000/audit_log?task_id=${task.task_id}`);
      const auditLog = await auditResponse.json();
  
      const notesResponse = await fetch(`http://localhost:5000/notes?task_id=${task.task_id}`);
      const notes = await notesResponse.json();
  
      setSelectedTaskForHistory({ ...task, auditLog, notes });
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error fetching task history:", error);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High':
        return <span style={{ color: 'red' }}>⬤</span>;
      case 'Medium':
        return <span style={{ color: 'orange' }}>⬤</span>;
      case 'Low':
        return <span style={{ color: 'green' }}>⬤</span>;
      default:
        return <span>⬤</span>;
    }
  };

  return (
    <View className="App" padding="2rem">
      <Flex justifyContent="space-between" alignItems="center">
        <Heading level={1} className="app-title">Platform Activity Management</Heading>
        <Menu>
          <MenuItem>Account Info</MenuItem>
          <MenuItem>Reset Password</MenuItem>
          <MenuItem>Help</MenuItem>
          <MenuItem>About</MenuItem>
          <MenuItem onClick={signOut}>Sign Out</MenuItem>
        </Menu>
      </Flex>

      <Flex direction="row" justifyContent="space-between" margin="2rem 0">
        <SearchField
          placeholder="Search tasks..."
          onChange={handleSearchChange}
          value={searchQuery}
        />
        <SelectField label="Team Member Filter" onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="All">All</option>
          {users.map(user => (
            <option key={user.user_id} value={user.user_id}>{user.name}</option>
          ))}
        </SelectField>
        <Button variation="link" onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </Flex>

      <Flex direction="row" justifyContent="space-between" margin="1rem 0">
        <label>Start Date:</label>
        <input 
          type="date" 
          value={startDateFilter} 
          onChange={(e) => handleDateFilterChange(e, 'start')}
        />
        
        <label>End Date:</label>
        <input 
          type="date" 
          value={endDateFilter} 
          onChange={(e) => handleDateFilterChange(e, 'end')} 
        />
      </Flex>

      <Flex direction="row" justifyContent="space-around" margin="2rem 0">
        <Card style={{ backgroundColor: '#d4af37' }} padding="1.5rem" minWidth="10rem" onClick={() => setStatusFilter('New')}>
          <Heading level={4}>New</Heading>
          <Text>{tasks.filter(task => task.status === 'New').length} tasks</Text>
        </Card>
        <Card backgroundColor="orange" padding="1.5rem" minWidth="10rem" onClick={() => setStatusFilter('In Progress')}>
          <Heading level={4}>In Progress</Heading>
          <Text>{tasks.filter(task => task.status === 'In Progress').length} tasks</Text>
        </Card>
        <Card backgroundColor="green" padding="1.5rem" minWidth="10rem" onClick={() => setStatusFilter('Completed')}>
          <Heading level={4}>Completed</Heading>
          <Text>{tasks.filter(task => task.status === 'Completed').length} tasks</Text>
        </Card>
        <Card backgroundColor="red" padding="1.5rem" minWidth="10rem" onClick={() => setStatusFilter('Overdue')}>
          <Heading level={4}>Overdue</Heading>
          <Text>{tasks.filter(task => task.status === 'Overdue').length} tasks</Text>
        </Card>
        <Card backgroundColor="gray" padding="1.5rem" minWidth="10rem" onClick={() => setStatusFilter('All')}>
          <Heading level={4}>All</Heading>
          <Text>Show All</Text>
        </Card>
      </Flex>

      <Flex justifyContent="space-between" alignItems="center" margin="1rem 0">
        <Heading level={2}>Tasks List - {statusFilter}</Heading>
        <Button onClick={handleAddTask} variation="primary" size="large">
          <FiPlus size={20} />
        </Button>
      </Flex>

      <View className="table-container" margin="3rem 0">
        <Table highlightOnHover striped="true" variation="default" style={{ tableLayout: "auto", width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Updates</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.map((task) => (
              <React.Fragment key={task.task_id}>  {/* Use a unique key here */}
                <TableRow>
                  <TableCell>
                    <Button variation="link" onClick={() => toggleRowExpansion(task.task_id)}>
                      {expandedRows[task.task_id] ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </Button>
                  </TableCell>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>{getPriorityIcon(task.priority)}</TableCell>
                  <TableCell>{task.assigned_to_name}</TableCell> {/* Show the assigned user's name */}
                  <TableCell>{formatDate(task.start_date)}</TableCell>
                  <TableCell>{formatDate(task.end_date)}</TableCell>
                  <TableCell>
                    <Button variation="link" onClick={() => handleShowNotesHistory(task)}>
                      {task.notes.length > 0 ? (
                        <Text>{task.notes.length} Updates</Text>
                      ) : (
                        <Text>No Updates</Text>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button variation="link" onClick={() => handleUpdate(task)}>
                      <FiEdit size={20} />
                    </Button>
                    <Button variation="link" onClick={() => deleteTask(task)}>
                      <FiTrash size={20} />
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows[task.task_id] && (
                  <TableRow>
                    <TableCell colSpan="9">
                      <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', border: '1px solid #ccc' }}>
                        <Text>Dependencies: {task.dependencies}</Text>
                        <Text>Notes:</Text>
                        <ul>
                          {task.notes.map(note => (
                            <li key={note.note_id}>{note.note_text} (by {note.username})</li>
                          ))}
                        </ul>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </View>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(tasks.length / tasksPerPage)}
        onChange={(page) => setCurrentPage(page)}
      />

      {showModal && (
        <TaskModal
          show={showModal}
          onClose={handleCloseModal}
          task={selectedTask}
          onSubmit={handleTaskSubmit}
          users={users}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          task={selectedTaskForHistory}
          history={selectedTaskForHistory?.notes || []}
          onClose={handleCloseHistoryModal}
        />
      )}
    </View>
  );
};

export default App;
