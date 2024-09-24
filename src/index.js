import React from 'react';
import { createRoot } from 'react-dom/client';  // Import the new createRoot API
import './index.css';  // Import your CSS file
import App from './App';
import { Amplify } from 'aws-amplify';
import config from './aws-exports';  // Import the AWS Amplify configuration

// Configure Amplify with the AWS configuration
Amplify.configure(config);

const container = document.getElementById('root');  // Get the root element from the DOM
const root = createRoot(container);  // Create a root for React

// Render the App component inside the root
root.render(<App />);