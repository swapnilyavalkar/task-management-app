import React from 'react';
import Modal from 'react-modal';
import { Button, Flex, TextField, SelectField } from '@aws-amplify/ui-react';

Modal.setAppElement('#root');

const TaskModal = ({ show, onClose, task, onSubmit, users }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(event);
    onClose();
  };

  return (
    <Modal
      isOpen={show}
      onRequestClose={onClose}
      contentLabel="Task Modal"
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          borderRadius: '10px',
          maxHeight: '80vh',  
          overflowY: 'auto',   
          maxWidth: '500px',  
          width: '90%',        
        },
      }}
    >

      <h2>{task ? 'Edit Task' : 'Add Task'}</h2>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="1rem">
          <TextField label="Task Name" name="name" defaultValue={task?.title || ''} required />
          <TextField label="Description" name="description" defaultValue={task?.description || ''} required />
          <SelectField label="Priority" name="priority" defaultValue={task?.priority || 'Medium'} required>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </SelectField>
          <SelectField label="Status" name="status" defaultValue={task?.status || ''} required>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </SelectField>
          <SelectField label="Assigned To" name="assignedTo" defaultValue={task?.assigned_to || ''} required>
            {users.map(user => (
              <option key={user.user_id} value={user.user_id}>{user.name}</option>
            ))}
          </SelectField>
          <TextField label="Start Date" name="startDate" type="date" defaultValue={task?.start_date ? task.start_date.split('T')[0] : ''} required />
          <TextField label="End Date" name="endDate" type="date" defaultValue={task?.end_date ? task.end_date.split('T')[0] : ''} required />
          <TextField 
  label="Notes" 
  name="notes" 
  defaultValue={task?.notes?.[0]?.note_text || ''}  // Show only the latest note
/>

          <TextField label="Dependencies" name="dependencies" defaultValue={task?.dependencies || ''} />
          <Button type="submit" variation="primary">Save</Button>
          <Button type="button" variation="link" onClick={onClose}>Close</Button>
        </Flex>
      </form>
    </Modal>
  );
};

export default TaskModal;
