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
      const quotedPdfLink = pdfLink ? `"${pdfLink}"` : "";
      content = content.replace(/{{pdfFilename}}/g, quotedPdfLink);
      content = content.replace(/{{pdf}}/g, quotedPdfLink);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vb2JzaWRpYW5fc3JjL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiwgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBNb2RhbCwgQXBwLCBURmlsZSwgVEZvbGRlciB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmludGVyZmFjZSBQYXBlcmxpYlNldHRpbmdzIHtcbiAgcGFwZXJOb3Rlc0ZvbGRlcjogc3RyaW5nO1xuICBhc3NldHNGb2xkZXI6IHN0cmluZztcbiAgcGFwZXJOb3RlVGVtcGxhdGU6IHN0cmluZztcbiAgcHJvdG9jb2xIYW5kbGVyRW5hYmxlZDogYm9vbGVhbjtcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogUGFwZXJsaWJTZXR0aW5ncyA9IHtcbiAgcGFwZXJOb3Rlc0ZvbGRlcjogJ0xpdGVyYXR1cmUgTm90ZXMnLFxuICBhc3NldHNGb2xkZXI6ICdBc3NldHMnLFxuICBwYXBlck5vdGVUZW1wbGF0ZTogYC0tLVxucGFwZXJfaWQ6IHt7aWR9fVxudGl0bGU6IHt7dGl0bGV9fVxuYXV0aG9yczoge3thdXRob3JzfX1cbnB1YmxpY2F0aW9uX2RhdGU6IHt7cHVibGljYXRpb25EYXRlfX1cbmFic3RyYWN0OiB7e2Fic3RyYWN0fX1cbmNvbW1lbnRzOiB7e2NvbW1lbnRzfX1cbnBkZjoge3twZGZGaWxlbmFtZX19XG51cmw6IHt7dXJsfX1cbnRhZ3M6IHt7dGFnc319XG4tLS1cblxuIyB7e3RpdGxlfX1cblxuIyMgU3VtbWFyeVxuXG4jIyBOb3Rlc1xuXG5gLFxuICBwcm90b2NvbEhhbmRsZXJFbmFibGVkOiB0cnVlLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFwZXJsaWJJbnRlZ3JhdGlvblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBQYXBlcmxpYlNldHRpbmdzO1xuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MucHJvdG9jb2xIYW5kbGVyRW5hYmxlZCkge1xuICAgICAgLy8gUmVnaXN0ZXIgdGhlIHBhcGVybGliIHByb3RvY29sIGhhbmRsZXJcbiAgICAgIHRoaXMucmVnaXN0ZXJPYnNpZGlhblByb3RvY29sSGFuZGxlcigncGFwZXJsaWInLCBhc3luYyAocGFyYW1zKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdSZWNlaXZlZCBQYXBlckxpYiBwcm90b2NvbCByZXF1ZXN0OicsIHBhcmFtcyk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCB7IGlkLCB0aXRsZSwgYXV0aG9ycywgeWVhciwgZG9pIH0gPSBwYXJhbXM7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgbmV3IE5vdGljZSgnRXJyb3I6IE5vIHBhcGVyIElEIHByb3ZpZGVkJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlT3JPcGVuUGFwZXJOb3RlKGlkLCB0aXRsZSwgYXV0aG9ycywgeWVhciwgZG9pKTtcbiAgICAgICAgICBuZXcgTm90aWNlKGBTdWNjZXNzZnVsbHkgb3BlbmVkIHBhcGVyOiAke3RpdGxlIHx8IGlkfWApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGhhbmRsaW5nIHBhcGVybGliIHByb3RvY29sOicsIGVycm9yKTtcbiAgICAgICAgICBuZXcgTm90aWNlKGBFcnJvciBvcGVuaW5nIHBhcGVyOiAke2Vycm9yLm1lc3NhZ2UgfHwgZXJyb3J9YCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBSZWdpc3RlciB0aGUgcGFwZXJsaWItb3BlbiBwcm90b2NvbCBoYW5kbGVyIHdpdGggUERGIHN1cHBvcnRcbiAgICAgIHRoaXMucmVnaXN0ZXJPYnNpZGlhblByb3RvY29sSGFuZGxlcigncGFwZXJsaWItb3BlbicsIGFzeW5jIChwYXJhbXMpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlY2VpdmVkIHBhcGVybGliLW9wZW4gcHJvdG9jb2wgcmVxdWVzdDonLCBwYXJhbXMpO1xuICAgICAgICBcbiAgICAgICAgLy8gSGFuZGxlIGRpZmZlcmVudCBwYXJhbWV0ZXIgZm9ybWF0c1xuICAgICAgICBpZiAocGFyYW1zLnBhdGgpIHtcbiAgICAgICAgICBjb25zdCBwYXBlclBhdGggPSBwYXJhbXMucGF0aC5yZXBsYWNlKC9ecGFwZXJsaWJcXC8vLCAnJyk7XG4gICAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRpbmcgdG8gb3BlbiBwYXBlciBmcm9tIHBhdGg6ICR7cGFwZXJQYXRofWApO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU9yT3BlblBhcGVyTm90ZShwYXBlclBhdGgsIHBhcGVyUGF0aCk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBTdWNjZXNzZnVsbHkgb3BlbmVkIHBhcGVyOiAke3BhcGVyUGF0aH1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaGFuZGxpbmcgcGF0aCBwYXJhbWV0ZXI6JywgZXJyb3IpO1xuICAgICAgICAgICAgbmV3IE5vdGljZShgRXJyb3Igb3BlbmluZyBwYXBlcjogJHtlcnJvci5tZXNzYWdlIHx8IGVycm9yfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHBhcmFtcy52YXVsdCAmJiBwYXJhbXMuZmlsZSkge1xuICAgICAgICAgIGNvbnN0IHBhcGVyRmlsZSA9IGRlY29kZVVSSUNvbXBvbmVudChwYXJhbXMuZmlsZSk7XG4gICAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRpbmcgdG8gb3BlbiBwYXBlciBmcm9tIHZhdWx0L2ZpbGU6ICR7cGFwZXJGaWxlfWApO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU9yT3BlblBhcGVyTm90ZShwYXBlckZpbGUsIHBhcGVyRmlsZSk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBTdWNjZXNzZnVsbHkgb3BlbmVkIHBhcGVyOiAke3BhcGVyRmlsZX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaGFuZGxpbmcgdmF1bHQvZmlsZSBwYXJhbWV0ZXJzOicsIGVycm9yKTtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoYEVycm9yIG9wZW5pbmcgcGFwZXI6ICR7ZXJyb3IubWVzc2FnZSB8fCBlcnJvcn1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEhhbmRsZSBtZXRhZGF0YSB3aXRoIFBERlxuICAgICAgICBpZiAocGFyYW1zLmlkIHx8IChwYXJhbXMudGl0bGUgJiYgcGFyYW1zLmF1dGhvcnMpKSB7XG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIGF1dGhvcnMsXG4gICAgICAgICAgICB5ZWFyLFxuICAgICAgICAgICAgcHVibGljYXRpb25EYXRlLFxuICAgICAgICAgICAgZG9pLFxuICAgICAgICAgICAgYWJzdHJhY3QsXG4gICAgICAgICAgICBjb21tZW50cyxcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIHRhZ3MsXG4gICAgICAgICAgICBwZGZQYXRoLFxuICAgICAgICAgICAgdmF1bHRQYXRoLFxuICAgICAgICAgICAgbGl0ZXJhdHVyZU5vdGVzRm9sZGVyLFxuICAgICAgICAgICAgYXNzZXRzRm9sZGVyXG4gICAgICAgICAgfSA9IHBhcmFtcztcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBwYXBlcklkID0gaWQgfHwgdGl0bGUgfHwgJ3Vua25vd24nO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0aW5nIHRvIG9wZW4gcGFwZXIgZnJvbSBtZXRhZGF0YTogJHtwYXBlcklkfWApO1xuICAgICAgICAgIFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU9yT3BlblBhcGVyTm90ZVdpdGhQREYoXG4gICAgICAgICAgICAgIHBhcGVySWQsXG4gICAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgICBhdXRob3JzLFxuICAgICAgICAgICAgICB5ZWFyLFxuICAgICAgICAgICAgICBwdWJsaWNhdGlvbkRhdGUsXG4gICAgICAgICAgICAgIGRvaSxcbiAgICAgICAgICAgICAgYWJzdHJhY3QsXG4gICAgICAgICAgICAgIGNvbW1lbnRzLFxuICAgICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICAgIHRhZ3MsXG4gICAgICAgICAgICAgIHBkZlBhdGgsXG4gICAgICAgICAgICAgIHZhdWx0UGF0aCxcbiAgICAgICAgICAgICAgbGl0ZXJhdHVyZU5vdGVzRm9sZGVyLFxuICAgICAgICAgICAgICBhc3NldHNGb2xkZXJcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBTdWNjZXNzZnVsbHkgb3BlbmVkIHBhcGVyOiAke3RpdGxlIHx8IHBhcGVySWR9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGhhbmRsaW5nIG1ldGFkYXRhIHBhcmFtZXRlcnM6JywgZXJyb3IpO1xuICAgICAgICAgICAgbmV3IE5vdGljZShgRXJyb3Igb3BlbmluZyBwYXBlcjogJHtlcnJvci5tZXNzYWdlIHx8IGVycm9yfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbmV3IE5vdGljZSgnRXJyb3I6IENvdWxkIG5vdCByZWNvZ25pemUgcGFyYW1ldGVycyBpbiB0aGUgVVJMJyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VucmVjb2duaXplZCBwYXJhbWV0ZXJzOicsIHBhcmFtcyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6ICdjcmVhdGUtcGFwZXItbm90ZScsXG4gICAgICBuYW1lOiAnQ3JlYXRlIG5ldyBwYXBlciBub3RlJyxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgIG5ldyBDcmVhdGVQYXBlck5vdGVNb2RhbCh0aGlzLmFwcCwgdGhpcykub3BlbigpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogJ29wZW4tcGFwZXJzLWZvbGRlcicsXG4gICAgICBuYW1lOiAnT3BlbiBwYXBlcnMgZm9sZGVyJyxcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuc2V0dGluZ3MucGFwZXJOb3Rlc0ZvbGRlcjtcbiAgICAgICAgY29uc3QgYWJzdHJhY3RGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlcik7XG4gICAgICAgIFxuICAgICAgICBpZiAoYWJzdHJhY3RGaWxlICYmIGFic3RyYWN0RmlsZSBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEZpbGUgPSBhYnN0cmFjdEZpbGUuY2hpbGRyZW5bMF07XG4gICAgICAgICAgaWYgKGZpcnN0RmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZigpLm9wZW5GaWxlKGZpcnN0RmlsZSk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBPcGVuZWQgcGFwZXJzIGZvbGRlcjogJHtmb2xkZXJ9YCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoYE5vIGZpbGUgZm91bmQgaW4gcGFwZXJzIGZvbGRlcjogJHtmb2xkZXJ9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ldyBOb3RpY2UoYFBhcGVycyBmb2xkZXIgbm90IGZvdW5kOiAke2ZvbGRlcn1gKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgUGFwZXJsaWJTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gIH1cblxuICBvbnVubG9hZCgpIHtcbiAgICBjb25zb2xlLmxvZygnUGFwZXJMaWIgSW50ZWdyYXRpb24gcGx1Z2luIHVubG9hZGVkJyk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlckV4aXN0cyhmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoIWZvbGRlclBhdGggfHwgZm9sZGVyUGF0aC50cmltKCkgPT09ICcnKSB7XG4gICAgICBuZXcgTm90aWNlKCdQbGVhc2UgZW50ZXIgYSB2YWxpZCBmb2xkZXIgcGF0aCcpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhYnN0cmFjdEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZm9sZGVyUGF0aCk7XG4gICAgICBcbiAgICAgIGlmIChhYnN0cmFjdEZpbGUpIHtcbiAgICAgICAgaWYgKGFic3RyYWN0RmlsZSBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgRm9sZGVyIGFscmVhZHkgZXhpc3RzOiAke2ZvbGRlclBhdGh9YCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgRXJyb3I6ICR7Zm9sZGVyUGF0aH0gZXhpc3RzIGJ1dCBpcyBub3QgYSBmb2xkZXJgKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJQYXRoKTtcbiAgICAgICAgY29uc29sZS5sb2coYENyZWF0ZWQgZm9sZGVyOiAke2ZvbGRlclBhdGh9YCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBjcmVhdGluZyBmb2xkZXI6ICR7ZXJyb3J9YCk7XG4gICAgICBuZXcgTm90aWNlKGBFcnJvciBjcmVhdGluZyBmb2xkZXI6ICR7ZXJyb3J9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlT3JPcGVuUGFwZXJOb3RlKFxuICAgIGlkOiBzdHJpbmcsXG4gICAgdGl0bGU/OiBzdHJpbmcsXG4gICAgYXV0aG9ycz86IHN0cmluZyxcbiAgICB5ZWFyPzogc3RyaW5nLFxuICAgIGRvaT86IHN0cmluZ1xuICApIHtcbiAgICBjb25zdCBzYWZlSWQgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUoaWQpO1xuICAgIGNvbnN0IHNhZmVUaXRsZSA9IHRpdGxlID8gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHRpdGxlKSA6IHNhZmVJZDtcbiAgICBcbiAgICBpZiAoIShhd2FpdCB0aGlzLmVuc3VyZUZvbGRlckV4aXN0cyh0aGlzLnNldHRpbmdzLnBhcGVyTm90ZXNGb2xkZXIpKSkge1xuICAgICAgbmV3IE5vdGljZSgnQ2Fubm90IGNyZWF0ZSBwYXBlciBub3RlOiBQYXBlcnMgZm9sZGVyIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IG5vdGVQYXRoID0gYCR7dGhpcy5zZXR0aW5ncy5wYXBlck5vdGVzRm9sZGVyfS8ke3NhZmVUaXRsZX0ubWRgO1xuICAgIGxldCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vdGVQYXRoKTtcbiAgICBcbiAgICBpZiAoZmlsZSkge1xuICAgICAgbmV3IE5vdGljZShgT3BlbmluZyBleGlzdGluZyBwYXBlciBub3RlOiAke3NhZmVUaXRsZX1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGNvbnRlbnQgPSB0aGlzLnNldHRpbmdzLnBhcGVyTm90ZVRlbXBsYXRlO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3t0aXRsZX19L2csIHRpdGxlIHx8ICdVbnRpdGxlZCBQYXBlcicpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3thdXRob3JzfX0vZywgYXV0aG9ycyB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3llYXJ9fS9nLCB5ZWFyIHx8ICcnKTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7cHVibGljYXRpb25EYXRlfX0vZywgeWVhciB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2RvaX19L2csIGRvaSB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2lkfX0vZywgaWQpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3thYnN0cmFjdH19L2csICcnKTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7Y29tbWVudHN9fS9nLCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3BkZn19L2csICcnKTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7dXJsfX0vZywgJycpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3t0YWdzfX0vZywgJycpO1xuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBmaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5vdGVQYXRoLCBjb250ZW50KTtcbiAgICAgICAgbmV3IE5vdGljZShgQ3JlYXRlZCBuZXcgcGFwZXIgbm90ZTogJHtzYWZlVGl0bGV9YCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBjcmVhdGluZyBwYXBlciBub3RlOiAke2Vycm9yfWApO1xuICAgICAgICBuZXcgTm90aWNlKGBFcnJvciBjcmVhdGluZyBwYXBlciBub3RlOiAke2Vycm9yfWApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKCkub3BlbkZpbGUoZmlsZSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlT3JPcGVuUGFwZXJOb3RlV2l0aFBERihcbiAgICBpZDogc3RyaW5nLFxuICAgIHRpdGxlPzogc3RyaW5nLFxuICAgIGF1dGhvcnM/OiBzdHJpbmcsXG4gICAgeWVhcj86IHN0cmluZyxcbiAgICBwdWJsaWNhdGlvbkRhdGU/OiBzdHJpbmcsXG4gICAgZG9pPzogc3RyaW5nLFxuICAgIGFic3RyYWN0Pzogc3RyaW5nLFxuICAgIGNvbW1lbnRzPzogc3RyaW5nLFxuICAgIHVybD86IHN0cmluZyxcbiAgICB0YWdzPzogc3RyaW5nLFxuICAgIHBkZlBhdGg/OiBzdHJpbmcsXG4gICAgdmF1bHRQYXRoPzogc3RyaW5nLFxuICAgIGxpdGVyYXR1cmVOb3Rlc0ZvbGRlcj86IHN0cmluZyxcbiAgICBhc3NldHNGb2xkZXI/OiBzdHJpbmdcbiAgKSB7XG4gICAgY29uc3Qgc2FmZUlkID0gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKGlkKTtcbiAgICBjb25zdCBzYWZlVGl0bGUgPSB0aXRsZSA/IHRoaXMuc2FuaXRpemVGaWxlbmFtZSh0aXRsZSkgOiBzYWZlSWQ7XG4gICAgXG4gICAgLy8gVXNlIHNldHRpbmdzIG9yIHByb3ZpZGVkIGZvbGRlciBuYW1lc1xuICAgIGNvbnN0IG5vdGVzRm9sZGVyID0gbGl0ZXJhdHVyZU5vdGVzRm9sZGVyIHx8IHRoaXMuc2V0dGluZ3MucGFwZXJOb3Rlc0ZvbGRlcjtcbiAgICBjb25zdCBwZGZGb2xkZXIgPSBhc3NldHNGb2xkZXIgfHwgdGhpcy5zZXR0aW5ncy5hc3NldHNGb2xkZXI7XG4gICAgXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJFeGlzdHMobm90ZXNGb2xkZXIpKSkge1xuICAgICAgbmV3IE5vdGljZSgnQ2Fubm90IGNyZWF0ZSBwYXBlciBub3RlOiBMaXRlcmF0dXJlIE5vdGVzIGZvbGRlciBkb2VzIG5vdCBleGlzdCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICBpZiAoIShhd2FpdCB0aGlzLmVuc3VyZUZvbGRlckV4aXN0cyhwZGZGb2xkZXIpKSkge1xuICAgICAgbmV3IE5vdGljZSgnQ2Fubm90IGNyZWF0ZSBwYXBlciBub3RlOiBBc3NldHMgZm9sZGVyIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IG5vdGVQYXRoID0gYCR7bm90ZXNGb2xkZXJ9LyR7c2FmZVRpdGxlfS5tZGA7XG4gICAgbGV0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm90ZVBhdGgpO1xuICAgIFxuICAgIC8vIEhhbmRsZSBQREYgY29weVxuICAgIGxldCBwZGZMaW5rID0gJyc7XG4gICAgaWYgKHBkZlBhdGggJiYgcGRmUGF0aC50cmltKCkgIT09ICcnKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBFeHRyYWN0IGZpbGVuYW1lIGZyb20gcGF0aCAoaGFuZGxlIGZpbGU6Ly8gVVJMcylcbiAgICAgICAgbGV0IGNsZWFuUGF0aCA9IHBkZlBhdGgucmVwbGFjZSgvXmZpbGU6XFwvXFwvLywgJycpO1xuICAgICAgICAvLyBIYW5kbGUgVVJMIGVuY29kaW5nIGluIHBhdGhcbiAgICAgICAgY2xlYW5QYXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KGNsZWFuUGF0aCk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyBQREYgZnJvbTogJHtjbGVhblBhdGh9YCk7XG4gICAgICAgIFxuICAgICAgICAvLyBVc2UgcGFwZXIgdGl0bGUgYXMgUERGIGZpbGVuYW1lIGluc3RlYWQgb2Ygb3JpZ2luYWwgZmlsZW5hbWVcbiAgICAgICAgY29uc3Qgc2FmZVBkZk5hbWUgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUodGl0bGUgfHwgJ1VudGl0bGVkJykgKyAnLnBkZic7XG4gICAgICAgIGNvbnN0IHRhcmdldFBkZlBhdGggPSBgJHtwZGZGb2xkZXJ9LyR7c2FmZVBkZk5hbWV9YDtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKGBUYXJnZXQgUERGIHBhdGg6ICR7dGFyZ2V0UGRmUGF0aH1gKTtcbiAgICAgICAgXG4gICAgICAgIC8vIENoZWNrIGlmIFBERiBhbHJlYWR5IGV4aXN0cyBpbiBhc3NldHNcbiAgICAgICAgY29uc3QgZXhpc3RpbmdQZGYgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGFyZ2V0UGRmUGF0aCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWV4aXN0aW5nUGRmKSB7XG4gICAgICAgICAgLy8gQ29weSBQREYgdG8gYXNzZXRzIGZvbGRlciBpZiBpdCBleGlzdHNcbiAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjbGVhblBhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCBwZGZDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGNsZWFuUGF0aCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVCaW5hcnkodGFyZ2V0UGRmUGF0aCwgcGRmQ29udGVudC5idWZmZXIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFx1MjcwNSBDb3BpZWQgUERGIHRvOiAke3RhcmdldFBkZlBhdGh9YCk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBQREYgY29waWVkOiAke3NhZmVQZGZOYW1lfWApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFx1Mjc0QyBQREYgZmlsZSBub3QgZm91bmQgYXQ6ICR7Y2xlYW5QYXRofWApO1xuICAgICAgICAgICAgbmV3IE5vdGljZShgV2FybmluZzogUERGIGZpbGUgbm90IGZvdW5kIGF0IHNvdXJjZSBsb2NhdGlvbmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgUERGIGFscmVhZHkgZXhpc3RzIGF0OiAke3RhcmdldFBkZlBhdGh9YCk7XG4gICAgICAgICAgbmV3IE5vdGljZShgVXNpbmcgZXhpc3RpbmcgUERGOiAke3NhZmVQZGZOYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBDcmVhdGUgd2lraS1zdHlsZSBiaWRpcmVjdGlvbmFsIGxpbmtcbiAgICAgICAgcGRmTGluayA9IGBbWyR7dGFyZ2V0UGRmUGF0aH1dXWA7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBjb3B5aW5nIFBERjogJHtlcnJvcn1gKTtcbiAgICAgICAgbmV3IE5vdGljZShgRXJyb3IgY29weWluZyBQREY6ICR7ZXJyb3IubWVzc2FnZSB8fCBlcnJvcn1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKGZpbGUpIHtcbiAgICAgIG5ldyBOb3RpY2UoYE9wZW5pbmcgZXhpc3RpbmcgcGFwZXIgbm90ZTogJHtzYWZlVGl0bGV9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjb250ZW50ID0gdGhpcy5zZXR0aW5ncy5wYXBlck5vdGVUZW1wbGF0ZTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7aWR9fS9nLCBpZCB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3RpdGxlfX0vZywgdGl0bGUgfHwgJ1VudGl0bGVkIFBhcGVyJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2F1dGhvcnN9fS9nLCBhdXRob3JzIHx8ICcnKTtcbiAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL3t7eWVhcn19L2csIHllYXIgfHwgJycpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3twdWJsaWNhdGlvbkRhdGV9fS9nLCBwdWJsaWNhdGlvbkRhdGUgfHwgeWVhciB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2RvaX19L2csIGRvaSB8fCAnJyk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e2Fic3RyYWN0fX0vZywgYWJzdHJhY3QgfHwgJycpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3tjb21tZW50c319L2csIGNvbW1lbnRzIHx8ICcnKTtcbiAgICAgIC8vIFdyYXAgd2lraWxpbmsgaW4gZG91YmxlIHF1b3RlcyB0byBwcmV2ZW50IFlBTUwgcGFyc2VyIGZyb20gYWRkaW5nIGV4dHJhIHF1b3Rlc1xuICAgICAgY29uc3QgcXVvdGVkUGRmTGluayA9IHBkZkxpbmsgPyBgXCIke3BkZkxpbmt9XCJgIDogJyc7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3BkZkZpbGVuYW1lfX0vZywgcXVvdGVkUGRmTGluayk7XG4gICAgICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC97e3BkZn19L2csIHF1b3RlZFBkZkxpbmspO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3t1cmx9fS9nLCB1cmwgfHwgJycpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgve3t0YWdzfX0vZywgdGFncyB8fCAnJyk7XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUobm90ZVBhdGgsIGNvbnRlbnQpO1xuICAgICAgICBuZXcgTm90aWNlKGBDcmVhdGVkIG5ldyBwYXBlciBub3RlOiAke3NhZmVUaXRsZX1gKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGNyZWF0aW5nIHBhcGVyIG5vdGU6ICR7ZXJyb3J9YCk7XG4gICAgICAgIG5ldyBOb3RpY2UoYEVycm9yIGNyZWF0aW5nIHBhcGVyIG5vdGU6ICR7ZXJyb3J9YCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoKS5vcGVuRmlsZShmaWxlKTtcbiAgICB9XG4gIH1cblxuICBzYW5pdGl6ZUZpbGVuYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5hbWUucmVwbGFjZSgvW1xcXFwvOio/XCI8PnxdL2csICctJyk7XG4gIH1cbn1cblxuY2xhc3MgQ3JlYXRlUGFwZXJOb3RlTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHBsdWdpbjogUGFwZXJsaWJJbnRlZ3JhdGlvblBsdWdpbjtcbiAgaWRJbnB1dDogSFRNTElucHV0RWxlbWVudDtcbiAgdGl0bGVJbnB1dDogSFRNTElucHV0RWxlbWVudDtcbiAgYXV0aG9yc0lucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xuICB5ZWFySW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGRvaUlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFBhcGVybGliSW50ZWdyYXRpb25QbHVnaW4pIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogJ0NyZWF0ZSBOZXcgUGFwZXIgTm90ZScgfSk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2xhYmVsJywgeyB0ZXh0OiAnUGFwZXIgSUQgKHJlcXVpcmVkKScgfSlcbiAgICAgIC5hcHBlbmRDaGlsZCh0aGlzLmlkSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpKTtcbiAgICB0aGlzLmlkSW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICB0aGlzLmlkSW5wdXQudmFsdWUgPSAnJztcbiAgICB0aGlzLmlkSW5wdXQucGxhY2Vob2xkZXIgPSAnVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBwYXBlcic7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2JyJyk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2xhYmVsJywgeyB0ZXh0OiAnVGl0bGUnIH0pXG4gICAgICAuYXBwZW5kQ2hpbGQodGhpcy50aXRsZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKSk7XG4gICAgdGhpcy50aXRsZUlucHV0LnR5cGUgPSAndGV4dCc7XG4gICAgdGhpcy50aXRsZUlucHV0LnZhbHVlID0gJyc7XG4gICAgdGhpcy50aXRsZUlucHV0LnBsYWNlaG9sZGVyID0gJ1BhcGVyIHRpdGxlJztcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnYnInKTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnbGFiZWwnLCB7IHRleHQ6ICdBdXRob3JzJyB9KVxuICAgICAgLmFwcGVuZENoaWxkKHRoaXMuYXV0aG9yc0lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKSk7XG4gICAgdGhpcy5hdXRob3JzSW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICB0aGlzLmF1dGhvcnNJbnB1dC52YWx1ZSA9ICcnO1xuICAgIHRoaXMuYXV0aG9yc0lucHV0LnBsYWNlaG9sZGVyID0gJ1BhcGVyIGF1dGhvcnMnO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKCdicicpO1xuXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKCdsYWJlbCcsIHsgdGV4dDogJ1llYXInIH0pXG4gICAgICAuYXBwZW5kQ2hpbGQodGhpcy55ZWFySW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpKTtcbiAgICB0aGlzLnllYXJJbnB1dC50eXBlID0gJ3RleHQnO1xuICAgIHRoaXMueWVhcklucHV0LnZhbHVlID0gJyc7XG4gICAgdGhpcy55ZWFySW5wdXQucGxhY2Vob2xkZXIgPSAnUHVibGljYXRpb24geWVhcic7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2JyJyk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2xhYmVsJywgeyB0ZXh0OiAnRE9JJyB9KVxuICAgICAgLmFwcGVuZENoaWxkKHRoaXMuZG9pSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpKTtcbiAgICB0aGlzLmRvaUlucHV0LnR5cGUgPSAndGV4dCc7XG4gICAgdGhpcy5kb2lJbnB1dC52YWx1ZSA9ICcnO1xuICAgIHRoaXMuZG9pSW5wdXQucGxhY2Vob2xkZXIgPSAnRGlnaXRhbCBPYmplY3QgSWRlbnRpZmllcic7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2JyJyk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJ0NyZWF0ZSBOb3RlJyB9KVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBwYXBlcklkID0gdGhpcy5pZElucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghcGFwZXJJZCkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoJ1BhcGVyIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5jcmVhdGVPck9wZW5QYXBlck5vdGUoXG4gICAgICAgICAgcGFwZXJJZCxcbiAgICAgICAgICB0aGlzLnRpdGxlSW5wdXQudmFsdWUudHJpbSgpLFxuICAgICAgICAgIHRoaXMuYXV0aG9yc0lucHV0LnZhbHVlLnRyaW0oKSxcbiAgICAgICAgICB0aGlzLnllYXJJbnB1dC52YWx1ZS50cmltKCksXG4gICAgICAgICAgdGhpcy5kb2lJbnB1dC52YWx1ZS50cmltKClcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuXG5jbGFzcyBQYXBlcmxpYlNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBQYXBlcmxpYkludGVncmF0aW9uUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFBhcGVybGliSW50ZWdyYXRpb25QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG5cbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiAnUGFwZXJMaWIgSW50ZWdyYXRpb24gU2V0dGluZ3MnIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZSgnTGl0ZXJhdHVyZSBOb3RlcyBGb2xkZXInKVxuICAgICAgLnNldERlc2MoJ1RoZSBmb2xkZXIgd2hlcmUgcGFwZXIgbm90ZXMgd2lsbCBiZSBzdG9yZWQuIFByZXNzIEVudGVyIG9yIGNsaWNrIENyZWF0ZSB0byBjcmVhdGUgdGhlIGZvbGRlci4nKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgY29uc3QgdGV4dENvbXBvbmVudCA9IHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ0xpdGVyYXR1cmUgTm90ZXMnKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXBlck5vdGVzRm9sZGVyKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnBhcGVyTm90ZXNGb2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgaW5wdXRFbCA9IHRleHRDb21wb25lbnQuaW5wdXRFbDtcbiAgICAgICAgaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmIChhd2FpdCB0aGlzLnBsdWdpbi5lbnN1cmVGb2xkZXJFeGlzdHModGhpcy5wbHVnaW4uc2V0dGluZ3MucGFwZXJOb3Rlc0ZvbGRlcikpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShgRm9sZGVyIGNyZWF0ZWQvdmVyaWZpZWQ6ICR7dGhpcy5wbHVnaW4uc2V0dGluZ3MucGFwZXJOb3Rlc0ZvbGRlcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlucHV0RWwuYmx1cigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGV4dENvbXBvbmVudDtcbiAgICAgIH0pXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvblxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KCdDcmVhdGUnKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmIChhd2FpdCB0aGlzLnBsdWdpbi5lbnN1cmVGb2xkZXJFeGlzdHModGhpcy5wbHVnaW4uc2V0dGluZ3MucGFwZXJOb3Rlc0ZvbGRlcikpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShgRm9sZGVyIGNyZWF0ZWQvdmVyaWZpZWQ6ICR7dGhpcy5wbHVnaW4uc2V0dGluZ3MucGFwZXJOb3Rlc0ZvbGRlcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoJ0Fzc2V0cyBGb2xkZXInKVxuICAgICAgLnNldERlc2MoJ1RoZSBmb2xkZXIgd2hlcmUgUERGIGZpbGVzIHdpbGwgYmUgc3RvcmVkLiBQcmVzcyBFbnRlciBvciBjbGljayBDcmVhdGUgdG8gY3JlYXRlIHRoZSBmb2xkZXIuJylcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRleHRDb21wb25lbnQgPSB0ZXh0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdhc3NldHMnKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NldHNGb2xkZXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRzRm9sZGVyID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGlucHV0RWwgPSB0ZXh0Q29tcG9uZW50LmlucHV0RWw7XG4gICAgICAgIGlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoYXdhaXQgdGhpcy5wbHVnaW4uZW5zdXJlRm9sZGVyRXhpc3RzKHRoaXMucGx1Z2luLnNldHRpbmdzLmFzc2V0c0ZvbGRlcikpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShgRm9sZGVyIGNyZWF0ZWQvdmVyaWZpZWQ6ICR7dGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRzRm9sZGVyfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5wdXRFbC5ibHVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0ZXh0Q29tcG9uZW50O1xuICAgICAgfSlcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoJ0NyZWF0ZScpXG4gICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGF3YWl0IHRoaXMucGx1Z2luLmVuc3VyZUZvbGRlckV4aXN0cyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NldHNGb2xkZXIpKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoYEZvbGRlciBjcmVhdGVkL3ZlcmlmaWVkOiAke3RoaXMucGx1Z2luLnNldHRpbmdzLmFzc2V0c0ZvbGRlcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoJ05vdGUgVGVtcGxhdGUnKVxuICAgICAgLnNldERlc2MoJ1RlbXBsYXRlIGZvciBuZXcgcGFwZXIgbm90ZXMuIFVzZSB7e2lkfX0sIHt7dGl0bGV9fSwge3thdXRob3JzfX0sIHt7eWVhcn19LCB7e3B1YmxpY2F0aW9uRGF0ZX19LCB7e2RvaX19LCB7e2Fic3RyYWN0fX0sIHt7Y29tbWVudHN9fSwge3twZGZ9fSwge3t1cmx9fSwgYW5kIHt7dGFnc319IGFzIHBsYWNlaG9sZGVycy4nKVxuICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PlxuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdFbnRlciB5b3VyIHRlbXBsYXRlJylcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucGFwZXJOb3RlVGVtcGxhdGUpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGFwZXJOb3RlVGVtcGxhdGUgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZSgnRW5hYmxlIFByb3RvY29sIEhhbmRsZXInKVxuICAgICAgLnNldERlc2MoJ0FsbG93IG9wZW5pbmcgbm90ZXMgZGlyZWN0bHkgZnJvbSBQYXBlckxpYiB1c2luZyB0aGUgcGFwZXJsaWI6Ly8gcHJvdG9jb2wnKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGVcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdG9jb2xIYW5kbGVyRW5hYmxlZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wcm90b2NvbEhhbmRsZXJFbmFibGVkID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoJ1BsZWFzZSByZXN0YXJ0IE9ic2lkaWFuIGZvciB0aGlzIGNoYW5nZSB0byB0YWtlIGVmZmVjdCcpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFBc0Y7QUFDdEYsU0FBb0I7QUFVcEIsSUFBTSxtQkFBcUM7QUFBQSxFQUN6QyxrQkFBa0I7QUFBQSxFQUNsQixjQUFjO0FBQUEsRUFDZCxtQkFBbUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQW1CbkIsd0JBQXdCO0FBQzFCO0FBRUEsSUFBcUIsNEJBQXJCLGNBQXVELHVCQUFPO0FBQUEsRUFBOUQ7QUFBQTtBQUNFO0FBQUE7QUFBQSxFQUVBLE1BQU0sU0FBUztBQUNiLFVBQU0sS0FBSyxhQUFhO0FBRXhCLFFBQUksS0FBSyxTQUFTLHdCQUF3QjtBQUV4QyxXQUFLLGdDQUFnQyxZQUFZLE9BQU8sV0FBVztBQUNqRSxnQkFBUSxJQUFJLHVDQUF1QyxNQUFNO0FBRXpELGNBQU0sRUFBRSxJQUFJLE9BQU8sU0FBUyxNQUFNLElBQUksSUFBSTtBQUUxQyxZQUFJLENBQUMsSUFBSTtBQUNQLGNBQUksdUJBQU8sNkJBQTZCO0FBQ3hDO0FBQUEsUUFDRjtB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
