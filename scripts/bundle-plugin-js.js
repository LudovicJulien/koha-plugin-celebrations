#!/usr/bin/env node
/**
 * Script de bundling pour le plugin Koha Celebrations
 * Fusionne tous les fichiers JS de "js/template/" en un seul bundle,
 * supprime les imports/exports, et met à jour le template pour charger ce bundle.
 */
import fs from "fs";
import path from "path";
// === Configuration ===
const jsDir = "Koha/Plugin/Celebrations/js/template";
const distDir = "Koha/Plugin/Celebrations/js/dist";
const outputFile = "Koha/Plugin/Celebrations/js/dist/celebrations-bundle.js";
const templateFile = "Koha/Plugin/Celebrations/templates/homeTheme.tt";
const scriptRegex = /<script\s+.*?\/js\/template\/.*?\.js.*?><\/script>/g;
const orderedFiles = [
  "utils.js",
  "config.js",
  "themeOptions.js",
  "themeGrid.js",
  "formHandler.js",
  "preview.js",
  "devicePreview.js"
];
// ===Créer dist/ si manquant ===
if (!fs.existsSync(distDir)) {
  console.log("📁 Dossier 'dist' manquant → création…");
  fs.mkdirSync(distDir, { recursive: true });
}
// === Lecture des fichiers existants ===
let allFiles = fs
  .readdirSync(jsDir)
  .filter(f => f.endsWith(".js"));
let sortedFiles = orderedFiles
  .filter(f => allFiles.includes(f))
  .map(f => path.join(jsDir, f));
let newFiles = allFiles
  .filter(f => !orderedFiles.includes(f))
  .map(f => path.join(jsDir, f));
const files = [...sortedFiles, ...newFiles];
console.log(`🔧 Fichiers fusionnés (${files.length}):`);
files.forEach(f => console.log("  -", f));
let bundleContent = "";
for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/^\s*import\s+.*?;?\s*$/gm, "");
  content = content.replace(/^\s*export\s+(?:default\s+)?/gm, "");
  content = content.replace(/^\s*$/gm, "");
  bundleContent += `\n// ===== Fichier: ${path.basename(file)} =====\n`;
  bundleContent += content + "\n";
}
fs.writeFileSync(outputFile, bundleContent, "utf8");
console.log(`✅ Bundle créé : ${outputFile}`);
// === Mise à jour du template ===
let templateContent = fs.readFileSync(templateFile, "utf8");
templateContent = templateContent.replace(scriptRegex, "");
const bundleTag = `<script src="/api/v1/contrib/[% api_namespace | uri %]/static/js/dist/celebrations-bundle.js" defer></script>`;
if (!templateContent.includes(bundleTag)) {
  templateContent = templateContent.replace(
    /(\[% INCLUDE 'intranet-bottom\.inc' %\])/,
    `${bundleTag}\n$1`
  );
  console.log("✅ Bundle ajouté dans le template.");
} else {
  console.log("ℹ️ Bundle déjà présent, aucune modification ajoutée.");
}
fs.writeFileSync(templateFile, templateContent, "utf8");
console.log(`✅ Template mis à jour avec le bundle : ${templateFile}`);
