import { Plugin, Notice, PluginSettingTab, Setting, Modal, App, TFile, TFolder } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';

interface PaperlibSettings {
  paperNotesFolder: string;
  assetsFolder: string;
  paperNoteTemplate: string;
  protocolHandlerEnabled: boolean;
}

const DEFAULT_SETTINGS: PaperlibSettings = {
  paperNotesFolder: 'Literature Notes',
  assetsFolder: 'Assets',
  paperNoteTemplate: `---
paper_id: {{id}}
title: {{title}}
authors: {{authors}}
publication_date: {{publicationDate}}
abstract: {{abstract}}
comments: {{comments}}
pdf: {{pdfFilename}}
url: {{url}}
tags: {{tags}}
---

# {{title}}

## Summary

## Notes

`,
  protocolHandlerEnabled: true,
};

export default class PaperlibIntegrationPlugin extends Plugin {
  settings: PaperlibSettings;

  async onload() {
    await this.loadSettings();

    if (this.settings.protocolHandlerEnabled) {
      // Register the paperlib protocol handler
      this.registerObsidianProtocolHandler('paperlib', async (params) => {
        console.log('Received PaperLib protocol request:', params);
        
        const { id, title, authors, year, doi } = params;
        
        if (!id) {
          new Notice('Error: No paper ID provided');
          return;
        }
        
        try {
          await this.createOrOpenPaperNote(id, title, authors, year, doi);
          new Notice(`Successfully opened paper: ${title || id}`);
        } catch (error) {
          console.error('Error handling paperlib protocol:', error);
          new Notice(`Error opening paper: ${error.message || error}`);
        }
      });

      // Register the paperlib-open protocol handler with PDF support
      this.registerObsidianProtocolHandler('paperlib-open', async (params) => {
        console.log('Received paperlib-open protocol request:', params);
        
        // Handle different parameter formats
        if (params.path) {
          const paperPath = params.path.replace(/^paperlib\//, '');
          console.log(`Attempting to open paper from path: ${paperPath}`);
          try {
            await this.createOrOpenPaperNote(paperPath, paperPath);
            new Notice(`Successfully opened paper: ${paperPath}`);
            return;
          } catch (error) {
            console.error('Error handling path parameter:', error);
            new Notice(`Error opening paper: ${error.message || error}`);
          }
        }
        
        if (params.vault && params.file) {
          const paperFile = decodeURIComponent(params.file);
          console.log(`Attempting to open paper from vault/file: ${paperFile}`);
          try {
            await this.createOrOpenPaperNote(paperFile, paperFile);
            new Notice(`Successfully opened paper: ${paperFile}`);
            return;
          } catch (error) {
            console.error('Error handling vault/file parameters:', error);
            new Notice(`Error opening paper: ${error.message || error}`);
          }
        }
        
        // Handle metadata with PDF
        if (params.id || (params.title && params.authors)) {
          const {
            id,
            title,
            authors,
            year,
            publicationDate,
            doi,
            abstract,
            comments,
            url,
            tags,
            pdfPath,
            vaultPath,
            literatureNotesFolder,
            assetsFolder
          } = params;
          
          const paperId = id || title || 'unknown';
          console.log(`Attempting to open paper from metadata: ${paperId}`);
          
          try {
            await this.createOrOpenPaperNoteWithPDF(
              paperId,
              title,
              authors,
              year,
              publicationDate,
              doi,
              abstract,
              comments,
              url,
              tags,
              pdfPath,
              vaultPath,
              literatureNotesFolder,
              assetsFolder
            );
            new Notice(`Successfully opened paper: ${title || paperId}`);
            return;
          } catch (error) {
            console.error('Error handling metadata parameters:', error);
            new Notice(`Error opening paper: ${error.message || error}`);
          }
        }
        
        new Notice('Error: Could not recognize parameters in the URL');
        console.error('Unrecognized parameters:', params);
      });
    }

    this.addCommand({
      id: 'create-paper-note',
      name: 'Create new paper note',
      callback: () => {
        new CreatePaperNoteModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: 'open-papers-folder',
      name: 'Open papers folder',
      callback: async () => {
        const folder = this.settings.paperNotesFolder;
        const abstractFile = this.app.vault.getAbstractFileByPath(folder);
        
        if (abstractFile && abstractFile instanceof TFolder) {
          const firstFile = abstractFile.children[0];
          if (firstFile instanceof TFile) {
            this.app.workspace.getLeaf().openFile(firstFile);
            new Notice(`Opened papers folder: ${folder}`);
          } else {
            new Notice(`No file found in papers folder: ${folder}`);
          }
        } else {
          new Notice(`Papers folder not found: ${folder}`);
        }
      },
    });

    this.addSettingTab(new PaperlibSettingTab(this.app, this));
  }

  onunload() {
    console.log('PaperLib Integration plugin unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async ensureFolderExists(folderPath: string): Promise<boolean> {
    if (!folderPath || folderPath.trim() === '') {
      new Notice('Please enter a valid folder path');
      return false;
    }

    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(folderPath);
      
      if (abstractFile) {
        if (abstractFile instanceof TFolder) {
          console.log(`Folder already exists: ${folderPath}`);
          return true;
        } else {
          new Notice(`Error: ${folderPath} exists but is not a folder`);
          return false;
        }
      } else {
        await this.app.vault.createFolder(folderPath);
        console.log(`Created folder: ${folderPath}`);
        return true;
      }
    } catch (error) {
      console.error(`Error creating folder: ${error}`);
      new Notice(`Error creating folder: ${error}`);
      return false;
    }
  }

  async createOrOpenPaperNote(
    id: string,
    title?: string,
    authors?: string,
    year?: string,
    doi?: string
  ) {
    const safeId = this.sanitizeFilename(id);
    const safeTitle = title ? this.sanitizeFilename(title) : safeId;
    
    if (!(await this.ensureFolderExists(this.settings.paperNotesFolder))) {
      new Notice('Cannot create paper note: Papers folder does not exist');
      return;
    }
    
    const notePath = `${this.settings.paperNotesFolder}/${safeTitle}.md`;
    let file = this.app.vault.getAbstractFileByPath(notePath);
    
    if (file) {
      new Notice(`Opening existing paper note: ${safeTitle}`);
    } else {
      let content = this.settings.paperNoteTemplate;
      content = content.replace(/{{title}}/g, title || 'Untitled Paper');
      content = content.replace(/{{authors}}/g, authors || '');
      content = content.replace(/{{year}}/g, year || '');
      content = content.replace(/{{publicationDate}}/g, year || '');
      content = content.replace(/{{doi}}/g, doi || '');
      content = content.replace(/{{id}}/g, id);
      content = content.replace(/{{abstract}}/g, '');
      content = content.replace(/{{comments}}/g, '');
      content = content.replace(/{{pdf}}/g, '');
      content = content.replace(/{{url}}/g, '');
      content = content.replace(/{{tags}}/g, '');
      
      try {
        file = await this.app.vault.create(notePath, content);
        new Notice(`Created new paper note: ${safeTitle}`);
      } catch (error) {
        console.error(`Error creating paper note: ${error}`);
        new Notice(`Error creating paper note: ${error}`);
        return;
      }
    }
    
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }

  async createOrOpenPaperNoteWithPDF(
    id: string,
    title?: string,
    authors?: string,
    year?: string,
    publicationDate?: string,
    doi?: string,
    abstract?: string,
    comments?: string,
    url?: string,
    tags?: string,
    pdfPath?: string,
    vaultPath?: string,
    literatureNotesFolder?: string,
    assetsFolder?: string
  ) {
    const safeId = this.sanitizeFilename(id);
    const safeTitle = title ? this.sanitizeFilename(title) : safeId;
    
    // Use settings or provided folder names
    const notesFolder = literatureNotesFolder || this.settings.paperNotesFolder;
    const pdfFolder = assetsFolder || this.settings.assetsFolder;
    
    if (!(await this.ensureFolderExists(notesFolder))) {
      new Notice('Cannot create paper note: Literature Notes folder does not exist');
      return;
    }
    
    if (!(await this.ensureFolderExists(pdfFolder))) {
      new Notice('Cannot create paper note: Assets folder does not exist');
      return;
    }
    
    const notePath = `${notesFolder}/${safeTitle}.md`;
    let file = this.app.vault.getAbstractFileByPath(notePath);
    
    // Handle PDF copy
    let pdfLink = '';
    if (pdfPath && pdfPath.trim() !== '') {
      try {
        // Extract filename from path (handle file:// URLs)
        let cleanPath = pdfPath.replace(/^file:\/\//, '');
        // Handle URL encoding in path
        cleanPath = decodeURIComponent(cleanPath);
        
        console.log(`Processing PDF from: ${cleanPath}`);
        
        // Use paper title as PDF filename instead of original filename
        const safePdfName = this.sanitizeFilename(title || 'Untitled') + '.pdf';
        const targetPdfPath = `${pdfFolder}/${safePdfName}`;
        
        console.log(`Target PDF path: ${targetPdfPath}`);
        
        // Check if PDF already exists in assets
        const existingPdf = this.app.vault.getAbstractFileByPath(targetPdfPath);
        
        if (!existingPdf) {
          // Copy PDF to assets folder if it exists
          if (fs.existsSync(cleanPath)) {
            const pdfContent = fs.readFileSync(cleanPath);
            await this.app.vault.createBinary(targetPdfPath, pdfContent.buffer);
            console.log(`✅ Copied PDF to: ${targetPdfPath}`);
            new Notice(`PDF copied: ${safePdfName}`);
          } else {
            console.warn(`❌ PDF file not found at: ${cleanPath}`);
            new Notice(`Warning: PDF file not found at source location`);
          }
        } else {
          console.log(`PDF already exists at: ${targetPdfPath}`);
          new Notice(`Using existing PDF: ${safePdfName}`);
        }
        
        // Create wiki-style bidirectional link
        pdfLink = `[[${targetPdfPath}]]`;
      } catch (error) {
        console.error(`Error copying PDF: ${error}`);
        new Notice(`Error copying PDF: ${error.message || error}`);
      }
    }
    
    if (file) {
      new Notice(`Opening existing paper note: ${safeTitle}`);
    } else {
      let content = this.settings.paperNoteTemplate;
      content = content.replace(/{{id}}/g, id || '');
      content = content.replace(/{{title}}/g, title || 'Untitled Paper');
      content = content.replace(/{{authors}}/g, authors || '');
      content = content.replace(/{{year}}/g, year || '');
      content = content.replace(/{{publicationDate}}/g, publicationDate || year || '');
      content = content.replace(/{{doi}}/g, doi || '');
      content = content.replace(/{{abstract}}/g, abstract || '');
      content = content.replace(/{{comments}}/g, comments || '');
      // Wrap wikilink in double quotes to prevent YAML parser from adding extra quotes
      const quotedPdfLink = pdfLink ? `"${pdfLink}"` : '';
      content = content.replace(/{{pdfFilename}}/g, quotedPdfLink);
      content = content.replace(/{{pdf}}/g, quotedPdfLink);
      content = content.replace(/{{url}}/g, url || '');
      content = content.replace(/{{tags}}/g, tags || '');
      
      try {
        file = await this.app.vault.create(notePath, content);
        new Notice(`Created new paper note: ${safeTitle}`);
      } catch (error) {
        console.error(`Error creating paper note: ${error}`);
        new Notice(`Error creating paper note: ${error}`);
        return;
      }
    }
    
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }

  sanitizeFilename(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, '-');
  }
}

class CreatePaperNoteModal extends Modal {
  plugin: PaperlibIntegrationPlugin;
  idInput: HTMLInputElement;
  titleInput: HTMLInputElement;
  authorsInput: HTMLInputElement;
  yearInput: HTMLInputElement;
  doiInput: HTMLInputElement;

  constructor(app: App, plugin: PaperlibIntegrationPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: 'Create New Paper Note' });

    contentEl.createEl('label', { text: 'Paper ID (required)' })
      .appendChild(this.idInput = document.createElement('input'));
    this.idInput.type = 'text';
    this.idInput.value = '';
    this.idInput.placeholder = 'Unique identifier for the paper';

    contentEl.createEl('br');

    contentEl.createEl('label', { text: 'Title' })
      .appendChild(this.titleInput = document.createElement('input'));
    this.titleInput.type = 'text';
    this.titleInput.value = '';
    this.titleInput.placeholder = 'Paper title';

    contentEl.createEl('br');

    contentEl.createEl('label', { text: 'Authors' })
      .appendChild(this.authorsInput = document.createElement('input'));
    this.authorsInput.type = 'text';
    this.authorsInput.value = '';
    this.authorsInput.placeholder = 'Paper authors';

    contentEl.createEl('br');

    contentEl.createEl('label', { text: 'Year' })
      .appendChild(this.yearInput = document.createElement('input'));
    this.yearInput.type = 'text';
    this.yearInput.value = '';
    this.yearInput.placeholder = 'Publication year';

    contentEl.createEl('br');

    contentEl.createEl('label', { text: 'DOI' })
      .appendChild(this.doiInput = document.createElement('input'));
    this.doiInput.type = 'text';
    this.doiInput.value = '';
    this.doiInput.placeholder = 'Digital Object Identifier';

    contentEl.createEl('br');

    contentEl.createEl('button', { text: 'Create Note' })
      .addEventListener('click', async () => {
        const paperId = this.idInput.value.trim();
        
        if (!paperId) {
          new Notice('Paper ID is required');
          return;
        }
        
        await this.plugin.createOrOpenPaperNote(
          paperId,
          this.titleInput.value.trim(),
          this.authorsInput.value.trim(),
          this.yearInput.value.trim(),
          this.doiInput.value.trim()
        );
        
        this.close();
      });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class PaperlibSettingTab extends PluginSettingTab {
  plugin: PaperlibIntegrationPlugin;

  constructor(app: App, plugin: PaperlibIntegrationPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'PaperLib Integration Settings' });

    new Setting(containerEl)
      .setName('Literature Notes Folder')
      .setDesc('The folder where paper notes will be stored. Press Enter or click Create to create the folder.')
      .addText((text) => {
        const textComponent = text
          .setPlaceholder('Literature Notes')
          .setValue(this.plugin.settings.paperNotesFolder)
          .onChange(async (value) => {
            this.plugin.settings.paperNotesFolder = value;
            await this.plugin.saveSettings();
          });
        
        const inputEl = textComponent.inputEl;
        inputEl.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (await this.plugin.ensureFolderExists(this.plugin.settings.paperNotesFolder)) {
              new Notice(`Folder created/verified: ${this.plugin.settings.paperNotesFolder}`);
            }
            inputEl.blur();
          }
        });
        
        return textComponent;
      })
      .addButton((button) =>
        button
          .setButtonText('Create')
          .onClick(async () => {
            if (await this.plugin.ensureFolderExists(this.plugin.settings.paperNotesFolder)) {
              new Notice(`Folder created/verified: ${this.plugin.settings.paperNotesFolder}`);
            }
          })
      );

    new Setting(containerEl)
      .setName('Assets Folder')
      .setDesc('The folder where PDF files will be stored. Press Enter or click Create to create the folder.')
      .addText((text) => {
        const textComponent = text
          .setPlaceholder('assets')
          .setValue(this.plugin.settings.assetsFolder)
          .onChange(async (value) => {
            this.plugin.settings.assetsFolder = value;
            await this.plugin.saveSettings();
          });
        
        const inputEl = textComponent.inputEl;
        inputEl.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (await this.plugin.ensureFolderExists(this.plugin.settings.assetsFolder)) {
              new Notice(`Folder created/verified: ${this.plugin.settings.assetsFolder}`);
            }
            inputEl.blur();
          }
        });
        
        return textComponent;
      })
      .addButton((button) =>
        button
          .setButtonText('Create')
          .onClick(async () => {
            if (await this.plugin.ensureFolderExists(this.plugin.settings.assetsFolder)) {
              new Notice(`Folder created/verified: ${this.plugin.settings.assetsFolder}`);
            }
          })
      );

    new Setting(containerEl)
      .setName('Note Template')
      .setDesc('Template for new paper notes. Use {{id}}, {{title}}, {{authors}}, {{year}}, {{publicationDate}}, {{doi}}, {{abstract}}, {{comments}}, {{pdf}}, {{url}}, and {{tags}} as placeholders.')
      .addTextArea((text) =>
        text
          .setPlaceholder('Enter your template')
          .setValue(this.plugin.settings.paperNoteTemplate)
          .onChange(async (value) => {
            this.plugin.settings.paperNoteTemplate = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Enable Protocol Handler')
      .setDesc('Allow opening notes directly from PaperLib using the paperlib:// protocol')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.protocolHandlerEnabled)
          .onChange(async (value) => {
            this.plugin.settings.protocolHandlerEnabled = value;
            await this.plugin.saveSettings();
            new Notice('Please restart Obsidian for this change to take effect');
          })
      );
  }
}
