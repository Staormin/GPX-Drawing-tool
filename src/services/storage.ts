/**
 * Storage service - localStorage management for projects and coordinates
 */

import { v4 as uuidv4 } from 'uuid';

export interface SavedCoordinate {
  id: string;
  name: string;
  lat: number;
  lon: number;
  timestamp?: number;
}

export interface ProjectData {
  id?: string;
  name: string;
  data: ProjectLayerData;
  createdAt?: number;
  updatedAt?: number;
}

export interface ProjectLayerData {
  circles: CircleElement[];
  lineSegments: LineSegmentElement[];
  points: PointElement[];
  savedCoordinates: SavedCoordinate[];
}

export interface CircleElement {
  id: string;
  name: string;
  center: { lat: number; lon: number };
  radius: number;
  color?: string;
  leafletId?: number;
}

export interface LineSegmentElement {
  id: string;
  name: string;
  center: { lat: number; lon: number };
  endpoint?: { lat: number; lon: number };
  mode: 'coordinate' | 'azimuth' | 'intersection' | 'parallel';
  distance?: number;
  azimuth?: number;
  intersectionPoint?: { lat: number; lon: number };
  intersectionDistance?: number;
  longitude?: number;
  color?: string;
  leafletId?: number;
}

export interface PointElement {
  id: string;
  name: string;
  coordinates: { lat: number; lon: number };
  elevation?: number;
  color?: string;
  leafletId?: number;
}

const PROJECTS_STORAGE_KEY = 'geochase_projects';

/**
 * Get all projects from localStorage
 */
export function getAllProjects(): ProjectData[] {
  try {
    const projects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return projects ? JSON.parse(projects) : [];
  } catch (error) {
    console.error('Error loading projects from storage:', error);
    return [];
  }
}

/**
 * Save projects to localStorage
 */
export function saveProjectsToStorage(projects: ProjectData[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving projects to storage:', error);
  }
}

/**
 * Get specific project by index
 */
export function getProject(index: number): ProjectData | null {
  const projects = getAllProjects();
  return projects[index] || null;
}

/**
 * Create a new project
 */
export function createProject(name: string, data: ProjectLayerData): ProjectData {
  return {
    id: uuidv4(),
    name,
    data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Save a new project
 */
export function saveProject(projectName: string, data: ProjectLayerData): void {
  const projects = getAllProjects();
  const newProject = createProject(projectName, data);
  projects.push(newProject);
  saveProjectsToStorage(projects);
}

/**
 * Update an existing project
 */
export function updateProject(index: number, name: string, data: ProjectLayerData): void {
  const projects = getAllProjects();
  if (projects[index]) {
    projects[index] = {
      id: projects[index].id,
      name,
      data,
      createdAt: projects[index].createdAt,
      updatedAt: Date.now(),
    };
    saveProjectsToStorage(projects);
  }
}

/**
 * Delete a project by index
 */
export function deleteProject(index: number): void {
  const projects = getAllProjects();
  projects.splice(index, 1);
  saveProjectsToStorage(projects);
}

/**
 * Clear all projects
 */
export function clearAllProjects(): void {
  saveProjectsToStorage([]);
}

/**
 * Export project data as JSON
 */
export function exportProjectAsJSON(project: ProjectData): string {
  return JSON.stringify(
    {
      version: '1.0',
      timestamp: new Date().toISOString(),
      ...project,
    },
    null,
    2
  );
}

/**
 * Import project data from JSON
 */
export function importProjectFromJSON(jsonString: string): ProjectData | null {
  try {
    const data = JSON.parse(jsonString);
    if (!data.name || !data.data) {
      throw new Error('Invalid project format');
    }
    return {
      name: data.name,
      data: data.data,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Error importing project:', error);
    return null;
  }
}
