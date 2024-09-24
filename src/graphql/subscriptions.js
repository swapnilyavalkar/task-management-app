/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateTask = /* GraphQL */ `
  subscription OnCreateTask {
    onCreateTask {
      id
      name
      description
      priority
      status
      assignedTo
      startDate
      endDate
      notes {
        note_id
        username
        date
        text
        __typename
      }
      dependencies
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateTask = /* GraphQL */ `
  subscription OnUpdateTask {
    onUpdateTask {
      id
      name
      description
      priority
      status
      assignedTo
      startDate
      endDate
      notes {
        note_id
        username
        date
        text
        __typename
      }
      dependencies
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteTask = /* GraphQL */ `
  subscription OnDeleteTask {
    onDeleteTask {
      id
      name
      description
      priority
      status
      assignedTo
      startDate
      endDate
      notes {
        note_id
        username
        date
        text
        __typename
      }
      dependencies
      createdAt
      updatedAt
      __typename
    }
  }
`;
