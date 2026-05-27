#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log(
        chalk.red("No target selected")
    );

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
    console.log(
        chalk.red("No valid skills selected")
    );

    console.log("");

    process.exit(1);
}

/**
 * Install target dir
 */
const targetDir =
    TARGETS[selectedTarget];

fs.ensureDirSync(targetDir);

console.log("");
console.log(
    chalk.cyan(
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

    const metadata =
        fs.readJsonSync(metadataPath);

    /**
     * Check compatibility
     */
    if (
        !metadata.compatibleTargets.includes(
            selectedTarget
        )
    ) {

        console.log(
            chalk.yellow(
                `⚠ ${skill} not compatible with ${selectedTarget}`
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

        const installed =
            fs.readJsonSync(installedFile);

        if (
            installed.version ===
            metadata.version
        ) {

            console.log(
                chalk.gray(
                    `✓ ${skill} already latest (${metadata.version})`
                )
            );

            continue;
        }
    }

    /**
     * Copy skill
     */
    fs.copySync(source, destination, {
        overwrite: true
    });

    /**
     * Write installed metadata
     */
    fs.writeJsonSync(
        installedFile,
        {
            name: metadata.name,
            version: metadata.version,
            installedAt:
                new Date().toISOString()
        },
        {
            spaces: 2
        }
    );

    console.log(
        chalk.green(
            `✓ Installed ${skill} v${metadata.version}`
        )
    );
}

console.log("");

console.log(
    chalk.blue("Done")
);

console.log("");
