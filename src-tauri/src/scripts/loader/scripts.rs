use data_encoding::HEXUPPER;
use deno_core::{ModuleResolutionError, ModuleSpecifier};
use ring::digest::{Context, SHA256};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{Error, ErrorKind};
use std::path::{Path, PathBuf};
use sublime_fuzzy::best_match;
use tokio::fs::metadata;
use tokio::io::AsyncReadExt;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommandInfo {
    name: String,
    pub title: String,
    version: u32,
    pub description: String,
    api: u32,
    entry_point: String,
}

#[derive(Clone, Debug)]
pub struct Command {
    pub id: String,
    location: String,
    pub info: CommandInfo,
}

impl Command {
    pub fn get_location(&self) -> &str {
        self.location.as_str()
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LibraryInfo {
    name: String,
    version: u32,
    api: u32,
}

#[derive(Clone, Debug)]
pub struct Library {
    location: String,
    pub info: LibraryInfo,
}

impl Library {
    pub fn get_location(&self) -> &str {
        self.location.as_str()
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct EditorSelection {
    anchor: usize,
    head: usize,
    text: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct EditorSelectionState {
    main_selection_index: usize,
    selections: Vec<EditorSelection>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct EditorSelectionReplacement {
    index: usize,
    text: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct EditorState {
    pub(crate) selection: EditorSelectionState,
}

impl Command {
    pub fn get_deno_module_specifier(&self) -> Result<ModuleSpecifier, ModuleResolutionError> {
        let module_path = PathBuf::from(self.location.as_str());
        let mut entry_point_path = module_path.clone();
        entry_point_path.push(self.info.entry_point.as_str());
        deno_core::resolve_path(entry_point_path, module_path.as_path())
    }
}

pub struct ScriptManager {
    script_locations: Vec<PathBuf>,
    commands: HashMap<String, Command>,
    libraries: HashMap<String, Library>,
}

pub struct CommandSearchResult<'a> {
    pub command: &'a Command,
    pub score: isize,
    pub matched_indices: Vec<usize>,
}

impl ScriptManager {
    pub fn new() -> Self {
        ScriptManager {
            script_locations: vec![],
            commands: HashMap::new(),
            libraries: HashMap::new(),
        }
    }

    pub fn find_commands_by_title(&self, search_term: &str) -> Vec<CommandSearchResult> {
        let mut commands = vec![];
        for command in self.commands.values() {
            let m = best_match(search_term, command.info.title.as_str());
            if let Some(m) = m {
                let result = CommandSearchResult {
                    command,
                    score: m.score(),
                    matched_indices: m.matched_indices().copied().collect(),
                };
                commands.push(result);
            }
        }
        commands.sort_by(|a, b| b.score.cmp(&a.score));

        commands
    }

    pub fn find_command_by_id(&self, id: &str) -> Option<&Command> {
        self.commands.get(id)
    }

    pub async fn add_location(&mut self, location: PathBuf) -> Result<(), Error> {
        self.load_scripts(&location).await?;
        self.script_locations.push(location);
        Ok(())
    }

    pub async fn reload_scripts(&mut self) {
        let locations = self.script_locations.clone();
        for location in &locations {
            println!("Reloading scripts from {}", location.display());
            let result = &self.load_scripts(location).await;
            if let Err(e) = result {
                println!(
                    "Could not reload scripts on location {}: {:?}",
                    location.display(),
                    e
                );
            }
        }
    }

    async fn load_scripts(&mut self, location: &Path) -> Result<(), Error> {
        let command_path = location.join("commands");
        if command_path.is_dir() {
            self.load_commands(&command_path).await?;
        }
        let library_path = location.join("library");
        if library_path.is_dir() {
            self.load_libraries(&library_path).await?;
        }
        Ok(())
    }

    async fn load_commands(&mut self, location: &Path) -> Result<(), Error> {
        let main_dir = location.read_dir()?;
        for entry in main_dir {
            let entry = entry?;
            let meta = entry.metadata()?;
            if meta.is_file() {
                continue;
            }

            let command = Self::load_command(entry.path()).await;
            if let Ok(script) = command {
                self.commands.insert(script.id.to_string(), script);
            } else {
                println!(
                    "WARNING: Could not load script at location {}: {:?}",
                    entry.path().display(),
                    command.unwrap_err()
                )
            }
        }
        Ok(())
    }

    async fn load_command(folder: PathBuf) -> Result<Command, Error> {
        let command_file_path = folder.join("command.json");
        let command_file_meta = metadata(&command_file_path).await?;
        if !command_file_meta.is_file() {
            return Err(Error::new(
                ErrorKind::IsADirectory,
                format!(
                    "Expected a file named command.json at {}",
                    command_file_path.display()
                ),
            ));
        }
        let id = sha256_digest_file(&command_file_path).await?;

        let file = File::open(command_file_path)?;
        let command_info: CommandInfo = serde_json::from_reader(file)?;

        let entry_point_file_path = folder.join(command_info.entry_point.clone());
        let entry_point_file_meta = metadata(&entry_point_file_path).await?;
        if !entry_point_file_meta.is_file() {
            return Err(Error::new(
                ErrorKind::IsADirectory,
                format!(
                    "Expected the entryPoint to be a file located at {}",
                    entry_point_file_path.display()
                ),
            ));
        }

        Ok(Command {
            id,
            location: String::from(folder.to_str().unwrap()),
            info: command_info,
        })
    }

    async fn load_libraries(&mut self, location: &Path) -> Result<(), Error> {
        let main_dir = location.read_dir()?;
        for entry in main_dir {
            let entry = entry?;
            let meta = entry.metadata()?;
            if meta.is_file() {
                continue;
            }
            let name = entry.file_name().into_string();
            if name.is_err() {
                continue;
            }
            let name = name.unwrap();
            if name.starts_with("@") {
                let sub_dir = entry.path().read_dir()?;
                for sub_entry in sub_dir {
                    let sub_entry = sub_entry?;
                    let sub_meta = sub_entry.metadata()?;
                    if sub_meta.is_file() {
                        continue;
                    }
                    self.load_library_or_warn(&sub_entry.path()).await;
                }
            } else {
                self.load_library_or_warn(&entry.path()).await;
            }
        }
        Ok(())
    }

    async fn load_library_or_warn(&mut self, folder: &Path) {
        let library = Self::load_library(folder).await;
        if let Ok(library) = library {
            self.libraries.insert(library.info.name.clone(), library);
        } else {
            println!(
                "WARNING: Could not load library at location {}: {:?}",
                folder.display(),
                library.unwrap_err()
            )
        }
    }

    async fn load_library(folder: &Path) -> Result<Library, Error> {
        let library_file_path = folder.join("library.json");
        let library_file_meta = metadata(&library_file_path).await?;
        if !library_file_meta.is_file() {
            return Err(Error::new(
                ErrorKind::IsADirectory,
                format!(
                    "Expected a file named library.json at {}",
                    library_file_path.display()
                ),
            ));
        }

        let file = File::open(library_file_path)?;
        let library_info: LibraryInfo = serde_json::from_reader(file)?;

        Ok(Library {
            location: String::from(folder.to_str().unwrap()),
            info: library_info,
        })
    }

    pub fn get_libraries_snapshot(&self) -> HashMap<String, Library> {
        self.libraries.clone()
    }
}

async fn sha256_digest_file(path: &PathBuf) -> Result<String, Error> {
    let mut context = Context::new(&SHA256);
    let mut buffer = [0; 1024];
    let mut file = tokio::fs::File::open(path).await?;

    loop {
        let count = file.read(&mut buffer).await?;
        if count == 0 {
            break;
        }
        context.update(&buffer[..count]);
    }
    let digest = context.finish();

    Ok(HEXUPPER.encode(digest.as_ref()))
}
