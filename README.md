Parch ISO Writer

Parch ISO Writer is a desktop application for downloading and writing Parch Linux operating system images to USB drives. It provides a graphical three step wizard that guides the user through selecting a source image, choosing a target USB drive, and performing the write operation with real time progress feedback.

The application is built with Tauri version 2 using a Rust backend for system level operations and a React with TypeScript frontend for the user interface. It runs on Linux, macOS, and Windows. On each platform it uses the native privilege elevation mechanism (pkexec on Linux, osascript on macOS, and PowerShell UAC on Windows) to obtain the permissions required for writing to block devices.

All source code is licensed under the GNU Affero General Public License version 3. See the LICENSE file for the full license text.

Documentation is available in the docs directory. Start with docs architecture for an overview of the system design, then read the individual module documentation for details on the Rust backend commands, the React frontend components, the step by step workflow, the release definitions, and the build process.


Features

The application can download Parch Linux ISO images from the official mirror with automatic resume support for interrupted downloads. It verifies downloaded images against MD5 or SHA256 checksums to ensure integrity. It can extract compressed archive images in the tar dot xz format used for ARM and Raspberry Pi releases. It detects USB drives automatically using platform specific commands and polls for changes every two seconds. It writes images to USB drives with a direct read write loop that reports progress every 250 milliseconds. The write operation runs with elevated privileges when necessary using the operating system's native elevation mechanism. The entire operation can be cancelled at any time, including the flash write process which kills the underlying child process.


Getting Started

Install the dependencies using bun install or your preferred package manager. Run the development server with bun run tauri dev. For a production build use bun run tauri build. The application requires Rust and the Tauri system dependencies for your platform. See the Tauri documentation for platform specific setup instructions.

The application window opens at 860 by 680 pixels with a minimum size of 720 by 600 pixels. The interface is a three step wizard. Step one is the source step where the user chooses to download a release from the list or select a local image file. Step two is the drive step where the user selects a target USB drive from the detected list. Step three is the write step which shows a summary, starts the operation, displays progress, and reports the result.


Architecture

The system follows a layered architecture with a Rust backend that handles all system level operations and a React frontend that presents the user interface and manages application state. The backend communicates with the frontend through Tauri's invoke and event system. The frontend calls backend functions using the invoke function and receives real time updates through event listeners.

The backend is organized into command modules for downloads, drive detection, archive extraction, and flash writing. Each module exposes Tauri commands that the frontend can call. The frontend uses a Zustand store for global state management and React components for each step of the wizard.

The flash writing subsystem is designed after the architecture used by balenaEtcher. When the application needs to write to a block device and lacks permission, it re invokes itself with elevated privileges using the operating system's native elevation mechanism. The elevated child process performs the copy loop and writes progress information as JSON lines to its standard output stream. The parent process reads this output, parses the JSON, and emits Tauri events that the frontend receives in real time. This avoids relying on external tools like dd whose output buffering behavior makes progress reporting unreliable when the output is piped through a non terminal file descriptor.

For detailed documentation on each subsystem see the docs directory. The file docs architecture dot md describes the overall system design. Docs backend dot md covers the Rust backend modules. Docs frontend dot md covers the React frontend components and state management. Docs flashing dot md describes the flash writing subsystem in detail including the elevation mechanism and progress reporting protocol. Docs releases dot md documents the release definitions and data model. Docs building dot md provides build and development instructions.