/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getTask = /* GraphQL */ `
  query GetTask($id: ID!) {
    getTask(id: $id) {
      task_id
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
        created_by
        updated_by
        note_text
      }
      dependencies
      createdAt
      updatedAt
      created_by
      updated_by
    }
  }
`;
export const listTasks = /* GraphQL */ `
  query ListTasks(
    $filter: ModelTaskFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTasks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
        priority
        status
        assignedTo
        startDate
        endDate
        dependencies
        createdAt
        updatedAt
        notes {
        note_id
        username
        date
        text
      }
      }
      nextToken
    }
  }
`;
