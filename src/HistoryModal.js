import React, { useState } from 'react';
import Modal from 'react-modal';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, View, Heading, SearchField } from '@aws-amplify/ui-react';

const HistoryModal = ({ task, onClose }) => {
  const { auditLog, notes } = task; 
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAuditLog, setFilteredAuditLog] = useState(auditLog || []);

  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredAuditLog(auditLog.filter(entry => 
      entry.field_name.toLowerCase().includes(query) || 
      entry.old_value.toLowerCase().includes(query) || 
      entry.new_value.toLowerCase().includes(query)
    ));
  };

  return (
    <Modal isOpen={!!task} onRequestClose={onClose}>
      <View className="modal-content">
        <Heading level={2}>Task History</Heading>

        <SearchField 
          placeholder="Search history..."
          onChange={handleSearchChange}
          value={searchQuery}
        />

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Changes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAuditLog.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>{entry.username || 'Unknown'}</TableCell>
                <TableCell>{new Date(entry.change_date).toLocaleString()}</TableCell>
                <TableCell>{entry.field_name}: {entry.old_value} &gt; {entry.new_value}</TableCell>
              </TableRow>
            ))}

            {notes && notes.map((note, index) => (
              <TableRow key={index}>
                <TableCell>{note.username}</TableCell>
                <TableCell>{new Date(note.created_at).toLocaleString()}</TableCell>
                <TableCell>{note.note_text}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button onClick={onClose}>Close</Button>
      </View>
    </Modal>
  );
};

export default HistoryModal;
