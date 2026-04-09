Linux Temurin JRE bundle is checked in here for packaging the Linux app.

Current bundle:

- `src-tauri/resources/jre/linux/jdk-21.0.10+7-jre/bin/java`

If you upgrade it later, keep the same directory shape so the runtime resolver can discover `bin/java`.
