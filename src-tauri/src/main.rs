// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    match parch_iso_writer_lib::try_run_elevated_flash_from_args() {
        Ok(true) => return,
        Ok(false) => {}
        Err(err) => {
            eprintln!("{}", err);
            std::process::exit(1);
        }
    }
    parch_iso_writer_lib::run()
}
