import fs from 'fs';
import path from 'path';

class ProjectStore {
  constructor() {
    this.projects = new Map();
  }

  createProject(id, initialData = {}) {
    const project = {
      id,
      video: {
        url: '',
        filename: '',
        filePath: '',
        audioPath: '',
        duration: 0,
        width: 1280,
        height: 720,
        size: 0,
        ...initialData.video
      },
      transcript: {
        language: 'en',
        segments: [],
        ...initialData.transcript
      },
      captionStyle: {
        template: 'highlight', // clean, bold, highlight, box, glow
        fontFamily: 'Outfit',
        fontSize: 44,
        color: '#FFFFFF',
        highlightColor: '#FACC15',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        position: 'bottom', // bottom, center, top
        verticalOffset: 12, // percentage from edge
        textAlign: 'center',
        textTransform: 'uppercase', // uppercase, none, capitalize
        animation: 'pop', // pop, bounce, fade, none
        boxPadding: 10,
        boxRadius: 8,
        ...initialData.captionStyle
      },
      status: initialData.status || 'uploaded',
      export: {
        status: 'idle',
        progress: 0,
        message: '',
        url: null,
        filename: null,
        error: null,
        ...initialData.export
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.set(id, project);
    return project;
  }

  getProject(id) {
    return this.projects.get(id) || null;
  }

  updateProject(id, updates) {
    const existing = this.getProject(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.video) {
      updated.video = { ...existing.video, ...updates.video };
    }
    if (updates.transcript) {
      updated.transcript = { ...existing.transcript, ...updates.transcript };
    }
    if (updates.captionStyle) {
      updated.captionStyle = { ...existing.captionStyle, ...updates.captionStyle };
    }
    if (updates.export) {
      updated.export = { ...existing.export, ...updates.export };
    }

    this.projects.set(id, updated);
    return updated;
  }

  deleteProject(id) {
    return this.projects.delete(id);
  }

  getAll() {
    return Array.from(this.projects.values());
  }
}

export const projectStore = new ProjectStore();
