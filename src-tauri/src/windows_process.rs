//! Windows: subprocesses spawned from the GUI exe must not allocate a visible console.

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub fn configure_hidden_subprocess(command: &mut std::process::Command) {
    #[cfg(windows)]
    {
        let _ = command.creation_flags(CREATE_NO_WINDOW);
    }
}

pub fn configure_hidden_subprocess_tokio(command: &mut tokio::process::Command) {
    #[cfg(windows)]
    {
        let _ = command.creation_flags(CREATE_NO_WINDOW);
    }
}
