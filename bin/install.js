#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    reset: "\x1b[0m",
    yellow: "\x1b[33m"
};

function colorize(color, text) {
    return `${colors[color]}${text}${colors.reset}`;
}

function readJson(filePath) {
    return JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );
}

function writeJson(filePath, data) {
    fs.writeFileSync(
        filePath,
        `${JSON.stringify(data, null, 2)}\n`,
        "utf8"
    );
}

/**
 * Skills source folder
 */
const skillsDir = path.join(
    __dirname,
    "..",
    "skills"
);

/**
 * All available skills
 */
const allSkills = fs.readdirSync(skillsDir);

/**
 * CLI args
 */
const args = process.argv.slice(2);

/**
 * Targets mapping
 */
const TARGETS = {

    antigravity: path.join(
        os.homedir(),
        ".gemini",
        "antigravity",
        "skills"
    ),

    "antigravity-cli": path.join(
        os.homedir(),
        ".gemini",
        "antigravity-cli",
        "skills"
    ),

    codex: path.join(
        os.homedir(),
        ".codex",
        "skills"
    ),

    cursor: path.join(
        os.homedir(),
        ".cursor",
        "skills"
    ),

    gemini: path.join(
        os.homedir(),
        ".gemini",
        "skills"
    )
};

/**
 * Find selected target
 */
const selectedTarget = Object.keys(TARGETS)
    .find(target =>
        args.includes(`--${target}`)
    );

if (!selectedTarget) {

    console.log("");
    console.log(colorize("red", "No target selected"));

    console.log("");
    console.log("Example:");
    console.log("");

    console.log(
        "npx wyn-skills --cursor"
    );

    console.log(
        "npx wyn-skills --codex --java-spring-boot"
    );

    console.log("");

    process.exit(1);
}

/**
 * Requested skills
 */
const requestedSkills = args
    .filter(arg => arg.startsWith("--"))
    .map(arg => arg.replace("--", ""))
    .filter(arg =>
        !Object.keys(TARGETS).includes(arg)
    );

/**
 * Install all if no specific skill
 */
const skillsToInstall =
    requestedSkills.length === 0
        ? allSkills
        : requestedSkills.filter(skill =>
            allSkills.includes(skill)
        );

if (skillsToInstall.length === 0) {

    console.log("");
    console.log(colorize("red", "No valid skills selected"));

    console.log("");

    process.exit(1);
}

/**
 * Install target dir
 */
const targetDir =
    TARGETS[selectedTarget];

fs.mkdirSync(targetDir, {
    recursive: true
});

console.log("");
console.log(
    colorize(
        "cyan",
        `Installing to ${selectedTarget}...\n`
    )
);

/**
 * Install process
 */
for (const skill of skillsToInstall) {

    const source = path.join(
        skillsDir,
        skill
    );

    const destination = path.join(
        targetDir,
        skill
    );

    /**
     * Read metadata
     */
    const metadataPath = path.join(
        source,
        "metadata.json"
    );

    const metadata = readJson(metadataPath);

    /**
     * Check compatibility
     */
    if (
        !metadata.compatibleTargets.includes(
            selectedTarget
        )
    ) {

        console.log(
            colorize(
                "yellow",
                `! ${skill} not compatible with ${selectedTarget}`
            )
        );

        continue;
    }

    /**
     * Check installed version
     */
    const installedFile = path.join(
        destination,
        ".installed.json"
    );

    if (fs.existsSync(installedFile)) {

        const installed = readJson(installedFile);

        if (
            installed.version ===
            metadata.version
        ) {

            console.log(
                colorize(
                    "gray",
                    `OK ${skill} already latest (${metadata.version})`
                )
            );

            continue;
        }
    }

    /**
     * Copy skill
     */
    fs.cpSync(source, destination, {
        recursive: true,
        force: true
    });

    /**
     * Write installed metadata
     */
    writeJson(installedFile, {
        name: metadata.name,
        version: metadata.version,
        installedAt:
            new Date().toISOString()
    });

    console.log(
        colorize(
            "green",
            `OK Installed ${skill} v${metadata.version}`
        )
    );
}

console.log("");

console.log(
    colorize("blue", "Done")
);

console.log("");
