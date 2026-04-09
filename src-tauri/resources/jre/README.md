Place a Temurin JRE 21 bundle under this directory for each packaged target.

Current repository state:

- Windows bundle is already checked in under `src-tauri/resources/jre/windows/jdk-21.0.10+7-jre`
- Linux bundle is already checked in under `src-tauri/resources/jre/linux/jdk-21.0.10+7-jre`
- macOS placeholder is present and ready for its target-specific JRE bundle

Expected examples:

- `src-tauri/resources/jre/windows/.../bin/java.exe`
- `src-tauri/resources/jre/macos/.../Contents/Home/bin/java`
- `src-tauri/resources/jre/linux/.../bin/java`

The runtime resolver scans this tree recursively and picks the first Java 11+ executable it finds.
