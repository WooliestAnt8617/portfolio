// src/components/ProjectsSection.js
import React, { useState, useEffect, useContext } from 'react';
import { X, PlusCircle, Save, Edit, Trash2, ExternalLink, Github } from 'lucide-react';
import apiService from '../apiService';
import AuthContext from '../AuthContext';
import { MessageBox, Switch, ConfirmDialog } from './CommonComponents';

const ProjectsSection = ({ user, token }) => { // 'token' is available as a prop
  const [projects, setProjects] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', longDescription: '', imageUrl: '', liveUrl: '', repoUrl: '', status: 'draft', displayOrder: 0, technologies: ''
  });
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);


  useEffect(() => {
    const fetchProjects = async () => {
      if (user && user.id && token) { // Ensure user.id and token are available
        setLoading(true);
        try {
          // FIX: Pass the 'token' to apiService.getProjects
          const fetchedProjects = await apiService.getProjects(user.id, token);
          setProjects(fetchedProjects);
        } catch (error) {
          setMessage(`Error fetching projects: ${error.message}`);
          setMessageType('error');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProjects();
  }, [user, token]); // FIX: Add 'token' to the dependency array

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'status' && type === 'checkbox') {
      const newStatus = checked ? 'published' : 'draft';
      if (newStatus === 'published' && formData.status === 'draft') {
        setPendingStatusChange(newStatus);
        setIsPublishConfirmOpen(true);
      } else {
        setFormData({ ...formData, [name]: newStatus });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleStatusConfirm = () => {
    setFormData({ ...formData, status: pendingStatusChange });
    setIsPublishConfirmOpen(false);
    setPendingStatusChange(null);
  };

  const handleStatusCancel = () => {
    setIsPublishConfirmOpen(false);
    setPendingStatusChange(null);
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      longDescription: project.longDescription || '',
      imageUrl: project.imageUrl || '',
      liveUrl: project.liveUrl || '',
      repoUrl: project.repoUrl || '',
      status: project.status,
      displayOrder: project.displayOrder,
      technologies: project.ProjectTechnologies ? project.ProjectTechnologies.map(tech => tech.technologyName).join(', ') : ''
    });
    setIsAdding(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const projectData = {
      ...formData,
      technologies: formData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech !== '').map(tech => ({ technologyName: tech }))
    };

    try {
      if (editingProject) {
        await apiService.updateProject(editingProject.id, projectData, token);
        setMessage('Project updated successfully!');
      } else {
        await apiService.createProject(projectData, token);
        setMessage('Project created successfully!');
      }
      setMessageType('success');
      // FIX: Pass the 'token' to apiService.getProjects here as well after save/update
      const updatedProjects = await apiService.getProjects(user.id, token);
      setProjects(updatedProjects);
      setIsAdding(false);
      setEditingProject(null);
      setFormData({
        title: '', description: '', longDescription: '', imageUrl: '', liveUrl: '', repoUrl: '', status: 'draft', displayOrder: 0, technologies: ''
      });
    } catch (error) {
      setMessage(`Error saving project: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    const confirmed = await new Promise((resolve) => {
      const confirmDialog = document.createElement('div');
      confirmDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
      confirmDialog.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
          <h3 class="text-lg font-semibold mb-4">Confirm Deletion</h3>
          <p class="mb-4">Are you sure you want to delete this project?</p>
          <div class="flex justify-end gap-3">
            <button id="cancelBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg">Cancel</button>
            <button id="confirmBtn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      document.getElementById('cancelBtn').onclick = () => {
        document.body.removeChild(confirmDialog);
        resolve(false);
      };
      document.getElementById('confirmBtn').onclick = () => {
        document.body.removeChild(confirmDialog);
        resolve(true);
      };
    });

    if (!confirmed) return;

    setMessage(null);
    setLoading(true);
    try {
      await apiService.deleteProject(projectId, token);
      // FIX: Pass the 'token' to apiService.getProjects after deletion
      setProjects(projects.filter(p => p.id !== projectId));
      setMessage('Project deleted successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error deleting project: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 animate-fade-in">
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex justify-between items-center">
        Your Projects
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingProject(null);
            setFormData({
              title: '', description: '', longDescription: '', imageUrl: '', liveUrl: '', repoUrl: '', status: 'draft', displayOrder: 0, technologies: ''
            });
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition duration-300 ease-in-out hover:scale-105"
        >
          {isAdding ? <X size={18} /> : <PlusCircle size={18} />} {isAdding ? 'Cancel' : 'Add New Project'}
        </button>
      </h3>
      <MessageBox message={message} type={messageType} onClose={() => setMessage(null)} />

      {isAdding && (
        <form onSubmit={handleSaveProject} className="space-y-4 mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 animate-slide-up">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">{editingProject ? 'Edit Project' : 'Add New Project'}</h4>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" required />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Short Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" required></textarea>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Long Description (Optional)</label>
            <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500"></textarea>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Image URL (Optional)</label>
            <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Live URL (Optional)</label>
            <input type="url" name="liveUrl" value={formData.liveUrl} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Repository URL (Optional)</label>
            <input type="url" name="repoUrl" value={formData.repoUrl} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Technologies (comma-separated)</label>
            <input type="text" name="technologies" value={formData.technologies} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out dark:bg-gray-600 dark:text-white dark:border-gray-500" placeholder="e.g., React, Node.js, MySQL" />
          </div>
          <div className="pt-2">
            <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Project Status</label>
            <Switch
              label={formData.status === 'published' ? 'Published' : 'Draft'}
              checked={formData.status === 'published'}
              onChange={(e) => handleChange({ target: { name: 'status', type: 'checkbox', checked: e.target.checked } })}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Toggle to make this project visible or hidden in your public profile.</p>
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition duration-300 ease-in-out disabled:opacity-50 hover:scale-105"
            disabled={loading}
          >
            <Save size={20} /> {loading ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
          </button>
        </form>
      )}

      {loading && !projects.length ? (
        <div className="text-center py-8 dark:text-gray-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No projects found. Add your first project above!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="bg-gray-100 dark:bg-gray-700 p-5 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between hover:scale-[1.02] animate-fade-in-up">
              <div>
                <img src={project.imageUrl || 'https://placehold.co/400x200/CBD5E0/4A5568?text=Project'} alt={project.title} className="w-full h-40 object-cover rounded-md mb-4" />
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{project.title}</h4>
                <p className="text-gray-700 text-sm mb-3 dark:text-gray-200">{project.description}</p>
                {project.longDescription && (
                  <p className="text-gray-600 text-xs mb-3 dark:text-gray-300">{project.longDescription.substring(0, 100)}...</p>
                )}
                {project.ProjectTechnologies && project.ProjectTechnologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.ProjectTechnologies.map((tech, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full transition duration-200 ease-in-out hover:scale-105 dark:bg-blue-900 dark:text-blue-200">
                        {tech.technologyName}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 mt-3">
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1 transition duration-200 ease-in-out hover:scale-[1.02] dark:text-blue-400">
                      <ExternalLink size={16} /> Live
                    </a>
                  )}
                  {project.repoUrl && (
                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:underline flex items-center gap-1 transition duration-200 ease-in-out hover:scale-[1.02] dark:text-gray-300">
                      <Github size={16} /> Repo
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditClick(project)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition duration-300 ease-in-out hover:scale-105"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition duration-300 ease-in-out hover:scale-105"
                >
                  <Trash2 size={16} /> Delete
                </button>
                {/* Display current status for the project item */}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${project.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'}`}>
                  {project.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={isPublishConfirmOpen}
        title="Confirm Publishing Project"
        message="Publishing this project will make it visible in your public profile and to other users in the 'Discover Profiles' section. You can unpublish it at any time by changing the status back to 'Draft'."
        onConfirm={handleStatusConfirm}
        onCancel={handleStatusCancel}
      />
    </div>
  );
};

export default ProjectsSection;
