/**
 * Projects store - Manages project save/load operations
 */

import type { ProjectData, ProjectLayerData } from '@/services/storage';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as storage from '@/services/storage';

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<ProjectData[]>([]);
  const activeProjectId = ref<string | null>(null);

  // Computed
  const projectCount = computed(() => projects.value.length);

  const sortedProjects = computed(() => {
    return [...projects.value].toSorted(
      (a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0)
    );
  });

  const activeProject = computed(() => {
    if (!activeProjectId.value) {
      return null;
    }
    return projects.value.find((p) => p.id === activeProjectId.value) || null;
  });

  // Actions
  function loadProjects(): void {
    projects.value = storage.getAllProjects();
  }

  function setActiveProject(projectId: string | null): void {
    activeProjectId.value = projectId;
    localStorage.setItem('geochase_activeProjectId', projectId || '');
  }

  function createAndSwitchProject(name: string, _data: ProjectLayerData): void {
    // Create new project with empty state
    storage.saveProject(name, {
      circles: [],
      lineSegments: [],
      points: [],
      savedCoordinates: [],
    });
    loadProjects();

    // Find and set the new project as active
    const newProject = projects.value.find((p) => p.name === name);
    if (newProject && newProject.id) {
      setActiveProject(newProject.id);
    }
  }

  function saveProject(name: string, data: ProjectLayerData): void {
    storage.saveProject(name, data);
    loadProjects();
  }

  function autoSaveActiveProject(data: ProjectLayerData): void {
    if (!activeProjectId.value) {
      return;
    }
    const currentProject = activeProject.value;
    if (currentProject) {
      const index = projects.value.indexOf(currentProject);
      if (index !== -1) {
        storage.updateProject(index, currentProject.name, data);
        loadProjects();
        // Update the active project reference
        const updatedProject = projects.value.find((p) => p.id === activeProjectId.value);
        if (updatedProject && updatedProject.id) {
          setActiveProject(updatedProject.id);
        }
      }
    }
  }

  function loadActiveProject(): void {
    const savedProjectId = localStorage.getItem('geochase_activeProjectId');
    if (savedProjectId) {
      activeProjectId.value = savedProjectId;
    }
  }

  function updateProject(index: number, name: string, data: ProjectLayerData): void {
    storage.updateProject(index, name, data);
    loadProjects();
  }

  function deleteProject(index: number): void {
    storage.deleteProject(index);
    loadProjects();
  }

  function getProject(index: number): ProjectData | null {
    return storage.getProject(index);
  }

  function clearAllProjects(): void {
    storage.clearAllProjects();
    projects.value = [];
  }

  function exportProjectAsJSON(index: number): string | null {
    const project = getProject(index);
    if (!project) {
      return null;
    }
    return storage.exportProjectAsJSON(project);
  }

  function importProject(jsonString: string): boolean {
    const project = storage.importProjectFromJSON(jsonString);
    if (!project) {
      return false;
    }
    storage.saveProject(project.name, project.data);
    loadProjects();
    return true;
  }

  function renameProject(index: number, newName: string): void {
    const project = getProject(index);
    if (project) {
      updateProject(index, newName, project.data);
    }
  }

  // Initialize on store creation
  loadProjects();
  loadActiveProject();

  return {
    // State
    projects,
    activeProjectId,

    // Computed
    projectCount,
    sortedProjects,
    activeProject,

    // Actions
    loadProjects,
    setActiveProject,
    createAndSwitchProject,
    saveProject,
    autoSaveActiveProject,
    loadActiveProject,
    updateProject,
    deleteProject,
    getProject,
    clearAllProjects,
    exportProjectAsJSON,
    importProject,
    renameProject,
  };
});
