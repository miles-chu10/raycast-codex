/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Codex Binary Path - Full path to the codex binary */
  "codexPath": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `run-task` command */
  export type RunTask = ExtensionPreferences & {}
  /** Preferences accessible in the `sessions` command */
  export type Sessions = ExtensionPreferences & {}
  /** Preferences accessible in the `saved-prompts` command */
  export type SavedPrompts = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `run-task` command */
  export type RunTask = {}
  /** Arguments passed to the `sessions` command */
  export type Sessions = {}
  /** Arguments passed to the `saved-prompts` command */
  export type SavedPrompts = {}
}

