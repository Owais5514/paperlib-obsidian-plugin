"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PaperlibIntegrationPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var fs = __toESM(require("fs"));
var DEFAULT_SETTINGS = {
  paperNotesFolder: "Literature Notes",
  assetsFolder: "Assets",
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
  protocolHandlerEnabled: true
};
var PaperlibIntegrationPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "settings");
  }
  async onload() {
    await this.loadSettings();
    if (this.settings.protocolHandlerEnabled) {
      this.registerObsidianProtocolHandler("paperlib", async (params) => {
        console.log("Received PaperLib protocol request:", params);
        const { id, title, authors, year, doi } = params;
        if (!id) {
          new import_obsidian.Notice("Error: No paper ID provided");
          return;
        }
        try {
          await this.createOrOpenPaperNote(id, title, authors, year, doi);
          new import_obsidian.Notice(`Successfully opened paper: ${title || id}`);
        } catch (error) {
          console.error("Error handling paperlib protocol:", error);
          new import_obsidian.Notice(`Error opening paper: ${error.message || error}`);
        }
      });
      this.registerObsidianProtocolHandler("paperlib-open", async (params) => {
        console.log("Received paperlib-open protocol request:", params);
        if (params.path) {
          const paperPath = params.path.replace(/^paperlib\//, "");
          console.log(`Attempting to open paper from path: ${paperPath}`);
          try {
            await this.createOrOpenPaperNote(paperPath, paperPath);
            new import_obsidian.Notice(`Successfully opened paper: ${paperPath}`);
            return;
          } catch (error) {
            console.error("Error handling path parameter:", error);
            new import_obsidian.Notice(`Error opening paper: ${error.message || error}`);
          }
        }
        if (params.vault && params.file) {
          const paperFile = decodeURIComponent(params.file);
          console.log(`Attempting to open paper from vault/file: ${paperFile}`);
          try {
            await this.createOrOpenPaperNote(paperFile, paperFile);
            new import_obsidian.Notice(`Successfully opened paper: ${paperFile}`);
            return;
          } catch (error) {
            console.error("Error handling vault/file parameters:", error);
            new import_obsidian.Notice(`Error opening paper: ${error.message || error}`);
          }
        }
        if (params.id || params.title && params.authors) {
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
          const paperId = id || title || "unknown";
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
            new import_obsidian.Notice(`Successfully opened paper: ${title || paperId}`);
            return;
          } catch (error) {
            console.error("Error handling metadata parameters:", error);
            new import_obsidian.Notice(`Error opening paper: ${error.message || error}`);
          }
        }
        new import_obsidian.Notice("Error: Could not recognize parameters in the URL");
        console.error("Unrecognized parameters:", params);
      });
    }
    this.addCommand({
      id: "create-paper-note",
      name: "Create new paper note",
      callback: () => {
        new CreatePaperNoteModal(this.app, this).open();
      }
    });
    this.addCommand({
      id: "open-papers-folder",
      name: "Open papers folder",
      callback: async () => {
        const folder = this.settings.paperNotesFolder;
        const abstractFile = this.app.vault.getAbstractFileByPath(folder);
        if (abstractFile && abstractFile instanceof import_obsidian.TFolder) {
          const firstFile = abstractFile.children[0];
          if (firstFile instanceof import_obsidian.TFile) {
            this.app.workspace.getLeaf().openFile(firstFile);
            new import_obsidian.Notice(`Opened papers folder: ${folder}`);
          } else {
            new import_obsidian.Notice(`No file found in papers folder: ${folder}`);
          }
        } else {
          new import_obsidian.Notice(`Papers folder not found: ${folder}`);
        }
      }
    });
    this.addSettingTab(new PaperlibSettingTab(this.app, this));
  }
  onunload() {
    console.log("PaperLib Integration plugin unloaded");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async ensureFolderExists(folderPath) {
    if (!folderPath || folderPath.trim() === "") {
      new import_obsidian.Notice("Please enter a valid folder path");
      return false;
    }
    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(folderPath);
      if (abstractFile) {
        if (abstractFile instanceof import_obsidian.TFolder) {
          console.log(`Folder already exists: ${folderPath}`);
          return true;
        } else {
          new import_obsidian.Notice(`Error: ${folderPath} exists but is not a folder`);
          return false;
        }
      } else {
        await this.app.vault.createFolder(folderPath);
        console.log(`Created folder: ${folderPath}`);
        return true;
      }
    } catch (error) {
      console.error(`Error creating folder: ${error}`);
      new import_obsidian.Notice(`Error creating folder: ${error}`);
      return false;
    }
  }
  async createOrOpenPaperNote(id, title, authors, year, doi) {
    const safeId = this.sanitizeFilename(id);
    const safeTitle = title ? this.sanitizeFilename(title) : safeId;
    if (!await this.ensureFolderExists(this.settings.paperNotesFolder)) {
      new import_obsidian.Notice("Cannot create paper note: Papers folder does not exist");
      return;
    }
    const notePath = `${this.settings.paperNotesFolder}/${safeTitle}.md`;
    let file = this.app.vault.getAbstractFileByPath(notePath);
    if (file) {
      new import_obsidian.Notice(`Opening existing paper note: ${safeTitle}`);
    } else {
      let content = this.settings.paperNoteTemplate;
      content = content.replace(/{{title}}/g, title || "Untitled Paper");
      content = content.replace(/{{authors}}/g, authors || "");
      content = content.replace(/{{year}}/g, year || "");
      content = content.replace(/{{publicationDate}}/g, year || "");
      content = content.replace(/{{doi}}/g, doi || "");
      content = content.replace(/{{id}}/g, id);
      content = content.replace(/{{abstract}}/g, "");
      content = content.replace(/{{comments}}/g, "");
      content = content.replace(/{{pdf}}/g, "");
      content = content.replace(/{{url}}/g, "");
      content = content.replace(/{{tags}}/g, "");
      try {
        file = await this.app.vault.create(notePath, content);
        new import_obsidian.Notice(`Created new paper note: ${safeTitle}`);
      } catch (error) {
        console.error(`Error creating paper note: ${error}`);
        new import_obsidian.Notice(`Error creating paper note: ${error}`);
        return;
      }
    }
    if (file instanceof import_obsidian.TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }
  async createOrOpenPaperNoteWithPDF(id, title, authors, year, publicationDate, doi, abstract, comments, url, tags, pdfPath, vaultPath, literatureNotesFolder, assetsFolder) {
    const safeId = this.sanitizeFilename(id);
    const safeTitle = title ? this.sanitizeFilename(title) : safeId;
    const notesFolder = literatureNotesFolder || this.settings.paperNotesFolder;
    const pdfFolder = assetsFolder || this.settings.assetsFolder;
    if (!await this.ensureFolderExists(notesFolder)) {
      new import_obsidian.Notice("Cannot create paper note: Literature Notes folder does not exist");
      return;
    }
    if (!await this.ensureFolderExists(pdfFolder)) {
      new import_obsidian.Notice("Cannot create paper note: Assets folder does not exist");
      return;
    }
    const notePath = `${notesFolder}/${safeTitle}.md`;
    let file = this.app.vault.getAbstractFileByPath(notePath);
    let pdfLink = "";
    if (pdfPath && pdfPath.trim() !== "") {
      try {
        let cleanPath = pdfPath.replace(/^file:\/\//, "");
        cleanPath = decodeURIComponent(cleanPath);
        console.log(`Processing PDF from: ${cleanPath}`);
        const safePdfName = this.sanitizeFilename(title || "Untitled") + ".pdf";
        const targetPdfPath = `${pdfFolder}/${safePdfName}`;
        console.log(`Target PDF path: ${targetPdfPath}`);
        const existingPdf = this.app.vault.getAbstractFileByPath(targetPdfPath);
        if (!existingPdf) {
          if (fs.existsSync(cleanPath)) {
            const pdfContent = fs.readFileSync(cleanPath);
            await this.app.vault.createBinary(targetPdfPath, pdfContent.buffer);
            console.log(`\u2705 Copied PDF to: ${targetPdfPath}`);
            new import_obsidian.Notice(`PDF copied: ${safePdfName}`);
          } else {
            console.warn(`\u274C PDF file not found at: ${cleanPath}`);
            new import_obsidian.Notice(`Warning: PDF file not found at source location`);
          }
        } else {
          console.log(`PDF already exists at: ${targetPdfPath}`);
          new import_obsidian.Notice(`Using existing PDF: ${safePdfName}`);
        }
        pdfLink = `[[${targetPdfPath}]]`;
      } catch (error) {
        console.error(`Error copying PDF: ${error}`);
        new import_obsidian.Notice(`Error copying PDF: ${error.message || error}`);
      }
    }
    if (file) {
      new import_obsidian.Notice(`Opening existing paper note: ${safeTitle}`);
    } else {
      let content = this.settings.paperNoteTemplate;
      content = content.replace(/{{id}}/g, id || "");
      content = content.replace(/{{title}}/g, title || "Untitled Paper");
      content = content.replace(/{{authors}}/g, authors || "");
      content = content.replace(/{{year}}/g, year || "");
      content = content.replace(/{{publicationDate}}/g, publicationDate || year || "");
      content = content.replace(/{{doi}}/g, doi || "");
      content = content.replace(/{{abstract}}/g, abstract || "");
      content = content.replace(/{{comments}}/g, comments || "");
      content = content.replace(/{{pdfFilename}}/g, pdfLink.replace(/\[\[|\]\]/g, ""));
      content = content.replace(/{{pdf}}/g, pdfLink);
      content = content.replace(/{{url}}/g, url || "");
      content = content.replace(/{{tags}}/g, tags || "");
      try {
        file = await this.app.vault.create(notePath, content);
        new import_obsidian.Notice(`Created new paper note: ${safeTitle}`);
      } catch (error) {
        console.error(`Error creating paper note: ${error}`);
        new import_obsidian.Notice(`Error creating paper note: ${error}`);
        return;
      }
    }
    if (file instanceof import_obsidian.TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }
  sanitizeFilename(name) {
    return name.replace(/[\\/:*?"<>|]/g, "-");
  }
};
var CreatePaperNoteModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    __publicField(this, "plugin");
    __publicField(this, "idInput");
    __publicField(this, "titleInput");
    __publicField(this, "authorsInput");
    __publicField(this, "yearInput");
    __publicField(this, "doiInput");
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create New Paper Note" });
    contentEl.createEl("label", { text: "Paper ID (required)" }).appendChild(this.idInput = document.createElement("input"));
    this.idInput.type = "text";
    this.idInput.value = "";
    this.idInput.placeholder = "Unique identifier for the paper";
    contentEl.createEl("br");
    contentEl.createEl("label", { text: "Title" }).appendChild(this.titleInput = document.createElement("input"));
    this.titleInput.type = "text";
    this.titleInput.value = "";
    this.titleInput.placeholder = "Paper title";
    contentEl.createEl("br");
    contentEl.createEl("label", { text: "Authors" }).appendChild(this.authorsInput = document.createElement("input"));
    this.authorsInput.type = "text";
    this.authorsInput.value = "";
    this.authorsInput.placeholder = "Paper authors";
    contentEl.createEl("br");
    contentEl.createEl("label", { text: "Year" }).appendChild(this.yearInput = document.createElement("input"));
    this.yearInput.type = "text";
    this.yearInput.value = "";
    this.yearInput.placeholder = "Publication year";
    contentEl.createEl("br");
    contentEl.createEl("label", { text: "DOI" }).appendChild(this.doiInput = document.createElement("input"));
    this.doiInput.type = "text";
    this.doiInput.value = "";
    this.doiInput.placeholder = "Digital Object Identifier";
    contentEl.createEl("br");
    contentEl.createEl("button", { text: "Create Note" }).addEventListener("click", async () => {
      const paperId = this.idInput.value.trim();
      if (!paperId) {
        new import_obsidian.Notice("Paper ID is required");
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
};
var PaperlibSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "plugin");
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "PaperLib Integration Settings" });
    new import_obsidian.Setting(containerEl).setName("Literature Notes Folder").setDesc("The folder where paper notes will be stored. Press Enter or click Create to create the folder.").addText((text) => {
      const textComponent = text.setPlaceholder("Literature Notes").setValue(this.plugin.settings.paperNotesFolder).onChange(async (value) => {
        this.plugin.settings.paperNotesFolder = value;
        await this.plugin.saveSettings();
      });
      const inputEl = textComponent.inputEl;
      inputEl.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (await this.plugin.ensureFolderExists(this.plugin.settings.paperNotesFolder)) {
            new import_obsidian.Notice(`Folder created/verified: ${this.plugin.settings.paperNotesFolder}`);
          }
          inputEl.blur();
        }
      });
      return textComponent;
    }).addButton(
      (button) => button.setButtonText("Create").onClick(async () => {
        if (await this.plugin.ensureFolderExists(this.plugin.settings.paperNotesFolder)) {
          new import_obsidian.Notice(`Folder created/verified: ${this.plugin.settings.paperNotesFolder}`);
        }
      })
    );
    new import_obsidian.Setting(containerEl).setName("Assets Folder").setDesc("The folder where PDF files will be stored. Press Enter or click Create to create the folder.").addText((text) => {
      const textComponent = text.setPlaceholder("assets").setValue(this.plugin.settings.assetsFolder).onChange(async (value) => {
        this.plugin.settings.assetsFolder = value;
        await this.plugin.saveSettings();
      });
      const inputEl = textComponent.inputEl;
      inputEl.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (await this.plugin.ensureFolderExists(this.plugin.settings.assetsFolder)) {
            new import_obsidian.Notice(`Folder created/verified: ${this.plugin.settings.assetsFolder}`);
          }
          inputEl.blur();
        }
      });
      return textComponent;
    }).addButton(
      (button) => button.setButtonText("Create").onClick(async () => {
        if (await this.plugin.ensureFolderExists(this.plugin.settings.assetsFolder)) {
          new import_obsidian.Notice(`Folder created/verified: ${this.plugin.settings.assetsFolder}`);
        }
      })
    );
    new import_obsidian.Setting(containerEl).setName("Note Template").setDesc("Template for new paper notes. Use {{id}}, {{title}}, {{authors}}, {{year}}, {{publicationDate}}, {{doi}}, {{abstract}}, {{comments}}, {{pdf}}, {{url}}, and {{tags}} as placeholders.").addTextArea(
      (text) => text.setPlaceholder("Enter your template").setValue(this.plugin.settings.paperNoteTemplate).onChange(async (value) => {
        this.plugin.settings.paperNoteTemplate = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Enable Protocol Handler").setDesc("Allow opening notes directly from PaperLib using the paperlib:// protocol").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.protocolHandlerEnabled).onChange(async (value) => {
        this.plugin.settings.protocolHandlerEnabled = value;
        await this.plugin.saveSettings();
        new import_obsidian.Notice("Please restart Obsidian for this change to take effect");
      })
    );
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vb2JzaWRpYW5fc3JjL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiwgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBNb2RhbCwgQXBwLCBURmlsZSwgVEZvbGRlciB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmludGVyZmFjZSBQYXBlcmxpYlNldHRpbmdzIHtcbiAgcGFwZXJOb3Rlc0ZvbGRlcjogc3RyaW5nO1xuICBhc3NldHNGb2xkZXI6IHN0cmluZztcbiAgcGFwZXJOb3RlVGVtcGxhdGU6IHN0cmluZztcbiAgcHJvdG9jb2xIYW5kbGVyRW5hYmxlZDogYm9vbGVhbjtcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogUGFwZXJsaWJTZXR0aW5ncyA9IHtcbiAgcGFwZXJOb3Rlc0ZvbGRlcjogJ0xpdGVyYXR1cmUgTm90ZXMnLFxuICBhc3NldHNGb2xkZXI6ICdBc3NldHMnLFxuICBwYXBlck5vdGVUZW1wbGF0ZTogYC0tLVxucGFwZXJfaWQ6IHt7aWR9fVxudGl0bGU6IHt7dGl0bGV9fVxuYXV0aG9yczoge3thdXRob3JzfX1cbnB1YmxpY2F0aW9uX2RhdGU6IHt7cHVibGljYXRpb25EYXRlfX1cbmFic3RyYWN0OiB7e2Fic3RyYWN0fX1cbmNvbW1lbnRzOiB7e2NvbW1lbnRzfX1cbnBkZjoge3twZGZGaWxlbmFtZX19XG51cmw6IHt7dXJsfX1cbnRhZ3M6IHt7dGFnc319XG4tLS1cblxuIyB7e3RpdGxlfX1cblxuIyMgU3VtbWFyeVxuXG4jIyBOb3Rlc1xuXG5gLFxuICBwcm90b2NvbEhhbmRsZXJFbmFibGVkOiB0cnVlLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFwZXJsaWJJbnRlZ3JhdGlvblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBQYXBlcmxpYlNldHRpbmdzO1xuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MucHJvdG9jb2xIYW5kbGVyRW5hYmxlZCkge1xuICAgICAgLy8gUmVnaXN0ZXIgdGhlIHBhcGVybGliIHByb3RvY29sIGhhbmRsZXJcbiAgICAgIHRoaXMucmVnaXN0ZXJPYnNpZGlhblByb3RvY29sSGFuZGxlcigncGFwZXJsaWInLCBhc3luYyAocGFyYW1zKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdSZWNlaXZlZCBQYXBlckxpYiBwcm90b2NvbCByZXF1ZXN0OicsIHBhcmFtcyk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCB7IGlkLCB0aXRsZSwgYXV0aG9ycywgeWVhciwgZG9pIH0gPSBwYXJhbXM7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgbmV3IE5vdGljZSgnRXJyb3I6IE5vIHBhcGVyIElEIHByb3ZpZGVkJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlT3JPcGVuUGFwZXJOb3RlKGlkLCB0aXRsZSwgYXV0aG9ycywgeWVhciwgZG9pKTtcbiAgICAgICAgICBuZXcgTm90aWNlKGBTdWNjZXNzZnVsbHkgb3BlbmVkIHBhcGVyOiAke3RpdGxlIHx8IGlkfWApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGhhbmRsaW5nIHBhcGVybGliIHByb3RvY29sOicsIGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKGBFcnJvciBvcGVuaW5nIHBhcGVyOiAke2Vycm9yLm1lc3NhZ2UgfHwgZXJyb3J9YCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBSZWdpc3RlciB0aGUgcGFwZXJsaWItb3BlbiBwcm90b2NvbCBoYW5kbGVyIHdpdGggUERGIHN1cHBvcnRcbiAgICAgIHRoaXMucmVnaXN0ZXJPYnNpZGlhblByb3RvY29sSGFuZGxlcigncGFwZXJsaWItb3BlbicsIGFzeW5jIChwYXJhbXMpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlY2VpdmVkIHBhcGVybGliLW9wZW4gcHJvdG9jb2wgcmVxdWVzdDonLCBwYXJhbXMpO1xuICAgICAgICBcbiAgICAgICAgLy8gSGFuZGxlIGRpZmZlcmVudCBwYXJhbWV0ZXIgZm9ybWF0c1xuICAgICAgICBpZiAocGFyYW1zLnBhdGgpIHtcbiAgICAgICAgICBjb25zdCBwYXBlclBhdGggPSBwYXJhbXMucGF0aC5yZXBsYWNlKC9ecGFwZXJsaWJcXC8vLCAnJyk7XG4gICAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRpbmcgdG8gb3BlbiBwYXBlciBmcm9tIHBhdGg6ICR7cGFwZXJQYXRofWApO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU9yT3BlblBhcGVyTm90ZShwYXBlclBhdGgsIHBhcGVyUGF0aCk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBTdWNjZXNzZnVsbHkgb3BlbmVkIHBhcGVyOiAke3BhcGVyUGF0aH1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaGFuZGxpbmcgcGF0aCBwYXJhbWV0ZXI6JywgZXJyb3IpO1xuICAgICAgICAgICAgbmV3IE5vdGljZShgRXJyb3Igb3BlbmluZyBwYXBlcjogJHtlcnJvci5tZXNzYWdlIHx8IGVycm9yfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHBhcmFtcy52YXVsdCAmJiBwYXJhbXMuZmlsZSkge1xuICAgICAgICAgIGNvbnN0IHBhcGVyRmlsZSA9IGRlY29kZVVSSUNvbXBvbmVudChwYXJhbXMuZmlsZSk7XG4gICAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRpbmcgdG8gb3BlbiBwYXBlciBmcm9tIHZhdWx0L2ZpbGU6ICR7cGFwZXJGaWxlfWApO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU9yT3BlblBhcGVyTm90ZShwYXBlckZpbGUsIHBhcGVyRmlsZSk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBTdWNjZXNzZnVsbHkgb3BlbmVkIHBhcGVyOiAke3BhcGVyRmlsZX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaGFuZGxpbmcgdmF1bHQvZmlsZSBwYXJhbWV0ZXJzOicsIGVycm9yKTtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoYEVycm9yIG9wZW5pbmcgcGFwZXI6ICR7ZXJyb3IubWVzc2FnZSB8fCBlcnJvcn1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEhhbmRsZSBtZXRhZGF0YSB3aXRoIFBERlxuICAgICAgICBpZiAocGFyYW1zLmlkIHx8IChwYXJhbXMudGl0bGUgJiYgcGFyYW1zLmF1dGhvcnMpKSB7XG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIGF1dGhvcnMsXG4gICAgICAgICAgICB5ZWFyLFxuICAgICAgICAgICAgcHVibGljYXRpb25EYXRlLFxuICAgICAgICAgICAgZG9pLFxuICAgICAgICAgICAgYWJzdHJhY3QsXG4gICAgICAgICAgICBjb21tZW50cyxcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIHRhZ3MsXG4gICAgICAgICAgICBwZGZQYXRoLFxuICAgICAgICAgICAgdmF1bHRQYXRoLFxuICAgICAgICAgICAgbGl0ZXJhdHVyZU5vdGVzRm9sZGVyLFxuICAgICAgICAgICAgYXNzZXRzRm9sZGVyXG4gICAgICAgICAgfSA9IHBhcmFtcztcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBwYXBlcklkID0gaWQgfHwgdGl0bGUgfHwgJ3Vua25vd24nO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0aW5nIHRvIG9wZW4gcGFwZXIgZnJvbSBtZXRhZGF0YTogJHtwYXBlcklkfWApO1xuICAgICAgICAgIFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU9yT3BlblBhcGVyTm90ZVdpdGhQREYoXG4gICAgICAgICAgICAgIHBhcGVySWQsXG4gICAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgICBhdXRob3JzLFxuICAgICAgICAgICAgICB5ZWFyLFxuICAgICAgICAgICAgICBwdWJsaWNhdGlvbkRhdGUsXG4gICAgICAgICAgICAgIGRvaSxcbiAgICAgICAgICAgICAgYWJzdHJhY3QsXG4gICAgICAgICAgICAgIGNvbW1lbnRzLFxuICAgICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICAgIHRhZ3MsXG4gICAgICAgICAgICAgIHBkZlBhdGgsXG4gICAgICAgICAgICAgIHZhdWx0UGF0aCxcbiAgICAgICAgICAgICAgbGl0ZXJhdHVyZU5vdGVzRm9sZGVyLFxuICAgICAgICAgICAgICBhc3NldHNGb2xkZXJcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBTdWNjZXNzZnVsbHkgb3BlbmVkIHBhcGVyOiAke3RpdGxlIHx8IHBhcGVySWR9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGhhbmRsaW5nIG1ldGFkYXRhIHBhcmFtZXRlcnM6JywgZXJyb3IpO1xuICAgICAgICAgICAgbmV3IE5vdGljZShgRXJyb3Igb3BlbmluZyBwYXBlcjogJHtlcnJvci5tZXNzYWdlIHx8IGVycm9yfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbmV3IE5vdGljZSgnRXJyb3I6IENvdWxkIG5vdCByZWNvZ25pemUgcGFyYW1ldGVycyBpbiB0aGUgVVJMJyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VucmVjb2duaXplZCBwYXJhbWV0ZXJzOicsIHBhcmFtcyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6ICdjcmVhdGUtcGFwZXItbm90ZScsXG4gICAgICBuYW1lOiAnQ3JlYXRlIG5ldyBwYXBlciBub3RlJyxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgIG5ldyBDcmVhdGVQYXBlck5vdGVNb2RhbCh0aGlzLmFwcCwgdGhpcykub3BlbigpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogJ29wZW4tcGFwZXJzLWZvbGRlcicsXG4gICAgICBuYW1lOiAnT3BlbiBwYXBlcnMgZm9sZGVyJyxcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuc2V0dGluZ3MucGFwZXJOb3Rlc0ZvbGRlcjtcbiAgICAgICAgY29uc3QgYWJzdHJhY3RGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlcik7XG4gICAgICAgIFxuICAgICAgICBpZiAoYWJzdHJhY3RGaWxlICYmIGFic3RyYWN0RmlsZSBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEZpbGUgPSBhYnN0cmFjdEZpbGUuY2hpbGRyZW5bMF07XG4gICAgICAgICAgaWYgKGZpcnN0RmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZigpLm9wZW5GaWxlKGZpcnN0RmlsZSk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBPcGVuZWQgcGFwZXJzIGZvbGRlcjogJHtmb2xkZXJ9YCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoYE5vIGZpbGUgZm91bmQgaW4gcGFwZXJzIGZvbGRlcjogJHtmb2xkZXJ9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ldyBOb3RpY2UoYFBhcGVycyBmb2xkZXIgbm90IGZvdW5kOiAke2ZvbGRlcn1gKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgUGFwZXJsaWJTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gIH1cblxuICBvbnVubG9hZCgpIHtcbiAgICBjb25zb2xlLmxvZygnUGFwZXJMaWIgSW50ZWdyYXRpb24gcGx1Z2luIHVubG9hZGVkJyk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlckV4aXN0cyhmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoIWZvbGRlclBhdGggfHwgZm9sZGVyUGF0aC50cmltKCkgPT09ICcnKSB7XG4gICAgICBuZXcgTm90aWNlKCdQbGVhc2UgZW50ZXIgYSB2YWxpZCBmb2xkZXIgcGF0aCcpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhYnN0cmFjdEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZm9sZGVyUGF0aCk7XG4gICAgICBcbiAgICAgIGlmIChhYnN0cmFjdEZpbGUpIHtcbiAgICAgICAgaWYgKGFic3RyYWN0RmlsZSBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgRm9sZGVyIGFscmVhZHkgZXhpc3RzOiAke2ZvbGRlclBhdGh9YCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgRXJyb3I6ICR7Zm9sZGVyUGF0aH0gZXhpc3RzIGJ1dCBpcyBub3QgYSBmb2xkZXJgKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJQYXRoKTtcbiAgICAgICAgY29uc29sZS5sb2coYENyZWF0ZWQgZm9sZGVyOiAke2ZvbGRlclBhdGh9YCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBjcmVhdGluZyBmb2xkZXI6ICR7ZXJyb3J9YCk7XG4gICAgICBuZXcgTm90aWNlKGBFcnJvciBjcmVhdGluZyBmb2xkZXI6ICR7ZXJyb3J9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlT3JPcGVuUGFwZXJOb3RlKFxuICAgIGlkOiBzdHJpbmcsXG4gICAgdGl0bGU/OiBzdHJpbmcsXG4gICAgYXV0aG9ycz86IHN0cmluZyxcbiAgICB5ZWFyPzogc3RyaW5nLFxuICAgIGRvaT86IHN0cmluZ1xuICApIHtcbiAgICBjb25zdCBzYWZlSWQgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUoaWQpO1xuICAgIGNvbnN0IHNhZmVUaXRsZSA9IHRpdGxlID8gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHRpdGxlKSA6IHNhZmVJZDtcbiAgICBcbiAgICBpZiAoIShhd2FpdCB0aGlzLmVuc3VyZUZvbGRlckV4aXN0cyh0aGlzLnNldHRpbmdzLnBhcGVyTm90ZXNGb2xkZXIpKSkge1xuICAgICAgbmV3IE5vdGljZSgnQ2Fubm90IGNyZWF0ZSBwYXBlciBub3RlOiBQYXBlcnMgZm9sZGVyIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IG5vdGVQYXRoID0gYCR7dGhpcy5zZXR0aW5ncy5wYXBlck5vdGVzRm9sZGVyfS8ke3NhZmVUaXRsZX0ubWRgO1xuICAgIGxldCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vdGVQYXRoKTtcbiAgICBcbiAgICBpZiAoZmlsZSkge1xuICAgICAgbmV3IE5vdGljZShgT3BlbmluZyBleGlzdGluZyBwYXBlciBub3RlOiAke3NhZmVUaXRsZX1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGNvbnRlbnQgPSB0aGlzLnNldHRpbmdzLnBhcGVyTm90ZVRlbXBsYXRlO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3t0aXRsZX19L2csIHRpdGxlIHx8ICdVbnRpdGxlZCBQYXBlcicpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3thdXRob3JzfX0vZywgYXV0aG9ycyB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3llYXJ9fS9nLCB5ZWFyIHx8ICcnKTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7cHVibGljYXRpb25EYXRlfX0vZywgeWVhciB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2RvaX19L2csIGRvaSB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2lkfX0vZywgaWQpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3thYnN0cmFjdH19L2csICcnKTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7Y29tbWVudHN9fS9nLCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3BkZn19L2csICcnKTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7dXJsfX0vZywgJycpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3t0YWdzfX0vZywgJycpO1xuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBmaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5vdGVQYXRoLCBjb250ZW50KTtcbiAgICAgICAgbmV3IE5vdGljZShgQ3JlYXRlZCBuZXcgcGFwZXIgbm90ZTogJHtzYWZlVGl0bGV9YCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBjcmVhdGluZyBwYXBlciBub3RlOiAke2Vycm9yfWApO1xuICAgICAgICBuZXcgTm90aWNlKGBFcnJvciBjcmVhdGluZyBwYXBlciBub3RlOiAke2Vycm9yfWApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKCkub3BlbkZpbGUoZmlsZSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlT3JPcGVuUGFwZXJOb3RlV2l0aFBERihcbiAgICBpZDogc3RyaW5nLFxuICAgIHRpdGxlPzogc3RyaW5nLFxuICAgIGF1dGhvcnM/OiBzdHJpbmcsXG4gICAgeWVhcj86IHN0cmluZyxcbiAgICBwdWJsaWNhdGlvbkRhdGU/OiBzdHJpbmcsXG4gICAgZG9pPzogc3RyaW5nLFxuICAgIGFic3RyYWN0Pzogc3RyaW5nLFxuICAgIGNvbW1lbnRzPzogc3RyaW5nLFxuICAgIHVybD86IHN0cmluZyxcbiAgICB0YWdzPzogc3RyaW5nLFxuICAgIHBkZlBhdGg/OiBzdHJpbmcsXG4gICAgdmF1bHRQYXRoPzogc3RyaW5nLFxuICAgIGxpdGVyYXR1cmVOb3Rlc0ZvbGRlcj86IHN0cmluZyxcbiAgICBhc3NldHNGb2xkZXI/OiBzdHJpbmdcbiAgKSB7XG4gICAgY29uc3Qgc2FmZUlkID0gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKGlkKTtcbiAgICBjb25zdCBzYWZlVGl0bGUgPSB0aXRsZSA/IHRoaXMuc2FuaXRpemVGaWxlbmFtZSh0aXRsZSkgOiBzYWZlSWQ7XG4gICAgXG4gICAgLy8gVXNlIHNldHRpbmdzIG9yIHByb3ZpZGVkIGZvbGRlciBuYW1lc1xuICAgIGNvbnN0IG5vdGVzRm9sZGVyID0gbGl0ZXJhdHVyZU5vdGVzRm9sZGVyIHx8IHRoaXMuc2V0dGluZ3MucGFwZXJOb3Rlc0ZvbGRlcjtcbiAgICBjb25zdCBwZGZGb2xkZXIgPSBhc3NldHNGb2xkZXIgfHwgdGhpcy5zZXR0aW5ncy5hc3NldHNGb2xkZXI7XG4gICAgXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJFeGlzdHMobm90ZXNGb2xkZXIpKSkge1xuICAgICAgbmV3IE5vdGljZSgnQ2Fubm90IGNyZWF0ZSBwYXBlciBub3RlOiBMaXRlcmF0dXJlIE5vdGVzIGZvbGRlciBkb2VzIG5vdCBleGlzdCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICBpZiAoIShhd2FpdCB0aGlzLmVuc3VyZUZvbGRlckV4aXN0cyhwZGZGb2xkZXIpKSkge1xuICAgICAgbmV3IE5vdGljZSgnQ2Fubm90IGNyZWF0ZSBwYXBlciBub3RlOiBBc3NldHMgZm9sZGVyIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IG5vdGVQYXRoID0gYCR7bm90ZXNGb2xkZXJ9LyR7c2FmZVRpdGxlfS5tZGA7XG4gICAgbGV0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm90ZVBhdGgpO1xuICAgIFxuICAgIC8vIEhhbmRsZSBQREYgY29weVxuICAgIGxldCBwZGZMaW5rID0gJyc7XG4gICAgaWYgKHBkZlBhdGggJiYgcGRmUGF0aC50cmltKCkgIT09ICcnKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBFeHRyYWN0IGZpbGVuYW1lIGZyb20gcGF0aCAoaGFuZGxlIGZpbGU6Ly8gVVJMcylcbiAgICAgICAgbGV0IGNsZWFuUGF0aCA9IHBkZlBhdGgucmVwbGFjZSgvXmZpbGU6XFwvXFwvLywgJycpO1xuICAgICAgICAvLyBIYW5kbGUgVVJMIGVuY29kaW5nIGluIHBhdGhcbiAgICAgICAgY2xlYW5QYXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KGNsZWFuUGF0aCk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyBQREYgZnJvbTogJHtjbGVhblBhdGh9YCk7XG4gICAgICAgIFxuICAgICAgICAvLyBVc2UgcGFwZXIgdGl0bGUgYXMgUERGIGZpbGVuYW1lIGluc3RlYWQgb2Ygb3JpZ2luYWwgZmlsZW5hbWVcbiAgICAgICAgY29uc3Qgc2FmZVBkZk5hbWUgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUodGl0bGUgfHwgJ1VudGl0bGVkJykgKyAnLnBkZic7XG4gICAgICAgIGNvbnN0IHRhcmdldFBkZlBhdGggPSBgJHtwZGZGb2xkZXJ9LyR7c2FmZVBkZk5hbWV9YDtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKGBUYXJnZXQgUERGIHBhdGg6ICR7dGFyZ2V0UGRmUGF0aH1gKTtcbiAgICAgICAgXG4gICAgICAgIC8vIENoZWNrIGlmIFBERiBhbHJlYWR5IGV4aXN0cyBpbiBhc3NldHNcbiAgICAgICAgY29uc3QgZXhpc3RpbmdQZGYgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGFyZ2V0UGRmUGF0aCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWV4aXN0aW5nUGRmKSB7XG4gICAgICAgICAgLy8gQ29weSBQREYgdG8gYXNzZXRzIGZvbGRlciBpZiBpdCBleGlzdHNcbiAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjbGVhblBhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCBwZGZDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGNsZWFuUGF0aCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVCaW5hcnkodGFyZ2V0UGRmUGF0aCwgcGRmQ29udGVudC5idWZmZXIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFx1MjcwNSBDb3BpZWQgUERGIHRvOiAke3RhcmdldFBkZlBhdGh9YCk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBQREYgY29waWVkOiAke3NhZmVQZGZOYW1lfWApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFx1Mjc0QyBQREYgZmlsZSBub3QgZm91bmQgYXQ6ICR7Y2xlYW5QYXRofWApO1xuICAgICAgICAgICAgbmV3IE5vdGljZShgV2FybmluZzogUERGIGZpbGUgbm90IGZvdW5kIGF0IHNvdXJjZSBsb2NhdGlvbmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgUERGIGFscmVhZHkgZXhpc3RzIGF0OiAke3RhcmdldFBkZlBhdGh9YCk7XG4gICAgICAgICAgbmV3IE5vdGljZShgVXNpbmcgZXhpc3RpbmcgUERGOiAke3NhZmVQZGZOYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBDcmVhdGUgd2lraS1zdHlsZSBiaWRpcmVjdGlvbmFsIGxpbmtcbiAgICAgICAgcGRmTGluayA9IGBbWyR7dGFyZ2V0UGRmUGF0aH1dXWA7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBjb3B5aW5nIFBERjogJHtlcnJvcn1gKTtcbiAgICAgICAgbmV3IE5vdGljZShgRXJyb3IgY29weWluZyBQREY6ICR7ZXJyb3IubWVzc2FnZSB8fCBlcnJvcn1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKGZpbGUpIHtcbiAgICAgIG5ldyBOb3RpY2UoYE9wZW5pbmcgZXhpc3RpbmcgcGFwZXIgbm90ZTogJHtzYWZlVGl0bGV9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjb250ZW50ID0gdGhpcy5zZXR0aW5ncy5wYXBlck5vdGVUZW1wbGF0ZTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7aWR9fS9nLCBpZCB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3RpdGxlfX0vZywgdGl0bGUgfHwgJ1VudGl0bGVkIFBhcGVyJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2F1dGhvcnN9fS9nLCBhdXRob3JzIHx8ICcnKTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7eWVhcn19L2csIHllYXIgfHwgJycpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3twdWJsaWNhdGlvbkRhdGV9fS9nLCBwdWJsaWNhdGlvbkRhdGUgfHwgeWVhciB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2RvaX19L2csIGRvaSB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2Fic3RyYWN0fX0vZywgYWJzdHJhY3QgfHwgJycpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3tjb21tZW50c319L2csIGNvbW1lbnRzIHx8ICcnKTtcbiAgICAgIC8vIEZvciBwcm9wZXJ0aWVzOiB1c2UgcGxhaW4gcGF0aCB3aXRob3V0IGJyYWNrZXRzIChPYnNpZGlhbiB3aWxsIGF1dG8tbGluayBpdClcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7cGRmRmlsZW5hbWV9fS9nLCBwZGZMaW5rLnJlcGxhY2UoL1xcW1xcW3xcXF1cXF0vZywgJycpKTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7cGRmfX0vZywgcGRmTGluayk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3VybH19L2csIHVybCB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3RhZ3N9fS9nLCB0YWdzIHx8ICcnKTtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgICAgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShub3RlUGF0aCwgY29udGVudCk7XG4gICAgICAgIG5ldyBOb3RpY2UoYENyZWF0ZWQgbmV3IHBhcGVyIG5vdGU6ICR7c2FmZVRpdGxlfWApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgY3JlYXRpbmcgcGFwZXIgbm90ZTogJHtlcnJvcn1gKTtcbiAgICAgICAgbmV3IE5vdGljZShgRXJyb3IgY3JlYXRpbmcgcGFwZXIgbm90ZTogJHtlcnJvcn1gKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZigpLm9wZW5GaWxlKGZpbGUpO1xuICAgIH1cbiAgfVxuXG4gIHNhbml0aXplRmlsZW5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmFtZS5yZXBsYWNlKC9bXFxcXC86Kj9cIjw+fF0vZywgJy0nKTtcbiAgfVxufVxuXG5jbGFzcyBDcmVhdGVQYXBlck5vdGVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcGx1Z2luOiBQYXBlcmxpYkludGVncmF0aW9uUGx1Z2luO1xuICBpZElucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xuICB0aXRsZUlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xuICBhdXRob3JzSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQ7XG4gIHllYXJJbnB1dDogSFRNTElucHV0RWxlbWVudDtcbiAgZG9pSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogUGFwZXJsaWJJbnRlZ3JhdGlvblBsdWdpbikge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBvbk9wZW4oKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiAnQ3JlYXRlIE5ldyBQYXBlciBOb3RlJyB9KTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnbGFiZWwnLCB7IHRleHQ6ICdQYXBlciBJRCAocmVxdWlyZWQpJyB9KVxuICAgICAgLmFwcGVuZENoaWxkKHRoaXMuaWRJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JykpO1xuICAgIHRoaXMuaWRJbnB1dC50eXBlID0gJ3RleHQnO1xuICAgIHRoaXMuaWRJbnB1dC52YWx1ZSA9ICcnO1xuICAgIHRoaXMuaWRJbnB1dC5wbGFjZWhvbGRlciA9ICdVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHBhcGVyJztcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnYnInKTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnbGFiZWwnLCB7IHRleHQ6ICdUaXRsZScgfSlcbiAgICAgIC5hcHBlbmRDaGlsZCh0aGlzLnRpdGxlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpKTtcbiAgICB0aGlzLnRpdGxlSW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICB0aGlzLnRpdGxlSW5wdXQudmFsdWUgPSAnJztcbiAgICB0aGlzLnRpdGxlSW5wdXQucGxhY2Vob2xkZXIgPSAnUGFwZXIgdGl0bGUnO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKCdicicpO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKCdsYWJlbCcsIHsgdGV4dDogJ0F1dGhvcnMnIH0pXG4gICAgICAuYXBwZW5kQ2hpbGQodGhpcy5hdXRob3JzSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpKTtcbiAgICB0aGlzLmF1dGhvcnNJbnB1dC50eXBlID0gJ3RleHQnO1xuICAgIHRoaXMuYXV0aG9yc0lucHV0LnZhbHVlID0gJyc7XG4gICAgdGhpcy5hdXRob3JzSW5wdXQucGxhY2Vob2xkZXIgPSAnUGFwZXIgYXV0aG9ycyc7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2JyJyk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2xhYmVsJywgeyB0ZXh0OiAnWWVhcicgfSlcbiAgICAgIC5hcHBlbmRDaGlsZCh0aGlzLnllYXJJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JykpO1xuICAgIHRoaXMueWVhcklucHV0LnR5cGUgPSAndGV4dCc7XG4gICAgdGhpcy55ZWFySW5wdXQudmFsdWUgPSAnJztcbiAgICB0aGlzLnllYXJJbnB1dC5wbGFjZWhvbGRlciA9ICdQdWJsaWNhdGlvbiB5ZWFyJztcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnYnInKTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnbGFiZWwnLCB7IHRleHQ6ICdET0knIH0pXG4gICAgICAuYXBwZW5kQ2hpbGQodGhpcy5kb2lJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JykpO1xuICAgIHRoaXMuZG9pSW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICB0aGlzLmRvaUlucHV0LnZhbHVlID0gJyc7XG4gICAgdGhpcy5kb2lJbnB1dC5wbGFjZWhvbGRlciA9ICdEaWdpdGFsIE9iamVjdCBJZGVudGlmaWVyJztcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnYnInKTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnQ3JlYXRlIE5vdGUnIH0pXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhcGVySWQgPSB0aGlzLmlkSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFwYXBlcklkKSB7XG4gICAgICAgICAgbmV3IE5vdGljZSgnUGFwZXIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmNyZWF0ZU9yT3BlblBhcGVyTm90ZShcbiAgICAgICAgICBwYXBlcklkLFxuICAgICAgICAgIHRoaXMudGl0bGVJbnB1dC52YWx1ZS50cmltKCksXG4gICAgICAgICAgdGhpcy5hdXRob3JzSW5wdXQudmFsdWUudHJpbSgpLFxuICAgICAgICAgIHRoaXMueWVhcklucHV0LnZhbHVlLnRyaW0oKSxcbiAgICAgICAgICB0aGlzLmRvaUlucHV0LnZhbHVlLnRyaW0oKVxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG59XG5cbmNsYXNzIFBhcGVybGliU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IFBhcGVybGliSW50ZWdyYXRpb25QbHVnaW47XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogUGFwZXJsaWJJbnRlZ3JhdGlvblBsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcblxuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbCgnaDInLCB7IHRleHQ6ICdQYXBlckxpYiBJbnRlZ3JhdGlvbiBTZXR0aW5ncycgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKCdMaXRlcmF0dXJlIE5vdGVzIEZvbGRlcicpXG4gICAgICAuc2V0RGVzYygnVGhlIGZvbGRlciB3aGVyZSBwYXBlciBub3RlcyB3aWxsIGJlIHN0b3JlZC4gUHJlc3MgRW50ZXIgb3IgY2xpY2sgQ3JlYXRlIHRvIGNyZWF0ZSB0aGUgZm9sZGVyLicpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICBjb25zdCB0ZXh0Q29tcG9uZW50ID0gdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcignTGl0ZXJhdHVyZSBOb3RlcycpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnBhcGVyTm90ZXNGb2xkZXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGFwZXJOb3Rlc0ZvbGRlciA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBpbnB1dEVsID0gdGV4dENvbXBvbmVudC5pbnB1dEVsO1xuICAgICAgICBpbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaWYgKGF3YWl0IHRoaXMucGx1Z2luLmVuc3VyZUZvbGRlckV4aXN0cyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXBlck5vdGVzRm9sZGVyKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKGBGb2xkZXIgY3JlYXRlZC92ZXJpZmllZDogJHt0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXBlck5vdGVzRm9sZGVyfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5wdXRFbC5ibHVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0ZXh0Q29tcG9uZW50O1xuICAgICAgfSlcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoJ0NyZWF0ZScpXG4gICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGF3YWl0IHRoaXMucGx1Z2luLmVuc3VyZUZvbGRlckV4aXN0cyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXBlck5vdGVzRm9sZGVyKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKGBGb2xkZXIgY3JlYXRlZC92ZXJpZmllZDogJHt0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXBlck5vdGVzRm9sZGVyfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZSgnQXNzZXRzIEZvbGRlcicpXG4gICAgICAuc2V0RGVzYygnVGhlIGZvbGRlciB3aGVyZSBQREYgZmlsZXMgd2lsbCBiZSBzdG9yZWQuIFByZXNzIEVudGVyIG9yIGNsaWNrIENyZWF0ZSB0byBjcmVhdGUgdGhlIGZvbGRlci4nKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgY29uc3QgdGV4dENvbXBvbmVudCA9IHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ2Fzc2V0cycpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmFzc2V0c0ZvbGRlcilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NldHNGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgaW5wdXRFbCA9IHRleHRDb21wb25lbnQuaW5wdXRFbDtcbiAgICAgICAgaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmIChhd2FpdCB0aGlzLnBsdWdpbi5lbnN1cmVGb2xkZXJFeGlzdHModGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRzRm9sZGVyKSkge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKGBGb2xkZXIgY3JlYXRlZC92ZXJpZmllZDogJHt0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NldHNGb2xkZXJ9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnB1dEVsLmJsdXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRleHRDb21wb25lbnQ7XG4gICAgICB9KVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dCgnQ3JlYXRlJylcbiAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoYXdhaXQgdGhpcy5wbHVnaW4uZW5zdXJlRm9sZGVyRXhpc3RzKHRoaXMucGx1Z2luLnNldHRpbmdzLmFzc2V0c0ZvbGRlcikpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShgRm9sZGVyIGNyZWF0ZWQvdmVyaWZpZWQ6ICR7dGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRzRm9sZGVyfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZSgnTm90ZSBUZW1wbGF0ZScpXG4gICAgICAuc2V0RGVzYygnVGVtcGxhdGUgZm9yIG5ldyBwYXBlciBub3Rlcy4gVXNlIHt7aWR9fSwge3t0aXRsZX19LCB7e2F1dGhvcnN9fSwge3t5ZWFyfX0sIHt7cHVibGljYXRpb25EYXRlfX0sIHt7ZG9pfX0sIHt7YWJzdHJhY3R9fSwge3tjb21tZW50c319LCB7e3BkZn19LCB7e3VybH19LCBhbmQge3t0YWdzfX0gYXMgcGxhY2Vob2xkZXJzLicpXG4gICAgICAuYWRkVGV4dEFyZWEoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ0VudGVyIHlvdXIgdGVtcGxhdGUnKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXBlck5vdGVUZW1wbGF0ZSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXBlck5vdGVUZW1wbGF0ZSA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKCdFbmFibGUgUHJvdG9jb2wgSGFuZGxlcicpXG4gICAgICAuc2V0RGVzYygnQWxsb3cgb3BlbmluZyBub3RlcyBkaXJlY3RseSBmcm9tIFBhcGVyTGliIHVzaW5nIHRoZSBwYXBlcmxpYjovLyBwcm90b2NvbCcpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wcm90b2NvbEhhbmRsZXJFbmFibGVkKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3RvY29sSGFuZGxlckVuYWJsZWQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgbmV3IE5vdGljZSgnUGxlYXNlIHJlc3RhcnQgT2JzaWRpYW4gZm9yIHRoaXMgY2hhbmdlIHRvIHRha2UgZWZmZWN0Jyk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNCQUFzRjtBQUN0RixTQUFvQjtBQVVwQixJQUFNLG1CQUFxQztBQUFBLEVBQ3pDLGtCQUFrQjtBQUFBLEVBQ2xCLGNBQWM7QUFBQSxFQUNkLG1CQUFtQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBbUJuQix3QkFBd0I7QUFDMUI7QUFFQSxJQUFxQiw0QkFBckIsY0FBdUQsdUJBQU87QUFBQSxFQUE5RDtBQUFBO0FBQ0U7QUFBQTtBQUFBLEVBRUEsTUFBTSxTQUFTO0FBQ2IsVUFBTSxLQUFLLGFBQWE7QUFFeEIsUUFBSSxLQUFLLFNBQVMsd0JBQXdCO0FBRXhDLFdBQUssZ0NBQWdDLFlBQVksT0FBTyxXQUFXO0FBQ2pFLGdCQUFRLElBQUksdUNBQXVDLE1BQU07QUFFekQsY0FBTSxFQUFFLElBQUksT0FBTyxTQUFTLE1BQU0sSUFBSSxJQUFJO0FBRTFDLFlBQUksQ0FBQyxJQUFJO0FBQ1AsY0FBSSx1QkFBTyw2QkFBNkI7QUFDeEM7QUFBQSxRQUNGO0FBRUEsWUFBSTtBQUNGLGdCQUFNLEtBQUssc0JBQXNCLElBQUksT0FBTyxTQUFTLE1BQU0sR0FBRztBQUM5RCxjQUFJLHVCQUFPLDhCQUE4QixTQUFTLEVBQUUsRUFBRTtBQUFBLFFBQ3hELFNBQVMsT0FBTztBQUNkLGtCQUFRLE1BQU0scUNBQXFDLEtBQUs7QUFDeEQsY0FBSSx1QkFBTyx3QkFBd0IsTUFBTSxXQUFXLEtBQUssRUFBRTtBQUFBLFFBQzdEO0FBQUEsTUFDRixDQUFDO0FBR0QsV0FBSyxnQ0FBZ0MsaUJBQWlCLE9BQU8sV0FBVztBQUN0RSxnQkFBUSxJQUFJLDRDQUE0QyxNQUFNO0FBRzlELFlBQUksT0FBTyxNQUFNO0FBQ2YsZ0JBQU0sWUFBWSxPQUFPLEtBQUssUUFBUSxlQUFlLEVBQUU7QUFDdkQsa0JBQVEsSUFBSSx1Q0FBdUMsU0FBUyxFQUFFO0FBQzlELGNBQUk7QUFDRixrQkFBTSxLQUFLLHNCQUFzQixXQUFXLFNBQVM7QUFDckQsZ0JBQUksdUJBQU8sOEJBQThCLFNBQVMsRUFBRTtBQUNwRDtBQUFBLFVBQ0YsU0FBUyxPQUFPO0FBQ2Qsb0JBQVEsTUFBTSxrQ0FBa0MsS0FBSztBQUNyRCxnQkFBSSx1QkFBTyx3QkFBd0IsTUFBTSxXQUFXLEtBQUssRUFBRTtBQUFBLFVBQzdEO0FBQUEsUUFDRjtBQUVBLFlBQUksT0FBTyxTQUFTLE9BQU8sTUFBTTtBQUMvQixnQkFBTSxZQUFZLG1CQUFtQixPQUFPLElBQUk7QUFDaEQsa0JBQVEsSUFBSSw2Q0FBNkMsU0FBUyxFQUFFO0FBQ3BFLGNBQUk7QUFDRixrQkFBTSxLQUFLLHNCQUFzQixXQUFXLFNBQVM7QUFDckQsZ0JBQUksdUJBQU8sOEJBQThCLFNBQVMsRUFBRTtBQUNwRDtBQUFBLFVBQ0YsU0FBUyxPQUFPO0FBQ2Qsb0JBQVEsTUFBTSx5Q0FBeUMsS0FBSztBQUM1RCxnQkFBSSx1QkFBTyx3QkFBd0IsTUFBTSxXQUFXLEtBQUssRUFBRTtBQUFBLFVBQzdEO0FBQUEsUUFDRjtBQUdBLFlBQUksT0FBTyxNQUFPLE9BQU8sU0FBUyxPQUFPLFNBQVU7QUFDakQsZ0JBQU07QUFBQSxZQUNKO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0YsSUFBSTtBQUVKLGdCQUFNLFVBQVUsTUFBTSxTQUFTO0FBQy9CLGtCQUFRLElBQUksMkNBQTJDLE9BQU8sRUFBRTtBQUVoRSxjQUFJO0FBQ0Ysa0JBQU0sS0FBSztBQUFBLGNBQ1Q7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsWUFDRjtBQUNBLGdCQUFJLHVCQUFPLDhCQUE4QixTQUFTLE9BQU8sRUFBRTtBQUMzRDtBQUFBLFVBQ0YsU0FBUyxPQUFPO0FBQ2Qsb0JBQVEsTUFBTSx1Q0FBdUMsS0FBSztBQUMxRCxnQkFBSSx1QkFBTyx3QkFBd0IsTUFBTSxXQUFXLEtBQUssRUFBRTtBQUFBLFVBQzdEO0FBQUEsUUFDRjtBQUVBLFlBQUksdUJBQU8sa0RBQWtEO0FBQzdELGdCQUFRLE1BQU0sNEJBQTRCLE1BQU07QUFBQSxNQUNsRCxDQUFDO0FBQUEsSUFDSDtBQUVBLFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNO0FBQ2QsWUFBSSxxQkFBcUIsS0FBSyxLQUFLLElBQUksRUFBRSxLQUFLO0FBQUEsTUFDaEQ7QUFBQSxJQUNGLENBQUM7QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsWUFBWTtBQUNwQixjQUFNLFNBQVMsS0FBSyxTQUFTO0FBQzdCLGNBQU0sZUFBZSxLQUFLLElBQUksTUFBTSxzQkFBc0IsTUFBTTtBQUVoRSxZQUFJLGdCQUFnQix3QkFBd0IseUJBQVM7QUFDbkQsZ0JBQU0sWUFBWSxhQUFhLFNBQVMsQ0FBQztBQUN6QyxjQUFJLHFCQUFxQix1QkFBTztBQUM5QixpQkFBSyxJQUFJLFVBQVUsUUFBUSxFQUFFLFNBQVMsU0FBUztBQUMvQyxnQkFBSSx1QkFBTyx5QkFBeUIsTUFBTSxFQUFFO0FBQUEsVUFDOUMsT0FBTztBQUNMLGdCQUFJLHVCQUFPLG1DQUFtQyxNQUFNLEVBQUU7QUFBQSxVQUN4RDtBQUFBLFFBQ0YsT0FBTztBQUNMLGNBQUksdUJBQU8sNEJBQTRCLE1BQU0sRUFBRTtBQUFBLFFBQ2pEO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssY0FBYyxJQUFJLG1CQUFtQixLQUFLLEtBQUssSUFBSSxDQUFDO0FBQUEsRUFDM0Q7QUFBQSxFQUVBLFdBQVc7QUFDVCxZQUFRLElBQUksc0NBQXNDO0FBQUEsRUFDcEQ7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUFBLEVBQzNFO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQUEsRUFDbkM7QUFBQSxFQUVBLE1BQU0sbUJBQW1CLFlBQXNDO0FBQzdELFFBQUksQ0FBQyxjQUFjLFdBQVcsS0FBSyxNQUFNLElBQUk7QUFDM0MsVUFBSSx1QkFBTyxrQ0FBa0M7QUFDN0MsYUFBTztBQUFBLElBQ1Q7QUFFQSxRQUFJO0FBQ0YsWUFBTSxlQUFlLEtBQUssSUFBSSxNQUFNLHNCQUFzQixVQUFVO0FBRXBFLFVBQUksY0FBYztBQUNoQixZQUFJLHdCQUF3Qix5QkFBUztBQUNuQyxrQkFBUSxJQUFJLDBCQUEwQixVQUFVLEVBQUU7QUFDbEQsaUJBQU87QUFBQSxRQUNULE9BQU87QUFDTCxjQUFJLHVCQUFPLFVBQVUsVUFBVSw2QkFBNkI7QUFDNUQsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRixPQUFPO0FBQ0wsY0FBTSxLQUFLLElBQUksTUFBTSxhQUFhLFVBQVU7QUFDNUMsZ0JBQVEsSUFBSSxtQkFBbUIsVUFBVSxFQUFFO0FBQzNDLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRixTQUFTLE9BQU87QUFDZCxjQUFRLE1BQU0sMEJBQTBCLEtBQUssRUFBRTtBQUMvQyxVQUFJLHVCQUFPLDBCQUEwQixLQUFLLEVBQUU7QUFDNUMsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLHNCQUNKLElBQ0EsT0FDQSxTQUNBLE1BQ0EsS0FDQTtBQUNBLFVBQU0sU0FBUyxLQUFLLGlCQUFpQixFQUFFO0FBQ3ZDLFVBQU0sWUFBWSxRQUFRLEtBQUssaUJBQWlCLEtBQUssSUFBSTtBQUV6RCxRQUFJLENBQUUsTUFBTSxLQUFLLG1CQUFtQixLQUFLLFNBQVMsZ0JBQWdCLEdBQUk7QUFDcEUsVUFBSSx1QkFBTyx3REFBd0Q7QUFDbkU7QUFBQSxJQUNGO0FBRUEsVUFBTSxXQUFXLEdBQUcsS0FBSyxTQUFTLGdCQUFnQixJQUFJLFNBQVM7QUFDL0QsUUFBSSxPQUFPLEtBQUssSUFBSSxNQUFNLHNCQUFzQixRQUFRO0FBRXhELFFBQUksTUFBTTtBQUNSLFVBQUksdUJBQU8sZ0NBQWdDLFNBQVMsRUFBRTtBQUFBLElBQ3hELE9BQU87QUFDTCxVQUFJLFVBQVUsS0FBSyxTQUFTO0FBQzVCLGdCQUFVLFFBQVEsUUFBUSxjQUFjLFNBQVMsZ0JBQWdCO0FBQ2pFLGdCQUFVLFFBQVEsUUFBUSxnQkFBZ0IsV0FBVyxFQUFFO0FBQ3ZELGdCQUFVLFFBQVEsUUFBUSxhQUFhLFFBQVEsRUFBRTtBQUNqRCxnQkFBVSxRQUFRLFFBQVEsd0JBQXdCLFFBQVEsRUFBRTtBQUM1RCxnQkFBVSxRQUFRLFFBQVEsWUFBWSxPQUFPLEVBQUU7QUFDL0MsZ0JBQVUsUUFBUSxRQUFRLFdBQVcsRUFBRTtBQUN2QyxnQkFBVSxRQUFRLFFBQVEsaUJBQWlCLEVBQUU7QUFDN0MsZ0JBQVUsUUFBUSxRQUFRLGlCQUFpQixFQUFFO0FBQzdDLGdCQUFVLFFBQVEsUUFBUSxZQUFZLEVBQUU7QUFDeEMsZ0JBQVUsUUFBUSxRQUFRLFlBQVksRUFBRTtBQUN4QyxnQkFBVSxRQUFRLFFBQVEsYUFBYSxFQUFFO0FBRXpDLFVBQUk7QUFDRixlQUFPLE1BQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxVQUFVLE9BQU87QUFDcEQsWUFBSSx1QkFBTywyQkFBMkIsU0FBUyxFQUFFO0FBQUEsTUFDbkQsU0FBUyxPQUFPO0FBQ2QsZ0JBQVEsTUFBTSw4QkFBOEIsS0FBSyxFQUFFO0FBQ25ELFlBQUksdUJBQU8sOEJBQThCLEtBQUssRUFBRTtBQUNoRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsUUFBSSxnQkFBZ0IsdUJBQU87QUFDekIsWUFBTSxLQUFLLElBQUksVUFBVSxRQUFRLEVBQUUsU0FBUyxJQUFJO0FBQUEsSUFDbEQ7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLDZCQUNKLElBQ0EsT0FDQSxTQUNBLE1BQ0EsaUJBQ0EsS0FDQSxVQUNBLFVBQ0EsS0FDQSxNQUNBLFNBQ0EsV0FDQSx1QkFDQSxjQUNBO0FBQ0EsVUFBTSxTQUFTLEtBQUssaUJBQWlCLEVBQUU7QUFDdkMsVUFBTSxZQUFZLFFBQVEsS0FBSyxpQkFBaUIsS0FBSyxJQUFJO0FBR3pELFVBQU0sY0FBYyx5QkFBeUIsS0FBSyxTQUFTO0FBQzNELFVBQU0sWUFBWSxnQkFBZ0IsS0FBSyxTQUFTO0FBRWhELFFBQUksQ0FBRSxNQUFNLEtBQUssbUJBQW1CLFdBQVcsR0FBSTtBQUNqRCxVQUFJLHVCQUFPLGtFQUFrRTtBQUM3RTtBQUFBLElBQ0Y7QUFFQSxRQUFJLENBQUUsTUFBTSxLQUFLLG1CQUFtQixTQUFTLEdBQUk7QUFDL0MsVUFBSSx1QkFBTyx3REFBd0Q7QUFDbkU7QUFBQSxJQUNGO0FBRUEsVUFBTSxXQUFXLEdBQUcsV0FBVyxJQUFJLFNBQVM7QUFDNUMsUUFBSSxPQUFPLEtBQUssSUFBSSxNQUFNLHNCQUFzQixRQUFRO0FBR3hELFFBQUksVUFBVTtBQUNkLFFBQUksV0FBVyxRQUFRLEtBQUssTUFBTSxJQUFJO0FBQ3BDLFVBQUk7QUFFRixZQUFJLFlBQVksUUFBUSxRQUFRLGNBQWMsRUFBRTtBQUVoRCxvQkFBWSxtQkFBbUIsU0FBUztBQUV4QyxnQkFBUSxJQUFJLHdCQUF3QixTQUFTLEVBQUU7QUFHL0MsY0FBTSxjQUFjLEtBQUssaUJBQWlCLFNBQVMsVUFBVSxJQUFJO0FBQ2pFLGNBQU0sZ0JBQWdCLEdBQUcsU0FBUyxJQUFJLFdBQVc7QUFFakQsZ0JBQVEsSUFBSSxvQkFBb0IsYUFBYSxFQUFFO0FBRy9DLGNBQU0sY0FBYyxLQUFLLElBQUksTUFBTSxzQkFBc0IsYUFBYTtBQUV0RSxZQUFJLENBQUMsYUFBYTtBQUVoQixjQUFPLGNBQVcsU0FBUyxHQUFHO0FBQzVCLGtCQUFNLGFBQWdCLGdCQUFhLFNBQVM7QUFDNUMsa0JBQU0sS0FBSyxJQUFJLE1BQU0sYUFBYSxlQUFlLFdBQVcsTUFBTTtBQUNsRSxvQkFBUSxJQUFJLHlCQUFvQixhQUFhLEVBQUU7QUFDL0MsZ0JBQUksdUJBQU8sZUFBZSxXQUFXLEVBQUU7QUFBQSxVQUN6QyxPQUFPO0FBQ0wsb0JBQVEsS0FBSyxpQ0FBNEIsU0FBUyxFQUFFO0FBQ3BELGdCQUFJLHVCQUFPLGdEQUFnRDtBQUFBLFVBQzdEO0FBQUEsUUFDRixPQUFPO0FBQ0wsa0JBQVEsSUFBSSwwQkFBMEIsYUFBYSxFQUFFO0FBQ3JELGNBQUksdUJBQU8sdUJBQXVCLFdBQVcsRUFBRTtBQUFBLFFBQ2pEO0FBR0Esa0JBQVUsS0FBSyxhQUFhO0FBQUEsTUFDOUIsU0FBUyxPQUFPO0FBQ2QsZ0JBQVEsTUFBTSxzQkFBc0IsS0FBSyxFQUFFO0FBQzNDLFlBQUksdUJBQU8sc0JBQXNCLE1BQU0sV0FBVyxLQUFLLEVBQUU7QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFFQSxRQUFJLE1BQU07QUFDUixVQUFJLHVCQUFPLGdDQUFnQyxTQUFTLEVBQUU7QUFBQSxJQUN4RCxPQUFPO0FBQ0wsVUFBSSxVQUFVLEtBQUssU0FBUztBQUM1QixnQkFBVSxRQUFRLFFBQVEsV0FBVyxNQUFNLEVBQUU7QUFDN0MsZ0JBQVUsUUFBUSxRQUFRLGNBQWMsU0FBUyxnQkFBZ0I7QUFDakUsZ0JBQVUsUUFBUSxRQUFRLGdCQUFnQixXQUFXLEVBQUU7QUFDdkQsZ0JBQVUsUUFBUSxRQUFRLGFBQWEsUUFBUSxFQUFFO0FBQ2pELGdCQUFVLFFBQVEsUUFBUSx3QkFBd0IsbUJBQW1CLFFBQVEsRUFBRTtBQUMvRSxnQkFBVSxRQUFRLFFBQVEsWUFBWSxPQUFPLEVBQUU7QUFDL0MsZ0JBQVUsUUFBUSxRQUFRLGlCQUFpQixZQUFZLEVBQUU7QUFDekQsZ0JBQVUsUUFBUSxRQUFRLGlCQUFpQixZQUFZLEVBQUU7QUFFekQsZ0JBQVUsUUFBUSxRQUFRLG9CQUFvQixRQUFRLFFBQVEsY0FBYyxFQUFFLENBQUM7QUFDL0UsZ0JBQVUsUUFBUSxRQUFRLFlBQVksT0FBTztBQUM3QyxnQkFBVSxRQUFRLFFBQVEsWUFBWSxPQUFPLEVBQUU7QUFDL0MsZ0JBQVUsUUFBUSxRQUFRLGFBQWEsUUFBUSxFQUFFO0FBRWpELFVBQUk7QUFDRixlQUFPLE1BQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxVQUFVLE9BQU87QUFDcEQsWUFBSSx1QkFBTywyQkFBMkIsU0FBUyxFQUFFO0FBQUEsTUFDbkQsU0FBUyxPQUFPO0FBQ2QsZ0JBQVEsTUFBTSw4QkFBOEIsS0FBSyxFQUFFO0FBQ25ELFlBQUksdUJBQU8sOEJBQThCLEtBQUssRUFBRTtBQUNoRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsUUFBSSxnQkFBZ0IsdUJBQU87QUFDekIsWUFBTSxLQUFLLElBQUksVUFBVSxRQUFRLEVBQUUsU0FBUyxJQUFJO0FBQUEsSUFDbEQ7QUFBQSxFQUNGO0FBQUEsRUFFQSxpQkFBaUIsTUFBc0I7QUFDckMsV0FBTyxLQUFLLFFBQVEsaUJBQWlCLEdBQUc7QUFBQSxFQUMxQztBQUNGO0FBRUEsSUFBTSx1QkFBTixjQUFtQyxzQkFBTTtBQUFBLEVBUXZDLFlBQVksS0FBVSxRQUFtQztBQUN2RCxVQUFNLEdBQUc7QUFSWDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFJRSxTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsU0FBUztBQUNQLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFFdEIsY0FBVSxTQUFTLE1BQU0sRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBRTFELGNBQVUsU0FBUyxTQUFTLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQyxFQUN4RCxZQUFZLEtBQUssVUFBVSxTQUFTLGNBQWMsT0FBTyxDQUFDO0FBQzdELFNBQUssUUFBUSxPQUFPO0FBQ3BCLFNBQUssUUFBUSxRQUFRO0FBQ3JCLFNBQUssUUFBUSxjQUFjO0FBRTNCLGNBQVUsU0FBUyxJQUFJO0FBRXZCLGNBQVUsU0FBUyxTQUFTLEVBQUUsTUFBTSxRQUFRLENBQUMsRUFDMUMsWUFBWSxLQUFLLGFBQWEsU0FBUyxjQUFjLE9BQU8sQ0FBQztBQUNoRSxTQUFLLFdBQVcsT0FBTztBQUN2QixTQUFLLFdBQVcsUUFBUTtBQUN4QixTQUFLLFdBQVcsY0FBYztBQUU5QixjQUFVLFNBQVMsSUFBSTtBQUV2QixjQUFVLFNBQVMsU0FBUyxFQUFFLE1BQU0sVUFBVSxDQUFDLEVBQzVDLFlBQVksS0FBSyxlQUFlLFNBQVMsY0FBYyxPQUFPLENBQUM7QUFDbEUsU0FBSyxhQUFhLE9BQU87QUFDekIsU0FBSyxhQUFhLFFBQVE7QUFDMUIsU0FBSyxhQUFhLGNBQWM7QUFFaEMsY0FBVSxTQUFTLElBQUk7QUFFdkIsY0FBVSxTQUFTLFNBQVMsRUFBRSxNQUFNLE9BQU8sQ0FBQyxFQUN6QyxZQUFZLEtBQUssWUFBWSxTQUFTLGNBQWMsT0FBTyxDQUFDO0FBQy9ELFNBQUssVUFBVSxPQUFPO0FBQ3RCLFNBQUssVUFBVSxRQUFRO0FBQ3ZCLFNBQUssVUFBVSxjQUFjO0FBRTdCLGNBQVUsU0FBUyxJQUFJO0FBRXZCLGNBQVUsU0FBUyxTQUFTLEVBQUUsTUFBTSxNQUFNLENBQUMsRUFDeEMsWUFBWSxLQUFLLFdBQVcsU0FBUyxjQUFjLE9BQU8sQ0FBQztBQUM5RCxTQUFLLFNBQVMsT0FBTztBQUNyQixTQUFLLFNBQVMsUUFBUTtBQUN0QixTQUFLLFNBQVMsY0FBYztBQUU1QixjQUFVLFNBQVMsSUFBSTtBQUV2QixjQUFVLFNBQVMsVUFBVSxFQUFFLE1BQU0sY0FBYyxDQUFDLEVBQ2pELGlCQUFpQixTQUFTLFlBQVk7QUFDckMsWUFBTSxVQUFVLEtBQUssUUFBUSxNQUFNLEtBQUs7QUFFeEMsVUFBSSxDQUFDLFNBQVM7QUFDWixZQUFJLHVCQUFPLHNCQUFzQjtBQUNqQztBQUFBLE1BQ0Y7QUFFQSxZQUFNLEtBQUssT0FBTztBQUFBLFFBQ2hCO0FBQUEsUUFDQSxLQUFLLFdBQVcsTUFBTSxLQUFLO0FBQUEsUUFDM0IsS0FBSyxhQUFhLE1BQU0sS0FBSztBQUFBLFFBQzdCLEtBQUssVUFBVSxNQUFNLEtBQUs7QUFBQSxRQUMxQixLQUFLLFNBQVMsTUFBTSxLQUFLO0FBQUEsTUFDM0I7QUFFQSxXQUFLLE1BQU07QUFBQSxJQUNiLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFFQSxVQUFVO0FBQ1IsVUFBTSxFQUFFLFVBQVUsSUFBSTtBQUN0QixjQUFVLE1BQU07QUFBQSxFQUNsQjtBQUNGO0FBRUEsSUFBTSxxQkFBTixjQUFpQyxpQ0FBaUI7QUFBQSxFQUdoRCxZQUFZLEtBQVUsUUFBbUM7QUFDdkQsVUFBTSxLQUFLLE1BQU07QUFIbkI7QUFJRSxTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxVQUFNLEVBQUUsWUFBWSxJQUFJO0FBRXhCLGdCQUFZLE1BQU07QUFFbEIsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUVwRSxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSx5QkFBeUIsRUFDakMsUUFBUSxnR0FBZ0csRUFDeEcsUUFBUSxDQUFDLFNBQVM7QUFDakIsWUFBTSxnQkFBZ0IsS0FDbkIsZUFBZSxrQkFBa0IsRUFDakMsU0FBUyxLQUFLLE9BQU8sU0FBUyxnQkFBZ0IsRUFDOUMsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMsbUJBQW1CO0FBQ3hDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBRUgsWUFBTSxVQUFVLGNBQWM7QUFDOUIsY0FBUSxpQkFBaUIsV0FBVyxPQUFPLE1BQU07QUFDL0MsWUFBSSxFQUFFLFFBQVEsU0FBUztBQUNyQixZQUFFLGVBQWU7QUFDakIsY0FBSSxNQUFNLEtBQUssT0FBTyxtQkFBbUIsS0FBSyxPQUFPLFNBQVMsZ0JBQWdCLEdBQUc7QUFDL0UsZ0JBQUksdUJBQU8sNEJBQTRCLEtBQUssT0FBTyxTQUFTLGdCQUFnQixFQUFFO0FBQUEsVUFDaEY7QUFDQSxrQkFBUSxLQUFLO0FBQUEsUUFDZjtBQUFBLE1BQ0YsQ0FBQztBQUVELGFBQU87QUFBQSxJQUNULENBQUMsRUFDQTtBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQ0csY0FBYyxRQUFRLEVBQ3RCLFFBQVEsWUFBWTtBQUNuQixZQUFJLE1BQU0sS0FBSyxPQUFPLG1CQUFtQixLQUFLLE9BQU8sU0FBUyxnQkFBZ0IsR0FBRztBQUMvRSxjQUFJLHVCQUFPLDRCQUE0QixLQUFLLE9BQU8sU0FBUyxnQkFBZ0IsRUFBRTtBQUFBLFFBQ2hGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDTDtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGVBQWUsRUFDdkIsUUFBUSw4RkFBOEYsRUFDdEcsUUFBUSxDQUFDLFNBQVM7QUFDakIsWUFBTSxnQkFBZ0IsS0FDbkIsZUFBZSxRQUFRLEVBQ3ZCLFNBQVMsS0FBSyxPQUFPLFNBQVMsWUFBWSxFQUMxQyxTQUFTLE9BQU8sVUFBVTtBQUN6QixhQUFLLE9BQU8sU0FBUyxlQUFlO0FBQ3BDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBRUgsWUFBTSxVQUFVLGNBQWM7QUFDOUIsY0FBUSxpQkFBaUIsV0FBVyxPQUFPLE1BQU07QUFDL0MsWUFBSSxFQUFFLFFBQVEsU0FBUztBQUNyQixZQUFFLGVBQWU7QUFDakIsY0FBSSxNQUFNLEtBQUssT0FBTyxtQkFBbUIsS0FBSyxPQUFPLFNBQVMsWUFBWSxHQUFHO0FBQzNFLGdCQUFJLHVCQUFPLDRCQUE0QixLQUFLLE9BQU8sU0FBUyxZQUFZLEVBQUU7QUFBQSxVQUM1RTtBQUNBLGtCQUFRLEtBQUs7QUFBQSxRQUNmO0FBQUEsTUFDRixDQUFDO0FBRUQsYUFBTztBQUFBLElBQ1QsQ0FBQyxFQUNBO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FDRyxjQUFjLFFBQVEsRUFDdEIsUUFBUSxZQUFZO0FBQ25CLFlBQUksTUFBTSxLQUFLLE9BQU8sbUJBQW1CLEtBQUssT0FBTyxTQUFTLFlBQVksR0FBRztBQUMzRSxjQUFJLHVCQUFPLDRCQUE0QixLQUFLLE9BQU8sU0FBUyxZQUFZLEVBQUU7QUFBQSxRQUM1RTtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0w7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxlQUFlLEVBQ3ZCLFFBQVEsdUxBQXVMLEVBQy9MO0FBQUEsTUFBWSxDQUFDLFNBQ1osS0FDRyxlQUFlLHFCQUFxQixFQUNwQyxTQUFTLEtBQUssT0FBTyxTQUFTLGlCQUFpQixFQUMvQyxTQUFTLE9BQU8sVUFBVTtBQUN6QixhQUFLLE9BQU8sU0FBUyxvQkFBb0I7QUFDekMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNMO0FBRUYsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEseUJBQXlCLEVBQ2pDLFFBQVEsMkVBQTJFLEVBQ25GO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FDRyxTQUFTLEtBQUssT0FBTyxTQUFTLHNCQUFzQixFQUNwRCxTQUFTLE9BQU8sVUFBVTtBQUN6QixhQUFLLE9BQU8sU0FBUyx5QkFBeUI7QUFDOUMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixZQUFJLHVCQUFPLHdEQUF3RDtBQUFBLE1BQ3JFLENBQUM7QUFBQSxJQUNMO0FBQUEsRUFDSjtBQUNGOyIsCiAgIm5hbWVzIjogW10KfQo=
