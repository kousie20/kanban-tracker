import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// Debug: Log initialization
console.log('App.js loading...');
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jtienvplopymmvszhopu.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aWVudnBsb3B5bW12c3pob3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTg0OTAsImV4cCI6MjA4ODQ3NDQ5MH0.f0ZqAWn_WDa3pJJCcOUsLBmC4lFJy3CQGLzZ6pAcVLk';

console.log('Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Supabase client created');

const statusOrder = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done', 'On Hold'];

function App() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  console.log('App component mounted');

  useEffect(() => {
    console.log('Fetching data...');
    fetchData();
  }, [retryCount]);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Starting data fetch...');
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      
      console.log('Projects response:', { projectData, projectError });
      if (projectError) throw projectError;
      setProjects(projectData || []);

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .order('priority');
      
      console.log('Tasks response:', { taskData, taskError });
      if (taskError) throw taskError;
      setTasks(taskData || []);
      
      console.log('Data fetch complete');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const result = {};
    statusOrder.forEach(status => {
      result[status] = tasks.filter(t => 
        t.status.toLowerCase() === status.toLowerCase()
      );
    });
    return result;
  }, [tasks]);

  const projectMap = useMemo(() => 
    Object.fromEntries(projects.map(p => [p.id, p.name])),
    [projects]
  );

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#ff6b6b',
      medium: '#ffd93d',
      low: '#6bcf7f'
    };
    return colors[priority] || '#999';
  };

  console.log('Render state:', { loading, error, projectCount: projects.length, taskCount: tasks.length });

  if (error) {
    return (
      <div className="error-container" style={{ padding: '20px', color: '#fff' }}>
        <h2>⚠️ Error Loading Kanban Board</h2>
        <p>{error}</p>
        <button onClick={() => setRetryCount(prev => prev + 1)} className="retry-button">
          🔄 Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="loading" style={{ color: '#fff', padding: '20px' }}>⏳ Loading Kanban Board...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>⚡ JARVIS Project Tracker</h1>
        <p>Track all work in one view</p>
      </header>

      <div className="kanban-board">
        {statusOrder.map(status => (
          <div key={status} className="column">
            <div className="column-header">
              <h2>{status}</h2>
              <span className="task-count">{grouped[status].length}</span>
            </div>

            <div className="tasks">
              {grouped[status].map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <span 
                      className="priority-dot" 
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                      aria-label={`Priority: ${task.priority || 'Medium'}`}
                    ></span>
                    <span className="task-priority">
                      {task.priority?.toUpperCase() || 'MEDIUM'}
                    </span>
                  </div>
                  <h3>{task.title}</h3>
                  <p className="task-project">
                    {projectMap[task.project_id] || 'Unknown Project'}
                  </p>
                  {task.due_date && (
                    <p className="task-due">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              {grouped[status].length === 0 && (
                <p className="empty-state">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <footer className="footer">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </footer>
    </div>
  );
}

export default App;
